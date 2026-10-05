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
import { createId } from '../lib/id';
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

  constructor(name: string) {
    super(name);
    this.version(1).stores({
      activities: 'id, date, assignedTo',
      meals: 'id, date, mealType',
      groceries: 'id, category, completed',
      notes: 'date',
      meta: 'key',
    });
  }
}

const now = () => new Date().toISOString();

export class IndexedDbRepository implements PlannerRepository {
  private db: PlannerDatabase;
  private listeners = new Set<() => void>();
  private channel: BroadcastChannel | undefined;

  constructor(name = 'onze-week') {
    this.db = new PlannerDatabase(name);
    // Keep multiple open tabs/windows in sync.
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(`${name}-changes`);
      this.channel.onmessage = () => this.listeners.forEach((l) => l());
    }
  }

  private changed() {
    this.listeners.forEach((l) => l());
    this.channel?.postMessage('changed');
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
    this.changed();
    return item;
  }
  async updateActivity(id: string, patch: Partial<NewActivity>) {
    await this.db.activities.update(id, { ...patch, updatedAt: now() });
    this.changed();
  }
  async deleteActivity(id: string) {
    await this.db.activities.delete(id);
    this.changed();
  }
  async putActivity(activity: Activity) {
    await this.db.activities.put(activity);
    this.changed();
  }

  async addMeal(input: NewMeal): Promise<Meal> {
    const item: Meal = { ...input, id: createId(), createdAt: now(), updatedAt: now() };
    await this.db.meals.add(item);
    this.changed();
    return item;
  }
  async updateMeal(id: string, patch: Partial<NewMeal>) {
    await this.db.meals.update(id, { ...patch, updatedAt: now() });
    this.changed();
  }
  async deleteMeal(id: string) {
    await this.db.meals.delete(id);
    this.changed();
  }
  async putMeal(meal: Meal) {
    await this.db.meals.put(meal);
    this.changed();
  }

  async addGrocery(input: NewGroceryItem): Promise<GroceryItem> {
    const item: GroceryItem = { completed: false, ...input, id: createId(), createdAt: now(), updatedAt: now() };
    await this.db.groceries.add(item);
    this.changed();
    return item;
  }
  async updateGrocery(id: string, patch: Partial<GroceryItem>) {
    await this.db.groceries.update(id, { ...patch, updatedAt: now() });
    this.changed();
  }
  async deleteGrocery(id: string) {
    await this.db.groceries.delete(id);
    this.changed();
  }
  async putGrocery(item: GroceryItem) {
    await this.db.groceries.put(item);
    this.changed();
  }
  async clearCompletedGroceries() {
    const done = await this.db.groceries.filter((g) => g.completed).toArray();
    await this.db.groceries.bulkDelete(done.map((g) => g.id));
    this.changed();
    return done;
  }

  async setNote(date: ISODate, text: string) {
    if (text.trim()) await this.db.notes.put({ date, text, updatedAt: now() });
    else await this.db.notes.delete(date);
    this.changed();
  }

  async replaceAll(snapshot: PlannerSnapshot) {
    await this.db.transaction('rw', [this.db.activities, this.db.meals, this.db.groceries, this.db.notes], async () => {
      await Promise.all([this.db.activities.clear(), this.db.meals.clear(), this.db.groceries.clear(), this.db.notes.clear()]);
      await Promise.all([
        this.db.activities.bulkAdd(snapshot.activities),
        this.db.meals.bulkAdd(snapshot.meals),
        this.db.groceries.bulkAdd(snapshot.groceries),
        this.db.notes.bulkAdd(snapshot.notes),
      ]);
    });
    this.changed();
  }

  async getMeta<T>(key: string): Promise<T | undefined> {
    const row = await this.db.meta.get(key);
    return row?.value as T | undefined;
  }
  async setMeta<T>(key: string, value: T) {
    await this.db.meta.put({ key, value });
  }
}
