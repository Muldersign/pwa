import type { Activity, ActivityCategory, ISODate, Meal, MealType } from '../domain/types';
import { timeToMinutes } from './dates';

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Ontbijt',
  lunch: 'Lunch',
  dinner: 'Avondeten',
  snack: 'Snack',
};

/** Where an untimed meal sits in the day. */
const MEAL_DEFAULT_MINUTES: Record<MealType, number> = {
  breakfast: 8 * 60,
  lunch: 12 * 60 + 30,
  snack: 15 * 60 + 30,
  dinner: 18 * 60,
};

export const CATEGORY_LABELS: Record<ActivityCategory | 'meal', string> = {
  meal: 'Eten',
  work: 'Werk',
  sport: 'Sport',
  social: 'Sociaal',
  home: 'Thuis',
  appointment: 'Afspraak',
  travel: 'Onderweg',
  other: 'Overig',
};

export type TimelineEntry =
  | { kind: 'activity'; id: string; sortMinutes: number; time?: string; endTime?: string; item: Activity }
  | { kind: 'meal'; id: string; sortMinutes: number; time?: string; item: Meal };

export function buildDayEntries(date: ISODate, activities: Activity[], meals: Meal[]): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    ...activities
      .filter((a) => a.date === date)
      .map<TimelineEntry>((a) => ({
        kind: 'activity',
        id: a.id,
        // Untimed activities read like all-day items and go first.
        sortMinutes: timeToMinutes(a.startTime) ?? -1,
        time: a.startTime,
        endTime: a.endTime,
        item: a,
      })),
    ...meals
      .filter((m) => m.date === date)
      .map<TimelineEntry>((m) => ({
        kind: 'meal',
        id: m.id,
        sortMinutes: timeToMinutes(m.time) ?? MEAL_DEFAULT_MINUTES[m.mealType],
        time: m.time,
        item: m,
      })),
  ];
  return entries.sort((a, b) => a.sortMinutes - b.sortMinutes || a.item.createdAt.localeCompare(b.item.createdAt));
}

export function entryEndMinutes(e: TimelineEntry): number {
  if (e.kind === 'activity') return timeToMinutes(e.endTime) ?? (e.sortMinutes < 0 ? 24 * 60 : e.sortMinutes + 60);
  return e.sortMinutes + 45;
}
