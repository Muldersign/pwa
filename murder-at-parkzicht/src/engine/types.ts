// Generic data model for a detective case. A case (scenario) is pure data;
// the engine only interprets it, so other murder cases can be added later
// by writing a new folder under src/scenario/.

export type ChapterNo = 1 | 2 | 3 | 4;

/** All listed requirements must hold. An empty condition is always true. */
export interface Cond {
  chapter?: number;
  evidence?: string[];
  flags?: string[];
  topics?: string[];
  puzzles?: string[];
  questions?: string[];
  /** At least one of these evidence ids. */
  anyEvidence?: string[];
}

export interface Effects {
  evidence?: string[];
  flags?: string[];
}

// ---------- Suspects ----------

export interface CondText {
  when?: Cond;
  text: string;
}

export interface AvatarSpec {
  skin: string;
  hair: string;
  hairStyle: 'short' | 'long' | 'bun' | 'curly' | 'bald' | 'bob' | 'ponytail' | 'spiky' | 'wavy';
  accent: string;
  accessory?: 'glasses' | 'beard' | 'camera' | 'earrings' | 'bowtie' | 'cap' | 'scarf' | 'headphones' | 'pen' | 'moustache';
}

export interface Suspect {
  id: string;
  name: string;
  epithet: string;
  age: number;
  occupation: string;
  bio: string;
  personality: string;
  avatar: AvatarSpec;
  /** Latest matching entry is shown. */
  statement: CondText[];
  motive: CondText[];
  alibi: CondText[];
  secrets: { id: string; text: string; when: Cond }[];
}

// ---------- Dialogue ----------

export interface Line {
  who: 'suspect' | 'detective' | 'note';
  text: string;
}

export interface Topic {
  id: string;
  label: string;
  /** Shown as a confrontation ("Confronteer met bewijs: …"). */
  confront?: boolean;
  /** Topic becomes visible once this holds. Chapter defaults to 1. */
  when: Cond;
  lines: Line[];
  effects?: Effects;
  /** Category for grouping in the interview screen. */
  subject?: string;
}

// ---------- Evidence ----------

export type EvidenceKind =
  | 'rapport'
  | 'document'
  | 'foto'
  | 'bank'
  | 'brief'
  | 'verklaring'
  | 'fysiek'
  | 'digitaal'
  | 'kaart';

export type DocBlock =
  | { kind: 'p'; text: string }
  | { kind: 'h'; text: string }
  | { kind: 'fields'; rows: [string, string][] }
  | { kind: 'table'; head: string[]; rows: string[][]; foot?: string[] }
  | { kind: 'note'; text: string }
  | { kind: 'quote'; text: string; by?: string }
  | { kind: 'photo'; scene: string }
  | { kind: 'map' }
  | { kind: 'stamp'; text: string };

export interface Evidence {
  id: string;
  title: string;
  kind: EvidenceKind;
  chapter: ChapterNo;
  summary: string;
  content: DocBlock[];
  /** Era of the evidence for sorting/labels. */
  era: '2024' | '2026';
}

// ---------- Photos (data-driven SVG scenes) ----------

export interface PhotoFigure {
  label: string;
  x: number; // 0..400 svg units (centre of the figure)
  scale?: number;
  /** Drawn behind the bar/objects (e.g. bar staff). */
  behind?: boolean;
  wet?: boolean;
  shirt: string;
  skin?: string;
  hair?: string;
  pose?: 'stand' | 'sing' | 'arms-up' | 'sit' | 'point' | 'hold';
  /** 0, 1 or 2 visible cufflinks; undefined = no cuffs shown. */
  cufflinks?: 0 | 1 | 2;
  tshirt?: boolean;
  blur?: boolean;
  prop?: 'mic' | 'glass' | 'cue' | 'phone' | 'camera' | 'envelope' | 'key' | 'none';
}

export interface PhotoObject {
  kind: 'bar' | 'trophy' | 'clock' | 'door' | 'coat-hooks' | 'stage' | 'table' | 'pool' | 'stain' | 'confetti' | 'speaker' | 'lamp' | 'window' | 'sign';
  x: number;
  y?: number;
  w?: number;
  h?: number;
  label?: string;
  value?: string;
}

export interface Hotspot {
  id: string;
  x?: number; // 0..400 svg units
  y?: number; // 0..260 svg units
  r?: number;
  /** Position relative to a figure (index into figures) instead of x/y. */
  anchor?: { figure: number; part: 'wristL' | 'wristR' | 'head' | 'chest' | 'hand' };
  label: string;
  detail: string;
}

export interface PhotoScene {
  id: string;
  caption: string;
  stamp: string;
  palette: 'warm' | 'cold' | 'sepia' | 'flash';
  damaged?: boolean;
  figures: PhotoFigure[];
  objects: PhotoObject[];
  hotspots: Hotspot[];
}

// ---------- Puzzles ----------

interface PuzzleBase {
  id: string;
  chapter: ChapterNo;
  title: string;
  intro: string;
  when: Cond;
  onSolve: Effects;
  success: string;
  hints: [string, string, string];
}

export interface OrderPuzzle extends PuzzleBase {
  type: 'order';
  items: { id: string; text: string }[];
  /** Correct order of item ids. */
  answer: string[];
}

export interface HotspotPuzzle extends PuzzleBase {
  type: 'hotspots';
  scene: string;
  required: string[];
}

export interface DiffPuzzle extends PuzzleBase {
  type: 'diff';
  leftTitle: string;
  rightTitle: string;
  rows: { id: string; label: string; left: string; right: string; differs: boolean }[];
}

export interface AssignPuzzle extends PuzzleBase {
  type: 'assign';
  options: { id: string; label: string }[];
  rows: { id: string; label: string; sub?: string; fields: { id: string; label: string; answer: string; options?: string[] }[] }[];
}

export type Puzzle = OrderPuzzle | HotspotPuzzle | DiffPuzzle | AssignPuzzle;

// ---------- Questions ----------

export interface Question {
  id: string;
  chapter: ChapterNo;
  text: string;
  when: Cond;
  locked: string;
  options: { id: string; text: string }[];
  answer: string;
  explanation: string;
  hints: [string, string, string];
}

// ---------- Chapters & timeline ----------

export interface Goal {
  id: string;
  label: string;
  done: Cond;
}

export interface Chapter {
  no: ChapterNo;
  title: string;
  subtitle: string;
  intro: string[];
  onStart: Effects;
  goals: Goal[];
  outro: string;
}

export interface TimelineEntry {
  id: string;
  era: '2024' | '2026';
  time: string;
  date?: string;
  text: string;
  when: Cond;
  /** True when the entry is a claim that was later shown to be false. */
  disputed?: Cond;
}

// ---------- Solution ----------

export interface Solution {
  culprit: string;
  motives: { id: string; text: string }[];
  motive: string;
  decisiveEvidence: string[];
  supportingEvidence: string[];
  reconstruction: { title: string; paragraphs: string[] }[];
  confession: string[];
}

export interface Scenario {
  id: string;
  title: string;
  subtitle: string;
  victim: { name: string; age: number; bio: string };
  suspects: Suspect[];
  dialogues: Record<string, Topic[]>;
  evidence: Evidence[];
  photos: PhotoScene[];
  puzzles: Puzzle[];
  questions: Question[];
  chapters: Chapter[];
  timeline: TimelineEntry[];
  solution: Solution;
}

// ---------- Save state ----------

export type Suspicion = 'onbekend' | 'sterk' | 'mogelijk' | 'uitgesloten';

export interface Accusation {
  suspect: string;
  motive: string;
  evidence: string[];
  at: number;
}

export interface GameState {
  version: 1;
  scenario: string;
  started: boolean;
  chapter: ChapterNo;
  evidence: string[];
  seenEvidence: string[];
  flags: string[];
  topics: string[];
  puzzles: string[];
  puzzleMistakes: Record<string, number>;
  questions: Record<string, string>;
  questionMistakes: Record<string, number>;
  hints: Record<string, number>;
  suspicion: Record<string, Suspicion>;
  notes: Record<string, string>;
  theory: string;
  savedLines: { suspect: string; topic: string }[];
  pinned: string[];
  completedChapters: number[];
  accusation?: Accusation;
  playMs: number;
  createdAt: number;
}
