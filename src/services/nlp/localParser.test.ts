import { describe, expect, it } from 'vitest';
import { parseLocally } from './localParser';

// Monday 5 October 2026, 10:00
const NOW = new Date(2026, 9, 5, 10, 0);
const parse = (s: string) => parseLocally(s, NOW);

describe('dates', () => {
  it('resolves "dinsdag komende week" to next week', () => {
    const r = parse('Dinsdag komende week pizza eten en om 19:45 uur trainen in Bareveld');
    expect(r.clarification).toBeUndefined();
    expect(r.actions).toEqual([
      { type: 'ADD_MEAL', date: '2026-10-13', mealType: 'dinner', time: undefined, title: 'Pizza' },
      {
        type: 'ADD_ACTIVITY',
        date: '2026-10-13',
        time: '19:45',
        endTime: undefined,
        title: 'Training',
        location: 'Bareveld',
        category: 'sport',
      },
    ]);
  });

  it('plain weekday is the first upcoming one', () => {
    expect(parse('dinsdag 19:45 trainen in Bareveld').actions[0]).toMatchObject({ date: '2026-10-06', time: '19:45' });
    expect(parse('zondag verjaardag oma om 15:00').actions[0]).toMatchObject({
      type: 'ADD_ACTIVITY',
      date: '2026-10-11',
      time: '15:00',
      title: 'Verjaardag oma',
      category: 'social',
    });
  });

  it('asks when "komende dinsdag" could mean this or next week', () => {
    const r = parse('komende dinsdag pizza eten');
    expect(r.clarification?.question).toBe('Bedoel je dinsdag 6 oktober of dinsdag 13 oktober?');
    expect(r.clarification?.options[1].actions[0]).toMatchObject({ date: '2026-10-13' });
  });

  it('does not ask for "aanstaande"', () => {
    const r = parse('aanstaande dinsdag pizza');
    expect(r.clarification).toBeUndefined();
    expect(r.actions[0]).toMatchObject({ type: 'ADD_MEAL', date: '2026-10-06', title: 'Pizza' });
  });

  it('handles morgen / overmorgen / explicit dates', () => {
    expect(parse('morgen pizza eten').actions[0]).toMatchObject({ type: 'ADD_MEAL', date: '2026-10-06', title: 'Pizza' });
    expect(parse('morgen om 19:00 trainen').actions[0]).toMatchObject({
      type: 'ADD_ACTIVITY',
      date: '2026-10-06',
      time: '19:00',
      title: 'Training',
    });
    expect(parse('overmorgen tandarts om 9:30').actions[0]).toMatchObject({ date: '2026-10-07', time: '09:30' });
    expect(parse('13 oktober kapper om half 4').actions[0]).toMatchObject({ date: '2026-10-13', time: '15:30', title: 'Kapper' });
    expect(parse('volgende week vrijdag uit eten bij De Gulle Boergondiër').actions[0]).toEqual({
      type: 'ADD_MEAL',
      date: '2026-10-16',
      mealType: 'dinner',
      time: undefined,
      title: 'Uit eten',
      location: 'De Gulle Boergondiër',
    });
  });
});

describe('multiple commands', () => {
  it('splits dinner at parents and a birthday', () => {
    const r = parse('Vrijdag om 18:00 eten bij mijn ouders en daarna om 20:00 verjaardag bij Mark');
    expect(r.actions).toHaveLength(2);
    expect(r.actions[0]).toMatchObject({ type: 'ADD_MEAL', date: '2026-10-09', time: '18:00', title: 'Eten bij mijn ouders' });
    expect(r.actions[1]).toMatchObject({ type: 'ADD_ACTIVITY', date: '2026-10-09', time: '20:00', title: 'Verjaardag Mark' });
  });

  it('meal plus groceries', () => {
    const r = parse('Woensdag pasta pesto eten en haal pasta, pesto, kip en mozzarella');
    expect(r.actions[0]).toMatchObject({ type: 'ADD_MEAL', date: '2026-10-07', title: 'Pasta pesto' });
    expect(r.actions.slice(1).map((a) => a.type === 'ADD_GROCERY' && a.name)).toEqual(['Pasta', 'Pesto', 'Kip', 'Mozzarella']);
  });

  it('trip and evening meal', () => {
    const r = parse("zaterdag naar Groningen en 's avonds sushi eten");
    expect(r.actions[0]).toMatchObject({ type: 'ADD_ACTIVITY', date: '2026-10-10', title: 'Naar Groningen', category: 'travel' });
    expect(r.actions[1]).toMatchObject({ type: 'ADD_MEAL', date: '2026-10-10', title: 'Sushi', mealType: 'dinner' });
  });
});

describe('groceries', () => {
  it('haal ... list', () => {
    const r = parse('Haal melk, eieren, wraps, kip, paprika en cola');
    expect(r.actions.map((a) => a.type === 'ADD_GROCERY' && a.name)).toEqual(['Melk', 'Eieren', 'Wraps', 'Kip', 'Paprika', 'Cola']);
  });
  it('trailing verb', () => {
    const r = parse('Melk, brood, kip, wraps en paprika halen');
    expect(r.actions.map((a) => a.type === 'ADD_GROCERY' && a.name)).toEqual(['Melk', 'Brood', 'Kip', 'Wraps', 'Paprika']);
  });
  it('zet ... bij boodschappen', () => {
    expect(parse('zet cola bij boodschappen').actions).toEqual([{ type: 'ADD_GROCERY', name: 'Cola', quantity: undefined, unit: undefined }]);
  });
  it('quantities', () => {
    expect(parse('haal 2 liter melk').actions[0]).toEqual({ type: 'ADD_GROCERY', name: 'Melk', quantity: 2, unit: 'l' });
    expect(parse('haal 6 eieren').actions[0]).toMatchObject({ name: 'Eieren', quantity: 6 });
  });
  it('delete from list', () => {
    expect(parse('verwijder melk van boodschappen').actions).toEqual([{ type: 'DELETE_GROCERY', name: 'Melk' }]);
    expect(parse('haal melk en brood van de lijst').actions).toEqual([
      { type: 'DELETE_GROCERY', name: 'Melk' },
      { type: 'DELETE_GROCERY', name: 'Brood' },
    ]);
  });
});

describe('changes', () => {
  it('vrijdag geen training', () => {
    expect(parse('vrijdag geen training').actions).toEqual([{ type: 'DELETE_ACTIVITY', title: 'training', date: '2026-10-09' }]);
  });
  it('verwijder pizza van donderdag', () => {
    expect(parse('verwijder pizza van donderdag').actions).toEqual([{ type: 'DELETE_MEAL', title: 'pizza', date: '2026-10-08' }]);
  });
  it('verplaats training', () => {
    expect(parse('verplaats training dinsdag naar woensdag 20:00').actions).toEqual([
      { type: 'MOVE_ACTIVITY', title: 'training', date: '2026-10-06', newDate: '2026-10-07', newTime: '20:00' },
    ]);
  });
  it('zet maandag nasi op het menu', () => {
    expect(parse('zet maandag nasi op het menu').actions[0]).toMatchObject({ type: 'ADD_MEAL', date: '2026-10-05', title: 'Nasi' });
  });
  it('toch geen pasta maar wraps', () => {
    expect(parse('we eten donderdag toch geen pasta maar wraps').actions).toEqual([
      { type: 'UPDATE_MEAL', title: 'pasta', date: '2026-10-08', newTitle: 'Wraps' },
    ]);
  });
  it('time range', () => {
    expect(parse('vrijdag van 9 tot 5 werken').actions[0]).toMatchObject({ time: '09:00', endTime: '17:00', title: 'Werk' });
  });
  it('takeaway, assignee and extra phrasing', () => {
    expect(parse('chinees halen vrijdag').actions[0]).toMatchObject({ type: 'ADD_MEAL', title: 'Chinees', date: '2026-10-09' });
    expect(parse('haal morgen melk').actions).toEqual([{ type: 'ADD_GROCERY', name: 'Melk', quantity: undefined, unit: undefined }]);
    expect(parse('woensdag 12:30 lunch met Sanne in Assen').actions[0]).toMatchObject({
      type: 'ADD_MEAL', mealType: 'lunch', title: 'Lunch met Sanne', location: 'Assen',
    });
    expect(parse('training gaat dinsdag niet door').actions[0]).toMatchObject({ type: 'DELETE_ACTIVITY', date: '2026-10-06' });
    expect(parse('zet de training van woensdag op 20:30').actions[0]).toMatchObject({ type: 'MOVE_ACTIVITY', newTime: '20:30' });
    expect(parse('Jessica moet zaterdag werken van 9 tot 5').actions[0]).toMatchObject({
      title: 'Werk', assignedTo: 'jessica', time: '09:00', endTime: '17:00',
    });
    expect(parse('pizza eten op vrijdag en zaterdag').actions.map((a) => 'date' in a && a.date)).toEqual(['2026-10-09', '2026-10-10']);
  });
});
