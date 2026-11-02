import type { Backup, BraceEvent, DayNote, Settings } from '../domain/types';
import { DEFAULT_SETTINGS } from '../domain/types';
import { db } from './db';

export async function loadSettings(): Promise<Settings> {
  const row = await db.kv.get('settings');
  const stored = (row?.value ?? {}) as Partial<Settings>;
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    reminders: { ...DEFAULT_SETTINGS.reminders, ...(stored.reminders ?? {}) },
  };
}

export async function saveSettings(settings: Settings) {
  await db.kv.put({ key: 'settings', value: settings });
}

/** Replace the full registration list atomically (every edit is validated as a whole first). */
export async function replaceEvents(next: BraceEvent[]) {
  await db.transaction('rw', db.events, async () => {
    const existing = await db.events.toCollection().primaryKeys();
    const keep = new Set(next.map((e) => e.id));
    await db.events.bulkDelete(existing.filter((id) => !keep.has(id)));
    await db.events.bulkPut(next);
  });
}

export async function saveNote(date: string, text: string) {
  const t = text.trim();
  if (!t) await db.notes.delete(date);
  else await db.notes.put({ date, text: t, updatedAt: Date.now() });
}

export async function confirmDay(date: string) {
  await db.confirmations.put({ date, confirmedAt: Date.now() });
}

export async function unconfirmDay(date: string) {
  await db.confirmations.delete(date);
}

export async function exportBackup(): Promise<Backup> {
  const [settings, events, notes, confirmations] = await Promise.all([
    loadSettings(),
    db.events.orderBy('at').toArray(),
    db.notes.toArray(),
    db.confirmations.toArray(),
  ]);
  return { app: 'alignerly', version: 1, exportedAt: new Date().toISOString(), settings, events, notes, confirmations };
}

export function parseBackup(raw: unknown): Backup {
  const b = raw as Partial<Backup>;
  if (!b || b.app !== 'alignerly' || !Array.isArray(b.events) || !Array.isArray(b.notes))
    throw new Error('Dit bestand is geen Alignerly-back-up.');
  for (const e of b.events) {
    if (typeof e?.id !== 'string' || (e.kind !== 'in' && e.kind !== 'out') || typeof e.at !== 'number')
      throw new Error('De back-up bevat ongeldige registraties.');
  }
  return {
    app: 'alignerly',
    version: 1,
    exportedAt: b.exportedAt ?? '',
    settings: { ...DEFAULT_SETTINGS, ...(b.settings ?? {}) },
    events: b.events,
    notes: (b.notes as DayNote[]).filter((n) => typeof n?.date === 'string' && typeof n.text === 'string'),
    confirmations: Array.isArray(b.confirmations) ? b.confirmations : [],
  };
}

export async function restoreBackup(b: Backup) {
  await db.transaction('rw', [db.events, db.notes, db.confirmations, db.kv], async () => {
    await Promise.all([db.events.clear(), db.notes.clear(), db.confirmations.clear()]);
    await db.events.bulkPut(b.events);
    await db.notes.bulkPut(b.notes);
    await db.confirmations.bulkPut(b.confirmations);
    await db.kv.put({ key: 'settings', value: b.settings });
  });
}

export async function wipeAll() {
  await db.transaction('rw', [db.events, db.notes, db.confirmations], async () => {
    await Promise.all([db.events.clear(), db.notes.clear(), db.confirmations.clear()]);
  });
}
