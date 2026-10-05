import Anthropic from '@anthropic-ai/sdk';
import { sanitizeActions } from '../src/services/nlp/validate';

/**
 * Server-side AI parsing. The API key is read from the server environment
 * (ANTHROPIC_API_KEY) and never shipped to the browser.
 */

const MODEL = 'claude-opus-5-5';

const nullableString = { type: ['string', 'null'] };

const ACTION_SCHEMA = {
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
          'newTitle', 'newDate', 'newTime', 'newLocation', 'assignedTo',
        ],
        properties: {
          type: {
            type: 'string',
            enum: [
              'ADD_ACTIVITY', 'ADD_MEAL', 'ADD_GROCERY', 'DELETE_ACTIVITY', 'DELETE_MEAL', 'DELETE_GROCERY',
              'UPDATE_ACTIVITY', 'UPDATE_MEAL', 'MOVE_ACTIVITY', 'MOVE_MEAL',
            ],
          },
          date: nullableString,
          title: nullableString,
          time: nullableString,
          endTime: nullableString,
          location: nullableString,
          category: { type: ['string', 'null'], enum: ['work', 'sport', 'social', 'home', 'appointment', 'travel', 'other', null] },
          mealType: { type: ['string', 'null'], enum: ['breakfast', 'lunch', 'dinner', 'snack', null] },
          name: nullableString,
          quantity: { type: ['number', 'null'] },
          unit: nullableString,
          newTitle: nullableString,
          newDate: nullableString,
          newTime: nullableString,
          newLocation: nullableString,
          assignedTo: { type: ['string', 'null'], enum: ['glenn', 'jessica', 'samen', null] },
        },
      },
    },
  },
};

const SYSTEM_PROMPT = `Je zet Nederlandse opdrachten voor een persoonlijke weekplanner om in gestructureerde acties.
De planner kent activiteiten (agenda), maaltijden en een boodschappenlijst.

Regels:
- Eén zin kan meerdere opdrachten bevatten; geef voor elke opdracht een aparte actie.
- Datums als YYYY-MM-DD, tijden als HH:MM (24-uurs). De week begint op maandag.
- "dinsdag" = de eerstvolgende dinsdag vanaf vandaag (vandaag telt mee). "dinsdag komende week" / "volgende week dinsdag" = dinsdag van de volgende kalenderweek.
- Eten zonder tijd is standaard avondeten (mealType "dinner"). "Uit eten bij X" → titel "Uit eten", locatie X.
- Werkwoorden als titel worden zelfstandige naamwoorden: "trainen" → "Training", "werken" → "Werk".
- "in/bij/te X" achter een activiteit is de locatie, behalve bij verjaardagen ("verjaardag bij Mark" → titel "Verjaardag Mark").
- Boodschappen: elk product een aparte ADD_GROCERY met "name" (met hoofdletter), eventueel quantity en unit.
- Verwijderen/verplaatsen/wijzigen: "title" is de naam van het bestaande item, "date" de huidige datum ervan; nieuwe waarden in newTitle/newDate/newTime/newLocation.
- "toch geen pasta maar wraps" → UPDATE_MEAL met title "pasta" en newTitle "Wraps".
- Het huishouden bestaat uit Glenn en Jessica. "Jessica moet zaterdag werken" → assignedTo "jessica"; "samen" → "samen".
- Velden die niet van toepassing zijn: null.
- Geef alleen acties die de gebruiker echt vraagt.`;

export interface ParseRequestResult {
  status: number;
  body: unknown;
}

export async function handleParseRequest(rawBody: string, apiKey: string | undefined): Promise<ParseRequestResult> {
  if (!apiKey) return { status: 501, body: { error: 'AI parsing is not configured on this server.' } };

  let payload: { input?: unknown; today?: unknown; weekday?: unknown; time?: unknown };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return { status: 400, body: { error: 'Invalid JSON' } };
  }
  const input = typeof payload.input === 'string' ? payload.input.slice(0, 1000) : '';
  const today = typeof payload.today === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(payload.today) ? payload.today : null;
  if (!input || !today) return { status: 400, body: { error: 'Missing input or today' } };
  const weekday = typeof payload.weekday === 'string' ? payload.weekday.slice(0, 20) : '';
  const time = typeof payload.time === 'string' ? payload.time.slice(0, 5) : '';

  const client = new Anthropic({ apiKey });
  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: {
        effort: 'low',
        format: { type: 'json_schema', schema: ACTION_SCHEMA },
      },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Vandaag is ${weekday} ${today}, het is ${time}.\n\nOpdracht: ${input}`,
        },
      ],
    });

    if (response.stop_reason === 'refusal' || response.stop_reason === 'max_tokens') {
      return { status: 422, body: { error: `Model stopped: ${response.stop_reason}` } };
    }
    const text = response.content.find((b) => b.type === 'text');
    if (!text || text.type !== 'text') return { status: 502, body: { error: 'Empty model response' } };

    const parsed = JSON.parse(text.text) as { actions?: unknown[] };
    const cleaned = (parsed.actions ?? []).map((a) =>
      Object.fromEntries(Object.entries(a as Record<string, unknown>).filter(([, v]) => v !== null)),
    );
    return { status: 200, body: { actions: sanitizeActions(cleaned) } };
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return { status: 429, body: { error: 'Rate limited' } };
    if (error instanceof Anthropic.AuthenticationError) return { status: 500, body: { error: 'Invalid server API key' } };
    if (error instanceof Anthropic.APIError) return { status: 502, body: { error: `AI error ${error.status}` } };
    return { status: 500, body: { error: 'AI parsing failed' } };
  }
}
