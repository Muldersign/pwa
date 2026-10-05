import { addDays } from 'date-fns';
import type { Activity, GroceryItem, Meal } from '../domain/types';
import { toISODate, weekStart } from '../lib/dates';
import { createId } from '../lib/id';
import { categorizeGrocery } from '../services/groceryCategorizer';
import { suggestIngredients } from '../services/recipes';
import type { PlannerRepository, PlannerSnapshot } from './repository';

const SEEDED_KEY = 'seeded-v1';

export function buildDemoData(now = new Date()): PlannerSnapshot {
  const monday = weekStart(now);
  const day = (offset: number) => toISODate(addDays(monday, offset));
  const stamp = new Date().toISOString();
  const base = () => ({ id: createId(), createdAt: stamp, updatedAt: stamp });

  const activities: Activity[] = [
    { ...base(), date: day(0), startTime: '08:30', endTime: '17:00', title: 'Werk', location: 'De Leo Media', category: 'work', assignedTo: 'glenn' },
    { ...base(), date: day(1), startTime: '09:00', endTime: '17:00', title: 'Werk', category: 'work', assignedTo: 'glenn' },
    { ...base(), date: day(1), startTime: '19:45', title: 'Training', location: 'Bareveld', category: 'sport', assignedTo: 'glenn' },
    { ...base(), date: day(2), startTime: '20:00', title: 'Sporten', category: 'sport', assignedTo: 'jessica' },
    { ...base(), date: day(3), startTime: '08:30', endTime: '17:00', title: 'Werk', location: 'De Leo Media', category: 'work', assignedTo: 'glenn' },
    { ...base(), date: day(3), startTime: '16:15', title: 'Tandarts', location: 'Stadskanaal', category: 'appointment', assignedTo: 'jessica' },
    { ...base(), date: day(4), startTime: '21:00', title: 'Borrel', location: 'Café De Toren', category: 'social', assignedTo: 'samen' },
    { ...base(), date: day(5), startTime: '10:00', title: 'Naar Groningen', category: 'travel', assignedTo: 'samen' },
    { ...base(), date: day(6), startTime: '15:00', title: 'Verjaardag oma', category: 'social', assignedTo: 'samen', notes: 'Cadeau niet vergeten' },
  ];

  const meal = (offset: number, title: string, mealType: Meal['mealType'], time?: string, location?: string): Meal => ({
    ...base(),
    date: day(offset),
    title,
    mealType,
    time,
    location,
    ingredients: suggestIngredients(title),
  });

  const meals: Meal[] = [
    meal(0, 'Broodje gezond', 'lunch', '12:30'),
    meal(0, 'Pasta pesto', 'dinner', '17:30'),
    meal(1, 'Pizza', 'dinner', '18:00'),
    meal(2, 'Nasi', 'dinner', '18:00'),
    meal(3, 'Wraps', 'dinner'),
    meal(4, 'Uit eten', 'dinner', '18:30', 'De Gulle Boergondiër'),
    meal(5, 'Sushi', 'dinner'),
    meal(6, 'Stamppot', 'dinner', '18:00'),
  ];

  const groceryNames = [
    'Bananen', 'Paprika', 'Ui', 'Kipfilet', 'Melk', 'Mozzarella', 'Eieren', 'Brood', 'Pasta', 'Pesto', 'Cola', 'Afwasmiddel',
  ];
  const groceries: GroceryItem[] = groceryNames.map((name, i) => ({
    ...base(),
    createdAt: new Date(Date.now() - (groceryNames.length - i) * 1000).toISOString(),
    name,
    category: categorizeGrocery(name),
    completed: false,
  }));

  return { activities, meals, groceries, notes: [{ date: day(6), text: 'Om 14:30 vertrekken naar oma.', updatedAt: stamp }] };
}

/** Seeds demo data once, on the very first launch. */
export async function seedIfFirstRun(repo: PlannerRepository): Promise<void> {
  if (await repo.getMeta<boolean>(SEEDED_KEY)) return;
  const existing = await repo.loadAll();
  const empty = !existing.activities.length && !existing.meals.length && !existing.groceries.length;
  if (empty) await repo.replaceAll(buildDemoData());
  await repo.setMeta(SEEDED_KEY, true);
}

export async function resetToDemoData(repo: PlannerRepository): Promise<void> {
  await repo.replaceAll(buildDemoData());
}

export async function clearAllData(repo: PlannerRepository): Promise<void> {
  await repo.replaceAll({ activities: [], meals: [], groceries: [], notes: [] });
}
