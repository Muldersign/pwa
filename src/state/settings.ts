import { useCallback, useSyncExternalStore } from 'react';

export interface Settings {
  /** Use the server-side AI parser when it is configured. */
  useAI: boolean;
  showCompletedGroceries: boolean;
}

const KEY = 'onze-week-settings';
const DEFAULTS: Settings = { useAI: true, showCompletedGroceries: false };
const listeners = new Set<() => void>();

let cache: Settings = read();

function read(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

function write(next: Settings) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Private mode or storage blocked: keep the in-memory value.
  }
  listeners.forEach((l) => l());
}

export function getSettings(): Settings {
  return cache;
}

export function useSettings(): [Settings, (patch: Partial<Settings>) => void] {
  const settings = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => cache,
  );
  const update = useCallback((patch: Partial<Settings>) => write({ ...cache, ...patch }), []);
  return [settings, update];
}
