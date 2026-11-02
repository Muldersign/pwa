import type { BraceEvent, Settings } from '../domain/types';
import type { DaySummary } from './tracking';
import { MIN, formatDurationWords } from './time';

export interface PlannedReminder {
  key: string;
  at: number;
  title: string;
  body: string;
}

const MEAL_WINDOWS: [number, number][] = [
  [6.5, 10],
  [11.5, 14.5],
  [16.5, 21],
];

function inMealWindow(ms: number): boolean {
  const d = new Date(ms);
  const h = d.getHours() + d.getMinutes() / 60;
  return MEAL_WINDOWS.some(([a, b]) => h >= a && h < b);
}

/** Reminders that belong to the current "out" period. Pure: the scheduler decides when to show them. */
export function planReminders(lastEvent: BraceEvent | null, today: DaySummary, now: number, settings: Settings): PlannedReminder[] {
  const r = settings.reminders;
  if (!r.enabled || !lastEvent || lastEvent.kind !== 'out') return [];
  const since = lastEvent.at;
  const out: PlannedReminder[] = [];
  const add = (kind: string, at: number, title: string, body: string) => out.push({ key: `${lastEvent.id}:${kind}`, at, title, body });

  if (r.first.on) add('first', since + r.first.minutes * MIN, 'Beugel nog uit', `Je beugel is al ${formatDurationWords(r.first.minutes * MIN)} uit. Tijd om hem weer in te doen? 💜`);
  if (r.second.on && r.second.minutes !== r.first.minutes)
    add('second', since + r.second.minutes * MIN, 'Beugel al een tijdje uit', `Je beugel is al ${formatDurationWords(r.second.minutes * MIN)} uit.`);
  if (r.meal.on && inMealWindow(since))
    add('meal', since + r.meal.minutes * MIN, 'Klaar met eten?', 'Vergeet niet je beugel terug te plaatsen na het tandenpoetsen.');
  if (r.budgetLow.on && today.isToday) {
    const remaining = today.budgetMs - today.outMs; // budget left right now, while out
    const at = now + (remaining - r.budgetLow.minutes * MIN);
    if (remaining > 0)
      add('budget', at, 'Uit-budget bijna op', `Nog ${formatDurationWords(r.budgetLow.minutes * MIN)} uit-tijd over voor vandaag.`);
  }
  return out.sort((a, b) => a.at - b.at);
}

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export async function showNotification(title: string, body: string) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return false;
  const options: NotificationOptions = { body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'alignerly' };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) {
      await reg.showNotification(title, options);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    new Notification(title, options);
    return true;
  } catch {
    return false;
  }
}
