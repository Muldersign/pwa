import { createContext, useContext } from 'react';
import type { Activity, ISODate, Meal } from '../domain/types';

export type EditorRequest =
  | { mode: 'create'; kind: 'activity' | 'meal'; date: ISODate }
  | { mode: 'edit'; kind: 'activity'; item: Activity }
  | { mode: 'edit'; kind: 'meal'; item: Meal };

export interface ConfirmRequest {
  title: string;
  message?: string;
  confirmLabel: string;
  destructive?: boolean;
}

export interface UIActions {
  openSmartInput: (prefill?: string) => void;
  openEditor: (request: EditorRequest) => void;
  /** Lets the user choose between adding an activity or a meal for a date. */
  openAddChooser: (date: ISODate) => void;
  confirm: (request: ConfirmRequest) => Promise<boolean>;
}

export const UIContext = createContext<UIActions | null>(null);

export function useUI(): UIActions {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used inside AppShell');
  return ctx;
}
