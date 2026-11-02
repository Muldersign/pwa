import type { BraceEvent, DayNote } from '../domain/types';
import { addDays, dayKey, parseDayKey } from '../lib/time';
import { newId } from '../lib/id';
import { db } from './db';

/** Deterministic pseudo-random so the demo looks the same every time. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

/** ~4 weeks of realistic data in the separate demo database. */
export async function seedDemo(now = Date.now()) {
  const rand = rng(42);
  const today = dayKey(now);
  const events: BraceEvent[] = [];
  const push = (kind: BraceEvent['kind'], at: number) => {
    if (at <= now) events.push({ id: newId(), kind, at, source: 'button', createdAt: at, updatedAt: at });
  };
  const first = addDays(today, -27);
  const d0 = parseDayKey(first);
  push('in', new Date(d0.getFullYear(), d0.getMonth(), d0.getDate() - 1, 22, 10).getTime());
  for (let i = 0; i <= 27; i++) {
    const d = parseDayKey(addDays(first, i));
    const at = (h: number, m: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m).getTime();
    const slack = [5, 12, 19].includes(i) ? 1.9 : 1; // a few days with long dinners
    const meals: [number, number, number][] = [
      [7, 10 + Math.floor(rand() * 30), 18 + Math.floor(rand() * 15)],
      [12, 5 + Math.floor(rand() * 35), 22 + Math.floor(rand() * 18)],
      [18, Math.floor(rand() * 40), Math.floor((26 + rand() * 20) * slack)],
    ];
    if (rand() < 0.35) meals.splice(2, 0, [15, 20 + Math.floor(rand() * 20), 8 + Math.floor(rand() * 8)]);
    for (const [h, m, dur] of meals) {
      const start = at(h, m);
      push('out', start);
      push('in', start + dur * 60_000);
    }
  }
  const notes: DayNote[] = [
    { date: addDays(today, -27), text: 'Nieuwe aligner ingezet (set 4). Spannend!', updatedAt: now },
    { date: addDays(today, -26), text: 'Veel druk op mijn voortanden.', updatedAt: now },
    { date: addDays(today, -15), text: 'Beugel wat langer uit gehad tijdens het eten, verjaardag van oma.', updatedAt: now },
    { date: addDays(today, -13), text: 'Nieuwe aligner ingezet (set 5).', updatedAt: now },
    { date: addDays(today, -12), text: 'Vandaag veel last van mijn tanden.', updatedAt: now },
    { date: addDays(today, -1), text: 'Lekker volgehouden 💜', updatedAt: now },
  ];
  const lunch = [...events].reverse().find((e) => e.kind === 'out' && new Date(e.at).getHours() === 12);
  if (lunch) lunch.note = 'Lunch op het werk';
  await db.transaction('rw', [db.events, db.notes, db.confirmations], async () => {
    await Promise.all([db.events.clear(), db.notes.clear(), db.confirmations.clear()]);
    await db.events.bulkPut(events);
    await db.notes.bulkPut(notes);
  });
}
