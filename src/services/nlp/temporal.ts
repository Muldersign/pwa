import { addDays, addWeeks, differenceInCalendarDays, isValid, startOfISOWeek } from 'date-fns';
import type { ClockTime, ISODate } from '../../domain/types';
import { toISODate } from '../../lib/dates';
import {
  MONTHS,
  NUMBER_WORDS,
  PART_OF_DAY,
  TODAY_PARTS,
  TOMORROW_PARTS,
  WEEKDAYS,
  type PartOfDay,
} from './lexicon';
import type { Token } from './tokens';

export interface DateMatch {
  date: ISODate;
  /** A second plausible reading, e.g. "komende dinsdag" said on a Monday. */
  alternative?: ISODate;
  partOfDay?: PartOfDay;
}

export interface TimeMatch {
  start?: ClockTime;
  end?: ClockTime;
  partOfDay?: PartOfDay;
}

const PREPOSITIONS_BEFORE_DATE = new Set(['op', 'van', 'voor', 'aanstaande', 'deze', 'komende', 'volgende']);

function isoWeekday(d: Date): number {
  const js = d.getDay();
  return js === 0 ? 7 : js;
}

function numberValue(low: string): number | undefined {
  if (/^\d+$/.test(low)) return Number(low);
  return NUMBER_WORDS[low];
}

/** Marks the preposition directly before index i as used ("op dinsdag", "van donderdag"). */
function consumePreposition(tokens: Token[], i: number) {
  const prev = tokens[i - 1];
  if (prev && !prev.used && (prev.low === 'op' || prev.low === 'van' || prev.low === 'voor')) prev.used = true;
}

/**
 * Finds and consumes the date expression in a clause.
 *
 * Definitions (week starts on Monday):
 * - "dinsdag"                    → the first Tuesday from today on (today counts).
 * - "komende/volgende dinsdag"   → the first Tuesday after today; when that is still
 *                                  this week we also offer the Tuesday a week later.
 * - "aanstaande dinsdag"         → the first Tuesday after today, no question asked.
 * - "dinsdag komende/volgende week", "volgende week dinsdag" → Tuesday of next week.
 * - "deze week dinsdag"          → Tuesday of the current week.
 */
export function extractDate(tokens: Token[], now: Date): DateMatch | undefined {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let weekOffset: number | undefined;
  let partOfDay: PartOfDay | undefined;

  // 1. Week expressions: "komende week", "volgende week", "deze week", "over 2 weken".
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.used) continue;
    const next = tokens[i + 1];
    if (next && next.low === 'week' && ['komende', 'volgende', 'deze', 'aankomende', 'eerstvolgende'].includes(t.low)) {
      weekOffset = t.low === 'deze' ? 0 : 1;
      t.used = next.used = true;
      consumePreposition(tokens, i);
      break;
    }
    if (t.low === 'over' && next) {
      const n = numberValue(next.low);
      const unit = tokens[i + 2];
      if (n !== undefined && unit && /^weken?$/.test(unit.low)) {
        weekOffset = n;
        t.used = next.used = unit.used = true;
        break;
      }
      if (n !== undefined && unit && /^dagen?$/.test(unit.low)) {
        t.used = next.used = unit.used = true;
        return { date: toISODate(addDays(today, n)) };
      }
    }
  }

  // 2. Today / tomorrow words.
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.used) continue;
    if (t.low in TODAY_PARTS) {
      t.used = true;
      consumePreposition(tokens, i);
      return { date: toISODate(today), partOfDay: TODAY_PARTS[t.low] };
    }
    if (t.low === 'overmorgen') {
      t.used = true;
      return { date: toISODate(addDays(today, 2)) };
    }
    if (t.low in TOMORROW_PARTS) {
      t.used = true;
      consumePreposition(tokens, i);
      // "morgen avond" / "morgen 's avonds"
      const next = tokens[i + 1];
      if (next && !next.used && next.low in PART_OF_DAY) {
        next.used = true;
        partOfDay = PART_OF_DAY[next.low];
      }
      return { date: toISODate(addDays(today, 1)), partOfDay: TOMORROW_PARTS[t.low] ?? partOfDay };
    }
  }

  // 3. Explicit dates: "13 oktober", "13-10", "13/10/2026".
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.used) continue;
    const numeric = /^(\d{1,2})[-/](\d{1,2})(?:[-/](\d{2,4}))?$/.exec(t.low);
    if (numeric) {
      const date = buildDate(today, Number(numeric[1]), Number(numeric[2]), numeric[3]);
      if (date) {
        t.used = true;
        consumePreposition(tokens, i);
        return { date };
      }
    }
    const day = /^(\d{1,2})(?:e|ste|de)?$/.exec(t.low);
    const monthTok = tokens[i + 1];
    if (day && monthTok && MONTHS[monthTok.low] !== undefined) {
      const yearTok = tokens[i + 2];
      const year = yearTok && /^\d{4}$/.test(yearTok.low) ? yearTok.low : undefined;
      const date = buildDate(today, Number(day[1]), MONTHS[monthTok.low], year);
      if (date) {
        t.used = monthTok.used = true;
        if (year) yearTok.used = true;
        // Drop a leading weekday that just repeats the date: "dinsdag 13 oktober".
        const prev = tokens[i - 1];
        if (prev && WEEKDAYS[prev.low] !== undefined) prev.used = true;
        consumePreposition(tokens, prev?.used ? i - 1 : i);
        return { date };
      }
    }
  }

  // 4. Weekdays, optionally with a modifier.
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.used) continue;
    const weekday = WEEKDAYS[t.low];
    if (weekday === undefined) continue;
    // Two-letter abbreviations only count when they look like a date ("di 19:45", "do pizza").
    if (t.low.length === 2 && i > 0 && !['op', 'van', 'komende', 'volgende', 'aanstaande'].includes(tokens[i - 1].low)) continue;
    t.used = true;

    const prev = tokens[i - 1];
    const modifier = prev && !prev.used ? prev.low : undefined;
    if (modifier && PREPOSITIONS_BEFORE_DATE.has(modifier)) prev.used = true;
    consumePreposition(tokens, prev?.used ? i - 1 : i);

    // "maandagavond" is not split by users often, but "maandag avond" is.
    const next = tokens[i + 1];
    if (next && !next.used && next.low in PART_OF_DAY) {
      next.used = true;
      partOfDay = PART_OF_DAY[next.low];
    }

    if (weekOffset !== undefined) {
      const monday = startOfISOWeek(addWeeks(today, weekOffset));
      return { date: toISODate(addDays(monday, weekday - 1)), partOfDay };
    }

    const todayWd = isoWeekday(today);
    if (modifier === 'komende' || modifier === 'volgende' || modifier === 'aanstaande' || modifier === 'aankomende') {
      const ahead = ((weekday - todayWd + 7) % 7) || 7;
      const first = addDays(today, ahead);
      const sameWeek = isoWeekday(first) > todayWd && differenceInCalendarDays(first, today) < 7;
      if (modifier !== 'aanstaande' && sameWeek) {
        return { date: toISODate(first), alternative: toISODate(addDays(first, 7)), partOfDay };
      }
      return { date: toISODate(first), partOfDay };
    }
    if (modifier === 'deze') {
      const monday = startOfISOWeek(today);
      return { date: toISODate(addDays(monday, weekday - 1)), partOfDay };
    }
    const ahead = (weekday - todayWd + 7) % 7;
    return { date: toISODate(addDays(today, ahead)), partOfDay };
  }

  // 5. Weekend.
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.used || t.low !== 'weekend') continue;
    t.used = true;
    const prev = tokens[i - 1];
    if (prev && ['dit', 'het', 'komend', 'volgend', 'in'].includes(prev.low)) prev.used = true;
    const todayWd = isoWeekday(today);
    let ahead = todayWd >= 6 ? 0 : 6 - todayWd;
    if (prev?.low === 'volgend' || weekOffset === 1) ahead += todayWd >= 6 ? 7 - (todayWd - 6) : 7;
    return { date: toISODate(addDays(today, ahead)) };
  }

  if (weekOffset !== undefined) {
    return { date: toISODate(startOfISOWeek(addWeeks(today, weekOffset))) };
  }
  return undefined;
}

function buildDate(today: Date, day: number, month: number, yearText?: string): ISODate | undefined {
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;
  let year = yearText ? Number(yearText.length === 2 ? `20${yearText}` : yearText) : today.getFullYear();
  let d = new Date(year, month - 1, day);
  if (!isValid(d) || d.getDate() !== day) return undefined;
  // Without a year, a date more than two weeks in the past means next year.
  if (!yearText && differenceInCalendarDays(d, today) < -14) {
    year += 1;
    d = new Date(year, month - 1, day);
  }
  return toISODate(d);
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function clock(h: number, m: number): ClockTime | undefined {
  if (h < 0 || h > 24 || m < 0 || m > 59) return undefined;
  return `${pad(h % 24)}:${pad(m)}`;
}

interface RawTime {
  h: number;
  m: number;
  /** "19:45" is explicit; "half 8" or "om 7 uur" needs am/pm guessing. */
  explicit: boolean;
  length: number;
}

function readTimeAt(tokens: Token[], i: number): RawTime | undefined {
  const t = tokens[i];
  if (!t || t.used) return undefined;
  const colon = /^(\d{1,2})[:.](\d{2})$/.exec(t.low);
  if (colon) {
    const h = Number(colon[1]);
    const m = Number(colon[2]);
    if (h <= 24 && m <= 59) return { h, m, explicit: colon[1].length === 2 || h >= 13, length: 1 };
  }
  const next = tokens[i + 1];
  if ((t.low === 'half' || t.low === 'kwart') && next) {
    if (t.low === 'half') {
      const n = numberValue(next.low);
      if (n !== undefined && n >= 1 && n <= 24) return { h: n - 1, m: 30, explicit: false, length: 2 };
    } else {
      const dir = next.low;
      const n = numberValue(tokens[i + 2]?.low ?? '');
      if (n !== undefined && (dir === 'over' || dir === 'voor')) {
        return dir === 'over'
          ? { h: n, m: 15, explicit: false, length: 3 }
          : { h: n - 1, m: 45, explicit: false, length: 3 };
      }
    }
  }
  const hourOnly = /^(\d{1,2})$/.exec(t.low);
  if (hourOnly) {
    const h = Number(hourOnly[1]);
    if (h <= 24) return { h, m: 0, explicit: h >= 13, length: 1 };
  }
  return undefined;
}

function resolveHour(raw: RawTime, part?: PartOfDay): ClockTime | undefined {
  let h = raw.h;
  if (!raw.explicit) {
    if ((part === 'evening' || part === 'afternoon') && h < 12) h += 12;
    else if (!part && h >= 1 && h <= 7) h += 12;
  }
  return clock(h, raw.m);
}

/** Finds and consumes start/end times: "om 19:45", "19.45 uur", "half 8", "van 9 tot 17". */
export function extractTime(tokens: Token[], defaultPart?: PartOfDay): TimeMatch {
  let partOfDay = defaultPart;
  for (const t of tokens) {
    if (!t.used && t.low in PART_OF_DAY) {
      partOfDay = PART_OF_DAY[t.low];
      t.used = true;
    }
  }

  let start: RawTime | undefined;
  let end: RawTime | undefined;

  for (let i = 0; i < tokens.length && !start; i++) {
    const t = tokens[i];
    if (t.used) continue;

    // "19:45-21:00"
    const range = /^(\d{1,2}[:.]\d{2}|\d{1,2})-(\d{1,2}[:.]\d{2}|\d{1,2})$/.exec(t.low);
    if (range && (t.low.includes(':') || t.low.includes('.') || tokens[i + 1]?.low === 'uur' || tokens[i - 1]?.low === 'van')) {
      const a = readTimeAt([{ raw: range[1], low: range[1], used: false }], 0);
      const b = readTimeAt([{ raw: range[2], low: range[2], used: false }], 0);
      if (a && b) {
        start = a;
        end = b;
        t.used = true;
        if (tokens[i - 1]?.low === 'van' || tokens[i - 1]?.low === 'om') tokens[i - 1].used = true;
        if (tokens[i + 1]?.low === 'uur') tokens[i + 1].used = true;
        break;
      }
    }

    const prev = tokens[i - 1];
    const raw = readTimeAt(tokens, i);
    if (!raw) continue;
    const isColon = /[:.]/.test(t.low);
    const afterUur = tokens[i + raw.length]?.low === 'uur';
    const introduced = prev && !prev.used && ['om', 'rond', 'vanaf', 'van', 'tegen'].includes(prev.low);
    const colloquial = t.low === 'half' || t.low === 'kwart';
    if (!isColon && !afterUur && !introduced && !colloquial) continue;
    // "van 9 tot 17": only a range when "tot" follows.
    if (prev?.low === 'van' && !isColon && !afterUur) {
      const totIdx = i + raw.length;
      if (tokens[totIdx]?.low !== 'tot') continue;
    }

    start = raw;
    for (let k = 0; k < raw.length; k++) tokens[i + k].used = true;
    if (introduced) prev.used = true;
    if (afterUur) tokens[i + raw.length].used = true;

    const totIdx = i + raw.length + (afterUur ? 1 : 0);
    if (tokens[totIdx]?.low === 'tot') {
      const endRaw = readTimeAt(tokens, totIdx + 1);
      if (endRaw) {
        end = endRaw;
        tokens[totIdx].used = true;
        for (let k = 0; k < endRaw.length; k++) tokens[totIdx + 1 + k].used = true;
        if (tokens[totIdx + 1 + endRaw.length]?.low === 'uur') tokens[totIdx + 1 + endRaw.length].used = true;
      }
    }
  }

  const startClock = start ? resolveHour(start, partOfDay) : undefined;
  let endClock = end ? resolveHour(end, partOfDay) : undefined;
  // "van 9 tot 5" → 17:00
  if (startClock && endClock && endClock <= startClock && end && !end.explicit) {
    endClock = clock((end.h + 12) % 24, end.m);
  }
  return { start: startClock, end: endClock, partOfDay };
}

export function hasTemporalHint(tokens: Token[]): boolean {
  return tokens.some(
    (t) =>
      WEEKDAYS[t.low] !== undefined && t.low.length > 2 ||
      t.low in TODAY_PARTS ||
      t.low in TOMORROW_PARTS ||
      t.low === 'overmorgen' ||
      t.low in PART_OF_DAY ||
      /^\d{1,2}[:.]\d{2}$/.test(t.low),
  );
}
