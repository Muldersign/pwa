import { describe, expect, it } from 'vitest';
import { MemoryRepository } from '../storage/memoryRepository';
import { executeActions } from './actionExecutor';
import { categorizeGrocery } from './groceryCategorizer';
import { parseLocally } from './nlp/localParser';
import { normalizeTimeInput } from '../components/DateTimeFields';

const NOW = new Date(2026, 9, 5, 10, 0);

async function run(repo: MemoryRepository, text: string) {
  return executeActions(repo, parseLocally(text, NOW).actions);
}

describe('executeActions', () => {
  it('adds meal + activity and undoes them', async () => {
    const repo = new MemoryRepository();
    const result = await run(repo, 'Dinsdag komende week pizza eten en om 19:45 uur trainen in Bareveld');
    let data = await repo.loadAll();
    expect(data.meals).toHaveLength(1);
    expect(data.meals[0]).toMatchObject({ title: 'Pizza', date: '2026-10-13', mealType: 'dinner' });
    expect(data.meals[0].ingredients.length).toBeGreaterThan(0);
    expect(data.activities[0]).toMatchObject({ title: 'Training', startTime: '19:45', location: 'Bareveld', category: 'sport' });
    await result.undo();
    data = await repo.loadAll();
    expect(data.meals).toHaveLength(0);
    expect(data.activities).toHaveLength(0);
  });

  it('creates separate grocery items with categories and skips duplicates', async () => {
    const repo = new MemoryRepository();
    await run(repo, 'Haal melk, eieren, wraps, kip, paprika en cola');
    const data = await repo.loadAll();
    expect(data.groceries.map((g) => [g.name, g.category])).toEqual([
      ['Melk', 'dairy'],
      ['Eieren', 'dairy'],
      ['Wraps', 'bakery'],
      ['Kip', 'meat'],
      ['Paprika', 'produce'],
      ['Cola', 'drinks'],
    ]);
    const again = await run(repo, 'zet melk bij boodschappen');
    expect(again.changes[0].kind).toBe('exists');
    expect((await repo.loadAll()).groceries).toHaveLength(6);
  });

  it('restores a completed grocery instead of duplicating it', async () => {
    const repo = new MemoryRepository();
    await run(repo, 'haal melk');
    const [melk] = (await repo.loadAll()).groceries;
    await repo.updateGrocery(melk.id, { completed: true });
    const r = await run(repo, 'haal melk');
    expect(r.changes[0].kind).toBe('restored');
    expect((await repo.loadAll()).groceries[0].completed).toBe(false);
  });

  it('deletes, moves and updates existing items', async () => {
    const repo = new MemoryRepository();
    await run(repo, 'dinsdag 19:45 trainen in Bareveld');
    await run(repo, 'donderdag pasta eten');
    await run(repo, 'vrijdag 20:00 training');

    await run(repo, 'verplaats training dinsdag naar woensdag 20:00');
    let data = await repo.loadAll();
    expect(data.activities.find((a) => a.location === 'Bareveld')).toMatchObject({ date: '2026-10-07', startTime: '20:00' });

    await run(repo, 'we eten donderdag toch geen pasta maar wraps');
    data = await repo.loadAll();
    expect(data.meals[0]).toMatchObject({ title: 'Wraps', date: '2026-10-08' });

    await run(repo, 'vrijdag geen training');
    data = await repo.loadAll();
    expect(data.activities.map((a) => a.date)).toEqual(['2026-10-07']);

    const missing = await run(repo, 'verwijder pizza van donderdag');
    expect(missing.changes[0].kind).toBe('notFound');
  });

  it('removes groceries by name', async () => {
    const repo = new MemoryRepository();
    await run(repo, 'haal melk en brood');
    await run(repo, 'verwijder melk van boodschappen');
    expect((await repo.loadAll()).groceries.map((g) => g.name)).toEqual(['Brood']);
  });
});

describe('categorizeGrocery', () => {
  it.each([
    ['halfvolle melk', 'dairy'],
    ['kipfilet', 'meat'],
    ['pindakaas', 'spreads'],
    ['tomatensoep', 'pantry'],
    ['afwasmiddel', 'household'],
    ['tandpasta', 'care'],
    ['diepvriespizza', 'frozen'],
    ['iets raars', 'other'],
  ])('%s → %s', (name, cat) => {
    expect(categorizeGrocery(name)).toBe(cat);
  });
});

describe('normalizeTimeInput', () => {
  it.each([
    ['1945', '19:45'],
    ['19.45', '19:45'],
    ['9:5', '09:05'],
    ['9', '09:00'],
    ['', ''],
  ])('%s → %s', (input, out) => expect(normalizeTimeInput(input)).toBe(out));
  it('rejects nonsense', () => {
    expect(normalizeTimeInput('25:00')).toBeUndefined();
    expect(normalizeTimeInput('abc')).toBeUndefined();
  });
});
