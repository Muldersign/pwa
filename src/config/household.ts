import type { Assignee } from '../domain/types';

/**
 * People in the household. When accounts are added (e.g. Supabase auth), this
 * list can be loaded from the server instead.
 */
export const HOUSEHOLD: { id: Assignee; name: string; initial: string }[] = [
  { id: 'glenn', name: 'Glenn', initial: 'G' },
  { id: 'jessica', name: 'Jessica', initial: 'J' },
  { id: 'samen', name: 'Samen', initial: 'S' },
];

export function assigneeName(id?: Assignee): string | undefined {
  return HOUSEHOLD.find((p) => p.id === id)?.name;
}
