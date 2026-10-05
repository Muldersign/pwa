import Dexie, { type Table } from 'dexie';
import type {
  Activity,
  DayNote,
  GroceryItem,
  ISODate,
  Meal,
  NewActivity,
  NewGroceryItem,
  NewMeal,
} from '../domain/types';
import { createId, isUuid } from '../lib/id';
import { recordKey, SYNC_TABLES, type OutboxEntry, type RemoteRow, type SyncRecord, type SyncTable } from '../sync/types';
import type { PlannerRepository, PlannerSnapshot } from './repository';

interface MetaRow {
  key: string;
  value: unknown;
}

class PlannerDatabase extends Dexie {
  activities!: Table<Activity, string>;
  meals!: Table<Meal, string>;
  groceries!: Table<GroceryItem, string>;
  notes!: Table<DayNote, string>;
  meta!: Table<MetaRow, string>;
  outbox!: Table<OutboxEntry, number>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({
      activities: 'id, date, assignedTo',
      meals: 'id, date, mealType',
      groceries: 'id, category, completed',
      notes: 'date',
      meta: 'key',
    });
    // v2: outbox of local changes waiting to be synced.
    this.version(2).stores({
      outbox: '++seq, [table+key]',
    });
  }
}

const now = () => new Date().toISOString();
const TRACKING_KEY = 'sync.tracking';

/**
 * Local-first storage on IndexedDB. The UI always reads and writes here, so the
 * app works offline. When sync is linked, every write also lands in the outbox,
 * which the SyncEngine sends to the server.
 */
export class IndexedDbRepository implements PlannerRepository {
  private db: PlannerDatabase;
  private listeners = new Set<() => void>();
  private outboxListeners = new Set<() => void>();
  private channel: BroadcastChannel | undefined;
  private tracking: boolean | undefined;

  constructor(name = 'onze-week') {
    this.db = new PlannerDatabase(name);
    // Keep multiple open tabs/windows in sync.
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(`${name}-changes`);
      this.channel.onmessage = () => this.listeners.forEach((l) => l());
    }
  }

  private emit() {
    this.listeners.forEach((l) => l());
    this.channel?.postMessage('changed');
  }

  private async isTracking(): Promise<boolean> {
    if (this.tracking === undefined) this.tracking = (await this.getMeta<boolean>(TRACKING_KEY)) ?? false;
    return this.tracking;
  }

  /** Records local changes in the outbox, then notifies the UI and the sync engine. */
  private async changed(entries: OutboxEntry[] = []) {
    if (entries.length && (await this.isTracking())) {
      await this.db.outbox.bulkAdd(entries.map(({ table, key }) => ({ table, key })));
      this.outboxListeners.forEach((l) => l());
    }
    this.emit();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async loadAll(): Promise<PlannerSnapshot> {
    const [activities, meals, groceries, notes] = await Promise.all([
      this.db.activities.toArray(),
      this.db.meals.toArray(),
      this.db.groceries.toArray(),
      this.db.notes.toArray(),
    ]);
    return { activities, meals, groceries, notes };
  }

  async addActivity(input: NewActivity): Promise<Activity> {
    const item: Activity = { ...input, id: createId(), createdAt: now(), updatedAt: now() };
    await this.db.activities.add(item);
    await this.changed([{ table: 'activities', key: item.id }]);
    return item;
  }
  async updateActivity(id: string, patch: Partial<NewActivity>) {
    await this.db.activities.update(id, { ...patch, updatedAt: now() });
    await this.changed([{ table: 'activities', key: id }]);
  }
  async deleteActivity(id: string) {
    await this.db.activities.delete(id);
    await this.changed([{ table: 'activities', key: id }]);
  }
  async putActivity(activity: Activity) {
    // A put is a fresh write (e.g. undo), so it must win over older remote state.
    await this.db.activities.put({ ...activity, updatedAt: now() });
    await this.changed([{ table: 'activities', key: activity.id }]);
  }

  async addMeal(input: NewMeal): Promise<Meal> {
    const item: Meal = { ...input, id: createId(), createdAt: now(), updatedAt: now() };
    await this.db.meals.add(item);
    await this.changed([{ table: 'meals', key: item.id }]);
    return item;
  }
  async updateMeal(id: string, patch: Partial<NewMeal>) {
    await this.db.meals.update(id, { ...patch, updatedAt: now() });
    await this.changed([{ table: 'meals', key: id }]);
  }
  async deleteMeal(id: string) {
    await this.db.meals.delete(id);
    await this.changed([{ table: 'meals', key: id }]);
  }
  async putMeal(meal: Meal) {
    await this.db.meals.put({ ...meal, updatedAt: now() });
    await this.changed([{ table: 'meals', key: meal.id }]);
  }

  async addGrocery(input: NewGroceryItem): Promise<GroceryItem> {
    const item: GroceryItem = { completed: false, ...input, id: createId(), createdAt: now(), updatedAt: now() };
    await this.db.groceries.add(item);
    await this.changed([{ table: 'groceries', key: item.id }]);
    return item;
  }
  async updateGrocery(id: string, patch: Partial<GroceryItem>) {
    await this.db.groceries.update(id, { ...patch, updatedAt: now() });
    await this.changed([{ table: 'groceries', key: id }]);
  }
  async deleteGrocery(id: string) {
    await this.db.groceries.delete(id);
    await this.changed([{ table: 'groceries', key: id }]);
  }
  async putGrocery(item: GroceryItem) {
    await this.db.groceries.put({ ...item, updatedAt: now() });
    await this.changed([{ table: 'groceries', key: item.id }]);
  }
  async clearCompletedGroceries() {
    const done = await this.db.groceries.filter((g) => g.completed).toArray();
    await this.db.groceries.bulkDelete(done.map((g) => g.id));
    await this.changed(done.map((g) => ({ table: 'groceries' as const, key: g.id })));
    return done;
  }

  async setNote(date: ISODate, text: string) {
    if (text.trim()) await this.db.notes.put({ date, text, updatedAt: now() });
    else await this.db.notes.delete(date);
    await this.changed([{ table: 'notes', key: date }]);
  }

  async replaceAll(snapshot: PlannerSnapshot) {
    const before = await this.loadAll();
    const stamp = now();
    const fresh: PlannerSnapshot = {
      activities: snapshot.activities.map((r) => ({ ...r, updatedAt: stamp })),
      meals: snapshot.meals.map((r) => ({ ...r, updatedAt: stamp })),
      groceries: snapshot.groceries.map((r) => ({ ...r, updatedAt: stamp })),
      notes: snapshot.notes.map((r) => ({ ...r, updatedAt: stamp })),
    };
    await this.db.transaction('rw', [this.db.activities, this.db.meals, this.db.groceries, this.db.notes], async () => {
      await Promise.all([this.db.activities.clear(), this.db.meals.clear(), this.db.groceries.clear(), this.db.notes.clear()]);
      await Promise.all([
        this.db.activities.bulkAdd(fresh.activities),
        this.db.meals.bulkAdd(fresh.meals),
        this.db.groceries.bulkAdd(fresh.groceries),
        this.db.notes.bulkAdd(fresh.notes),
      ]);
    });
    // Everything that existed before or exists now has changed (or was removed).
    const keys = new Map<string, OutboxEntry>();
    for (const table of SYNC_TABLES) {
      for (const r of [...(before[table] as SyncRecord[]), ...(fresh[table] as SyncRecord[])]) {
        const key = recordKey(table, r);
        keys.set(`${table}:${key}`, { table, key });
      }
    }
    await this.changed([...keys.values()]);
  }

  async getMeta<T>(key: string): Promise<T | undefined> {
    const row = await this.db.meta.get(key);
    return row?.value as T | undefined;
  }
  async setMeta<T>(key: string, value: T) {
    await this.db.meta.put({ key, value });
  }
  async deleteMeta(key: string) {
    await this.db.meta.delete(key);
  }

  /* ------------------------------------------------------------------ */
  /*  Sync support (used by SyncEngine only)                              */
  /* ------------------------------------------------------------------ */

  private table(t: SyncTable): Table<SyncRecord, string> {
    return this.db[t] as unknown as Table<SyncRecord, string>;
  }

  /** Start or stop recording local changes in the outbox. */
  async setTracking(on: boolean) {
    this.tracking = on;
    await this.setMeta(TRACKING_KEY, on);
    if (!on) await this.db.outbox.clear();
  }

  onOutboxChange(listener: () => void): () => void {
    this.outboxListeners.add(listener);
    return () => {
      this.outboxListeners.delete(listener);
    };
  }

  async getRecord(table: SyncTable, key: string): Promise<SyncRecord | undefined> {
    return this.table(table).get(key);
  }

  async readOutbox(): Promise<OutboxEntry[]> {
    return this.db.outbox.orderBy('seq').toArray();
  }

  async outboxCount(): Promise<number> {
    return this.db.outbox.count();
  }

  async removeOutbox(seqs: number[]) {
    await this.db.outbox.bulkDelete(seqs);
  }

  /** Queues every local record, e.g. when this device creates a household. */
  async enqueueAll() {
    const all = await this.loadAll();
    const entries: OutboxEntry[] = [];
    for (const t of SYNC_TABLES) for (const r of all[t] as SyncRecord[]) entries.push({ table: t, key: recordKey(t, r) });
    if (entries.length) await this.db.outbox.bulkAdd(entries);
    this.outboxListeners.forEach((l) => l());
  }

  /**
   * Writes rows coming from the server without queueing them again.
   * Entries in `dropFromOutbox` ("table:key") are removed from the outbox
   * because the remote version won.
   */
  async applyRemote(rows: RemoteRow[], dropFromOutbox: Set<string> = new Set()) {
    if (!rows.length) return;
    await this.db.transaction(
      'rw',
      [this.db.activities, this.db.meals, this.db.groceries, this.db.notes, this.db.outbox],
      async () => {
        for (const row of rows) {
          const t = this.table(row.table);
          if (row.deleted || !row.record) await t.delete(row.key);
          else await t.put(row.record);
        }
        if (dropFromOutbox.size) {
          await this.db.outbox.filter((e) => dropFromOutbox.has(`${e.table}:${e.key}`)).delete();
        }
      },
    );
    this.emit();
  }

  /** Clears planner data without queueing deletes (used when joining another household). */
  async clearLocalOnly() {
    await this.db.transaction(
      'rw',
      [this.db.activities, this.db.meals, this.db.groceries, this.db.notes, this.db.outbox],
      async () => {
        await Promise.all([
          this.db.activities.clear(),
          this.db.meals.clear(),
          this.db.groceries.clear(),
          this.db.notes.clear(),
          this.db.outbox.clear(),
        ]);
      },
    );
    this.emit();
  }

  /** Gives records created with an old non-UUID id a UUID, which the server requires. */
  async ensureUuidIds() {
    await this.db.transaction('rw', [this.db.activities, this.db.meals, this.db.groceries], async () => {
      for (const t of ['activities', 'meals', 'groceries'] as const) {
        const table = this.table(t);
        const bad = (await table.toArray()).filter((r) => !isUuid((r as { id: string }).id));
        for (const r of bad) {
          await table.delete((r as { id: string }).id);
          await table.put({ ...r, id: createId() } as SyncRecord);
        }
      }
    });
  }
}
