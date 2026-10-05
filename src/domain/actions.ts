import type { ActivityCategory, Assignee, ClockTime, ISODate, MealType } from './types';

/**
 * Structured commands produced by the natural-language parser (local or AI).
 * The rest of the app only ever deals with these — never with raw text.
 */
export type PlannerAction =
  | {
      type: 'ADD_ACTIVITY';
      date: ISODate;
      title: string;
      time?: ClockTime;
      endTime?: ClockTime;
      location?: string;
      category?: ActivityCategory;
      assignedTo?: Assignee;
    }
  | {
      type: 'ADD_MEAL';
      date: ISODate;
      title: string;
      mealType: MealType;
      time?: ClockTime;
      location?: string;
      assignedTo?: Assignee;
    }
  | { type: 'ADD_GROCERY'; name: string; quantity?: number; unit?: string }
  | { type: 'DELETE_ACTIVITY'; title: string; date?: ISODate }
  | { type: 'DELETE_MEAL'; title: string; date?: ISODate }
  | { type: 'DELETE_GROCERY'; name: string }
  | {
      type: 'UPDATE_ACTIVITY';
      title: string;
      date?: ISODate;
      newTitle?: string;
      newTime?: ClockTime;
      newLocation?: string;
    }
  | { type: 'UPDATE_MEAL'; title?: string; date?: ISODate; newTitle: string }
  | { type: 'MOVE_ACTIVITY'; title: string; date?: ISODate; newDate?: ISODate; newTime?: ClockTime }
  | { type: 'MOVE_MEAL'; title: string; date?: ISODate; newDate: ISODate };

export type PlannerActionType = PlannerAction['type'];

export interface ClarificationOption {
  label: string;
  actions: PlannerAction[];
}

export interface ParseResult {
  actions: PlannerAction[];
  /** Present only when the parser genuinely cannot decide between interpretations. */
  clarification?: {
    question: string;
    options: ClarificationOption[];
  };
  /** Which engine produced the result. */
  source: 'local' | 'ai';
}

export const ACTION_TYPES: PlannerActionType[] = [
  'ADD_ACTIVITY',
  'ADD_MEAL',
  'ADD_GROCERY',
  'DELETE_ACTIVITY',
  'DELETE_MEAL',
  'DELETE_GROCERY',
  'UPDATE_ACTIVITY',
  'UPDATE_MEAL',
  'MOVE_ACTIVITY',
  'MOVE_MEAL',
];
