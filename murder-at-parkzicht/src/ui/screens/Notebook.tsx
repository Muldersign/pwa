import { Avatar } from '../components/Avatar';
import { KIND_ICON, SectionTitle } from '../components/ui';
import { useNav } from '../nav';
import { usePlaying } from '../store';
import { SUSPICION } from './Suspects';

export function NotebookTab() {
  const { sc, state, setTheory } = usePlaying();
  const { open } = useNav();
  const hints = Object.values(state.hints).reduce((a, b) => a + b, 0);
  const answered = sc.questions.filter((q) => state.questions[q.id] === q.answer);
  return (
    <div className="anim-fade">
      <h1 className="font-display text-[26px] font-extrabold">
        <span className="gold-text">Detectiveboek</span>
      </h1>
      <div className="mt-2 flex gap-4 font-type text-[12px] text-muted">
        <span>⏱ {Math.round(state.playMs / 60000)} min</span>
        <span>💡 {hints} hints</span>
        <span>🗂 {state.evidence.length} bewijsstukken</span>
      </div>

      <SectionTitle>Mijn theorie</SectionTitle>
      <textarea
        value={state.theory}
        onChange={(e) => setTheory(e.target.value)}
        rows={6}
        placeholder="Wie, waarom, hoe? Schrijf je reconstructie op…"
        className="paper w-full rounded-md p-3 text-[15px] outline-none focus:ring-2 focus:ring-gold"
        style={{ backgroundImage: 'repeating-linear-gradient(transparent 0 27px, rgba(122,31,43,.18) 27px 28px)', lineHeight: '28px' }}
      />

      <SectionTitle>Verdenkingen</SectionTitle>
      <div className="space-y-1.5">
        {sc.suspects.map((s) => {
          const v = state.suspicion[s.id] ?? 'onbekend';
          return (
            <button key={s.id} onClick={() => open({ type: 'suspect', id: s.id })} className="flex w-full items-center gap-3 rounded-md bg-wood-2/60 p-2 text-left">
              <Avatar spec={s.avatar} name={s.name} size={36} />
              <span className="flex-1 text-[15px]">{s.name}</span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] ${SUSPICION[v].cls}`}>{SUSPICION[v].label}</span>
            </button>
          );
        })}
      </div>

      <SectionTitle>Bewijs voor de beschuldiging (★)</SectionTitle>
      {state.pinned.length === 0 ? (
        <p className="text-[14px] italic text-muted">Nog niets gemarkeerd. Tik op ☆ bij een bewijsstuk.</p>
      ) : (
        <div className="space-y-1.5">
          {state.pinned.map((id) => {
            const e = sc.evidence.find((x) => x.id === id)!;
            return (
              <button key={id} onClick={() => open({ type: 'evidence', id })} className="paper flex w-full items-center gap-2 rounded p-2 text-left text-[14px]">
                <span>{KIND_ICON[e.kind]}</span>
                {e.title}
              </button>
            );
          })}
        </div>
      )}

      <SectionTitle>Bewaarde verklaringen</SectionTitle>
      {state.savedLines.length === 0 ? (
        <p className="text-[14px] italic text-muted">Tik tijdens een verhoor op "📌 Bewaar deze verklaring".</p>
      ) : (
        <div className="space-y-2">
          {state.savedLines.map((l) => {
            const s = sc.suspects.find((x) => x.id === l.suspect)!;
            const t = sc.dialogues[l.suspect].find((x) => x.id === l.topic)!;
            return (
              <div key={l.topic} className="rounded-md border border-gold/25 bg-wood-2/60 p-3 text-[14px]">
                <div className="font-display text-gold-2">{s.name}</div>
                <div className="text-parchment/70">{t.label}</div>
                <p className="mt-1">{t.lines.filter((x) => x.who === 'suspect').map((x) => x.text).join(' ')}</p>
              </div>
            );
          })}
        </div>
      )}

      <SectionTitle>Beantwoorde onderzoeksvragen</SectionTitle>
      {answered.length === 0 ? (
        <p className="text-[14px] italic text-muted">Nog geen vragen beantwoord.</p>
      ) : (
        <ol className="space-y-2">
          {answered.map((q) => (
            <li key={q.id} className="rounded-md bg-wood-2/60 p-3 text-[14px]">
              <div className="font-display text-gold-2">
                {sc.questions.indexOf(q) + 1}. {q.text}
              </div>
              <div className="mt-1">{q.options.find((o) => o.id === q.answer)!.text}</div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
