import type { ListItem, ListItemStatus } from '../domain/types';

export const STATUS_LABELS: Record<ListItemStatus, string> = {
  yes: 'Komt',
  maybe: 'Misschien',
  no: 'Komt niet',
  pending: 'Nog geen reactie',
};

export const STATUS_ORDER: ListItemStatus[] = ['yes', 'maybe', 'no', 'pending'];

export interface ListStats {
  total: number;
  yes: number;
  maybe: number;
  no: number;
  pending: number;
  /** Expected people: counts of everyone who said yes (an entry can stand for several people). */
  people: number;
}

export function listStats(items: ListItem[]): ListStats {
  const s: ListStats = { total: items.length, yes: 0, maybe: 0, no: 0, pending: 0, people: 0 };
  for (const i of items) {
    s[i.status] += 1;
    if (i.status === 'yes') s.people += i.count ?? 1;
  }
  return s;
}
