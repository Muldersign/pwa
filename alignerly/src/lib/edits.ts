import type { BraceEvent, Kind } from '../domain/types';
import { MIN, formatClock } from './time';
import { opposite, sortEvents } from './tracking';
import { newId } from './id';

/**
 * Pure editing operations on the registration list. Every operation returns the
 * complete new list (or an error in plain Dutch); the caller saves it atomically.
 * Invariants: sorted, at least one minute apart, kinds alternate, nothing in the future.
 */

export type EditResult = { ok: true; events: BraceEvent[]; message?: string } | { ok: false; error: string };

const KIND_LABEL: Record<Kind, string> = { in: 'in', out: 'uit' };

export function validateSequence(events: BraceEvent[], now: number): string | null {
  const s = sortEvents(events);
  for (let i = 0; i < s.length; i++) {
    const e = s[i];
    if (e.at > now + MIN) return `Een registratie om ${formatClock(e.at)} ligt in de toekomst.`;
    const prev = s[i - 1];
    if (!prev) continue;
    if (Math.floor(e.at / MIN) === Math.floor(prev.at / MIN))
      return `Er staat al een registratie om ${formatClock(e.at)}. Kies een ander tijdstip.`;
    if (prev.kind === e.kind)
      return `Dit zou twee keer achter elkaar “beugel ${KIND_LABEL[e.kind]}” opleveren (${formatClock(prev.at)} en ${formatClock(e.at)}). Voeg een periode toe of pas een bestaand moment aan.`;
  }
  return null;
}

function finish(events: BraceEvent[], now: number, message?: string): EditResult {
  const sorted = sortEvents(events);
  const error = validateSequence(sorted, now);
  return error ? { ok: false, error } : { ok: true, events: sorted, message };
}

function make(kind: Kind, at: number, source: BraceEvent['source'], note?: string): BraceEvent {
  const t = Date.now();
  return { id: newId(), kind, at, source, note: note?.trim() || undefined, createdAt: t, updatedAt: t };
}

/** The big button. Kind is derived from the current state, so a double tap can never create "in, in". */
export function toggle(events: BraceEvent[], now: number, initialKind?: Kind): EditResult {
  const sorted = sortEvents(events);
  const last = sorted[sorted.length - 1];
  const kind = last ? opposite(last.kind) : initialKind;
  if (!kind) return { ok: false, error: 'Kies of je beugel nu in of uit is.' };
  // Keep the sequence strictly increasing even if the device clock jumped back.
  const at = last ? Math.max(now, last.at + MIN) : now;
  return finish([...sorted, make(kind, at, 'button')], Math.max(now, at));
}

export function addMoment(events: BraceEvent[], kind: Kind, at: number, now: number, note?: string): EditResult {
  if (at > now) return { ok: false, error: 'Dit tijdstip ligt in de toekomst.' };
  return finish([...events, make(kind, at, 'manual', note)], now);
}

/** A forgotten period, e.g. "beugel uit van 12:15 tot 12:50" inside a wearing period. */
export function addPeriod(events: BraceEvent[], kind: Kind, from: number, to: number, now: number, note?: string): EditResult {
  if (to <= from) return { ok: false, error: 'Het eindtijdstip moet na het begintijdstip liggen.' };
  if (to > now) return { ok: false, error: 'Het eindtijdstip ligt in de toekomst.' };
  const inside = events.filter((e) => e.at >= from && e.at <= to);
  if (inside.length) return { ok: false, error: 'Deze periode overlapt met bestaande registraties. Pas die eerst aan of kies andere tijden.' };
  const sorted = sortEvents(events);
  const before = [...sorted].reverse().find((e) => e.at < from);
  const after = sorted.find((e) => e.at > to);
  if (before && before.kind === kind)
    return { ok: false, error: `Je beugel stond op dat moment al geregistreerd als ${KIND_LABEL[kind]}. Wil je juist het tegenovergestelde toevoegen?` };
  const added = [make(kind, from, 'manual', note)];
  // Close the period at `to`, unless the next registration is already the opposite state:
  // then the period simply runs until that next moment.
  if (!after || after.kind === kind) {
    added.push(make(opposite(kind), to, 'manual'));
    return finish([...sorted, ...added], now);
  }
  return finish([...sorted, ...added], now, `De periode loopt door tot ${formatClock(after.at)}, het volgende geregistreerde moment.`);
}

export function updateEvent(events: BraceEvent[], id: string, patch: { at?: number; note?: string }, now: number): EditResult {
  const target = events.find((e) => e.id === id);
  if (!target) return { ok: false, error: 'Deze registratie bestaat niet meer.' };
  if (patch.at !== undefined && patch.at > now) return { ok: false, error: 'Dit tijdstip ligt in de toekomst.' };
  const updated: BraceEvent = {
    ...target,
    at: patch.at ?? target.at,
    note: patch.note !== undefined ? patch.note.trim() || undefined : target.note,
    updatedAt: Date.now(),
  };
  return finish(events.map((e) => (e.id === id ? updated : e)), now);
}

export interface DeletePlan {
  remove: string[];
  description: string;
}

/** Deleting one moment may leave "in, in"; then the whole period goes, which is what the user means. */
export function planDelete(events: BraceEvent[], id: string): DeletePlan | null {
  const s = sortEvents(events);
  const i = s.findIndex((e) => e.id === id);
  if (i < 0) return null;
  const e = s[i];
  const prev = s[i - 1];
  const next = s[i + 1];
  if (prev && next && prev.kind === next.kind) {
    return {
      remove: [e.id, next.id],
      description: `De periode ${formatClock(e.at)} – ${formatClock(next.at)} (beugel ${KIND_LABEL[e.kind]}) wordt verwijderd. Je beugel telt dan in die tijd als ${KIND_LABEL[prev.kind]}.`,
    };
  }
  if (!next && prev) {
    return {
      remove: [e.id],
      description: `Het moment “beugel ${KIND_LABEL[e.kind]}” om ${formatClock(e.at)} wordt verwijderd. Je beugel telt dan vanaf ${formatClock(prev.at)} weer als ${KIND_LABEL[prev.kind]}.`,
    };
  }
  return { remove: [e.id], description: `Het moment “beugel ${KIND_LABEL[e.kind]}” om ${formatClock(e.at)} wordt verwijderd.` };
}

export function applyDelete(events: BraceEvent[], plan: DeletePlan): BraceEvent[] {
  return events.filter((e) => !plan.remove.includes(e.id));
}
