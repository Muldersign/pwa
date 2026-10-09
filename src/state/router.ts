import { useCallback, useEffect, useState } from 'react';

export type Route =
  | { name: 'today' }
  | { name: 'week'; week?: string }
  | { name: 'day'; date: string }
  | { name: 'groceries' }
  | { name: 'lists' }
  | { name: 'list'; id: string }
  | { name: 'more' };

export type TabName = 'today' | 'week' | 'groceries' | 'lists' | 'more';

function parseHash(hash: string): { route: Route; query: URLSearchParams } {
  const [path, qs] = hash.replace(/^#\/?/, '').split('?');
  const query = new URLSearchParams(qs ?? '');
  const parts = path.split('/').filter(Boolean);
  switch (parts[0]) {
    case 'week':
      return { route: { name: 'week', week: parts[1] }, query };
    case 'dag':
      if (parts[1] && /^\d{4}-\d{2}-\d{2}$/.test(parts[1])) return { route: { name: 'day', date: parts[1] }, query };
      break;
    case 'boodschappen':
      return { route: { name: 'groceries' }, query };
    case 'lijstjes':
      return { route: { name: 'lists' }, query };
    case 'lijst':
      if (parts[1]) return { route: { name: 'list', id: parts[1] }, query };
      return { route: { name: 'lists' }, query };
    case 'meer':
      return { route: { name: 'more' }, query };
  }
  return { route: { name: 'today' }, query };
}

export function routeToHash(route: Route): string {
  switch (route.name) {
    case 'today':
      return '#/vandaag';
    case 'week':
      return route.week ? `#/week/${route.week}` : '#/week';
    case 'day':
      return `#/dag/${route.date}`;
    case 'groceries':
      return '#/boodschappen';
    case 'lists':
      return '#/lijstjes';
    case 'list':
      return `#/lijst/${route.id}`;
    case 'more':
      return '#/meer';
  }
}

/** Minimal hash router: works on static hosting, offline and with the Android back button. */
export function useHashRouter() {
  const [state, setState] = useState(() => parseHash(window.location.hash));

  useEffect(() => {
    const onChange = () => setState(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((route: Route, options: { replace?: boolean } = {}) => {
    const hash = routeToHash(route);
    if (hash === window.location.hash) return;
    if (options.replace) {
      history.replaceState(null, '', hash);
      setState(parseHash(hash));
    } else {
      window.location.hash = hash;
    }
  }, []);

  return { route: state.route, query: state.query, navigate };
}

export function tabOf(route: Route): TabName {
  if (route.name === 'day') return 'week';
  if (route.name === 'list') return 'lists';
  return route.name;
}
