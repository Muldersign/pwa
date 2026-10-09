import type { PlannerAction } from '../domain/actions';
import type { Activity, GroceryItem, ISODate, ListItem, Meal, PlannerList } from '../domain/types';
import { capitalize, todayISO } from '../lib/dates';
import type { PlannerRepository, PlannerSnapshot } from '../storage/repository';
import { categorizeGrocery, productKey } from './groceryCategorizer';
import { categorizeActivity, TITLE_NORMALIZATION } from './nlp/lexicon';
import { suggestIngredients } from './recipes';

export type ChangeKind = 'added' | 'removed' | 'updated' | 'moved' | 'exists' | 'restored' | 'notFound';

export type Change =
  | { kind: ChangeKind; entity: 'activity'; item: Activity; before?: Activity }
  | { kind: ChangeKind; entity: 'meal'; item: Meal; before?: Meal }
  | { kind: ChangeKind; entity: 'grocery'; item: GroceryItem; before?: GroceryItem }
  | { kind: ChangeKind; entity: 'listItem'; item: ListItem; list: PlannerList; before?: ListItem }
  | { kind: 'notFound'; entity: 'unknown'; query: string; date?: ISODate; message?: string };

export interface ExecutionResult {
  changes: Change[];
  undo: () => Promise<void>;
}

/* ---------------------------------- matching ---------------------------------- */

function matchKey(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (TITLE_NORMALIZATION[w] ?? w).toLowerCase())
    .join(' ')
    .replace(/[^a-z0-9à-ÿ ]/gi, '')
    .trim();
}

function titleScore(title: string, query: string): number {
  const a = matchKey(title);
  const b = matchKey(query);
  if (!b) return 0;
  if (a === b) return 3;
  if (a.startsWith(b) || b.startsWith(a)) return 2;
  if (a.includes(b) || b.includes(a)) return 1;
  return 0;
}

function findBest<T extends { title: string; date: ISODate }>(items: T[], query: string, date?: ISODate): T | undefined {
  const today = todayISO();
  const candidates = items
    .map((item) => ({ item, score: titleScore(item.title, query) }))
    .filter((c) => c.score > 0 && (!date || c.item.date === date));
  if (!candidates.length) return undefined;
  candidates.sort((x, y) => {
    if (y.score !== x.score) return y.score - x.score;
    // Without a date: prefer the nearest upcoming item, then the most recent past one.
    const xf = x.item.date >= today;
    const yf = y.item.date >= today;
    if (xf !== yf) return xf ? -1 : 1;
    return xf ? x.item.date.localeCompare(y.item.date) : y.item.date.localeCompare(x.item.date);
  });
  return candidates[0].item;
}

function findGrocery(items: GroceryItem[], name: string): GroceryItem | undefined {
  const key = productKey(name);
  return (
    items.find((g) => productKey(g.name) === key) ??
    items.find((g) => productKey(g.name).includes(key) || key.includes(productKey(g.name)))
  );
}

/* ---------------------------------- executor ---------------------------------- */

export async function executeActions(repo: PlannerRepository, actions: PlannerAction[]): Promise<ExecutionResult> {
  const state: PlannerSnapshot = await repo.loadAll();
  const changes: Change[] = [];
  const undoOps: (() => Promise<void>)[] = [];

  const addActivity = async (a: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => {
    const created = await repo.addActivity(a);
    state.activities.push(created);
    changes.push({ kind: 'added', entity: 'activity', item: created });
    undoOps.push(() => repo.deleteActivity(created.id));
  };

  const addMeal = async (m: Omit<Meal, 'id' | 'createdAt' | 'updatedAt'>) => {
    const dup = state.meals.find((x) => x.date === m.date && matchKey(x.title) === matchKey(m.title));
    if (dup) {
      changes.push({ kind: 'exists', entity: 'meal', item: dup });
      return;
    }
    const created = await repo.addMeal(m);
    state.meals.push(created);
    changes.push({ kind: 'added', entity: 'meal', item: created });
    undoOps.push(() => repo.deleteMeal(created.id));
  };

  const updateActivity = async (before: Activity, patch: Partial<Activity>, kind: ChangeKind) => {
    const original = { ...before };
    const after = { ...before, ...patch, updatedAt: new Date().toISOString() };
    await repo.putActivity(after);
    Object.assign(before, after);
    changes.push({ kind, entity: 'activity', item: after, before: original });
    undoOps.push(() => repo.putActivity(original));
  };

  const updateMeal = async (before: Meal, patch: Partial<Meal>, kind: ChangeKind) => {
    const original = { ...before };
    const after = { ...before, ...patch, updatedAt: new Date().toISOString() };
    await repo.putMeal(after);
    Object.assign(before, after);
    changes.push({ kind, entity: 'meal', item: after, before: original });
    undoOps.push(() => repo.putMeal(original));
  };

  const removeActivity = async (item: Activity) => {
    await repo.deleteActivity(item.id);
    state.activities = state.activities.filter((x) => x.id !== item.id);
    changes.push({ kind: 'removed', entity: 'activity', item });
    undoOps.push(() => repo.putActivity(item));
  };

  const removeMeal = async (item: Meal) => {
    await repo.deleteMeal(item.id);
    state.meals = state.meals.filter((x) => x.id !== item.id);
    changes.push({ kind: 'removed', entity: 'meal', item });
    undoOps.push(() => repo.putMeal(item));
  };

  for (const action of actions) {
    switch (action.type) {
      case 'ADD_ACTIVITY':
        await addActivity({
          title: action.title,
          date: action.date,
          startTime: action.time,
          endTime: action.endTime,
          location: action.location,
          category: action.category ?? categorizeActivity(action.title),
          assignedTo: action.assignedTo,
        });
        break;

      case 'ADD_MEAL':
        await addMeal({
          title: capitalize(action.title),
          date: action.date,
          mealType: action.mealType,
          time: action.time,
          location: action.location,
          ingredients: suggestIngredients(action.title),
          assignedTo: action.assignedTo,
        });
        break;

      case 'ADD_GROCERY': {
        const result = await addGroceryItem(repo, state, {
          name: action.name,
          quantity: action.quantity,
          unit: action.unit,
        });
        changes.push(result.change);
        if (result.undo) undoOps.push(result.undo);
        break;
      }

      case 'DELETE_GROCERY': {
        const found = findGrocery(state.groceries, action.name);
        if (!found) {
          changes.push({ kind: 'notFound', entity: 'unknown', query: action.name });
          break;
        }
        await repo.deleteGrocery(found.id);
        state.groceries = state.groceries.filter((g) => g.id !== found.id);
        changes.push({ kind: 'removed', entity: 'grocery', item: found });
        undoOps.push(() => repo.putGrocery(found));
        break;
      }

      case 'DELETE_ACTIVITY':
      case 'DELETE_MEAL': {
        const preferMeal = action.type === 'DELETE_MEAL';
        const activity = findBest(state.activities, action.title, action.date);
        const meal = findBest(state.meals, action.title, action.date);
        const pickMeal = meal && (preferMeal || !activity);
        if (pickMeal) await removeMeal(meal);
        else if (activity) await removeActivity(activity);
        else changes.push({ kind: 'notFound', entity: 'unknown', query: action.title, date: action.date });
        break;
      }

      case 'MOVE_ACTIVITY':
      case 'MOVE_MEAL': {
        const activity = findBest(state.activities, action.title, action.date);
        const meal = findBest(state.meals, action.title, action.date);
        const preferMeal = action.type === 'MOVE_MEAL';
        if (meal && (preferMeal || !activity)) {
          const patch: Partial<Meal> = {};
          if (action.newDate) patch.date = action.newDate;
          if (action.type === 'MOVE_ACTIVITY' && action.newTime) patch.time = action.newTime;
          await updateMeal(meal, patch, 'moved');
        } else if (activity) {
          const patch: Partial<Activity> = {};
          if (action.newDate) patch.date = action.newDate;
          if (action.type === 'MOVE_ACTIVITY' && action.newTime) patch.startTime = action.newTime;
          await updateActivity(activity, patch, 'moved');
        } else {
          changes.push({ kind: 'notFound', entity: 'unknown', query: action.title, date: action.date });
        }
        break;
      }

      case 'UPDATE_ACTIVITY': {
        const activity = findBest(state.activities, action.title, action.date);
        if (!activity) {
          changes.push({ kind: 'notFound', entity: 'unknown', query: action.title, date: action.date });
          break;
        }
        const patch: Partial<Activity> = {};
        if (action.newTitle) patch.title = action.newTitle;
        if (action.newTime) patch.startTime = action.newTime;
        if (action.newLocation) patch.location = action.newLocation;
        await updateActivity(activity, patch, 'updated');
        break;
      }

      case 'UPDATE_MEAL': {
        const date = action.date;
        let meal = action.title ? findBest(state.meals, action.title, date) : undefined;
        if (!meal && date) {
          // "we eten donderdag toch wraps": replace that day's dinner.
          meal = state.meals.find((m) => m.date === date && m.mealType === 'dinner');
        }
        if (meal) {
          await updateMeal(meal, { title: capitalize(action.newTitle), ingredients: suggestIngredients(action.newTitle) }, 'updated');
        } else if (date) {
          await addMeal({
            title: capitalize(action.newTitle),
            date,
            mealType: 'dinner',
            ingredients: suggestIngredients(action.newTitle),
          });
        } else {
          changes.push({ kind: 'notFound', entity: 'unknown', query: action.title ?? action.newTitle });
        }
        break;
      }

      case 'SET_LIST_STATUS': {
        const result = await setListStatus(repo, state, action.name, action.status, action.listTitle);
        changes.push(result.change);
        if (result.undo) undoOps.push(result.undo);
        break;
      }
    }
  }

  return {
    changes,
    undo: async () => {
      for (const op of undoOps.reverse()) await op();
    },
  };
}

/* --------------------------------- lijstjes --------------------------------- */

/** Normalized person name for matching: "Daniël" ~ "daniel", ignores "?" and spacing. */
export function personKey(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function listMatches(list: PlannerList, hint: string): boolean {
  const a = personKey(list.title);
  const b = personKey(hint);
  return !!b && (a === b || a.includes(b) || b.includes(a));
}

/** Upcoming, non-archived lists first; then the rest. */
function rankLists(lists: PlannerList[]): PlannerList[] {
  const today = todayISO();
  const score = (l: PlannerList) => (l.archived ? 2 : l.date && l.date < today ? 1 : 0);
  return [...lists].sort((x, y) => score(x) - score(y) || (x.date ?? '9999').localeCompare(y.date ?? '9999'));
}

async function setListStatus(
  repo: PlannerRepository,
  state: PlannerSnapshot,
  name: string,
  status: ListItem['status'],
  listHint?: string,
): Promise<{ change: Change; undo?: () => Promise<void> }> {
  const key = personKey(name);
  const lists = rankLists(state.lists);
  const candidateLists = listHint ? lists.filter((l) => listMatches(l, listHint)) : lists;
  if (listHint && !candidateLists.length) {
    return { change: { kind: 'notFound', entity: 'unknown', query: listHint, message: `Ik kon geen lijst “${listHint}” vinden.` } };
  }

  const matches = state.listItems
    .filter((i) => candidateLists.some((l) => l.id === i.listId))
    .filter((i) => personKey(i.name) === key || personKey(i.name).split(' ')[0] === key);

  if (!matches.length) {
    // A named list but an unknown person: add them to that list.
    if (listHint && candidateLists.length === 1) {
      const list = candidateLists[0];
      const position = Math.max(-1, ...state.listItems.filter((i) => i.listId === list.id).map((i) => i.position)) + 1;
      const created = await repo.addListItem({ listId: list.id, name: capitalize(name.trim()), status, position });
      state.listItems.push(created);
      return { change: { kind: 'added', entity: 'listItem', item: created, list }, undo: () => repo.deleteListItem(created.id) };
    }
    return { change: { kind: 'notFound', entity: 'unknown', query: name, message: `${capitalize(name)} staat op geen enkele lijst.` } };
  }

  // The same person on several lists without a hint: only the upcoming one when that is clear.
  const listIds = [...new Set(matches.map((m) => m.listId))];
  if (listIds.length > 1) {
    const titles = listIds.map((id) => lists.find((l) => l.id === id)!.title);
    return {
      change: {
        kind: 'notFound',
        entity: 'unknown',
        query: name,
        message: `${capitalize(name)} staat op meerdere lijsten (${titles.join(', ')}). Zeg bijvoorbeeld “${capitalize(name)} komt naar ${titles[0]}”.`,
      },
    };
  }

  const item = matches[0];
  const list = lists.find((l) => l.id === item.listId)!;
  const before = { ...item };
  await repo.updateListItem(item.id, { status });
  const after: ListItem = { ...item, status, updatedAt: new Date().toISOString() };
  Object.assign(item, after);
  return { change: { kind: 'updated', entity: 'listItem', item: after, list, before }, undo: () => repo.putListItem(before) };
}

/* -------------------------------- grocery helpers -------------------------------- */

export async function addGroceryItem(
  repo: PlannerRepository,
  state: Pick<PlannerSnapshot, 'groceries'>,
  input: { name: string; quantity?: number; unit?: string; sourceMealId?: string },
): Promise<{ change: Change; undo?: () => Promise<void> }> {
  const name = capitalize(input.name.trim());
  const existing = state.groceries.find((g) => productKey(g.name) === productKey(name));
  if (existing && !existing.completed) {
    return { change: { kind: 'exists', entity: 'grocery', item: existing } };
  }
  if (existing && existing.completed) {
    const before = { ...existing };
    const after: GroceryItem = { ...existing, completed: false, completedAt: undefined, updatedAt: new Date().toISOString() };
    await repo.putGrocery(after);
    Object.assign(existing, after);
    return { change: { kind: 'restored', entity: 'grocery', item: after, before }, undo: () => repo.putGrocery(before) };
  }
  const created = await repo.addGrocery({
    name,
    quantity: input.quantity,
    unit: input.unit,
    category: categorizeGrocery(name),
    sourceMealId: input.sourceMealId,
  });
  state.groceries.push(created);
  return { change: { kind: 'added', entity: 'grocery', item: created }, undo: () => repo.deleteGrocery(created.id) };
}

/** Adds all ingredients of a meal to the shopping list (skipping duplicates). */
export async function addMealIngredientsToGroceries(repo: PlannerRepository, meal: Meal): Promise<ExecutionResult> {
  const state = await repo.loadAll();
  const changes: Change[] = [];
  const undoOps: (() => Promise<void>)[] = [];
  for (const ing of meal.ingredients) {
    const r = await addGroceryItem(repo, state, { ...ing, sourceMealId: meal.id });
    changes.push(r.change);
    if (r.undo) undoOps.push(r.undo);
  }
  return {
    changes,
    undo: async () => {
      for (const op of undoOps.reverse()) await op();
    },
  };
}
