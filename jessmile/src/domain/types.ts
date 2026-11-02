export type Kind = 'in' | 'out';

/** One button press (or manual correction): from this moment on the aligner is in / out. */
export interface BraceEvent {
  id: string;
  kind: Kind;
  /** Epoch milliseconds (absolute time; local time zone / DST is applied only when displaying). */
  at: number;
  note?: string;
  source: 'button' | 'manual';
  createdAt: number;
  updatedAt: number;
}

export interface DayNote {
  /** Local calendar day, YYYY-MM-DD */
  date: string;
  text: string;
  updatedAt: number;
}

/** A past day without any registration that Jessica explicitly confirmed. */
export interface DayConfirmation {
  date: string;
  confirmedAt: number;
}

export interface ReminderSettings {
  enabled: boolean;
  first: { on: boolean; minutes: number };
  second: { on: boolean; minutes: number };
  budgetLow: { on: boolean; minutes: number };
  meal: { on: boolean; minutes: number };
}

export interface Settings {
  name: string;
  goalMinutes: number;
  reminders: ReminderSettings;
}

export const DEFAULT_SETTINGS: Settings = {
  name: 'Jessica',
  goalMinutes: 22 * 60,
  reminders: {
    enabled: false,
    first: { on: true, minutes: 30 },
    second: { on: true, minutes: 60 },
    budgetLow: { on: true, minutes: 15 },
    meal: { on: false, minutes: 45 },
  },
};

export interface Backup {
  app: 'jessmile' | 'alignerly';
  version: 1;
  exportedAt: string;
  settings: Settings;
  events: BraceEvent[];
  notes: DayNote[];
  confirmations: DayConfirmation[];
}
