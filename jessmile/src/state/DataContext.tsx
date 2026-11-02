import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from 'react';
import type { BraceEvent, DayNote, Kind, Settings } from '../domain/types';
import { db } from '../storage/db';
import * as repo from '../storage/repo';
import { useLive } from '../lib/useLive';
import { type DaySummary, computeDay, currentState, sortEvents, type CurrentState } from '../lib/tracking';
import { type EditResult, toggle as toggleOp } from '../lib/edits';
import { haptic } from '../lib/haptics';
import { formatClock } from '../lib/time';
import { useToast } from './ToastContext';

interface DataValue {
  ready: boolean;
  error: Error | null;
  events: BraceEvent[];
  notes: Map<string, DayNote>;
  confirmed: Set<string>;
  settings: Settings;
  computeDay: (key: string, now: number) => DaySummary;
  current: (now: number) => CurrentState;
  /** Big button. Returns false when ignored (double tap). */
  toggle: (initialKind?: Kind) => Promise<boolean>;
  /** Persist the result of a pure edit operation (from lib/edits). */
  commit: (result: EditResult, success?: string) => Promise<boolean>;
  replaceEvents: (next: BraceEvent[]) => Promise<void>;
  saveNote: (date: string, text: string) => Promise<void>;
  confirmDay: (date: string) => Promise<void>;
  unconfirmDay: (date: string) => Promise<void>;
  saveSettings: (s: Settings) => Promise<void>;
}

const Ctx = createContext<DataValue | null>(null);

export function DataProvider({ settings, children }: { settings: Settings; children: ReactNode }) {
  const toast = useToast();
  const ev = useLive(() => db.events.orderBy('at').toArray(), []);
  const nt = useLive(() => db.notes.toArray(), []);
  const cf = useLive(() => db.confirmations.toArray(), []);
  const st = useLive(() => repo.loadSettings(), []);

  const events = useMemo(() => sortEvents(ev.data ?? []), [ev.data]);
  const notes = useMemo(() => new Map((nt.data ?? []).map((n) => [n.date, n])), [nt.data]);
  const confirmed = useMemo(() => new Set((cf.data ?? []).map((c) => c.date)), [cf.data]);
  const liveSettings = st.data ?? settings;
  const eventsRef = useRef(events);
  eventsRef.current = events;
  const busy = useRef(0);

  const compute = useCallback(
    (key: string, now: number) => computeDay(key, events, now, { goalMinutes: liveSettings.goalMinutes, confirmed }),
    [events, confirmed, liveSettings.goalMinutes],
  );

  const commit = useCallback(
    async (result: EditResult, success?: string) => {
      if (!result.ok) {
        toast.show({ text: result.error, tone: 'error' });
        haptic([8, 40, 8]);
        return false;
      }
      try {
        await repo.replaceEvents(result.events);
        if (result.message || success) toast.show({ text: result.message ?? success! });
        return true;
      } catch (e) {
        toast.show({ text: `Opslaan mislukt: ${(e as Error).message}`, tone: 'error' });
        return false;
      }
    },
    [toast],
  );

  const toggle = useCallback(
    async (initialKind?: Kind) => {
      // Guard against fast double taps: ignore presses within 1.2 s of the previous one.
      const t = Date.now();
      if (t - busy.current < 1200) return false;
      busy.current = t;
      const before = eventsRef.current;
      const result = toggleOp(before, t, initialKind);
      if (!result.ok) {
        toast.show({ text: result.error, tone: 'error' });
        return false;
      }
      const added = result.events.find((e) => !before.some((b) => b.id === e.id))!;
      try {
        await repo.replaceEvents(result.events);
      } catch (e) {
        toast.show({ text: `Opslaan mislukt: ${(e as Error).message}`, tone: 'error' });
        return false;
      }
      haptic(added.kind === 'in' ? [10, 30, 18] : 14);
      toast.show({
        text: `Beugel ${added.kind === 'in' ? 'in' : 'uit'} om ${formatClock(added.at)} opgeslagen`,
        actionLabel: 'Ongedaan maken',
        onAction: async () => {
          await db.events.delete(added.id);
        },
      });
      return true;
    },
    [toast],
  );

  const value: DataValue = {
    ready: ev.data !== undefined && nt.data !== undefined && cf.data !== undefined,
    error: ev.error ?? nt.error ?? cf.error ?? st.error,
    events,
    notes,
    confirmed,
    settings: liveSettings,
    computeDay: compute,
    current: (now) => currentState(events, now),
    toggle,
    commit,
    replaceEvents: repo.replaceEvents,
    saveNote: repo.saveNote,
    confirmDay: repo.confirmDay,
    unconfirmDay: repo.unconfirmDay,
    saveSettings: repo.saveSettings,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useData(): DataValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useData outside DataProvider');
  return v;
}
