/** ISO calendar date in local time: "2026-10-13". */
export type ISODate = string;
/** 24-hour clock time: "19:45". */
export type ClockTime = string;

/** Who an item belongs to. Ready for a future two-person household. */
export type Assignee = 'glenn' | 'jessica' | 'samen';

export type ActivityCategory = 'work' | 'sport' | 'social' | 'home' | 'appointment' | 'travel' | 'other';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type GroceryCategory =
  | 'produce'
  | 'meat'
  | 'dairy'
  | 'bakery'
  | 'spreads'
  | 'pantry'
  | 'sauces'
  | 'frozen'
  | 'snacks'
  | 'drinks'
  | 'household'
  | 'care'
  | 'other';

interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity extends BaseEntity {
  title: string;
  date: ISODate;
  startTime?: ClockTime;
  endTime?: ClockTime;
  location?: string;
  category: ActivityCategory;
  notes?: string;
  assignedTo?: Assignee;
}

export interface Ingredient {
  name: string;
  quantity?: number;
  unit?: string;
}

export interface Meal extends BaseEntity {
  title: string;
  date: ISODate;
  mealType: MealType;
  time?: ClockTime;
  location?: string;
  ingredients: Ingredient[];
  notes?: string;
  assignedTo?: Assignee;
}

export interface GroceryItem extends BaseEntity {
  name: string;
  quantity?: number;
  unit?: string;
  category: GroceryCategory;
  completed: boolean;
  completedAt?: string;
  /** Set when the item was added from a meal's ingredient list. */
  sourceMealId?: string;
}

export interface DayNote {
  /** The date doubles as primary key: one note per day. */
  date: ISODate;
  text: string;
  updatedAt: string;
}

export type NewActivity = Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>;
export type NewMeal = Omit<Meal, 'id' | 'createdAt' | 'updatedAt'>;
export type NewGroceryItem = Omit<GroceryItem, 'id' | 'createdAt' | 'updatedAt' | 'completed'> & {
  completed?: boolean;
};

/* ------------------------------- Lijstjes ------------------------------- */

/** Response of a person on a guest list. */
export type ListItemStatus = 'pending' | 'yes' | 'maybe' | 'no';

export interface PlannerList extends BaseEntity {
  title: string;
  /** Optional event this list belongs to (e.g. a birthday party). */
  date?: ISODate;
  time?: ClockTime;
  location?: string;
  notes?: string;
  /** Lists are archived instead of deleted once the event is over. */
  archived?: boolean;
}

export interface ListItem extends BaseEntity {
  listId: string;
  name: string;
  status: ListItemStatus;
  /** Number of people this entry stands for (partner, kids). Defaults to 1. */
  count?: number;
  note?: string;
  /** Sort order within the list. */
  position: number;
}

export type NewPlannerList = Omit<PlannerList, 'id' | 'createdAt' | 'updatedAt'>;
export type NewListItem = Omit<ListItem, 'id' | 'createdAt' | 'updatedAt'>;
