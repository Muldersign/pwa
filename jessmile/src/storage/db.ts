import Dexie, { type Table } from 'dexie';
import type { BraceEvent, DayConfirmation, DayNote } from '../domain/types';

/** Storage keys keep the original 'alignerly' names so existing data survives the rename to Jessmile. */

/** Real data and demo data live in separate databases, so a demo can never touch Jessica's log. */
export const DEMO_FLAG = 'alignerly-demo';

export function isDemoMode(): boolean {
  try {
    return localStorage.getItem(DEMO_FLAG) === '1';
  } catch {
    return false;
  }
}

class JessmileDB extends Dexie {
  events!: Table<BraceEvent, string>;
  notes!: Table<DayNote, string>;
  confirmations!: Table<DayConfirmation, string>;
  kv!: Table<{ key: string; value: unknown }, string>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({
      events: 'id, at',
      notes: 'date',
      confirmations: 'date',
      kv: 'key',
    });
  }
}

export const db = new JessmileDB(isDemoMode() ? 'alignerly-demo' : 'alignerly');

export async function requestPersistence() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist();
  } catch {
    /* not supported */
  }
}
