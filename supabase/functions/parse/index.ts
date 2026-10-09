// Onze Week — AI parsing as a Supabase Edge Function (Deno).
//
// Turns a Dutch sentence into planner actions with Claude.
// - The Anthropic API key is a Supabase secret (ANTHROPIC_API_KEY); it never reaches the browser.
// - "Verify JWT" stays on: only signed-in users of this project can call it.
// - The app validates every returned action again before applying it.
//
// Deploy: Supabase dashboard → Edge Functions → Deploy a new function → Via editor,
// name it "parse", paste this file. Or with the CLI: `supabase functions deploy parse`.

import Anthropic from 'npm:@anthropic-ai/sdk@0.131.0';

const MODEL = 'claude-opus-5-5';
/** Shown in every error, so it is easy to see which deployment answered. */
const FUNCTION_VERSION = 'v4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Nullable fields use anyOf: the structured-output validator does not accept
// type arrays combined with enum.
const nullable = (schema: Record<string, unknown>) => ({ anyOf: [schema, { type: 'null' }] });
const nullableString = nullable({ type: 'string' });
const nullableEnum = (values: string[]) => nullable({ type: 'string', enum: values });

const OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['actions'],
  properties: {
    actions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'type', 'date', 'title', 'time', 'endTime', 'location', 'category', 'mealType', 'name', 'quantity', 'unit',
          'newTitle', 'newDate', 'newTime', 'newLocation', 'assignedTo', 'status', 'listTitle',
        ],
        properties: {
          type: {
            type: 'string',
            enum: [
              'ADD_ACTIVITY', 'ADD_MEAL', 'ADD_GROCERY', 'DELETE_ACTIVITY', 'DELETE_MEAL', 'DELETE_GROCERY',
              'UPDATE_ACTIVITY', 'UPDATE_MEAL', 'MOVE_ACTIVITY', 'MOVE_MEAL', 'SET_LIST_STATUS',
            ],
          },
          date: nullableString,
          title: nullableString,
          time: nullableString,
          endTime: nullableString,
          location: nullableString,
          category: nullableEnum(['work', 'sport', 'social', 'home', 'appointment', 'travel', 'other']),
          mealType: nullableEnum(['breakfast', 'lunch', 'dinner', 'snack']),
          name: nullableString,
          quantity: nullable({ type: 'number' }),
          unit: nullableString,
          newTitle: nullableString,
          newDate: nullableString,
          newTime: nullableString,
          newLocation: nullableString,
          assignedTo: nullableEnum(['glenn', 'jessica', 'samen']),
          status: nullableEnum(['yes', 'maybe', 'no', 'pending']),
          listTitle: nullableString,
        },
      },
    },
  },
};

const SYSTEM_PROMPT = `Je zet Nederlandse opdrachten voor de gedeelde weekplanner van Glenn en Jessica om in gestructureerde acties.
De planner kent activiteiten (agenda), maaltijden en één boodschappenlijst.

Actietypes:
- ADD_ACTIVITY: date, title, optioneel time (start), endTime, location, category, assignedTo
- ADD_MEAL: date, title, mealType (breakfast/lunch/dinner/snack), optioneel time, location, assignedTo
- ADD_GROCERY: name, optioneel quantity en unit (l, ml, kg, g, pak, fles, blik, zak, doos, pot, bos, st)
- DELETE_ACTIVITY / DELETE_MEAL: title (van het bestaande item), date
- DELETE_GROCERY: name
- UPDATE_ACTIVITY: title + date van het bestaande item, plus newTitle / newTime / newLocation
- UPDATE_MEAL: title + date van de bestaande maaltijd (title mag null zijn = "het avondeten van die dag"), newTitle
- MOVE_ACTIVITY: title + date van het bestaande item, newDate en/of newTime
- MOVE_MEAL: title + date, newDate
- SET_LIST_STATUS: reactie op een gastenlijst. name = de persoon (precies zoals op de lijst), status = yes (komt) / no (komt niet, afgezegd) / maybe (misschien, twijfelt) / pending (nog geen reactie), listTitle = de titel van de lijst

Regels:
- Eén zin kan meerdere opdrachten bevatten: geef voor elke opdracht een aparte actie, in de volgorde van de zin.
  "Woensdag pasta pesto eten en haal pasta, pesto en kip" = 1 ADD_MEAL + 3 ADD_GROCERY.
- Meerdere dagen voor hetzelfde ("di + do training", "maandag en woensdag sporten") = één actie per dag.
- Afkortingen: ma, di, wo, do, vr, za, zo. Een tijdbereik "19:45-21:45" = time 19:45, endTime 21:45.
- Datums als YYYY-MM-DD, tijden als HH:MM (24-uurs). De week begint op maandag.
- "dinsdag" = de eerstvolgende dinsdag vanaf vandaag (vandaag telt mee). "dinsdag komende week" / "volgende week dinsdag" = dinsdag van de volgende kalenderweek. "morgenavond", "vanavond", "dit weekend" (zaterdag) gewoon omrekenen.
- Zonder datum: vandaag, of de datum van de vorige opdracht in dezelfde zin.
- "om 7 uur" bij sport/sociaal/eten = 19:00; "half 8" = 19:30 tenzij duidelijk ochtend.
- Eten zonder maaltijdsoort is avondeten (dinner). "Uit eten bij X" → ADD_MEAL title "Uit eten", location "X". "Eten bij mijn ouders" → ADD_MEAL title "Eten bij mijn ouders".
- Titels kort en met hoofdletter. Werkwoorden worden zelfstandige naamwoorden: "trainen" → "Training", "werken" → "Werk". "verjaardag bij Mark" → title "Verjaardag Mark".
- "in/bij/te X" achter een activiteit is de locatie (met hoofdletters zoals een plaatsnaam).
- Kies category: work, sport, social, home, appointment (tandarts, kapper, dokter), travel (naar een plaats), other.
- Boodschappen: elk product apart, naam met hoofdletter, enkelvoud/meervoud zoals gezegd. "chinees halen" is eten (ADD_MEAL), geen boodschap.
- Bij verwijderen, verplaatsen of wijzigen: gebruik als title EXACT de titel uit de lijst met bestaande items als die er staat, met de datum van dat item.
  "vrijdag geen training" → DELETE_ACTIVITY van de training op vrijdag. "we eten donderdag toch geen pasta maar wraps" → UPDATE_MEAL title "Pasta", newTitle "Wraps".
- Lijstjes: "Jan komt niet", "Oma en Gerard komen", "Bryan komt naar bier", "Sanne heeft afgezegd" → één SET_LIST_STATUS per persoon.
  Kies de lijst uit de bestaande lijsten. Staat iemand op meerdere lijsten en is niet duidelijk welke, gebruik dan de lijst die genoemd wordt of anders de eerstvolgende; noem nooit een lijst die niet bestaat. Gebruik de naam exact zoals op de lijst (ook accenten, bijv. "Daniël").
- "Jessica moet …" → assignedTo "jessica"; "Glenn …" → "glenn"; "samen …" → "samen". Anders null.
- Velden die niet van toepassing zijn: null.
- Geef alleen acties die de gebruiker echt vraagt. Is de zin geen opdracht voor de planner, geef dan een lege lijst.`;

interface ParseBody {
  input?: unknown;
  today?: unknown;
  weekday?: unknown;
  time?: unknown;
  context?: unknown;
}

function json(body: Record<string, unknown>, status = 200) {
  if (typeof body.error === 'string') body = { ...body, error: `${body.error} [parse ${FUNCTION_VERSION}]` };
  return new Response(JSON.stringify({ ...body, version: FUNCTION_VERSION }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) return json({ error: 'ANTHROPIC_API_KEY is not set in the Edge Function secrets.' }, 501);

  let body: ParseBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }
  const input = typeof body.input === 'string' ? body.input.trim().slice(0, 1000) : '';
  const today = typeof body.today === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.today) ? body.today : '';
  if (!input || !today) return json({ error: 'Missing input or today' }, 400);
  const weekday = typeof body.weekday === 'string' ? body.weekday.slice(0, 20) : '';
  const time = typeof body.time === 'string' ? body.time.slice(0, 5) : '';
  const context = typeof body.context === 'string' ? body.context.slice(0, 8000) : '';

  const userMessage =
    `Vandaag is ${weekday} ${today}, het is ${time}.\n\n` +
    (context ? `Bestaande items in de planner:\n${context}\n\n` : '') +
    `Opdracht: ${input}`;

  const client = new Anthropic({ apiKey });
  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: {
        effort: 'low',
        format: { type: 'json_schema', schema: OUTPUT_SCHEMA },
      },
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    if (response.stop_reason === 'refusal' || response.stop_reason === 'max_tokens') {
      return json({ error: `Model stopped: ${response.stop_reason}` }, 422);
    }
    const text = response.content.find((b) => b.type === 'text');
    if (!text || text.type !== 'text') return json({ error: 'Empty model response' }, 502);

    const parsed = JSON.parse(text.text) as { actions?: Record<string, unknown>[] };
    const actions = (parsed.actions ?? []).map((a) => Object.fromEntries(Object.entries(a).filter(([, v]) => v !== null)));
    return json({ actions, model: response.model });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) return json({ error: 'Invalid ANTHROPIC_API_KEY' }, 500);
    if (error instanceof Anthropic.RateLimitError) return json({ error: 'Rate limited' }, 429);
    if (error instanceof Anthropic.APIError) return json({ error: `AI error ${error.status}: ${error.message}` }, 502);
    return json({ error: error instanceof Error ? error.message : 'AI parsing failed' }, 500);
  }
});
