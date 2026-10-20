import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as E from '../engine/engine';
import type { GameState, Scenario, Suspicion, Topic } from '../engine/types';
import { parkzicht } from '../scenario/parkzicht';

const SAVE_KEY = 'parkzicht-save-v1';

function load(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as GameState;
    return s.version === 1 && s.scenario === parkzicht.id ? s : null;
  } catch {
    return null;
  }
}

function save(s: GameState | null) {
  try {
    if (s) localStorage.setItem(SAVE_KEY, JSON.stringify(s));
    else localStorage.removeItem(SAVE_KEY);
  } catch {
    /* storage unavailable: the game still works, just without resume */
  }
}

interface Ctx {
  sc: Scenario;
  state: GameState | null;
  /** Evidence ids that just appeared and should be announced. */
  discoveries: string[];
  clearDiscoveries: () => void;
  start: () => void;
  reset: () => void;
  ask: (t: Topic) => void;
  markSeen: (id: string) => void;
  answer: (qid: string, opt: string) => boolean;
  solve: (pid: string) => void;
  mistake: (pid: string) => void;
  hint: (key: string, level: number) => void;
  setSuspicion: (sid: string, v: Suspicion) => void;
  setNote: (sid: string, v: string) => void;
  setTheory: (v: string) => void;
  toggleSavedLine: (suspect: string, topic: string) => void;
  togglePin: (id: string) => void;
  advance: () => void;
  accuse: (suspect: string, motive: string, evidence: string[]) => void;
}

const GameCtx = createContext<Ctx | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const sc = parkzicht;
  const [state, setState] = useState<GameState | null>(() => load());
  const [discoveries, setDiscoveries] = useState<string[]>([]);
  const lastTick = useRef(Date.now());

  useEffect(() => save(state), [state]);

  // Track active play time (only while the tab is visible).
  useEffect(() => {
    const id = window.setInterval(() => {
      const now = Date.now();
      const delta = Math.min(now - lastTick.current, 30_000);
      lastTick.current = now;
      if (document.visibilityState === 'visible')
        setState((s) => (s && !s.accusation ? { ...s, playMs: s.playMs + delta } : s));
    }, 15_000);
    return () => window.clearInterval(id);
  }, []);

  const update = useCallback((fn: (s: GameState) => GameState) => {
    setState((prev) => {
      if (!prev) return prev;
      const next = fn(prev);
      const fresh = next.evidence.filter((e) => !prev.evidence.includes(e));
      if (fresh.length) setDiscoveries((d) => [...d, ...fresh.filter((f) => !d.includes(f))]);
      return next;
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      sc,
      state,
      discoveries,
      clearDiscoveries: () => setDiscoveries([]),
      start: () => {
        const s = E.newGame(sc);
        setState({ ...s, seenEvidence: [] });
        setDiscoveries([]);
      },
      reset: () => {
        setState(null);
        setDiscoveries([]);
      },
      ask: (t) => update((s) => E.askTopic(s, t)),
      markSeen: (id) => update((s) => (s.seenEvidence.includes(id) ? s : { ...s, seenEvidence: [...s.seenEvidence, id] })),
      answer: (qid, opt) => {
        let ok = false;
        update((s) => {
          const r = E.answerQuestion(sc, s, qid, opt);
          ok = r.correct;
          return r.state;
        });
        return ok || sc.questions.find((q) => q.id === qid)?.answer === opt;
      },
      solve: (pid) => update((s) => E.solvePuzzle(sc, s, pid)),
      mistake: (pid) => update((s) => E.puzzleMistake(s, pid)),
      hint: (key, level) => update((s) => E.useHint(s, key, level)),
      setSuspicion: (sid, v) => update((s) => ({ ...s, suspicion: { ...s.suspicion, [sid]: v } })),
      setNote: (sid, v) => update((s) => ({ ...s, notes: { ...s.notes, [sid]: v } })),
      setTheory: (v) => update((s) => ({ ...s, theory: v })),
      toggleSavedLine: (suspect, topic) =>
        update((s) => {
          const has = s.savedLines.some((l) => l.topic === topic);
          return { ...s, savedLines: has ? s.savedLines.filter((l) => l.topic !== topic) : [...s.savedLines, { suspect, topic }] };
        }),
      togglePin: (id) => update((s) => ({ ...s, pinned: s.pinned.includes(id) ? s.pinned.filter((p) => p !== id) : [...s.pinned, id] })),
      advance: () => update((s) => E.advanceChapter(sc, s)),
      accuse: (suspect, motive, evidence) => update((s) => ({ ...s, accusation: { suspect, motive, evidence, at: Date.now() } })),
    }),
    [sc, state, discoveries, update],
  );

  return <GameCtx.Provider value={value}>{children}</GameCtx.Provider>;
}

export function useGame() {
  const c = useContext(GameCtx);
  if (!c) throw new Error('useGame outside provider');
  return c;
}

/** Same as useGame but asserts that a game is running. */
export function usePlaying() {
  const c = useGame();
  if (!c.state) throw new Error('no game');
  return { ...c, state: c.state };
}
