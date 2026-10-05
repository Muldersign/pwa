import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { IndexedDbRepository } from '../storage/indexedDbRepository';
import { SyncEngine } from './syncEngine';
import { recordKey, type RemoteRow, type RemoteStore, type SyncRecord, type SyncTable } from './types';

/** In-memory server with the same rules as the database: last write wins, tombstones, synced_at cursor. */
class FakeRemote implements RemoteStore {
  rows = new Map<string, RemoteRow>();
  private clock = Date.parse('2026-10-05T10:00:00Z');
  private tick() {
    this.clock += 1000;
    return new Date(this.clock).toISOString();
  }

  async pullSince(h: string, table: SyncTable, since: string | null) {
    return [...this.rows.entries()]
      .filter(([k, r]) => k.startsWith(`${h}:${table}:`) && (!since || r.syncedAt > since))
      .map(([, r]) => structuredClone(r))
      .sort((a, b) => a.syncedAt.localeCompare(b.syncedAt));
  }

  async upsert(h: string, table: SyncTable, records: SyncRecord[]) {
    for (const rec of records) {
      const key = recordKey(table, rec);
      const id = `${h}:${table}:${key}`;
      const existing = this.rows.get(id);
      if (existing && rec.updatedAt < existing.updatedAt) continue;
      this.rows.set(id, { table, key, record: structuredClone(rec), deleted: false, updatedAt: rec.updatedAt, syncedAt: this.tick() });
    }
  }

  async markDeleted(h: string, table: SyncTable, keys: string[], updatedAt: string) {
    for (const key of keys) {
      const id = `${h}:${table}:${key}`;
      const existing = this.rows.get(id);
      if (!existing || updatedAt < existing.updatedAt) continue;
      this.rows.set(id, { ...existing, record: undefined, deleted: true, updatedAt, syncedAt: this.tick() });
    }
  }

  subscribe() {
    return () => {};
  }
}

let n = 0;
async function device(remote: RemoteStore, household = 'h1') {
  const repo = new IndexedDbRepository(`test-${++n}`);
  await repo.setTracking(true);
  const engine = new SyncEngine(repo, remote, household, () => true);
  return { repo, engine };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('SyncEngine', () => {
  it('shares new items between two devices', async () => {
    const remote = new FakeRemote();
    const a = await device(remote);
    const b = await device(remote);

    await a.repo.addActivity({ title: 'Training', date: '2026-10-13', startTime: '19:45', location: 'Bareveld', category: 'sport' });
    await a.repo.addMeal({ title: 'Pizza', date: '2026-10-13', mealType: 'dinner', ingredients: [{ name: 'Pizzabodem' }] });
    await a.repo.addGrocery({ name: 'Melk', category: 'dairy' });
    await a.repo.setNote('2026-10-13', 'Tas inpakken');
    await a.engine.sync();
    expect(await a.repo.outboxCount()).toBe(0);

    await b.engine.sync();
    const data = await b.repo.loadAll();
    expect(data.activities[0]).toMatchObject({ title: 'Training', location: 'Bareveld' });
    expect(data.meals[0].ingredients).toEqual([{ name: 'Pizzabodem' }]);
    expect(data.groceries[0].name).toBe('Melk');
    expect(data.notes[0].text).toBe('Tas inpakken');
    // Pulled rows are not queued again.
    expect(await b.repo.outboxCount()).toBe(0);
  });

  it('syncs edits, check-offs and deletions', async () => {
    const remote = new FakeRemote();
    const a = await device(remote);
    const b = await device(remote);
    const melk = await a.repo.addGrocery({ name: 'Melk', category: 'dairy' });
    const brood = await a.repo.addGrocery({ name: 'Brood', category: 'bakery' });
    await a.engine.sync();
    await b.engine.sync();

    await sleep(5);
    await b.repo.updateGrocery(melk.id, { completed: true });
    await b.repo.deleteGrocery(brood.id);
    await b.engine.sync();
    await a.engine.sync();

    const groceries = (await a.repo.loadAll()).groceries;
    expect(groceries).toHaveLength(1);
    expect(groceries[0]).toMatchObject({ name: 'Melk', completed: true });
  });

  it('keeps working offline and sends queued changes later', async () => {
    const remote = new FakeRemote();
    let online = false;
    const repo = new IndexedDbRepository(`test-${++n}`);
    await repo.setTracking(true);
    const engine = new SyncEngine(repo, remote, 'h1', () => online);

    await repo.addActivity({ title: 'Werk', date: '2026-10-06', category: 'work' });
    await engine.sync();
    expect(engine.getStatus()).toMatchObject({ phase: 'offline', pending: 1 });
    expect(remote.rows.size).toBe(0);

    online = true;
    await engine.sync();
    expect(engine.getStatus()).toMatchObject({ phase: 'idle', pending: 0 });
    expect(remote.rows.size).toBe(1);
  });

  it('last write wins, also when the older change arrives later', async () => {
    const remote = new FakeRemote();
    const a = await device(remote);
    const b = await device(remote);
    const meal = await a.repo.addMeal({ title: 'Pasta', date: '2026-10-08', mealType: 'dinner', ingredients: [] });
    await a.engine.sync();
    await b.engine.sync();

    // B edits first but is offline; A edits later and syncs.
    await b.repo.updateMeal(meal.id, { title: 'Nasi' });
    await sleep(5);
    await a.repo.updateMeal(meal.id, { title: 'Wraps' });
    await a.engine.sync();
    await b.engine.sync();
    await a.engine.sync();

    expect((await a.repo.loadAll()).meals[0].title).toBe('Wraps');
    expect((await b.repo.loadAll()).meals[0].title).toBe('Wraps');
  });

  it('undo after a synced delete brings the item back everywhere', async () => {
    const remote = new FakeRemote();
    const a = await device(remote);
    const b = await device(remote);
    const act = await a.repo.addActivity({ title: 'Tandarts', date: '2026-10-08', category: 'appointment' });
    await a.engine.sync();
    await a.repo.deleteActivity(act.id);
    await a.engine.sync();
    await sleep(5);
    await a.repo.putActivity(act); // undo
    await a.engine.sync();
    await b.engine.sync();
    expect((await b.repo.loadAll()).activities.map((x) => x.title)).toEqual(['Tandarts']);
  });

  it('does not upload anything while tracking is off', async () => {
    const remote = new FakeRemote();
    const repo = new IndexedDbRepository(`test-${++n}`);
    await repo.addGrocery({ name: 'Kaas', category: 'dairy' });
    expect(await repo.outboxCount()).toBe(0);
    await repo.setTracking(true);
    await repo.enqueueAll();
    const engine = new SyncEngine(repo, remote, 'h1', () => true);
    await engine.sync();
    expect(remote.rows.size).toBe(1);
  });
});
