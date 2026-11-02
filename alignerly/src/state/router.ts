import { useEffect, useState } from 'react';

export type Tab = 'vandaag' | 'kalender' | 'statistieken' | 'instellingen';
export interface Route {
  tab: Tab;
  /** Open day detail (YYYY-MM-DD) */
  day?: string;
}

const TABS: Tab[] = ['vandaag', 'kalender', 'statistieken', 'instellingen'];

export function parseHash(hash: string): Route {
  const [path, query = ''] = hash.replace(/^#\/?/, '').split('?');
  const tab = (TABS.includes(path as Tab) ? path : 'vandaag') as Tab;
  const day = new URLSearchParams(query).get('dag') ?? undefined;
  return { tab, day: day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : undefined };
}

export function toHash(r: Route): string {
  return `#/${r.tab}${r.day ? `?dag=${r.day}` : ''}`;
}

export function useRoute(): [Route, (r: Route, replace?: boolean) => void] {
  const [route, setRoute] = useState(() => parseHash(location.hash));
  useEffect(() => {
    const on = () => setRoute(parseHash(location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const go = (r: Route, replace = false) => {
    const h = toHash(r);
    if (replace) history.replaceState(null, '', h);
    else history.pushState(null, '', h);
    setRoute(r);
  };
  return [route, go];
}
