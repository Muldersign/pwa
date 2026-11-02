import type { BraceEvent, Kind } from '../domain/types';
import { HOUR, addDays, dayEnd, dayKey, dayRange, dayStart } from './time';

/**
 * The model: a list of state changes ("from this moment the aligner is in/out").
 * Time is only counted between registered moments; before the very first
 * registration the state is unknown. A past day without any registration that
 * falls inside one long period is "unconfirmed": it is not counted until Jessica
 * confirms it — the app never silently assumes 24 hours of wear.
 */

export type SegmentKind = Kind | 'unknown' | 'unconfirmed' | 'future';

export interface Segment {
  kind: SegmentKind;
  start: number;
  end: number;
  /** For unconfirmed segments: the state that would apply after confirming */
  assumed?: Kind;
}

export type DayStatus = 'future' | 'nodata' | 'unconfirmed' | 'partial' | 'today' | 'achieved' | 'missed';

export interface DaySummary {
  key: string;
  start: number;
  end: number;
  isToday: boolean;
  segments: Segment[];
  /** Registrations whose timestamp falls inside this day */
  events: BraceEvent[];
  wornMs: number;
  outMs: number;
  unknownMs: number;
  goalMs: number;
  /** Out-budget for the day: 24 h − goal */
  budgetMs: number;
  /** worn / goal, 0..1+ */
  progress: number;
  achieved: boolean;
  status: DayStatus;
  /** Part of the (elapsed) day has no registered state */
  incomplete: boolean;
  unconfirmed: boolean;
}

export function opposite(kind: Kind): Kind {
  return kind === 'in' ? 'out' : 'in';
}

export function sortEvents(events: BraceEvent[]): BraceEvent[] {
  return [...events].sort((a, b) => a.at - b.at);
}

/** State at a moment (null = unknown, before the first registration). Events must be sorted. */
export function stateAt(events: BraceEvent[], t: number): BraceEvent | null {
  let lo = 0;
  let hi = events.length - 1;
  let found: BraceEvent | null = null;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (events[mid].at <= t) {
      found = events[mid];
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return found;
}

function pushSeg(segs: Segment[], seg: Segment) {
  if (seg.end <= seg.start) return;
  const last = segs[segs.length - 1];
  if (last && last.kind === seg.kind && last.end === seg.start && last.assumed === seg.assumed) last.end = seg.end;
  else segs.push({ ...seg });
}

export interface ComputeOptions {
  goalMinutes: number;
  confirmed?: ReadonlySet<string>;
}

export function computeDay(key: string, sorted: BraceEvent[], now: number, opts: ComputeOptions): DaySummary {
  const start = dayStart(key);
  const end = dayEnd(key);
  const goalMs = opts.goalMinutes * 60_000;
  const budgetMs = Math.max(0, 24 * HOUR - goalMs);
  const isToday = now >= start && now < end;
  const events = sorted.filter((e) => e.at >= start && e.at < end);
  const segments: Segment[] = [];
  const base = { key, start, end, isToday, events, goalMs, budgetMs };

  if (start > now) {
    segments.push({ kind: 'future', start, end });
    return { ...base, segments, wornMs: 0, outMs: 0, unknownMs: 0, progress: 0, achieved: false, status: 'future', incomplete: false, unconfirmed: false };
  }

  const effEnd = Math.min(end, now);
  const unconfirmed = !isToday && events.length === 0 && !opts.confirmed?.has(key);

  // Walk all periods that overlap [start, effEnd)
  let cursor = start;
  const first = sorted[0];
  if (!first || first.at >= effEnd) {
    pushSeg(segments, { kind: 'unknown', start, end: effEnd });
    cursor = effEnd;
  } else {
    if (first.at > start) {
      pushSeg(segments, { kind: 'unknown', start, end: first.at });
      cursor = first.at;
    }
    let current = stateAt(sorted, cursor);
    let idx = current ? sorted.indexOf(current) : 0;
    while (cursor < effEnd && current) {
      const next = sorted[idx + 1];
      const segEnd = Math.min(next ? next.at : effEnd, effEnd);
      if (unconfirmed) pushSeg(segments, { kind: 'unconfirmed', start: cursor, end: segEnd, assumed: current.kind });
      else pushSeg(segments, { kind: current.kind, start: cursor, end: segEnd });
      cursor = segEnd;
      idx += 1;
      current = next ?? null;
    }
  }
  if (effEnd < end) pushSeg(segments, { kind: 'future', start: effEnd, end });

  let wornMs = 0;
  let outMs = 0;
  let unknownMs = 0;
  for (const s of segments) {
    const d = s.end - s.start;
    if (s.kind === 'in') wornMs += d;
    else if (s.kind === 'out') outMs += d;
    else if (s.kind === 'unknown' || s.kind === 'unconfirmed') unknownMs += d;
  }
  const progress = goalMs > 0 ? wornMs / goalMs : 0;
  const achieved = wornMs >= goalMs;
  const hasData = wornMs + outMs > 0;
  let status: DayStatus;
  if (unconfirmed && unknownMs > 0 && !hasData) status = 'unconfirmed';
  else if (!hasData) status = 'nodata';
  else if (isToday) status = achieved ? 'achieved' : 'today';
  // A past day that is only partly registered (e.g. the very first day) is neutral, never "missed".
  else status = achieved ? 'achieved' : unknownMs > 0 ? 'partial' : 'missed';

  return {
    ...base,
    segments,
    wornMs,
    outMs,
    unknownMs,
    progress,
    achieved,
    status,
    incomplete: hasData && unknownMs > 0,
    unconfirmed: status === 'unconfirmed',
  };
}

export function computeDays(keys: string[], sorted: BraceEvent[], now: number, opts: ComputeOptions): DaySummary[] {
  return keys.map((k) => computeDay(k, sorted, now, opts));
}

/** All days from the first registration up to today (inclusive). */
export function trackedDayKeys(sorted: BraceEvent[], now: number): string[] {
  if (!sorted.length) return [];
  return dayRange(dayKey(sorted[0].at), dayKey(now));
}

export interface Stats {
  completedDays: number;
  achievedDays: number;
  averageWornMs: number;
  currentStreak: number;
  longestStreak: number;
  last7WornMs: number;
  last7Days: DaySummary[];
  todayAchieved: boolean;
}

/** `days` must be consecutive and ascending, ending today. */
export function computeStats(days: DaySummary[]): Stats {
  const past = days.filter((d) => !d.isToday && (d.status === 'achieved' || d.status === 'missed'));
  const achievedDays = days.filter((d) => d.status === 'achieved').length;
  const averageWornMs = past.length ? past.reduce((s, d) => s + d.wornMs, 0) / past.length : 0;

  let longest = 0;
  let run = 0;
  for (const d of days) {
    if (d.status === 'achieved') {
      run += 1;
      longest = Math.max(longest, run);
    } else if (!(d.isToday && d.status === 'today') && d.status !== 'partial') run = 0; // unfinished/partial days never break a streak
  }

  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const d = days[i];
    if ((d.isToday && d.status !== 'achieved') || d.status === 'partial') continue;
    if (d.status === 'achieved') current += 1;
    else break;
  }

  const last7 = days.slice(-7);
  const today = days[days.length - 1];
  return {
    completedDays: past.length,
    achievedDays,
    averageWornMs,
    currentStreak: current,
    longestStreak: longest,
    last7WornMs: last7.reduce((s, d) => s + d.wornMs, 0),
    last7Days: last7,
    todayAchieved: !!today?.isToday && today.status === 'achieved',
  };
}

export interface CurrentState {
  kind: Kind | null;
  since: number | null;
  event: BraceEvent | null;
}

export function currentState(sorted: BraceEvent[], now: number): CurrentState {
  const e = stateAt(sorted, now);
  return { kind: e?.kind ?? null, since: e?.at ?? null, event: e };
}

/** Days (keys) touched by the period that starts at `event`. */
export function periodEnd(sorted: BraceEvent[], event: BraceEvent): number | null {
  const i = sorted.findIndex((e) => e.id === event.id);
  return sorted[i + 1]?.at ?? null;
}

export function lastNDays(todayKey: string, n: number): string[] {
  return dayRange(addDays(todayKey, -(n - 1)), todayKey);
}
