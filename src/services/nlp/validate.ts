import { ACTION_TYPES, type PlannerAction } from '../../domain/actions';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
const CATEGORIES = ['work', 'sport', 'social', 'home', 'appointment', 'travel', 'other'];
const ASSIGNEES = ['glenn', 'jessica', 'samen'];
const assignee = (v: unknown) => (typeof v === 'string' && ASSIGNEES.includes(v) ? (v as never) : undefined);

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}
function date(v: unknown): string | undefined {
  const s = str(v);
  return s && DATE.test(s) ? s : undefined;
}
function time(v: unknown): string | undefined {
  const s = str(v);
  return s && TIME.test(s) ? s : undefined;
}
function num(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : undefined;
}

/**
 * Validates untrusted actions (e.g. from an AI endpoint). Invalid entries are
 * dropped instead of crashing the app. Optional fields are removed when empty.
 */
export function sanitizeActions(input: unknown): PlannerAction[] {
  if (!Array.isArray(input)) return [];
  const out: PlannerAction[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== 'object') continue;
    const a = raw as Record<string, unknown>;
    const type = a.type as PlannerAction['type'];
    if (!ACTION_TYPES.includes(type)) continue;
    let action: PlannerAction | undefined;
    switch (type) {
      case 'ADD_ACTIVITY': {
        const d = date(a.date);
        const title = str(a.title);
        if (d && title) {
          const category = str(a.category);
          action = {
            type, date: d, title, time: time(a.time), endTime: time(a.endTime), location: str(a.location),
            category: category && CATEGORIES.includes(category) ? (category as never) : undefined,
            assignedTo: assignee(a.assignedTo),
          };
        }
        break;
      }
      case 'ADD_MEAL': {
        const d = date(a.date);
        const title = str(a.title);
        const mealType = str(a.mealType);
        if (d && title) {
          action = {
            type, date: d, title, time: time(a.time), location: str(a.location),
            mealType: mealType && MEAL_TYPES.includes(mealType) ? (mealType as never) : 'dinner',
            assignedTo: assignee(a.assignedTo),
          };
        }
        break;
      }
      case 'ADD_GROCERY': {
        const name = str(a.name);
        if (name) action = { type, name, quantity: num(a.quantity), unit: str(a.unit) };
        break;
      }
      case 'DELETE_GROCERY': {
        const name = str(a.name);
        if (name) action = { type, name };
        break;
      }
      case 'DELETE_ACTIVITY':
      case 'DELETE_MEAL': {
        const title = str(a.title);
        if (title) action = { type, title, date: date(a.date) };
        break;
      }
      case 'UPDATE_ACTIVITY': {
        const title = str(a.title);
        if (title) {
          action = { type, title, date: date(a.date), newTitle: str(a.newTitle), newTime: time(a.newTime), newLocation: str(a.newLocation) };
        }
        break;
      }
      case 'UPDATE_MEAL': {
        const newTitle = str(a.newTitle);
        if (newTitle) action = { type, title: str(a.title), date: date(a.date), newTitle };
        break;
      }
      case 'MOVE_ACTIVITY': {
        const title = str(a.title);
        if (title) action = { type, title, date: date(a.date), newDate: date(a.newDate), newTime: time(a.newTime) };
        break;
      }
      case 'MOVE_MEAL': {
        const title = str(a.title);
        const newDate = date(a.newDate);
        if (title && newDate) action = { type, title, date: date(a.date), newDate };
        break;
      }
    }
    if (action) {
      const record = action as unknown as Record<string, unknown>;
      for (const k of Object.keys(record)) {
        if (record[k] === undefined) delete record[k];
      }
      out.push(action);
    }
  }
  return out;
}
