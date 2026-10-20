import { useState } from 'react';
import { canAccuse, chapterComplete, check, goalsFor } from '../../engine/engine';
import type { ChapterNo, Question } from '../../engine/types';
import { MiloAvatar } from '../components/Avatar';
import { Btn, Hints, KIND_ICON, SectionTitle, Stamp } from '../components/ui';
import { useNav } from '../nav';
import { usePlaying } from '../store';

export function ChapterIntro({ no }: { no: number }) {
  const { sc } = usePlaying();
  const { close } = useNav();
  const ch = sc.chapters.find((c) => c.no === no)!;
  const items = (ch.onStart.evidence ?? []).map((id) => sc.evidence.find((e) => e.id === id)!);
  return (
    <div className="desk anim-fade fixed inset-0 z-40 overflow-y-auto">
      <div className="safe-top mx-auto flex min-h-full max-w-md flex-col items-center px-5 pb-10 pt-8">
        {/* envelope */}
        <div className="relative mt-2 h-40 w-64" style={{ perspective: 600 }}>
          <div className="folder absolute inset-x-0 bottom-0 h-32 rounded-sm" />
          <div className="paper letter-out absolute inset-x-4 bottom-6 flex h-28 items-start justify-center rounded-sm pt-3">
            <span className="font-type text-xs uppercase tracking-[0.3em] text-bordeaux">{ch.subtitle}</span>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-20 rounded-b-sm bg-gradient-to-b from-[#b48c52] to-[#9c7642]" style={{ clipPath: 'polygon(0 0, 50% 55%, 100% 0, 100% 100%, 0 100%)' }} />
          <div className="envelope-flap absolute inset-x-0 top-8 h-20" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)', background: 'linear-gradient(#c9a46a,#a98048)' }} />
          <div className="absolute left-1/2 top-[86px] z-10 grid h-10 w-10 -translate-x-1/2 place-items-center rounded-full bg-bordeaux font-display text-gold-2 shadow-lg" style={{ animation: 'fade .3s 0s reverse both' }}>
            {no}
          </div>
        </div>
        <div className="anim-rise mt-8 text-center" style={{ animationDelay: '1.2s' }}>
          <div className="font-type text-xs uppercase tracking-[0.3em] text-muted">{ch.subtitle} van 4</div>
          <h1 className="mt-1 font-display text-3xl font-extrabold">
            <span className="gold-text">{ch.title}</span>
          </h1>
        </div>
        <div className="anim-rise mt-5 space-y-3 text-[16px] leading-relaxed text-parchment/90" style={{ animationDelay: '1.4s' }}>
          {ch.intro.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        {items.length > 0 && (
          <div className="anim-rise mt-6 w-full" style={{ animationDelay: '1.6s' }}>
            <div className="font-type text-xs uppercase tracking-widest text-gold">In deze envelop</div>
            <ul className="mt-2 grid grid-cols-1 gap-1.5">
              {items.map((e) => (
                <li key={e.id} className="flex items-center gap-2 rounded bg-wood-2/70 px-3 py-1.5 text-[14px]">
                  <span>{KIND_ICON[e.kind]}</span>
                  {e.title}
                </li>
              ))}
            </ul>
          </div>
        )}
        <Btn kind="gold" className="anim-rise mt-8 w-full" onClick={close}>
          Open het dossier
        </Btn>
      </div>
    </div>
  );
}

function QuestionCard({ q, index }: { q: Question; index: number }) {
  const { sc, state, answer } = usePlaying();
  const [pick, setPick] = useState<string | null>(null);
  const [wrong, setWrong] = useState(0);
  const [open, setOpen] = useState(false);
  const solved = state.questions[q.id] === q.answer;
  const available = check(q.when, state, sc);
  return (
    <div className={`paper relative rounded-md p-3 ${wrong ? 'anim-shake' : ''}`} key={wrong} data-q={q.id} data-state={solved ? 'solved' : available ? 'open' : 'locked'}>
      <button className="flex w-full items-start gap-3 text-left" onClick={() => setOpen(!open)}>
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-bordeaux font-display text-sm text-gold-2">{index}</span>
        <span className="flex-1 font-display text-[16px] font-semibold leading-snug">{q.text}</span>
        <span className="text-paper-ink/50">{open ? '▲' : '▼'}</span>
      </button>
      {solved && !open && <div className="absolute -top-1 right-8"><Stamp text="Opgelost" color="#3d6b2f" className="!text-[11px]" /></div>}
      {open && (
        <div className="mt-3">
          {solved ? (
            <div>
              <p className="rounded bg-ok/15 p-2 text-[15px]">✔ {q.options.find((o) => o.id === q.answer)!.text}</p>
              <p className="mt-2 text-[15px] italic text-paper-ink/80">{q.explanation}</p>
            </div>
          ) : !available ? (
            <p className="text-[15px] italic text-paper-ink/70">🔒 {q.locked}</p>
          ) : (
            <div className="space-y-2">
              {q.options.map((o) => (
                <label key={o.id} className={`flex cursor-pointer gap-2 rounded border p-2 text-[15px] ${pick === o.id ? 'border-bordeaux bg-bordeaux/10' : 'border-paper-ink/20'}`}>
                  <input type="radio" name={q.id} className="mt-1 accent-[#7a1f2b]" checked={pick === o.id} onChange={() => setPick(o.id)} />
                  <span>{o.text}</span>
                </label>
              ))}
              <div className="flex items-center gap-3 pt-1">
                <Btn
                  disabled={!pick}
                  onClick={() => {
                    if (!pick) return;
                    if (!answer(q.id, pick)) setWrong((w) => w + 1);
                  }}
                >
                  Beantwoord
                </Btn>
                {wrong > 0 && <span className="text-sm text-bordeaux">Dat klopt niet met het bewijs. Probeer opnieuw.</span>}
              </div>
              <div className="text-parchment">
                <Hints hintKey={`q:${q.id}`} hints={q.hints} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function InvestigationTab({ onQuit }: { onQuit: () => void }) {
  const { sc, state, advance } = usePlaying();
  const { open, setTab } = useNav();
  const ch = sc.chapters.find((c) => c.no === state.chapter)!;
  const goals = goalsFor(sc, state, state.chapter);
  const complete = chapterComplete(sc, state);
  const questions = sc.questions.filter((q) => q.chapter === state.chapter);
  const puzzles = sc.puzzles.filter((p) => p.chapter <= state.chapter && (p.chapter === state.chapter || !state.puzzles.includes(p.id)));
  const recent = [...state.evidence].reverse().slice(0, 4).map((id) => sc.evidence.find((e) => e.id === id)!);
  const qIndex = (id: string) => sc.questions.findIndex((q) => q.id === id) + 1;

  return (
    <div className="anim-fade">
      <div className="flex items-center justify-between">
        <button onClick={onQuit} className="font-type text-[11px] uppercase tracking-widest text-muted">
          ☰ Titelscherm
        </button>
        <div className="flex gap-1.5" aria-label={`Hoofdstuk ${state.chapter} van 4`}>
          {[1, 2, 3, 4].map((n) => (
            <span key={n} className={`h-2 w-6 rounded-full ${n < state.chapter ? 'bg-gold' : n === state.chapter ? 'bg-bordeaux-2' : 'bg-wood-3'}`} />
          ))}
        </div>
      </div>

      <div className="mt-4">
        <div className="font-type text-xs uppercase tracking-[0.3em] text-muted">{ch.subtitle}</div>
        <h1 className="font-display text-[28px] font-extrabold leading-tight">
          <span className="gold-text">{ch.title}</span>
        </h1>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-md border border-gold/25 bg-wood-2/70 p-3">
        <MiloAvatar size={48} />
        <div className="text-[14px]">
          <div className="font-display font-semibold">{sc.victim.name} ✝</div>
          <div className="text-parchment/75">Gevonden om 21.45 in de achterkamer. {sc.victim.age} jaar.</div>
        </div>
      </div>

      <SectionTitle>Onderzoeksdoelen</SectionTitle>
      <ul className="space-y-1.5">
        {goals.map((g) => (
          <li key={g.id} className={`flex items-start gap-2 text-[15px] ${g.complete ? 'text-parchment/60 line-through decoration-gold/50' : ''}`}>
            <span className={g.complete ? 'text-ok' : 'text-gold'}>{g.complete ? '☑' : '☐'}</span>
            {g.label}
          </li>
        ))}
      </ul>

      {complete && !(state.chapter === 4) && (
        <div className="paper anim-rise relative mt-5 overflow-hidden rounded-md p-4 text-center">
          <Stamp text="Hoofdstuk afgerond" color="#7a1f2b" />
          <p className="mt-3 text-[15px]">{ch.outro}</p>
          <Btn kind="primary" className="mt-4 w-full" onClick={() => advance()}>
            Open hoofdstuk {state.chapter + 1} ✉
          </Btn>
          <p className="mt-2 text-xs text-paper-ink/60">Je kunt ook eerst nog verder ondervragen; alles blijft beschikbaar.</p>
        </div>
      )}
      {state.chapter === 4 && canAccuse(sc, state) && (
        <div className="paper anim-rise mt-5 rounded-md p-4 text-center">
          <p className="text-[15px]">{ch.outro}</p>
          <Btn kind="primary" className="anim-glow mt-4 w-full" onClick={() => open({ type: 'accuse' })}>
            ⚖ De laatste beschuldiging
          </Btn>
          <p className="mt-2 text-xs text-paper-ink/60">Je kunt eerst nog verdachten ondervragen. De beschuldiging is definitief.</p>
        </div>
      )}

      <SectionTitle>Puzzels</SectionTitle>
      <div className="space-y-2">
        {puzzles.map((p) => {
          const solved = state.puzzles.includes(p.id);
          const ok = check(p.when, state, sc);
          const missing = (p.when.evidence ?? []).filter((e) => !state.evidence.includes(e)).map((e) => sc.evidence.find((x) => x.id === e)!.title);
          return (
            <button
              key={p.id}
              data-puzzle={p.id}
              data-state={solved ? 'solved' : ok ? 'open' : 'locked'}
              onClick={() => ok && open({ type: 'puzzle', id: p.id })}
              className={`folder flex w-full items-center gap-3 rounded-md p-3 text-left ${ok ? '' : 'opacity-70'}`}
            >
              <span className="text-2xl">{solved ? '✅' : ok ? '🧩' : '🔒'}</span>
              <span className="flex-1">
                <span className="block font-display font-semibold">{p.title}</span>
                <span className="block text-[13px] text-paper-ink/75">
                  {solved ? 'Opgelost — tik om terug te kijken' : ok ? 'Klaar om op te lossen' : missing.length ? `Nog nodig: ${missing.join(', ')}` : 'Nog niet beschikbaar'}
                </span>
              </span>
              {ok && <span className="text-paper-ink/60">›</span>}
            </button>
          );
        })}
      </div>

      {questions.length > 0 && (
        <>
          <SectionTitle>Onderzoeksvragen</SectionTitle>
          <div className="space-y-2">
            {questions.map((q) => (
              <QuestionCard key={q.id} q={q} index={qIndex(q.id)} />
            ))}
          </div>
        </>
      )}

      {state.chapter === 4 && (
        <>
          <SectionTitle>Eindvragen</SectionTitle>
          <div className="space-y-2">
            {['Wie heeft Milo Dubbelspel vermoord?', 'Waarom?', 'Welke bewijsstukken tonen dit aan?'].map((t, i) => (
              <div key={t} className="flex items-start gap-3 rounded-md border border-gold/25 bg-wood-2/60 p-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-bordeaux font-display text-sm text-gold-2">{10 + i}</span>
                <span className="font-display text-[16px] font-semibold">{t}</span>
              </div>
            ))}
            <p className="text-sm text-muted">Deze drie vragen beantwoord je in De Laatste Beschuldiging.</p>
          </div>
        </>
      )}

      <SectionTitle>Laatste ontdekkingen</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        {recent.map((e) => (
          <button key={e.id} onClick={() => open({ type: 'evidence', id: e.id })} className="paper rounded p-2.5 text-left">
            <div className="text-lg">{KIND_ICON[e.kind]}</div>
            <div className="mt-1 line-clamp-2 font-display text-[14px] font-semibold leading-tight">{e.title}</div>
          </button>
        ))}
      </div>
      <button onClick={() => setTab('bewijs')} className="mt-2 text-sm text-gold-2 underline underline-offset-4">
        Naar het bewijsarchief ({state.evidence.length})
      </button>

      {state.completedChapters.length > 0 && (
        <>
          <SectionTitle>Eerdere hoofdstukken</SectionTitle>
          <div className="space-y-2">
            {state.completedChapters.map((no) => {
              const c = sc.chapters.find((x) => x.no === no)!;
              return (
                <details key={no} className="rounded-md border border-gold/20 bg-wood-2/50 p-3">
                  <summary className="cursor-pointer font-display">
                    {c.subtitle}: {c.title}
                  </summary>
                  <div className="mt-2 space-y-2">
                    {sc.questions
                      .filter((q) => q.chapter === (no as ChapterNo))
                      .map((q) => (
                        <QuestionCard key={q.id} q={q} index={qIndex(q.id)} />
                      ))}
                  </div>
                </details>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
