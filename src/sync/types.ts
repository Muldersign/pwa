import type { Activity, DayNote, GroceryItem, ListItem, Meal, PlannerList } from '../domain/types';

/** Local table names that take part in synchronisation. */
export type SyncTable = 'activities' | 'meals' | 'groceries' | 'notes' | 'lists' | 'listItems';

export const SYNC_TABLES: SyncTable[] = ['activities', 'meals', 'groceries', 'notes', 'lists', 'listItems'];

export interface SyncRecordMap {
  activities: Activity;
  meals: Meal;
  groceries: GroceryItem;
  notes: DayNote;
  lists: PlannerList;
  listItems: ListItem;
}

export type SyncRecord = SyncRecordMap[SyncTable];

/** A local change waiting to be sent. Only the key is stored; the current row is read at push time. */
export interface OutboxEntry {
  seq?: number;
  table: SyncTable;
  /** Record id, or the date for day notes. */
  key: string;
}

/** A row as it comes back from the server. */
export interface RemoteRow {
  table: SyncTable;
  key: string;
  /** Present unless the row was deleted. */
  record?: SyncRecord;
  deleted: boolean;
  updatedAt: string;
  /** Server-side write time, used as pull cursor. */
  syncedAt: string;
}

/** The server side of sync. Implemented by SupabaseRemote; tests use an in-memory fake. */
export interface RemoteStore {
  pullSince(householdId: string, table: SyncTable, since: string | null): Promise<RemoteRow[]>;
  upsert(householdId: string, table: SyncTable, records: SyncRecord[]): Promise<void>;
  markDeleted(householdId: string, table: SyncTable, keys: string[], updatedAt: string): Promise<void>;
  /** Calls `onChange` whenever another device writes to this household. */
  subscribe(householdId: string, onChange: () => void): () => void;
}

export function recordKey(table: SyncTable, record: SyncRecord): string {
  return table === 'notes' ? (record as DayNote).date : (record as { id: string }).id;
}
