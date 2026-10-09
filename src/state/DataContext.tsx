import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { localRepository } from '../storage/instance';
import { EMPTY_SNAPSHOT, type PlannerRepository, type PlannerSnapshot } from '../storage/repository';
import { seedIfFirstRun } from '../storage/seed';

interface DataState extends PlannerSnapshot {
  repo: PlannerRepository;
  status: 'loading' | 'ready' | 'error';
  error?: string;
  reload: () => Promise<void>;
}

const EMPTY: PlannerSnapshot = EMPTY_SNAPSHOT;

const DataContext = createContext<DataState | null>(null);

/** Local-first store; Supabase sync runs alongside it (see sync/SyncContext). */
const repository: PlannerRepository = localRepository;

export function DataProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<PlannerSnapshot>(EMPTY);
  const [status, setStatus] = useState<DataState['status']>('loading');
  const [error, setError] = useState<string>();

  const reload = useCallback(async () => {
    try {
      setSnapshot(await repository.loadAll());
      setStatus('ready');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await seedIfFirstRun(repository);
        if (!cancelled) await reload();
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setStatus('error');
        }
      }
    })();
    const unsubscribe = repository.subscribe(() => void reload());
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [reload]);

  const value = useMemo<DataState>(
    () => ({ ...snapshot, repo: repository, status, error, reload }),
    [snapshot, status, error, reload],
  );
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataState {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside DataProvider');
  return ctx;
}
