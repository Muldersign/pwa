import {
  addDays,
  addWeeks,
  differenceInCalendarDays,
  format,
  getISOWeek,
  isValid,
  parse,
  startOfISOWeek,
} from 'date-fns';
import { nl } from 'date-fns/locale';
import type { ClockTime, ISODate } from '../domain/types';

export { nl };

export function toISODate(date: Date): ISODate {
  return format(date, 'yyyy-MM-dd');
}

export function fromISODate(iso: ISODate): Date {
  const d = parse(iso, 'yyyy-MM-dd', new Date());
  return isValid(d) ? d : new Date(NaN);
}

export function todayISO(now = new Date()): ISODate {
  return toISODate(now);
}

export function weekStart(date: Date): Date {
  return startOfISOWeek(date);
}

export function weekDays(anyDayInWeek: Date): Date[] {
  const start = weekStart(anyDayInWeek);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function weekNumber(date: Date): number {
  return getISOWeek(date);
}

export function shiftWeek(date: Date, weeks: number): Date {
  return addWeeks(date, weeks);
}

/** "maandag 5 oktober" */
export function formatLongDate(date: Date | ISODate): string {
  const d = typeof date === 'string' ? fromISODate(date) : date;
  return format(d, 'EEEE d MMMM', { locale: nl });
}

/** "ma 5 okt" */
export function formatShortDate(date: Date | ISODate): string {
  const d = typeof date === 'string' ? fromISODate(date) : date;
  return format(d, 'EEEEEE d MMM', { locale: nl }).replace(/\./g, '');
}

/** "maandag" */
export function formatWeekday(date: Date | ISODate): string {
  const d = typeof date === 'string' ? fromISODate(date) : date;
  return format(d, 'EEEE', { locale: nl });
}

/** "Ma" */
export function formatWeekdayShort(date: Date): string {
  const s = format(date, 'EEEEEE', { locale: nl });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "5 – 11 oktober" or "28 sep – 4 okt" */
export function formatWeekRange(anyDayInWeek: Date): string {
  const days = weekDays(anyDayInWeek);
  const first = days[0];
  const last = days[6];
  if (first.getMonth() === last.getMonth()) {
    return `${format(first, 'd')} – ${format(last, 'd MMMM', { locale: nl })}`;
  }
  return `${format(first, 'd MMM', { locale: nl })} – ${format(last, 'd MMM', { locale: nl })}`.replace(/\./g, '');
}

/** Relative label used in confirmations: "vandaag", "morgen", "dinsdag 13 oktober". */
export function relativeDayLabel(iso: ISODate, now = new Date()): string {
  const diff = differenceInCalendarDays(fromISODate(iso), now);
  if (diff === 0) return 'vandaag';
  if (diff === 1) return 'morgen';
  if (diff === 2) return 'overmorgen';
  if (diff === -1) return 'gisteren';
  return formatLongDate(iso);
}

export function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 6) return 'Goedenacht';
  if (h < 12) return 'Goedemorgen';
  if (h < 18) return 'Goedemiddag';
  return 'Goedenavond';
}

export function timeToMinutes(t: ClockTime | undefined): number | undefined {
  if (!t) return undefined;
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) return undefined;
  return Number(m[1]) * 60 + Number(m[2]);
}

export function nowMinutes(now = new Date()): number {
  return now.getHours() * 60 + now.getMinutes();
}

export function isValidClockTime(t: string): boolean {
  const m = /^(\d{2}):(\d{2})$/.exec(t);
  return !!m && Number(m[1]) < 24 && Number(m[2]) < 60;
}
