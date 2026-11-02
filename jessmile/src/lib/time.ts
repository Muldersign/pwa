// Local-calendar helpers. All stored times are epoch ms; days are local calendar days,
// built with the Date constructor so DST days (23 h / 25 h) are handled by the platform.

export const MIN = 60_000;
export const HOUR = 60 * MIN;

export function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function dayKey(d: Date | number): string {
  const x = typeof d === 'number' ? new Date(d) : d;
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
}

export function parseDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function dayStart(key: string): number {
  return parseDayKey(key).getTime();
}

export function dayEnd(key: string): number {
  const d = parseDayKey(key);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
}

export function addDays(key: string, n: number): string {
  const d = parseDayKey(key);
  return dayKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n));
}

/** Inclusive list of day keys from `from` to `to`. */
export function dayRange(from: string, to: string): string[] {
  const out: string[] = [];
  for (let k = from; k <= to; k = addDays(k, 1)) out.push(k);
  return out;
}

const dateFmt = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });
const dateFmtYear = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const shortFmt = new Intl.DateTimeFormat('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' });
const monthFmt = new Intl.DateTimeFormat('nl-NL', { month: 'long', year: 'numeric' });

export function formatLongDate(key: string, withYear = false): string {
  return (withYear ? dateFmtYear : dateFmt).format(parseDayKey(key));
}
export function formatShortDate(key: string): string {
  return shortFmt.format(parseDayKey(key)).replace('.', '');
}
export function formatMonth(year: number, month: number): string {
  return monthFmt.format(new Date(year, month, 1));
}

export function formatClock(ms: number): string {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 18u 42m · 42m · 0m */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / MIN));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  return `${h}u ${pad(m)}m`;
}

/** Friendlier variant for sentences: "24 minuten", "1 uur en 5 minuten" */
export function formatDurationWords(ms: number): string {
  const total = Math.max(0, Math.floor(ms / MIN));
  const h = Math.floor(total / 60);
  const m = total % 60;
  const mins = m === 1 ? '1 minuut' : `${m} minuten`;
  if (h === 0) return mins;
  const hours = `${h} uur`;
  return m === 0 ? hours : `${hours} en ${mins}`;
}

/** Live stopwatch: 1:05:09 / 24:09 */
export function formatStopwatch(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

/** Value for <input type="datetime-local"> */
export function toLocalInput(ms: number): string {
  const d = new Date(ms);
  return `${dayKey(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalInput(value: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

export function floorMinute(ms: number): number {
  return Math.floor(ms / MIN) * MIN;
}
