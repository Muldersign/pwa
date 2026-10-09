import type { ParseResult, PlannerAction } from '../../domain/actions';
import { HOUSEHOLD } from '../../config/household';
import type { Assignee, ISODate, ListItem, MealType } from '../../domain/types';
import { capitalize, formatLongDate } from '../../lib/dates';
import {
  ABSORB_LOCATION_TITLES,
  DELETE_WORDS,
  DISHES,
  EAT_WORDS,
  FILLER,
  GROCERY_ADD_VERBS,
  GROCERY_UNITS,
  MOVE_WORDS,
  NUMBER_WORDS,
  TITLE_NORMALIZATION,
  UPDATE_WORDS,
  categorizeActivity,
  type PartOfDay,
} from './lexicon';
import { extractDate, extractTime, hasTemporalHint, type DateMatch } from './temporal';
import { joinRaw, normalizeSentence, remaining, tokenize, type Token } from './tokens';

/* -------------------------------------------------------------------------- */
/*  Clause splitting                                                          */
/* -------------------------------------------------------------------------- */

const CLAUSE_SPLIT = /\s*(?:,|;|\.(?=\s|$)|\s+en\s+daarna\s+|\s+en\s+dan\s+|\s+daarna\s+|\s+en\s+ook\s+|\s+en\s+|\s+plus\s+|\s+ook\s+nog\s+)\s*/i;

type ClauseKind = 'groceryAdd' | 'groceryDelete' | 'bare' | 'other';

interface Clause {
  text: string;
  kind: ClauseKind;
}

const ACTION_MARKERS = new Set([
  ...EAT_WORDS,
  ...DELETE_WORDS,
  ...MOVE_WORDS,
  ...UPDATE_WORDS,
  ...Object.keys(TITLE_NORMALIZATION),
  'naar', 'bij', 'geen', 'haal', 'halen', 'koop', 'kopen', 'boodschappen', 'lijst', 'lijstje', 'nodig', 'verjaardag',
  'afspraak', 'om', 'uur',
]);

function words(text: string): string[] {
  return tokenize(text).map((t) => t.low);
}

function hasListMention(lowWords: string[]): boolean {
  return lowWords.some((w) => w === 'boodschappen' || w === 'boodschappenlijst' || w === 'lijst' || w === 'lijstje');
}

function classifyClause(text: string, sentenceMentionsList: boolean): ClauseKind {
  const tokens = tokenize(text);
  const w = tokens.map((t) => t.low);
  const temporal = hasTemporalHint(tokens);
  const hasDelete = w.some((x) => DELETE_WORDS.has(x)) || w.includes('weg');
  const fromList = /\bvan\s+(?:de\s+|het\s+|mijn\s+)?(?:boodschappen|boodschappenlijst|lijst|lijstje)\b/i.test(text);

  if ((hasDelete && sentenceMentionsList) || fromList) {
    if (!temporal) return 'groceryDelete';
  }
  const addMarker =
    w.some((x) => GROCERY_ADD_VERBS.has(x)) ||
    /\b(?:op|bij|aan)\s+(?:de\s+|het\s+|mijn\s+)?(?:boodschappen|boodschappenlijst|lijst|lijstje)\b/i.test(text);
  const eats = w.some((x) => EAT_WORDS.has(x));
  // "chinees halen vrijdag" is takeaway for dinner, not a shopping item.
  const takeaway = temporal && w[0] !== 'haal' && w.includes('halen') && w.some((x) => DISHES.includes(x));
  if (addMarker && !eats && !takeaway && !/\d{1,2}[:.]\d{2}/.test(text) && !w.includes('om')) return 'groceryAdd';

  if (!temporal && !w.some((x) => ACTION_MARKERS.has(x)) && w.length > 0 && w.length <= 4 && !/\d{1,2}[:.]\d{2}/.test(text)) {
    return 'bare';
  }
  return 'other';
}

/**
 * Splits a sentence into clauses and decides which bare fragments are grocery
 * items ("haal melk, brood en kaas") and which belong to the previous clause
 * ("pasta met kip en spinazie").
 */
function splitClauses(sentence: string): Clause[] {
  const parts = sentence.split(CLAUSE_SPLIT).map((p) => p.trim()).filter(Boolean);
  const mentionsList = hasListMention(words(sentence));
  const clauses: Clause[] = parts.map((text) => ({ text, kind: classifyClause(text, mentionsList) }));

  // Bare runs adjacent to a grocery clause become grocery items of the same polarity.
  for (let i = 0; i < clauses.length; i++) {
    if (clauses[i].kind !== 'bare') continue;
    let j = i;
    while (j < clauses.length && clauses[j].kind === 'bare') j++;
    const before = clauses[i - 1]?.kind;
    const after = clauses[j]?.kind;
    const groceryKind =
      before === 'groceryAdd' || before === 'groceryDelete'
        ? before
        : after === 'groceryAdd' || after === 'groceryDelete'
          ? after
          : undefined;
    if (groceryKind) for (let k = i; k < j; k++) clauses[k].kind = groceryKind;
    i = j - 1;
  }

  // "haal melk en brood van de lijst": a run that ends in a removal is a removal.
  const isGrocery = (k: ClauseKind) => k === 'groceryAdd' || k === 'groceryDelete';
  for (let i = 0; i < clauses.length; i++) {
    if (!isGrocery(clauses[i].kind)) continue;
    let j = i;
    while (j + 1 < clauses.length && isGrocery(clauses[j + 1].kind)) j++;
    if (clauses[j].kind === 'groceryDelete') for (let k = i; k <= j; k++) clauses[k].kind = 'groceryDelete';
    i = j;
  }

  // Remaining bare fragments are glued back onto the previous clause.
  const merged: Clause[] = [];
  for (const c of clauses) {
    const prev = merged[merged.length - 1];
    if (c.kind === 'bare' && prev && prev.kind === 'other') {
      prev.text = `${prev.text} en ${c.text}`;
    } else {
      merged.push({ ...c, kind: c.kind === 'bare' ? 'other' : c.kind });
    }
  }
  return merged;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const GROCERY_STRIP = new Set([
  'haal', 'halen', 'koop', 'kopen', 'nog', 'ook', 'even', 'we', 'wij', 'ik', 'moeten', 'moet', 'graag', 'wil', 'zet',
  'zetten', 'doe', 'voeg', 'toe', 'toevoegen', 'bij', 'aan', 'op', 'de', 'het', 'mijn', 'boodschappen',
  'boodschappenlijst', 'lijst', 'lijstje', 'nodig', 'hebben', 'heb', 'van', 'weg', 'verwijder', 'verwijderen',
  'schrap', 'wis', 'wat', 'er', 'staat', 'af', 'afvinken', 'boodschappen:', 'is', 'zijn', 'op:', 'kan', 'mag',
]);

function groceryFromText(text: string, kind: 'groceryAdd' | 'groceryDelete'): PlannerAction | undefined {
  const all = tokenize(text);
  // "haal morgen melk": the date says when to shop, the list itself has no dates.
  extractDate(all, new Date());
  const tokens = all.filter((t) => !t.used && !GROCERY_STRIP.has(t.low));
  // Leading article / quantity.
  let quantity: number | undefined;
  let unit: string | undefined;
  while (tokens.length && ['een', 'wat', 'paar', 'nieuwe', 'nieuw', 'verse'].includes(tokens[0].low) && tokens.length > 1) {
    if (tokens[0].low === 'een' && tokens[1] && GROCERY_UNITS[tokens[1].low]) {
      quantity = 1;
    }
    tokens.shift();
  }
  const first = tokens[0];
  if (first && tokens.length > 1) {
    const qMatch = /^(\d+(?:[.,]\d+)?)([a-z]+)?$/.exec(first.low);
    const qWord = NUMBER_WORDS[first.low];
    if (qMatch || qWord !== undefined) {
      quantity = qMatch ? Number(qMatch[1].replace(',', '.')) : qWord;
      if (qMatch?.[2] && GROCERY_UNITS[qMatch[2]]) unit = GROCERY_UNITS[qMatch[2]];
      tokens.shift();
    }
  }
  if (tokens[0] && tokens.length > 1 && GROCERY_UNITS[tokens[0].low]) {
    unit = GROCERY_UNITS[tokens[0].low];
    tokens.shift();
    if (tokens[0]?.low === 'met' || tokens[0]?.low === 'aan') tokens.shift();
  }
  const name = joinRaw(tokens).replace(/^[-–:]+|[-–:]+$/g, '').trim();
  if (!name) return undefined;
  if (kind === 'groceryDelete') return { type: 'DELETE_GROCERY', name: capitalize(name) };
  return { type: 'ADD_GROCERY', name: capitalize(name), quantity, unit };
}

function cleanTitle(tokens: Token[], extraStrip: Set<string> = new Set()): string {
  const kept = tokens.filter((t) => !t.used && !extraStrip.has(t.low));
  // Strip filler at the edges only, so "pasta met kip" stays intact.
  while (kept.length && FILLER.has(kept[0].low)) kept.shift();
  while (kept.length && FILLER.has(kept[kept.length - 1].low)) kept.pop();
  return joinRaw(kept);
}

function normalizeActivityTitle(title: string): string {
  const parts = title.split(' ');
  const mapped = TITLE_NORMALIZATION[parts[0].toLowerCase()];
  if (mapped && parts.length === 1) return mapped;
  if (mapped && parts.length > 1 && /en$/.test(parts[0].toLowerCase())) {
    // "trainen met Jan" → "Training met Jan"
    return [mapped, ...parts.slice(1)].join(' ');
  }
  return capitalize(title);
}

/** Title-case a location the user typed in lowercase: "de gulle boergondiër" → "De Gulle Boergondiër". */
function prettyLocation(loc: string): string {
  if (loc !== loc.toLowerCase()) return loc;
  // "de film", "het strand", "mijn ouders" are not proper names.
  if (/^(de|het|een|mijn|onze|m'n)\s/.test(loc)) return loc;
  const small = new Set(['van', 'der', 'den', 'de', 'het', 'aan', 'op', 'en', "'t"]);
  return loc
    .split(' ')
    .map((w, i) => (i > 0 && small.has(w) ? w : capitalize(w)))
    .join(' ');
}

function isMealish(lowWords: string[], title: string): boolean {
  if (lowWords.some((w) => EAT_WORDS.has(w))) return true;
  const t = title.toLowerCase();
  return DISHES.some((d) => t === d || t.startsWith(`${d} `) || t.endsWith(` ${d}`));
}

function mealTypeFrom(lowWords: string[], time?: string, part?: PartOfDay): MealType {
  if (lowWords.some((w) => w === 'ontbijt' || w === 'ontbijten')) return 'breakfast';
  if (lowWords.some((w) => w === 'lunch' || w === 'lunchen')) return 'lunch';
  if (lowWords.some((w) => w === 'snack' || w === 'tussendoortje')) return 'snack';
  if (lowWords.some((w) => w === 'avondeten' || w === 'diner' || w === 'dineren' || w === 'avondmaal')) return 'dinner';
  if (time) {
    const h = Number(time.slice(0, 2));
    if (h < 11) return 'breakfast';
    if (h < 15) return 'lunch';
    return 'dinner';
  }
  if (part === 'morning') return 'breakfast';
  if (part === 'afternoon') return 'lunch';
  return 'dinner';
}

const MEAL_STRIP = new Set([...EAT_WORDS, 'menu', 'op', 'het', 'de', 'als', 'zet', 'we', 'wij', 'gaan', 'staat', 'er', 'halen']);

/** Splits "trainen in Bareveld" into title + location. */
function splitLocation(tokens: Token[]): { titleTokens: Token[]; location?: string; preposition?: string } {
  const live = tokens.filter((t) => !t.used);
  for (let i = live.length - 1; i > 0; i--) {
    const w = live[i].low;
    if ((w === 'in' || w === 'bij' || w === 'te' || w === 'op') && i < live.length - 1) {
      // "op" only for clear venues: "op kantoor", "op de club", "op Schiphol"
      if (w === 'op' && !/^(kantoor|de|het|school|schiphol|locatie)$/.test(live[i + 1].low) && live[i + 1].raw === live[i + 1].low) continue;
      const location = joinRaw(live.slice(i + 1));
      return { titleTokens: live.slice(0, i), location, preposition: w };
    }
  }
  return { titleTokens: live };
}

/* -------------------------------------------------------------------------- */
/*  Clause interpretation                                                     */
/* -------------------------------------------------------------------------- */

interface ClauseContext {
  date?: ISODate;
  assignedTo?: Assignee;
  alternative?: { from: ISODate; to: ISODate };
  part?: PartOfDay;
  lastAdd?: PlannerAction;
}

function interpretClause(text: string, now: Date, ctx: ClauseContext): PlannerAction[] {
  const tokens = tokenize(text);
  const low = tokens.map((t) => t.low);
  const assignedTo = extractAssignee(tokens) ?? ctx.assignedTo;
  ctx.assignedTo = assignedTo;
  const withAssignee = (actions: PlannerAction[]): PlannerAction[] =>
    assignedTo
      ? actions.map((a) => (a.type === 'ADD_ACTIVITY' || a.type === 'ADD_MEAL' ? { ...a, assignedTo } : a))
      : actions;
  return withAssignee(interpretTokens(tokens, low, now, ctx));
}

/** "Jessica moet zaterdag werken" → assignedTo jessica. Names after "bij"/"met"/"verjaardag" are not assignees. */
function extractAssignee(tokens: Token[]): Assignee | undefined {
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const person = HOUSEHOLD.find((p) => p.id === t.low);
    if (!person) continue;
    const prev = tokens[i - 1]?.low;
    if (prev && ['bij', 'met', 'verjaardag', 'van', 'voor', 'naar', 'jarig'].includes(prev)) continue;
    t.used = true;
    return person.id;
  }
  return undefined;
}

function interpretTokens(tokens: Token[], low: string[], now: Date, ctx: ClauseContext): PlannerAction[] {

  /* ---- MOVE: "verplaats training dinsdag naar woensdag 20:00" ---------- */
  const naarIdx = low.lastIndexOf('naar');
  const hasMoveVerb = low.some((w) => MOVE_WORDS.has(w));
  if (naarIdx > 0) {
    const left = tokens.slice(0, naarIdx);
    const right = tokens.slice(naarIdx + 1);
    const rightProbe = right.map((t) => ({ ...t }));
    const target = extractDate(rightProbe, now);
    const targetTime = extractTime(rightProbe);
    const rightRest = rightProbe.filter((t) => !t.used && !FILLER.has(t.low));
    if ((target || targetTime.start) && (hasMoveVerb || rightRest.length === 0)) {
      const source = extractDate(left, now);
      noteAlternative(source, ctx);
      const title = cleanTitle(left, new Set([...MOVE_WORDS, 'van', 'de', 'het']));
      if (title) {
        const date = source?.date ?? ctx.date;
        const mealish = isMealish(low, title);
        if (mealish && target) {
          return [{ type: 'MOVE_MEAL', title, date, newDate: target.date }];
        }
        return [{ type: 'MOVE_ACTIVITY', title, date, newDate: target?.date, newTime: targetTime.start }];
      }
    }
  }

  const dateMatch = extractDate(tokens, now);
  noteAlternative(dateMatch, ctx);
  const time = extractTime(tokens, dateMatch?.partOfDay ?? undefined);
  const date = dateMatch?.date ?? ctx.date ?? toISOToday(now);
  const part = time.partOfDay ?? dateMatch?.partOfDay ?? (dateMatch ? undefined : ctx.part);
  ctx.date = date;
  ctx.part = part;

  const live = remaining(tokens);
  const liveLow = live.map((t) => t.low);

  /* ---- Only a date: "pizza eten op vrijdag en zaterdag" ---------------- */
  if (live.filter((t) => !FILLER.has(t.low)).length === 0) {
    if (ctx.lastAdd && dateMatch && (ctx.lastAdd.type === 'ADD_MEAL' || ctx.lastAdd.type === 'ADD_ACTIVITY')) {
      return [{ ...ctx.lastAdd, date }];
    }
    return [];
  }

  /* ---- UPDATE: "toch geen pasta maar wraps", "wraps ipv pasta" -------- */
  const geenIdx = liveLow.indexOf('geen');
  const maarIdx = liveLow.indexOf('maar');
  const ipvIdx = liveLow.indexOf('ipv');
  const wordtIdx = liveLow.findIndex((w) => w === 'wordt' || w === 'worden');
  const changeIdx = liveLow.findIndex((w) => w === 'verander' || w === 'wijzig' || w === 'veranderen' || w === 'wijzigen');
  let oldPart: Token[] | undefined;
  let newPart: Token[] | undefined;
  if (geenIdx >= 0 && maarIdx > geenIdx) {
    oldPart = live.slice(geenIdx + 1, maarIdx);
    newPart = live.slice(maarIdx + 1);
  } else if (ipvIdx > 0) {
    newPart = live.slice(0, ipvIdx);
    oldPart = live.slice(ipvIdx + 1);
  } else if (changeIdx >= 0) {
    const toIdx = liveLow.findIndex((w, i) => i > changeIdx && (w === 'in' || w === 'naar'));
    if (toIdx > changeIdx) {
      oldPart = live.slice(changeIdx + 1, toIdx);
      newPart = live.slice(toIdx + 1);
    }
  } else if (wordtIdx > 0) {
    oldPart = live.slice(0, wordtIdx);
    newPart = live.slice(wordtIdx + 1);
  }
  if (oldPart && newPart) {
    const oldTitle = cleanTitle(oldPart, MEAL_STRIP);
    const newTitle = cleanTitle(newPart, MEAL_STRIP);
    if (newTitle || time.start) {
      const mealish = isMealish(liveLow, oldTitle) || isMealish(liveLow, newTitle);
      if (mealish && newTitle) {
        return [{ type: 'UPDATE_MEAL', title: oldTitle || undefined, date, newTitle: capitalize(newTitle) }];
      }
      if (oldTitle) {
        return [{
          type: 'UPDATE_ACTIVITY',
          title: oldTitle,
          date,
          newTitle: newTitle ? normalizeActivityTitle(newTitle) : undefined,
          newTime: time.start,
        }];
      }
    }
  }

  /* ---- DELETE: "vrijdag geen training", "verwijder pizza van donderdag" */
  const deleteVerb = liveLow.some((w) => DELETE_WORDS.has(w));
  const negation = geenIdx >= 0 && maarIdx < 0;
  const cancelled = /\b(gaat|gaan)\s+niet\s+door\b/.test(liveLow.join(' '));
  if (deleteVerb || negation || cancelled) {
    const strip = new Set([...DELETE_WORDS, 'geen', 'gaat', 'gaan', 'niet', 'door', 'van', 'uit', 'menu', 'eten', 'de', 'het', 'haal', 'we', 'er']);
    const title = cleanTitle(live, strip);
    if (title) {
      const mealish = isMealish(liveLow, title);
      const targetDate = dateMatch?.date ?? ctx.date;
      return [mealish ? { type: 'DELETE_MEAL', title, date: targetDate } : { type: 'DELETE_ACTIVITY', title, date: targetDate }];
    }
  }

  /* ---- "zet de training (van woensdag) op 20:30" → new time ----------- */
  if ((low[0] === 'zet' || low[0] === 'verzet') && (low[1] === 'de' || low[1] === 'het') && time.start) {
    const title = cleanTitle(live, new Set(['zet', 'verzet', 'de', 'het', 'van', 'op', 'naar']));
    if (title) return [{ type: 'MOVE_ACTIVITY', title, date: dateMatch?.date ?? ctx.date, newTime: time.start }];
  }

  /* ---- "we eten donderdag toch wraps" → replace that day's dinner ------ */
  if (liveLow.includes('toch') && liveLow.some((w) => EAT_WORDS.has(w))) {
    const newTitle = cleanTitle(live, MEAL_STRIP);
    if (newTitle) return [{ type: 'UPDATE_MEAL', date, newTitle: capitalize(newTitle) }];
  }

  /* ---- ADD_MEAL -------------------------------------------------------- */
  const roughTitle = cleanTitle(live, MEAL_STRIP);
  if (isMealish(liveLow, roughTitle)) {
    const mealType = mealTypeFrom(liveLow, time.start, part);
    // "uit eten bij X" / "eten bij mijn ouders"
    const eatIdx = liveLow.findIndex((w) => w === 'eten' || w === 'dineren' || w === 'lunchen');
    if (eatIdx >= 0 && liveLow[eatIdx + 1] === 'bij' && live.length > eatIdx + 2) {
      const who = joinRaw(live.slice(eatIdx + 2));
      if (liveLow[eatIdx - 1] === 'uit') {
        return [{ type: 'ADD_MEAL', date, mealType, time: time.start, title: 'Uit eten', location: prettyLocation(who) }];
      }
      const verb = live[eatIdx].raw.toLowerCase();
      return [{ type: 'ADD_MEAL', date, mealType, time: time.start, title: capitalize(`${verb} bij ${who}`) }];
    }
    if (liveLow.includes('uit') && liveLow.includes('eten')) {
      const loc = splitLocation(live.filter((t) => !['uit', 'eten', 'we', 'gaan'].includes(t.low)));
      return [{
        type: 'ADD_MEAL',
        date,
        mealType,
        time: time.start,
        title: 'Uit eten',
        location: loc.location ? prettyLocation(loc.location) : undefined,
      }];
    }
    if (roughTitle) {
      const loc = splitLocation(live.filter((t) => !MEAL_STRIP.has(t.low) || t.low === 'in' || t.low === 'te'));
      let title = loc.location && loc.preposition !== 'bij' ? cleanTitle(loc.titleTokens, MEAL_STRIP) : roughTitle;
      const location = loc.location && loc.preposition !== 'bij' && title ? prettyLocation(loc.location) : undefined;
      if (!title) title = roughTitle;
      // "lunch met Sanne" → keep the meal word: "Lunch met Sanne".
      if (/^met\s/i.test(title)) {
        const mealWord = live.find((t) => EAT_WORDS.has(t.low));
        title = `${mealWord ? mealWord.low : 'eten'} ${title}`;
      }
      return [{ type: 'ADD_MEAL', date, mealType, time: time.start, title: capitalize(title), location }];
    }
  }

  /* ---- ADD_ACTIVITY ---------------------------------------------------- */
  const { titleTokens, location, preposition } = splitLocation(live);
  let title = cleanTitle(titleTokens);
  let finalLocation = location ? prettyLocation(location) : undefined;
  if (!title && location) {
    title = `${preposition} ${location}`;
    finalLocation = undefined;
  }
  if (!title) return [];
  const firstWord = title.split(' ')[0].toLowerCase();
  if (location && ABSORB_LOCATION_TITLES.has(firstWord) && title.split(' ').length === 1) {
    title = `${title} ${location.replace(/^(de|het|mijn)\s+/i, '')}`;
    finalLocation = undefined;
  }
  title = normalizeActivityTitle(title);
  if (title.toLowerCase().startsWith('naar ')) {
    title = `Naar ${prettyLocation(title.slice(5))}`;
  }
  return [{
    type: 'ADD_ACTIVITY',
    date,
    time: time.start,
    endTime: time.end,
    title,
    location: finalLocation,
    category: categorizeActivity(`${title} ${preposition === 'naar' ? 'naar' : ''}`),
  }];
}

function noteAlternative(match: DateMatch | undefined, ctx: ClauseContext) {
  if (match?.alternative && !ctx.alternative) {
    ctx.alternative = { from: match.date, to: match.alternative };
  }
}

function toISOToday(now: Date): ISODate {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function replaceDate(actions: PlannerAction[], from: ISODate, to: ISODate): PlannerAction[] {
  return actions.map((a) => {
    const copy = { ...a } as Record<string, unknown>;
    if (copy.date === from) copy.date = to;
    if (copy.newDate === from) copy.newDate = to;
    return copy as PlannerAction;
  });
}

/* -------------------------------------------------------------------------- */
/*  Public entry point                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Rule-based Dutch parser. Works fully offline and handles the common phrasing
 * for planning, meals and groceries, including several commands in one sentence.
 */
/** What the parser may know about guest lists, to recognize "Jan komt niet". */
export interface ListKnowledge {
  listTitles: string[];
  personNames: string[];
}

const nameKey = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .trim();

/**
 * RSVP sentences: "Jan komt niet", "Oma en Gerard komen", "Stefan komt misschien
 * naar bier", "Bart heeft afgezegd", "Sanne kan niet". Only used for names that
 * are on a list (or with a list name), so agenda sentences are never misread.
 */
function parseRsvp(sentence: string, known?: ListKnowledge): PlannerAction[] | undefined {
  if (!known || !known.personNames.length) return undefined;
  const m =
    /^(.+?)\s+(komt|komen|kan|kunnen|heeft|hebben|is|zijn|twijfelt|twijfelen)\b(.*)$/i.exec(sentence.replace(/[.!]+$/, ''));
  if (!m) return undefined;
  const [, who, verb, restRaw] = m;
  let rest = restRaw.trim().toLowerCase();
  const v = verb.toLowerCase();

  // Optional list: "... naar/voor/op/bij (de/het) <lijst>"
  let listTitle: string | undefined;
  const hint = /\b(?:naar|voor|op|bij)\s+(?:de\s+|het\s+|mijn\s+)?([a-zà-ÿ' -]{2,40})$/i.exec(rest);
  if (hint) {
    listTitle = hint[1].trim();
    rest = rest.slice(0, hint.index).trim();
  }
  const words = rest.split(/\s+/).filter(Boolean);
  const allowed = new Set(['wel', 'niet', 'misschien', 'toch', 'ook', 'komen', 'afgezegd', 'afgemeld', 'aangemeld', 'erbij', 'er', 'nog', 'zeker', 'geen', 'tijd']);
  if (words.some((w) => !allowed.has(w))) return undefined;

  let status: ListItem['status'];
  if (v.startsWith('twijfel') || words.includes('misschien')) status = 'maybe';
  else if (words.includes('niet') || words.includes('afgezegd') || words.includes('afgemeld') || words.includes('geen')) status = 'no';
  else if ((v === 'kan' || v === 'kunnen' || v === 'heeft' || v === 'hebben' || v === 'is' || v === 'zijn') && !words.includes('aangemeld') && !words.includes('erbij') && !words.includes('wel')) return undefined;
  else status = 'yes';

  const names = who
    .split(/\s*,\s*|\s+en\s+|\s*&\s*/i)
    .map((n) => n.trim())
    .filter(Boolean);
  if (!names.length || names.length > 12 || names.some((n) => /\d/.test(n) || n.split(' ').length > 3)) return undefined;

  const knownNames = new Set(known.personNames.map(nameKey));
  const knownFirst = new Set(known.personNames.map((n) => nameKey(n).split(' ')[0]));
  const listKnown = listTitle && known.listTitles.some((t) => nameKey(t).includes(nameKey(listTitle!)) || nameKey(listTitle!).includes(nameKey(t)));
  const anyKnown = names.some((n) => knownNames.has(nameKey(n)) || knownFirst.has(nameKey(n)));
  if (!anyKnown && !listKnown) return undefined;
  if (listTitle && !listKnown) return undefined;

  return names.map((name) => ({ type: 'SET_LIST_STATUS' as const, name: capitalize(name), status, listTitle: listKnown ? listTitle : undefined }));
}

/** "Jan komt niet en Noor komt", "Jan komt niet, Noor twijfelt": several RSVPs in one sentence. */
function parseRsvpSentence(sentence: string, known?: ListKnowledge): PlannerAction[] | undefined {
  const whole = parseRsvp(sentence, known);
  if (whole) return whole;
  // Split on commas first; a part that still fails is split on "en" before a new subject.
  const parts = sentence.split(/\s*[,;]\s*/).map((p) => p.trim()).filter(Boolean);
  const out: PlannerAction[] = [];
  let pieces = 0;
  for (const part of parts) {
    const direct = parseRsvp(part, known);
    if (direct) {
      out.push(...direct);
      pieces++;
      continue;
    }
    const sub = part
      .split(/\s+en\s+(?=\S+(?:\s+\S+)?\s+(?:komt|kan|heeft|is|twijfelt)\b)/i)
      .map((p) => p.trim())
      .filter(Boolean);
    if (sub.length < 2) return undefined;
    for (const piece of sub) {
      const r = parseRsvp(piece, known);
      if (!r) return undefined;
      out.push(...r);
      pieces++;
    }
  }
  if (pieces < 2) return undefined;
  return out;
}

export function parseLocally(input: string, now: Date = new Date(), known?: ListKnowledge): ParseResult {
  const sentence = normalizeSentence(input);
  if (!sentence) return { actions: [], source: 'local' };

  const rsvp = parseRsvpSentence(sentence, known);
  if (rsvp) return { actions: rsvp, source: 'local' };

  const ctx: ClauseContext = {};
  const actions: PlannerAction[] = [];

  for (const clause of splitClauses(sentence)) {
    if (clause.kind === 'groceryAdd' || clause.kind === 'groceryDelete') {
      const a = groceryFromText(clause.text, clause.kind);
      if (a) actions.push(a);
      continue;
    }
    const produced = interpretClause(clause.text, now, ctx);
    for (const a of produced) {
      actions.push(a);
      if (a.type === 'ADD_MEAL' || a.type === 'ADD_ACTIVITY') ctx.lastAdd = a;
    }
  }

  // Deduplicate grocery items within one sentence.
  const seen = new Set<string>();
  const unique = actions.filter((a) => {
    if (a.type !== 'ADD_GROCERY') return true;
    const k = a.name.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  if (ctx.alternative && unique.length > 0) {
    const { from, to } = ctx.alternative;
    const weekday = formatLongDate(from).split(' ')[0];
    return {
      actions: unique,
      source: 'local',
      clarification: {
        question: `Bedoel je ${weekday} ${formatLongDate(from).split(' ').slice(1).join(' ')} of ${weekday} ${formatLongDate(to).split(' ').slice(1).join(' ')}?`,
        options: [
          { label: formatLongDate(from), actions: unique },
          { label: formatLongDate(to), actions: replaceDate(unique, from, to) },
        ],
      },
    };
  }

  return { actions: unique, source: 'local' };
}

/**
 * Parses the quick-add field on the shopping list: "melk", "2 liter melk",
 * "melk, brood en kaas". Everything typed there is a product.
 */
export function parseGroceryInput(input: string): PlannerAction[] {
  const sentence = normalizeSentence(input);
  if (!sentence) return [];
  return sentence
    .split(CLAUSE_SPLIT)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => groceryFromText(part, 'groceryAdd') ?? { type: 'ADD_GROCERY' as const, name: capitalize(part) });
}
