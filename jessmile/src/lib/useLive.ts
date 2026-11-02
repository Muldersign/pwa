import { liveQuery } from 'dexie';
import { useEffect, useState } from 'react';

/** Subscribes to a Dexie live query; updates across tabs and after every write. */
export function useLive<T>(query: () => Promise<T>, deps: unknown[]): { data: T | undefined; error: Error | null } {
  const [state, setState] = useState<{ data: T | undefined; error: Error | null }>({ data: undefined, error: null });
  useEffect(() => {
    const sub = liveQuery(query).subscribe({
      next: (data) => setState({ data, error: null }),
      error: (error: Error) => setState((s) => ({ ...s, error })),
    });
    return () => sub.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}
