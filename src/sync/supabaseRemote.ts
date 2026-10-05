import type { SupabaseClient } from '@supabase/supabase-js';
import type { Activity, DayNote, GroceryItem, Meal } from '../domain/types';
import { isUuid } from '../lib/id';
import type { RemoteRow, RemoteStore, SyncRecord, SyncTable } from './types';

type Row = Record<string, unknown>;

const SERVER_TABLE: Record<SyncTable, string> = {
  activities: 'activities',
  meals: 'meals',
  groceries: 'grocery_items',
  notes: 'day_notes',
};

const iso = (v: unknown): string => new Date(String(v)).toISOString();
const opt = <T,>(v: T | null | undefined): T | undefined => (v === null ? undefined : v);

/* ------------------------------ local → server ------------------------------ */

function toRow(table: SyncTable, r: SyncRecord, householdId: string): Row {
  const base = { household_id: householdId, updated_at: r.updatedAt, deleted_at: null };
  switch (table) {
    case 'activities': {
      const a = r as Activity;
      return {
        ...base, id: a.id, title: a.title, date: a.date, start_time: a.startTime ?? null, end_time: a.endTime ?? null,
        location: a.location ?? null, category: a.category, notes: a.notes ?? null, assigned_to: a.assignedTo ?? null,
        created_at: a.createdAt,
      };
    }
    case 'meals': {
      const m = r as Meal;
      return {
        ...base, id: m.id, title: m.title, date: m.date, meal_type: m.mealType, time: m.time ?? null,
        location: m.location ?? null, ingredients: m.ingredients ?? [], notes: m.notes ?? null,
        assigned_to: m.assignedTo ?? null, created_at: m.createdAt,
      };
    }
    case 'groceries': {
      const g = r as GroceryItem;
      return {
        ...base, id: g.id, name: g.name, quantity: g.quantity ?? null, unit: g.unit ?? null, category: g.category,
        completed: g.completed, completed_at: g.completedAt ?? null,
        source_meal_id: g.sourceMealId && isUuid(g.sourceMealId) ? g.sourceMealId : null, created_at: g.createdAt,
      };
    }
    case 'notes': {
      const n = r as DayNote;
      return { ...base, date: n.date, text: n.text };
    }
  }
}

/* ------------------------------ server → local ------------------------------ */

function fromRow(table: SyncTable, row: Row): SyncRecord {
  const updatedAt = iso(row.updated_at);
  switch (table) {
    case 'activities':
      return {
        id: String(row.id), title: String(row.title), date: String(row.date), startTime: opt(row.start_time as string),
        endTime: opt(row.end_time as string), location: opt(row.location as string), category: row.category as Activity['category'],
        notes: opt(row.notes as string), assignedTo: opt(row.assigned_to as Activity['assignedTo']),
        createdAt: iso(row.created_at), updatedAt,
      };
    case 'meals':
      return {
        id: String(row.id), title: String(row.title), date: String(row.date), mealType: row.meal_type as Meal['mealType'],
        time: opt(row.time as string), location: opt(row.location as string),
        ingredients: Array.isArray(row.ingredients) ? (row.ingredients as Meal['ingredients']) : [],
        notes: opt(row.notes as string), assignedTo: opt(row.assigned_to as Meal['assignedTo']),
        createdAt: iso(row.created_at), updatedAt,
      };
    case 'groceries':
      return {
        id: String(row.id), name: String(row.name), quantity: row.quantity === null ? undefined : Number(row.quantity),
        unit: opt(row.unit as string), category: row.category as GroceryItem['category'], completed: Boolean(row.completed),
        completedAt: row.completed_at ? iso(row.completed_at) : undefined, sourceMealId: opt(row.source_meal_id as string),
        createdAt: iso(row.created_at), updatedAt,
      };
    case 'notes':
      return { date: String(row.date), text: String(row.text ?? ''), updatedAt };
  }
}

function keyOf(table: SyncTable, row: Row): string {
  return table === 'notes' ? String(row.date) : String(row.id);
}

/** RemoteStore backed by Supabase (PostgREST + Realtime). */
export class SupabaseRemote implements RemoteStore {
  constructor(private client: SupabaseClient) {}

  async pullSince(householdId: string, table: SyncTable, since: string | null): Promise<RemoteRow[]> {
    const out: RemoteRow[] = [];
    const pageSize = 1000;
    for (let from = 0; ; from += pageSize) {
      let q = this.client
        .from(SERVER_TABLE[table])
        .select('*')
        .eq('household_id', householdId)
        .order('synced_at', { ascending: true })
        .range(from, from + pageSize - 1);
      if (since) q = q.gt('synced_at', since);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      for (const row of (data ?? []) as Row[]) {
        const deleted = row.deleted_at !== null && row.deleted_at !== undefined;
        out.push({
          table,
          key: keyOf(table, row),
          record: deleted ? undefined : fromRow(table, row),
          deleted,
          updatedAt: iso(row.updated_at),
          syncedAt: iso(row.synced_at),
        });
      }
      if (!data || data.length < pageSize) break;
    }
    return out;
  }

  async upsert(householdId: string, table: SyncTable, records: SyncRecord[]) {
    if (!records.length) return;
    const { error } = await this.client
      .from(SERVER_TABLE[table])
      .upsert(records.map((r) => toRow(table, r, householdId)), {
        onConflict: table === 'notes' ? 'household_id,date' : 'id',
      });
    if (error) throw new Error(error.message);
  }

  async markDeleted(householdId: string, table: SyncTable, keys: string[], updatedAt: string) {
    const column = table === 'notes' ? 'date' : 'id';
    const valid = table === 'notes' ? keys : keys.filter(isUuid);
    if (!valid.length) return;
    const { error } = await this.client
      .from(SERVER_TABLE[table])
      .update({ deleted_at: updatedAt, updated_at: updatedAt })
      .eq('household_id', householdId)
      .in(column, valid);
    if (error) throw new Error(error.message);
  }

  subscribe(householdId: string, onChange: () => void): () => void {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const notify = () => {
      clearTimeout(timer);
      timer = setTimeout(onChange, 300);
    };
    let channel = this.client.channel(`household-${householdId}`);
    for (const t of Object.values(SERVER_TABLE)) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: t, filter: `household_id=eq.${householdId}` },
        notify,
      );
    }
    channel.subscribe();
    return () => {
      clearTimeout(timer);
      void this.client.removeChannel(channel);
    };
  }
}
