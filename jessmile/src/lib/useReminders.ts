import { useEffect } from 'react';
import { useData } from '../state/DataContext';
import { dayKey } from './time';
import { planReminders, showNotification } from './reminders';
import { useToast } from '../state/ToastContext';

const FIRED_KEY = 'alignerly-fired-reminders';
/** Reminders more than this late (app was closed) are skipped instead of shown all at once. */
const GRACE = 10 * 60_000;

function loadFired(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(FIRED_KEY) ?? '[]'));
  } catch {
    return new Set();
  }
}
function saveFired(s: Set<string>) {
  try {
    localStorage.setItem(FIRED_KEY, JSON.stringify([...s].slice(-60)));
  } catch {
    /* ignore */
  }
}

/**
 * Schedules browser notifications for the current out-period while the app (or its tab) is alive.
 * Everything is recomputed from stored timestamps, so re-opening the app re-plans correctly.
 */
export function useReminders() {
  const { events, settings, computeDay, ready } = useData();
  const toast = useToast();
  useEffect(() => {
    if (!ready || !settings.reminders.enabled) return;
    let timers: number[] = [];
    const plan = () => {
      timers.forEach(clearTimeout);
      timers = [];
      const now = Date.now();
      const last = events[events.length - 1] ?? null;
      const today = computeDay(dayKey(now), now);
      const fired = loadFired();
      for (const r of planReminders(last, today, now, settings)) {
        if (fired.has(r.key)) continue;
        const fire = async () => {
          const f = loadFired();
          if (f.has(r.key)) return;
          f.add(r.key);
          saveFired(f);
          const shown = await showNotification(r.title, r.body);
          if (!shown || document.visibilityState === 'visible') toast.show({ text: `${r.title} · ${r.body}` });
        };
        const delay = r.at - now;
        if (delay <= 0) {
          if (-delay < GRACE) void fire();
          else {
            fired.add(r.key);
            saveFired(fired);
          }
        } else if (delay < 2 ** 31 - 1) timers.push(window.setTimeout(fire, delay));
      }
    };
    plan();
    const onVis = () => document.visibilityState === 'visible' && plan();
    document.addEventListener('visibilitychange', onVis);
    const tick = window.setInterval(plan, 5 * 60_000);
    return () => {
      timers.forEach(clearTimeout);
      clearInterval(tick);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [events, settings, computeDay, ready, toast]);
}
