import { describe, expect, it } from 'vitest';
import type { BraceEvent, Kind } from '../domain/types';
import { computeDay, computeStats, computeDays, trackedDayKeys } from './tracking';
import { addPeriod, applyDelete, planDelete, toggle, updateEvent, validateSequence } from './edits';
import { HOUR, MIN, dayEnd, dayStart } from './time';

let n = 0;
const ev = (kind: Kind, y: number, m: number, d: number, h: number, min = 0): BraceEvent => ({
  id: `e${++n}`,
  kind,
  at: new Date(y, m - 1, d, h, min).getTime(),
  source: 'button',
  createdAt: 0,
  updatedAt: 0,
});
const opts = { goalMinutes: 22 * 60 };

describe('computeDay', () => {
  it('sums the example day from the brief', () => {
    const events = [
      ev('in', 2026, 10, 14, 0, 0),
      ev('out', 2026, 10, 15, 7, 30),
      ev('in', 2026, 10, 15, 8, 0),
      ev('out', 2026, 10, 15, 12, 15),
      ev('in', 2026, 10, 15, 12, 50),
      ev('out', 2026, 10, 15, 18, 30),
      ev('in', 2026, 10, 15, 19, 5),
    ];
    const now = new Date(2026, 9, 16, 10).getTime();
    const day = computeDay('2026-10-15', events, now, opts);
    expect(day.outMs).toBe(30 * MIN + 35 * MIN + 35 * MIN);
    expect(day.wornMs).toBe(24 * HOUR - day.outMs);
    expect(day.status).toBe('achieved');
    expect(day.incomplete).toBe(false);
  });

  it('splits a period across midnight', () => {
    const events = [ev('out', 2026, 10, 10, 23, 30), ev('in', 2026, 10, 11, 0, 20)];
    const now = new Date(2026, 9, 11, 12).getTime();
    const d1 = computeDay('2026-10-10', events, now, opts);
    const d2 = computeDay('2026-10-11', events, now, opts);
    expect(d1.outMs).toBe(30 * MIN);
    expect(d2.outMs).toBe(20 * MIN);
    expect(d2.wornMs).toBe(12 * HOUR - 20 * MIN);
    expect(d2.isToday).toBe(true);
  });

  it('never assumes wear before the first registration', () => {
    const events = [ev('in', 2026, 10, 10, 15, 0)];
    const now = new Date(2026, 9, 10, 20).getTime();
    const d = computeDay('2026-10-10', events, now, opts);
    expect(d.wornMs).toBe(5 * HOUR);
    expect(d.unknownMs).toBe(15 * HOUR);
    expect(d.incomplete).toBe(true);
  });

  it('marks a past day without registrations as unconfirmed until confirmed', () => {
    const events = [ev('in', 2026, 10, 9, 20, 0), ev('out', 2026, 10, 11, 8, 0)];
    const now = new Date(2026, 9, 11, 9).getTime();
    const d = computeDay('2026-10-10', events, now, opts);
    expect(d.status).toBe('unconfirmed');
    expect(d.wornMs).toBe(0);
    const c = computeDay('2026-10-10', events, now, { ...opts, confirmed: new Set(['2026-10-10']) });
    expect(c.wornMs).toBe(24 * HOUR);
    expect(c.status).toBe('achieved');
  });

  it('handles DST: 25-hour day at the end of October', () => {
    const key = '2026-10-25';
    expect(dayEnd(key) - dayStart(key)).toBe(25 * HOUR);
    const events = [ev('in', 2026, 10, 24, 22), ev('out', 2026, 10, 25, 12), ev('in', 2026, 10, 25, 13)];
    const d = computeDay(key, events, new Date(2026, 9, 26, 9).getTime(), opts);
    expect(d.outMs).toBe(HOUR);
    expect(d.wornMs).toBe(24 * HOUR);
  });

  it('counts today only up to now', () => {
    const events = [ev('in', 2026, 10, 10, 0), ev('out', 2026, 10, 11, 9)];
    const now = new Date(2026, 9, 11, 9, 24).getTime();
    const d = computeDay('2026-10-11', events, now, opts);
    expect(d.wornMs).toBe(9 * HOUR);
    expect(d.outMs).toBe(24 * MIN);
    expect(d.status).toBe('today');
  });
});

describe('stats', () => {
  it('computes streaks without letting an unfinished today break them', () => {
    const events = [
      ev('in', 2026, 10, 1, 0),
      ev('out', 2026, 10, 2, 12),
      ev('in', 2026, 10, 2, 16), // day 2 missed (4h out)
      ev('out', 2026, 10, 3, 12),
      ev('in', 2026, 10, 3, 12, 30),
      ev('out', 2026, 10, 4, 12),
      ev('in', 2026, 10, 4, 12, 30),
      ev('out', 2026, 10, 5, 8),
    ];
    const now = new Date(2026, 9, 5, 8, 30).getTime();
    const days = computeDays(trackedDayKeys(events, now), events, now, opts);
    const s = computeStats(days);
    expect(s.currentStreak).toBe(2);
    expect(s.longestStreak).toBe(2);
    expect(s.completedDays).toBe(4);
    expect(s.achievedDays).toBe(3);
  });
});

describe('edits', () => {
  const now = new Date(2026, 9, 10, 20).getTime();
  const base = () => [ev('in', 2026, 10, 10, 8), ev('out', 2026, 10, 10, 12), ev('in', 2026, 10, 10, 12, 30)];

  it('toggle alternates and never doubles', () => {
    const r1 = toggle(base(), now);
    expect(r1.ok && r1.events.at(-1)!.kind).toBe('out');
    if (!r1.ok) return;
    // A second tap a few seconds later is stored at its real time, never in the future
    const r2 = toggle(r1.events, now + 5000);
    expect(r2.ok && r2.events.at(-1)!.at).toBe(now + 5000);
    if (r2.ok) expect(validateSequence(r2.events, now + 5000)).toBe(null);
  });

  it('adds a forgotten out-period inside a wearing period', () => {
    const r = addPeriod(base(), 'out', new Date(2026, 9, 10, 18, 30).getTime(), new Date(2026, 9, 10, 19, 5).getTime(), now);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.events.map((e) => e.kind)).toEqual(['in', 'out', 'in', 'out', 'in']);
  });

  it('rejects overlapping periods', () => {
    const r = addPeriod(base(), 'out', new Date(2026, 9, 10, 11).getTime(), new Date(2026, 9, 10, 13).getTime(), now);
    expect(r.ok).toBe(false);
  });

  it('rejects an edit that reorders moments', () => {
    const events = base();
    const r = updateEvent(events, events[1].id, { at: new Date(2026, 9, 10, 13).getTime() }, now);
    expect(r.ok).toBe(false);
  });

  it('deleting a middle moment removes the whole period', () => {
    const events = base();
    const plan = planDelete(events, events[1].id)!;
    expect(plan.remove).toHaveLength(2);
    expect(applyDelete(events, plan).map((e) => e.kind)).toEqual(['in']);
  });
});

describe('partial days', () => {
  it('the first, partly registered day is neutral and does not break a streak', () => {
    const events = [ev('in', 2026, 9, 1, 22, 0), ev('out', 2026, 9, 2, 12), ev('in', 2026, 9, 2, 12, 20), ev('out', 2026, 9, 3, 12), ev('in', 2026, 9, 3, 12, 30)];
    const now = new Date(2026, 8, 4, 10).getTime();
    const days = computeDays(trackedDayKeys(events, now), events, now, opts);
    expect(days[0].status).toBe('partial');
    expect(computeStats(days).currentStreak).toBe(2);
  });
});
