import { describe, expect, it } from 'vitest';
import { MemoryRepository } from '../storage/memoryRepository';
import { executeActions } from './actionExecutor';
import { parseLocally } from './nlp/localParser';

const NOW = new Date(2026, 9, 9, 10, 0);

async function setup() {
  const repo = new MemoryRepository();
  const familie = await repo.addList({ title: 'Familie', date: '2026-10-30', time: '19:30' });
  const vrienden = await repo.addList({ title: 'Vrienden', date: '2026-10-31', time: '20:00' });
  const bier = await repo.addList({ title: 'Bier', date: '2026-10-24', time: '20:00' });
  const add = (listId: string, names: string[]) =>
    Promise.all(names.map((name, position) => repo.addListItem({ listId, name, status: 'pending', position })));
  await add(familie.id, ['Oma', 'Gerard', 'Jan', 'Bryan', 'Rick?']);
  await add(vrienden.id, ['Rick', 'Daniël', 'Stefan']);
  await add(bier.id, ['Bryan', 'Stefan', 'Korné']);
  const data = await repo.loadAll();
  const known = { listTitles: data.lists.map((l) => l.title), personNames: data.listItems.map((i) => i.name) };
  const run = async (text: string) => {
    const parsed = parseLocally(text, NOW, known);
    return { parsed, result: await executeActions(repo, parsed.actions) };
  };
  return { repo, run, known };
}

const statusOf = async (repo: MemoryRepository, name: string, listTitle: string) => {
  const d = await repo.loadAll();
  const list = d.lists.find((l) => l.title === listTitle)!;
  return d.listItems.find((i) => i.listId === list.id && i.name === name)?.status;
};

describe('lijstjes', () => {
  it('parses RSVP sentences only for known names', async () => {
    const { known } = await setup();
    expect(parseLocally('Jan komt niet', NOW, known).actions).toEqual([{ type: 'SET_LIST_STATUS', name: 'Jan', status: 'no', listTitle: undefined }]);
    expect(parseLocally('Oma en Gerard komen', NOW, known).actions.map((a) => a.type === 'SET_LIST_STATUS' && [a.name, a.status])).toEqual([
      ['Oma', 'yes'],
      ['Gerard', 'yes'],
    ]);
    expect(parseLocally('Stefan komt misschien naar bier', NOW, known).actions[0]).toMatchObject({ status: 'maybe', listTitle: 'bier' });
    expect(parseLocally('Korné heeft afgezegd', NOW, known).actions[0]).toMatchObject({ status: 'no' });
    expect(parseLocally('Jan komt niet en Gerard komt', NOW, known).actions.map((a) => a.type === 'SET_LIST_STATUS' && [a.name, a.status])).toEqual([
      ['Jan', 'no'],
      ['Gerard', 'yes'],
    ]);
    expect(parseLocally('Oma en Gerard komen, Jan twijfelt', NOW, known).actions.map((a) => a.type === 'SET_LIST_STATUS' && [a.name, a.status])).toEqual([
      ['Oma', 'yes'],
      ['Gerard', 'yes'],
      ['Jan', 'maybe'],
    ]);
    // Not an RSVP: unknown name / agenda sentence
    expect(parseLocally('Mark komt eten vrijdag', NOW, known).actions[0]?.type).not.toBe('SET_LIST_STATUS');
    expect(parseLocally('morgen pizza eten', NOW, known).actions[0]?.type).toBe('ADD_MEAL');
  });

  it('updates status, with undo', async () => {
    const { repo, run } = await setup();
    const { result } = await run('Jan komt niet');
    expect(await statusOf(repo, 'Jan', 'Familie')).toBe('no');
    await result.undo();
    expect(await statusOf(repo, 'Jan', 'Familie')).toBe('pending');
  });

  it('matches names without accents and question marks', async () => {
    const { repo, run } = await setup();
    await run('Daniel komt');
    expect(await statusOf(repo, 'Daniël', 'Vrienden')).toBe('yes');
  });

  it('asks which list when a name is on several lists', async () => {
    const { repo, run } = await setup();
    const { result } = await run('Bryan komt');
    expect(result.changes[0]).toMatchObject({ kind: 'notFound' });
    expect((result.changes[0] as { message?: string }).message).toMatch(/meerdere lijsten/);
    await run('Bryan komt naar bier');
    expect(await statusOf(repo, 'Bryan', 'Bier')).toBe('yes');
    expect(await statusOf(repo, 'Bryan', 'Familie')).toBe('pending');
  });

  it('adds a new person to a named list', async () => {
    const { repo, run } = await setup();
    await run('Piet komt ook naar vrienden');
    expect(await statusOf(repo, 'Piet', 'Vrienden')).toBe('yes');
  });
});
