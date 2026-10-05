import type { IndexedDbRepository } from '../storage/indexedDbRepository';
import { SYNC_TABLES, type OutboxEntry, type RemoteRow, type RemoteStore, type SyncRecord, type SyncTable } from './types';

export type SyncPhase = 'idle' | 'syncing' | 'offline' | 'error';

export interface SyncStatus {
  phase: SyncPhase;
  pending: number;
  lastSyncedAt?: string;
  error?: string;
}

/** Re-read a few seconds before the cursor: commits can land slightly out of order. */
const CURSOR_OVERLAP_MS = 10_000;
const PUSH_DEBOUNCE_MS = 700;
const POLL_INTERVAL_MS = 60_000;

const cursorKey = (householdId: string, table: SyncTable) => `sync.cursor.${householdId}.${table}`;

/**
 * Two-way sync between the local IndexedDB store and a RemoteStore.
 *
 * - Push: the outbox (keys of locally changed rows) is sent in batches. Rows
 *   that no longer exist locally are sent as deletions (tombstones).
 * - Pull: rows changed on the server since the last cursor are applied
 *   locally. Last write wins on `updatedAt`; a pending local change that is
 *   newer than the remote row is kept and pushed instead.
 * - Triggers: start, local changes (debounced), realtime notifications,
 *   coming back online, the app becoming visible, and a slow poll.
 */
export class SyncEngine {
  private status: SyncStatus = { phase: 'idle', pending: 0 };
  private listeners = new Set<(s: SyncStatus) => void>();
  private running = false;
  private inFlight: Promise<void> | null = null;
  private again = false;
  private pushTimer: ReturnType<typeof setTimeout> | undefined;
  private pollTimer: ReturnType<typeof setInterval> | undefined;
  private cleanups: (() => void)[] = [];

  constructor(
    private local: IndexedDbRepository,
    private remote: RemoteStore,
    private householdId: string,
    private isOnline: () => boolean = () => (typeof navigator === 'undefined' ? true : navigator.onLine),
  ) {}

  getStatus(): SyncStatus {
    return this.status;
  }

  onStatus(listener: (s: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    listener(this.status);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setStatus(patch: Partial<SyncStatus>) {
    this.status = { ...this.status, ...patch };
    this.listeners.forEach((l) => l(this.status));
  }

  private async refreshPending() {
    this.setStatus({ pending: await this.local.outboxCount() });
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.cleanups.push(
      this.local.onOutboxChange(() => {
        void this.refreshPending();
        this.schedulePush();
      }),
      this.remote.subscribe(this.householdId, () => void this.sync()),
    );
    if (typeof window !== 'undefined') {
      const onOnline = () => void this.sync();
      const onVisible = () => document.visibilityState === 'visible' && void this.sync();
      window.addEventListener('online', onOnline);
      document.addEventListener('visibilitychange', onVisible);
      this.cleanups.push(() => {
        window.removeEventListener('online', onOnline);
        document.removeEventListener('visibilitychange', onVisible);
      });
    }
    this.pollTimer = setInterval(() => void this.sync(), POLL_INTERVAL_MS);
    void this.local.getMeta<string>(`sync.last.${this.householdId}`).then((last) => {
      if (last) this.setStatus({ lastSyncedAt: last });
    });
    void this.sync();
  }

  stop() {
    this.running = false;
    clearTimeout(this.pushTimer);
    clearInterval(this.pollTimer);
    this.cleanups.forEach((c) => c());
    this.cleanups = [];
  }

  private schedulePush() {
    clearTimeout(this.pushTimer);
    this.pushTimer = setTimeout(() => void this.sync(), PUSH_DEBOUNCE_MS);
  }

  /** Runs one push+pull round. Concurrent calls are coalesced. */
  sync(): Promise<void> {
    if (this.inFlight) {
      this.again = true;
      return this.inFlight;
    }
    this.inFlight = (async () => {
      do {
        this.again = false;
        await this.round();
      } while (this.again && this.running);
    })().finally(() => {
      this.inFlight = null;
    });
    return this.inFlight;
  }

  private async round() {
    if (!this.isOnline()) {
      await this.refreshPending();
      this.setStatus({ phase: 'offline' });
      return;
    }
    this.setStatus({ phase: 'syncing', error: undefined });
    try {
      await this.push();
      await this.pull();
      const at = new Date().toISOString();
      await this.local.setMeta(`sync.last.${this.householdId}`, at);
      await this.refreshPending();
      this.setStatus({ phase: 'idle', lastSyncedAt: at });
    } catch (e) {
      await this.refreshPending();
      const offline = !this.isOnline() || (e instanceof TypeError && /fetch|network/i.test(e.message));
      this.setStatus({ phase: offline ? 'offline' : 'error', error: e instanceof Error ? e.message : String(e) });
    }
  }

  async push() {
    const entries = await this.local.readOutbox();
    if (!entries.length) return;

    // Collapse to the latest entry per row; remember every seq to clear afterwards.
    const latest = new Map<string, OutboxEntry>();
    for (const e of entries) latest.set(`${e.table}:${e.key}`, e);

    for (const table of SYNC_TABLES) {
      const keys = [...latest.values()].filter((e) => e.table === table).map((e) => e.key);
      if (!keys.length) continue;
      const upserts: SyncRecord[] = [];
      const deletes: string[] = [];
      for (const key of keys) {
        const rec = await this.local.getRecord(table, key);
        if (rec) upserts.push(rec);
        else deletes.push(key);
      }
      for (let i = 0; i < upserts.length; i += 200) {
        await this.remote.upsert(this.householdId, table, upserts.slice(i, i + 200));
      }
      if (deletes.length) {
        await this.remote.markDeleted(this.householdId, table, deletes, new Date().toISOString());
      }
    }
    // Only clear what we sent; changes made during the push stay queued.
    await this.local.removeOutbox(entries.map((e) => e.seq!).filter((s) => s !== undefined));
  }

  async pull() {
    const pending = new Map<string, true>();
    for (const e of await this.local.readOutbox()) pending.set(`${e.table}:${e.key}`, true);

    for (const table of SYNC_TABLES) {
      const cursor = await this.local.getMeta<string>(cursorKey(this.householdId, table));
      const since = cursor ? new Date(new Date(cursor).getTime() - CURSOR_OVERLAP_MS).toISOString() : null;
      const rows = await this.remote.pullSince(this.householdId, table, since);
      if (!rows.length) continue;

      const apply: RemoteRow[] = [];
      const drop = new Set<string>();
      for (const row of rows) {
        const id = `${table}:${row.key}`;
        const local = await this.local.getRecord(table, row.key);
        if (pending.has(id)) {
          // Our queued change wins if it is at least as new as the server's.
          const localUpdated = local?.updatedAt ?? '';
          if (localUpdated >= row.updatedAt) continue;
          drop.add(id);
        } else if (local && local.updatedAt > row.updatedAt) {
          continue;
        } else if (!local && row.deleted) {
          continue;
        }
        apply.push(row);
      }
      await this.local.applyRemote(apply, drop);
      const maxSynced = rows.reduce((m, r) => (r.syncedAt > m ? r.syncedAt : m), cursor ?? '');
      await this.local.setMeta(cursorKey(this.householdId, table), maxSynced);
    }
  }

  /** Forget cursors so the next pull downloads everything again. */
  async resetCursors() {
    for (const table of SYNC_TABLES) await this.local.deleteMeta(cursorKey(this.householdId, table));
  }
}
