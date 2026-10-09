import type {
  Activity,
  GroceryItem,
  ISODate,
  ListItem,
  Meal,
  NewActivity,
  NewGroceryItem,
  NewListItem,
  NewMeal,
  NewPlannerList,
  PlannerList,
} from '../domain/types';
import { createId } from '../lib/id';
import { EMPTY_SNAPSHOT, type PlannerRepository, type PlannerSnapshot } from './repository';

const now = () => new Date().toISOString();
const clone = <T,>(v: T): T => structuredClone(v);

/**
 * In-memory implementation of PlannerRepository. Used in tests and as the
 * simplest reference for writing another backend (e.g. Supabase).
 */
export class MemoryRepository implements PlannerRepository {
  private data: PlannerSnapshot = clone(EMPTY_SNAPSHOT);
  private meta = new Map<string, unknown>();
  private listeners = new Set<() => void>();

  private changed() {
    this.listeners.forEach((l) => l());
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async loadAll() {
    return clone(this.data);
  }

  async addActivity(input: NewActivity): Promise<Activity> {
    const item: Activity = { ...input, id: createId(), createdAt: now(), updatedAt: now() };
    this.data.activities.push(item);
    this.changed();
    return clone(item);
  }
  async updateActivity(id: string, patch: Partial<NewActivity>) {
    this.data.activities = this.data.activities.map((a) => (a.id === id ? { ...a, ...patch, updatedAt: now() } : a));
    this.changed();
  }
  async deleteActivity(id: string) {
    this.data.activities = this.data.activities.filter((a) => a.id !== id);
    this.changed();
  }
  async putActivity(activity: Activity) {
    this.data.activities = [...this.data.activities.filter((a) => a.id !== activity.id), clone(activity)];
    this.changed();
  }

  async addMeal(input: NewMeal): Promise<Meal> {
    const item: Meal = { ...input, id: createId(), createdAt: now(), updatedAt: now() };
    this.data.meals.push(item);
    this.changed();
    return clone(item);
  }
  async updateMeal(id: string, patch: Partial<NewMeal>) {
    this.data.meals = this.data.meals.map((m) => (m.id === id ? { ...m, ...patch, updatedAt: now() } : m));
    this.changed();
  }
  async deleteMeal(id: string) {
    this.data.meals = this.data.meals.filter((m) => m.id !== id);
    this.changed();
  }
  async putMeal(meal: Meal) {
    this.data.meals = [...this.data.meals.filter((m) => m.id !== meal.id), clone(meal)];
    this.changed();
  }

  async addGrocery(input: NewGroceryItem): Promise<GroceryItem> {
    const item: GroceryItem = { completed: false, ...input, id: createId(), createdAt: now(), updatedAt: now() };
    this.data.groceries.push(item);
    this.changed();
    return clone(item);
  }
  async updateGrocery(id: string, patch: Partial<GroceryItem>) {
    this.data.groceries = this.data.groceries.map((g) => (g.id === id ? { ...g, ...patch, updatedAt: now() } : g));
    this.changed();
  }
  async deleteGrocery(id: string) {
    this.data.groceries = this.data.groceries.filter((g) => g.id !== id);
    this.changed();
  }
  async putGrocery(item: GroceryItem) {
    this.data.groceries = [...this.data.groceries.filter((g) => g.id !== item.id), clone(item)];
    this.changed();
  }
  async clearCompletedGroceries() {
    const done = this.data.groceries.filter((g) => g.completed);
    this.data.groceries = this.data.groceries.filter((g) => !g.completed);
    this.changed();
    return clone(done);
  }

  async setNote(date: ISODate, text: string) {
    this.data.notes = this.data.notes.filter((n) => n.date !== date);
    if (text.trim()) this.data.notes.push({ date, text, updatedAt: now() });
    this.changed();
  }

  async addList(input: NewPlannerList): Promise<PlannerList> {
    const item: PlannerList = { ...input, id: createId(), createdAt: now(), updatedAt: now() };
    this.data.lists.push(item);
    this.changed();
    return clone(item);
  }
  async updateList(id: string, patch: Partial<NewPlannerList>) {
    this.data.lists = this.data.lists.map((l) => (l.id === id ? { ...l, ...patch, updatedAt: now() } : l));
    this.changed();
  }
  async deleteList(id: string) {
    const list = this.data.lists.find((l) => l.id === id);
    if (!list) return undefined;
    const items = this.data.listItems.filter((i) => i.listId === id);
    this.data.lists = this.data.lists.filter((l) => l.id !== id);
    this.data.listItems = this.data.listItems.filter((i) => i.listId !== id);
    this.changed();
    return clone({ list, items });
  }
  async putList(list: PlannerList) {
    this.data.lists = [...this.data.lists.filter((l) => l.id !== list.id), clone(list)];
    this.changed();
  }
  async addListItem(input: NewListItem): Promise<ListItem> {
    const item: ListItem = { ...input, id: createId(), createdAt: now(), updatedAt: now() };
    this.data.listItems.push(item);
    this.changed();
    return clone(item);
  }
  async updateListItem(id: string, patch: Partial<NewListItem>) {
    this.data.listItems = this.data.listItems.map((i) => (i.id === id ? { ...i, ...patch, updatedAt: now() } : i));
    this.changed();
  }
  async deleteListItem(id: string) {
    this.data.listItems = this.data.listItems.filter((i) => i.id !== id);
    this.changed();
  }
  async putListItem(item: ListItem) {
    this.data.listItems = [...this.data.listItems.filter((i) => i.id !== item.id), clone(item)];
    this.changed();
  }

  async replaceAll(snapshot: PlannerSnapshot) {
    this.data = clone({ ...EMPTY_SNAPSHOT, ...snapshot });
    this.changed();
  }
  async getMeta<T>(key: string) {
    return this.meta.get(key) as T | undefined;
  }
  async setMeta<T>(key: string, value: T) {
    this.meta.set(key, value);
  }
}
