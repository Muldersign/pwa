import type { ChapterNo, Cond, CondText, Effects, GameState, Scenario, Topic } from './types';

export function newGame(scenario: Scenario): GameState {
  const state: GameState = {
    version: 1,
    scenario: scenario.id,
    started: true,
    chapter: 1,
    evidence: [],
    seenEvidence: [],
    flags: [],
    topics: [],
    puzzles: [],
    puzzleMistakes: {},
    questions: {},
    questionMistakes: {},
    hints: {},
    suspicion: Object.fromEntries(scenario.suspects.map((s) => [s.id, 'onbekend'])),
    notes: {},
    theory: '',
    savedLines: [],
    pinned: [],
    completedChapters: [],
    playMs: 0,
    createdAt: Date.now(),
  };
  return applyEffects(state, scenario.chapters[0].onStart);
}

export function check(cond: Cond | undefined, s: GameState, scenario: Scenario): boolean {
  if (!cond) return true;
  if (cond.chapter && s.chapter < cond.chapter) return false;
  if (cond.evidence && !cond.evidence.every((e) => s.evidence.includes(e))) return false;
  if (cond.anyEvidence && !cond.anyEvidence.some((e) => s.evidence.includes(e))) return false;
  if (cond.flags && !cond.flags.every((f) => s.flags.includes(f))) return false;
  if (cond.topics && !cond.topics.every((t) => s.topics.includes(t))) return false;
  if (cond.puzzles && !cond.puzzles.every((p) => s.puzzles.includes(p))) return false;
  if (cond.questions) {
    for (const q of cond.questions) {
      const def = scenario.questions.find((x) => x.id === q);
      if (!def || s.questions[q] !== def.answer) return false;
    }
  }
  return true;
}

function addUnique(list: string[], items: string[] | undefined): string[] {
  if (!items?.length) return list;
  const out = [...list];
  for (const i of items) if (!out.includes(i)) out.push(i);
  return out;
}

export function applyEffects(s: GameState, fx: Effects | undefined): GameState {
  if (!fx) return s;
  return { ...s, evidence: addUnique(s.evidence, fx.evidence), flags: addUnique(s.flags, fx.flags) };
}

/** Evidence ids that an effect would add and the player does not have yet. */
export function newEvidenceFrom(s: GameState, fx: Effects | undefined): string[] {
  return (fx?.evidence ?? []).filter((e) => !s.evidence.includes(e));
}

export function latest(entries: CondText[], s: GameState, scenario: Scenario): string | undefined {
  let out: string | undefined;
  for (const e of entries) if (check(e.when, s, scenario)) out = e.text;
  return out;
}

export function visibleTopics(scenario: Scenario, suspectId: string, s: GameState): Topic[] {
  return (scenario.dialogues[suspectId] ?? []).filter((t) => check({ chapter: 1, ...t.when }, s, scenario));
}

export function unseenTopicCount(scenario: Scenario, suspectId: string, s: GameState): number {
  return visibleTopics(scenario, suspectId, s).filter((t) => !s.topics.includes(t.id)).length;
}

export function askTopic(s: GameState, topic: Topic): GameState {
  const next = s.topics.includes(topic.id) ? s : { ...s, topics: [...s.topics, topic.id] };
  return applyEffects(next, topic.effects);
}

export function goalsFor(scenario: Scenario, s: GameState, no: ChapterNo) {
  const ch = scenario.chapters.find((c) => c.no === no)!;
  return ch.goals.map((g) => ({ ...g, complete: check(g.done, s, scenario) }));
}

export function chapterComplete(scenario: Scenario, s: GameState, no: ChapterNo = s.chapter): boolean {
  return goalsFor(scenario, s, no).every((g) => g.complete);
}

export function advanceChapter(scenario: Scenario, s: GameState): GameState {
  if (!chapterComplete(scenario, s)) return s;
  const done = s.completedChapters.includes(s.chapter) ? s.completedChapters : [...s.completedChapters, s.chapter];
  if (s.chapter >= 4) return { ...s, completedChapters: done };
  const nextNo = (s.chapter + 1) as ChapterNo;
  const ch = scenario.chapters.find((c) => c.no === nextNo)!;
  return applyEffects({ ...s, chapter: nextNo, completedChapters: done }, ch.onStart);
}

export function canAccuse(scenario: Scenario, s: GameState): boolean {
  return s.chapter === 4 && chapterComplete(scenario, s, 4);
}

export function answerQuestion(scenario: Scenario, s: GameState, qid: string, option: string): { state: GameState; correct: boolean } {
  const q = scenario.questions.find((x) => x.id === qid)!;
  const correct = q.answer === option;
  if (correct) return { state: { ...s, questions: { ...s.questions, [qid]: option } }, correct };
  return {
    state: { ...s, questionMistakes: { ...s.questionMistakes, [qid]: (s.questionMistakes[qid] ?? 0) + 1 } },
    correct,
  };
}

export function solvePuzzle(scenario: Scenario, s: GameState, pid: string): GameState {
  if (s.puzzles.includes(pid)) return s;
  const p = scenario.puzzles.find((x) => x.id === pid)!;
  return applyEffects({ ...s, puzzles: [...s.puzzles, pid] }, p.onSolve);
}

export function puzzleMistake(s: GameState, pid: string): GameState {
  return { ...s, puzzleMistakes: { ...s.puzzleMistakes, [pid]: (s.puzzleMistakes[pid] ?? 0) + 1 } };
}

export function useHint(s: GameState, key: string, level: number): GameState {
  if ((s.hints[key] ?? 0) >= level) return s;
  return { ...s, hints: { ...s.hints, [key]: level } };
}

// ---------- Scoring ----------

export interface ScoreBreakdown {
  culpritCorrect: boolean;
  motiveCorrect: boolean;
  culprit: number;
  motive: number;
  evidence: number;
  decisiveChosen: string[];
  investigation: number;
  hintsUsed: number;
  mistakes: number;
  total: number;
  rank: { title: string; award: 'goud' | 'zilver' | 'brons' | 'geen'; text: string };
}

export function score(scenario: Scenario, s: GameState): ScoreBreakdown {
  const acc = s.accusation;
  const sol = scenario.solution;
  const culpritCorrect = acc?.suspect === sol.culprit;
  const motiveCorrect = acc?.motive === sol.motive;
  const decisiveChosen = (acc?.evidence ?? []).filter((e) => sol.decisiveEvidence.includes(e));
  const supporting = (acc?.evidence ?? []).filter((e) => sol.supportingEvidence.includes(e));
  const irrelevant = (acc?.evidence ?? []).length - decisiveChosen.length - supporting.length;
  const evidencePts = culpritCorrect ? Math.max(0, Math.min(20, decisiveChosen.length * 5 + supporting.length * 2 - irrelevant * 2)) : 0;
  const hintsUsed = Object.values(s.hints).reduce((a, b) => a + b, 0);
  const mistakes =
    Object.values(s.questionMistakes).reduce((a, b) => a + b, 0) + Object.values(s.puzzleMistakes).reduce((a, b) => a + b, 0);
  const investigation = Math.max(0, 10 - hintsUsed - Math.floor(mistakes / 2));
  const culprit = culpritCorrect ? 50 : 0;
  const motive = culpritCorrect && motiveCorrect ? 20 : 0;
  const total = culprit + motive + evidencePts + investigation;
  let rank: ScoreBreakdown['rank'];
  if (!culpritCorrect)
    rank = {
      title: 'De moordenaar loopt nog vrij',
      award: 'geen',
      text: 'Je beschuldiging hield geen stand. De Golden Cock blijft deze keer in de vitrine.',
    };
  else if (total >= 90)
    rank = { title: 'Meesterspeurder van Parkzicht', award: 'goud', text: 'Messcherp. Zelfs de Brotherhood buigt het hoofd.' };
  else if (total >= 75)
    rank = { title: 'Hoofdinspecteur', award: 'zilver', text: 'Overtuigend opgelost, met een paar losse eindjes.' };
  else rank = { title: 'Rechercheur in opleiding', award: 'brons', text: 'De juiste dader, maar het dossier had steviger gekund.' };
  return { culpritCorrect, motiveCorrect, culprit, motive, evidence: evidencePts, decisiveChosen, investigation, hintsUsed, mistakes, total, rank };
}
