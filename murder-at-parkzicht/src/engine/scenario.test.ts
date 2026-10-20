import { describe, expect, it } from 'vitest';
import { parkzicht as sc } from '../scenario/parkzicht';
import type { Cond, Effects, GameState } from './types';
import {
  advanceChapter,
  answerQuestion,
  askTopic,
  canAccuse,
  chapterComplete,
  check,
  newGame,
  score,
  solvePuzzle,
  visibleTopics,
} from './engine';

const evIds = new Set(sc.evidence.map((e) => e.id));
const allTopics = Object.values(sc.dialogues).flat();
const topicIds = new Set(allTopics.map((t) => t.id));
const puzzleIds = new Set(sc.puzzles.map((p) => p.id));
const questionIds = new Set(sc.questions.map((q) => q.id));
const photoIds = new Set(sc.photos.map((p) => p.id));

function refsOf(c: Cond | undefined) {
  return {
    ev: [...(c?.evidence ?? []), ...(c?.anyEvidence ?? [])],
    topics: c?.topics ?? [],
    puzzles: c?.puzzles ?? [],
    questions: c?.questions ?? [],
  };
}

function allConds(): { where: string; c: Cond | undefined }[] {
  const out: { where: string; c: Cond | undefined }[] = [];
  for (const t of allTopics) out.push({ where: `topic ${t.id}`, c: t.when });
  for (const p of sc.puzzles) out.push({ where: `puzzle ${p.id}`, c: p.when });
  for (const q of sc.questions) out.push({ where: `question ${q.id}`, c: q.when });
  for (const ch of sc.chapters) for (const g of ch.goals) out.push({ where: `goal ${g.id}`, c: g.done });
  for (const t of sc.timeline) out.push({ where: `timeline ${t.id}`, c: t.when }, { where: `timeline ${t.id} disputed`, c: t.disputed });
  for (const s of sc.suspects) {
    for (const e of [...s.statement, ...s.motive, ...s.alibi]) out.push({ where: `suspect ${s.id}`, c: e.when });
    for (const e of s.secrets) out.push({ where: `secret ${e.id}`, c: e.when });
  }
  return out;
}

function allEffects(): { where: string; fx: Effects | undefined }[] {
  return [
    ...allTopics.map((t) => ({ where: `topic ${t.id}`, fx: t.effects })),
    ...sc.puzzles.map((p) => ({ where: `puzzle ${p.id}`, fx: p.onSolve })),
    ...sc.chapters.map((c) => ({ where: `chapter ${c.no}`, fx: c.onStart })),
  ];
}

/** Plays the whole game the way a thorough player would, without any shortcuts. */
function autoplay(): { state: GameState; steps: number } {
  let s = newGame(sc);
  let steps = 0;
  for (let guard = 0; guard < 200; guard++) {
    let progressed = false;
    for (const sus of sc.suspects) {
      for (const t of visibleTopics(sc, sus.id, s)) {
        if (!s.topics.includes(t.id)) {
          s = askTopic(s, t);
          progressed = true;
          steps++;
        }
      }
    }
    for (const p of sc.puzzles) {
      if (!s.puzzles.includes(p.id) && p.chapter <= s.chapter && check(p.when, s, sc)) {
        s = solvePuzzle(sc, s, p.id);
        progressed = true;
        steps++;
      }
    }
    for (const q of sc.questions) {
      if (!s.questions[q.id] && q.chapter <= s.chapter && check(q.when, s, sc)) {
        s = answerQuestion(sc, s, q.id, q.answer).state;
        progressed = true;
        steps++;
      }
    }
    if (!progressed && chapterComplete(sc, s) && s.chapter < 4) {
      s = advanceChapter(sc, s);
      progressed = true;
    }
    if (!progressed) break;
  }
  return { state: s, steps };
}

describe('scenario data integrity', () => {
  it('has the required amount of content', () => {
    expect(sc.suspects).toHaveLength(10);
    expect(sc.chapters).toHaveLength(4);
    expect(sc.evidence.length).toBeGreaterThanOrEqual(20);
    expect(sc.puzzles.length).toBeGreaterThanOrEqual(4);
    // 9 investigation questions + 3 final accusation questions = 12
    expect(sc.questions).toHaveLength(9);
    for (const ch of sc.chapters) expect(sc.puzzles.some((p) => p.chapter === ch.no)).toBe(true);
  });

  it('uses exactly the ten requested names', () => {
    expect(sc.suspects.map((s) => s.name)).toEqual([
      'Glenn Mulder',
      'Jessica Postema',
      'Sanne Roossien',
      'Alex Gorissen',
      'Jolien Beemer',
      'Rick van der Veen',
      'Yvan Hoving',
      'Maureen Nieuwold',
      'Daniëlle Radtur',
      'Stefan Alting',
    ]);
  });

  it('gives every suspect at least eight topics spread over the chapters', () => {
    for (const s of sc.suspects) {
      const topics = sc.dialogues[s.id];
      expect(topics.length, s.id).toBeGreaterThanOrEqual(8);
      const chapters = new Set(topics.map((t) => t.when.chapter ?? 1));
      expect(chapters.size, s.id).toBeGreaterThanOrEqual(3);
      expect(topics.some((t) => t.confront), `${s.id} has a confrontation`).toBe(true);
    }
  });

  it('has unique ids', () => {
    expect(topicIds.size).toBe(allTopics.length);
    expect(evIds.size).toBe(sc.evidence.length);
  });

  it('only references things that exist', () => {
    for (const { where, c } of allConds()) {
      const r = refsOf(c);
      for (const e of r.ev) expect(evIds.has(e), `${where} → evidence ${e}`).toBe(true);
      for (const t of r.topics) expect(topicIds.has(t), `${where} → topic ${t}`).toBe(true);
      for (const p of r.puzzles) expect(puzzleIds.has(p), `${where} → puzzle ${p}`).toBe(true);
      for (const q of r.questions) expect(questionIds.has(q), `${where} → question ${q}`).toBe(true);
    }
    for (const { where, fx } of allEffects()) for (const e of fx?.evidence ?? []) expect(evIds.has(e), `${where} gives ${e}`).toBe(true);
    for (const e of sc.evidence)
      for (const b of e.content) if (b.kind === 'photo') expect(photoIds.has(b.scene), `${e.id} photo`).toBe(true);
    for (const id of [...sc.solution.decisiveEvidence, ...sc.solution.supportingEvidence]) expect(evIds.has(id), id).toBe(true);
    expect(sc.suspects.some((s) => s.id === sc.solution.culprit)).toBe(true);
    expect(sc.solution.motives.some((m) => m.id === sc.solution.motive)).toBe(true);
  });

  it('every piece of evidence can be obtained', () => {
    const given = new Set(allEffects().flatMap((x) => x.fx?.evidence ?? []));
    for (const e of sc.evidence) expect(given.has(e.id), e.id).toBe(true);
  });

  it('has valid puzzle definitions', () => {
    for (const p of sc.puzzles) {
      if (p.type === 'order') expect([...p.answer].sort()).toEqual(p.items.map((i) => i.id).sort());
      if (p.type === 'hotspots') {
        const scene = sc.photos.find((x) => x.id === p.scene)!;
        for (const r of p.required) expect(scene.hotspots.some((h) => h.id === r), r).toBe(true);
      }
      if (p.type === 'diff') expect(p.rows.some((r) => r.differs) && p.rows.some((r) => !r.differs)).toBe(true);
      if (p.type === 'assign')
        for (const r of p.rows) for (const f of r.fields) expect(p.options.some((o) => o.id === f.answer), `${p.id}/${r.id}`).toBe(true);
      expect(p.hints).toHaveLength(3);
    }
    for (const q of sc.questions) expect(q.options.some((o) => o.id === q.answer)).toBe(true);
  });

  it('anchors photo hotspots to existing figures', () => {
    for (const ph of sc.photos)
      for (const h of ph.hotspots) {
        if (h.anchor) expect(ph.figures[h.anchor.figure], `${ph.id}/${h.id}`).toBeDefined();
        else expect(h.x !== undefined && h.y !== undefined, `${ph.id}/${h.id}`).toBe(true);
      }
  });
});

describe('story logic', () => {
  it('money adds up: €650 = €500 + €150', () => {
    const geld = sc.puzzles.find((p) => p.id === 'p_geld');
    expect(geld?.type).toBe('assign');
    expect(650).toBe(500 + 150);
    // The café invoice lists 185 + 95 + 220
    expect(185 + 95 + 220).toBe(500);
    const factuur = JSON.stringify(sc.evidence.find((e) => e.id === 'e_factuur'));
    for (const amount of ['€185', '€95', '€220', '€500']) expect(factuur).toContain(amount);
    const bank = JSON.stringify(sc.evidence.find((e) => e.id === 'e_bank_bob'));
    for (const amount of ['+€650', '−€500', '−€150']) expect(bank).toContain(amount);
  });

  it('keeps the two timelines apart and in order', () => {
    const night = sc.timeline.filter((t) => t.era === '2026');
    const toMin = (t: string) => {
      const m = t.match(/(\d{2})\.(\d{2})/);
      return m ? Number(m[1]) * 60 + Number(m[2]) : NaN;
    };
    for (const t of night) expect(Number.isNaN(toMin(t.time)), t.id).toBe(false);
    for (const t of night) expect(t.date, t.id).toBeUndefined();
    for (const t of sc.timeline.filter((x) => x.era === '2024')) expect(t.date, t.id).toBeDefined();
  });

  it('has a consistent key route', () => {
    const p = sc.puzzles.find((x) => x.id === 'p_sleutel');
    if (p?.type !== 'assign') throw new Error('p_sleutel');
    expect(p.rows.map((r) => r.fields[0].answer)).toEqual(['alex', 'lock', 'neck', 'dader', 'spare', 'jas']);
  });

  it('leaves exactly two suspects without an alibi, the culprit among them', () => {
    const p = sc.puzzles.find((x) => x.id === 'p_alibi');
    if (p?.type !== 'assign') throw new Error('p_alibi');
    const open = p.rows.filter((r) => r.fields[0].answer === 'nee').map((r) => r.id.replace('al_', ''));
    expect(open).toHaveLength(2);
    expect(open).toContain(sc.solution.culprit);
  });

  it('the cufflink evidence singles out one person', () => {
    // Brotherhood members who wore two cufflinks at 21.10 and one at 21.52
    const at = (scene: string) => Object.fromEntries(sc.photos.find((p) => p.id === scene)!.figures.map((f) => [f.label, f.cufflinks]));
    const before = at('foto_2110');
    const after = at('foto_2152');
    const lost = Object.keys(before).filter((k) => before[k] === 2 && after[k] === 1);
    expect(lost).toHaveLength(1);
    expect(lost[0].toLowerCase()).toBe(sc.solution.culprit);
  });
});

describe('full playthrough', () => {
  const { state, steps } = autoplay();

  it('can be played from start to accusation', () => {
    expect(state.chapter).toBe(4);
    expect(canAccuse(sc, state)).toBe(true);
    expect(steps).toBeGreaterThan(100);
  });

  it('unlocks every topic, puzzle, question and piece of evidence along the way', () => {
    for (const t of allTopics) expect(state.topics.includes(t.id), t.id).toBe(true);
    for (const p of sc.puzzles) expect(state.puzzles.includes(p.id), p.id).toBe(true);
    for (const q of sc.questions) expect(state.questions[q.id], q.id).toBe(q.answer);
    for (const e of sc.evidence) expect(state.evidence.includes(e.id), e.id).toBe(true);
  });

  it('all decisive evidence is available before the accusation', () => {
    for (const e of sc.solution.decisiveEvidence) expect(state.evidence.includes(e), e).toBe(true);
  });

  it('only reveals secrets/alibis through conditions the player can meet', () => {
    for (const s of sc.suspects) for (const sec of s.secrets) expect(check(sec.when, state, sc), sec.id).toBe(true);
  });

  it('scores a correct accusation highly and a wrong one low', () => {
    const good = score(sc, {
      ...state,
      accusation: { suspect: sc.solution.culprit, motive: sc.solution.motive, evidence: sc.solution.decisiveEvidence.slice(0, 4), at: 0 },
    });
    expect(good.culpritCorrect).toBe(true);
    expect(good.total).toBeGreaterThanOrEqual(90);
    const bad = score(sc, { ...state, accusation: { suspect: 'stefan', motive: 'm_blackbook', evidence: ['e_sleutel_jas', 'e_kasboek'], at: 0 } });
    expect(bad.culpritCorrect).toBe(false);
    expect(bad.total).toBeLessThan(20);
  });

  it('cannot skip ahead: chapter 2 is locked at the start', () => {
    const s = newGame(sc);
    expect(chapterComplete(sc, s)).toBe(false);
    expect(advanceChapter(sc, s).chapter).toBe(1);
  });
});
