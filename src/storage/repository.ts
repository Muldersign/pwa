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

export interface PlannerSnapshot {
  activities: Activity[];
  meals: Meal[];
  groceries: GroceryItem[];
  notes: DayNote[];
}

/**
 * Storage-agnostic contract for all planner data.
 *
 * The UI and services only depend on this interface. Today it is implemented
 * with IndexedDB (local-first). A Supabase implementation can be added later
 * (accounts, sync between two people and devices, realtime) by implementing
 * the same methods and emitting `subscribe` callbacks on remote changes.
 */
export interface PlannerRepository {
  loadAll(): Promise<PlannerSnapshot>;
  /** Called after any change (local or, later, remote). Returns an unsubscribe fn. */
  subscribe(listener: () => void): () => void;

  addActivity(input: NewActivity): Promise<Activity>;
  updateActivity(id: string, patch: Partial<NewActivity>): Promise<void>;
  deleteActivity(id: string): Promise<void>;
  putActivity(activity: Activity): Promise<void>;

  addMeal(input: NewMeal): Promise<Meal>;
  updateMeal(id: string, patch: Partial<NewMeal>): Promise<void>;
  deleteMeal(id: string): Promise<void>;
  putMeal(meal: Meal): Promise<void>;

  addGrocery(input: NewGroceryItem): Promise<GroceryItem>;
  updateGrocery(id: string, patch: Partial<GroceryItem>): Promise<void>;
  deleteGrocery(id: string): Promise<void>;
  putGrocery(item: GroceryItem): Promise<void>;
  clearCompletedGroceries(): Promise<GroceryItem[]>;

  setNote(date: ISODate, text: string): Promise<void>;

  replaceAll(snapshot: PlannerSnapshot): Promise<void>;
  getMeta<T>(key: string): Promise<T | undefined>;
  setMeta<T>(key: string, value: T): Promise<void>;
}
