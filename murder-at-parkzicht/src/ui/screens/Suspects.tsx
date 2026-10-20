import { useEffect, useRef, useState } from 'react';
import { check, latest, unseenTopicCount, visibleTopics } from '../../engine/engine';
import type { Suspicion, Topic } from '../../engine/types';
import { Avatar } from '../components/Avatar';
import { Btn, Screen, SectionTitle, Stamp } from '../components/ui';
import { useNav } from '../nav';
import { usePlaying } from '../store';

export const SUSPICION: Record<Suspicion, { label: string; cls: string }> = {
  onbekend: { label: 'Onbekend', cls: 'bg-wood-3 text-parchment/80' },
  sterk: { label: 'Sterk verdacht', cls: 'bg-bordeaux-2 text-parchment' },
  mogelijk: { label: 'Mogelijk verdacht', cls: 'bg-gold text-paper-ink' },
  uitgesloten: { label: 'Voorlopig uitgesloten', cls: 'bg-[#3f5a4a] text-parchment' },
};

export function SuspectsTab() {
  const { sc, state } = usePlaying();
  const { open } = useNav();
  return (
    <div className="anim-fade">
      <h1 className="font-display text-[26px] font-extrabold">
        <span className="gold-text">Verdachten</span>
      </h1>
      <p className="mt-1 text-[14px] text-parchment/70">Tien mensen, tien geheimen. Je verdenking wijzig je in hun dossier; het spel verklapt niet of je gelijk hebt.</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {sc.suspects.map((s) => {
          const fresh = unseenTopicCount(sc, s.id, state);
          const sus = SUSPICION[state.suspicion[s.id] ?? 'onbekend'];
          return (
            <button key={s.id} onClick={() => open({ type: 'suspect', id: s.id })} className="paper relative flex flex-col items-center rounded-md px-2 pb-3 pt-4 text-center">
              {fresh > 0 && <span className="absolute right-2 top-2 rounded-full bg-bordeaux px-1.5 text-[11px] font-bold text-parchment">{fresh} nieuw</span>}
              <Avatar spec={s.avatar} name={s.name} size={64} />
              <div className="mt-2 font-display text-[15px] font-semibold leading-tight">{s.name}</div>
              <div className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-paper-ink/70">{s.epithet}</div>
              <span className={`mt-2 rounded-full px-2 py-0.5 text-[11px] ${sus.cls}`}>{sus.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SuspectDossier({ id }: { id: string }) {
  const { sc, state, setSuspicion, setNote } = usePlaying();
  const { close, open } = useNav();
  const s = sc.suspects.find((x) => x.id === id)!;
  const secrets = s.secrets.filter((x) => check(x.when, state, sc));
  const saved = state.savedLines.filter((l) => l.suspect === id);
  const fresh = unseenTopicCount(sc, id, state);
  return (
    <Screen title={s.name} kicker="Persoonlijk dossier" onBack={close}>
      <div className="paper rounded-md p-4">
        <div className="flex gap-4">
          <Avatar spec={s.avatar} name={s.name} size={88} />
          <div className="min-w-0">
            <div className="font-display text-xl font-bold leading-tight">{s.name}</div>
            <div className="text-[14px] italic text-paper-ink/75">{s.epithet}</div>
            <div className="mt-1 text-[13px] text-paper-ink/70">
              {s.age} jaar · {s.occupation}
            </div>
          </div>
        </div>
        <p className="mt-3 text-[15px]">{s.bio}</p>
        <p className="mt-2 text-[14px] text-paper-ink/75">
          <span className="font-type text-[11px] uppercase">Karakter: </span>
          {s.personality}
        </p>
      </div>

      <Btn kind="primary" className="mt-4 w-full" onClick={() => open({ type: 'interview', id })}>
        🗣️ Ondervragen {fresh > 0 && <span className="ml-1 rounded-full bg-gold px-2 text-xs text-paper-ink">{fresh} nieuw</span>}
      </Btn>

      <SectionTitle>Status (jouw verdenking)</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(SUSPICION) as Suspicion[]).map((k) => (
          <button
            key={k}
            onClick={() => setSuspicion(id, k)}
            className={`rounded-md border px-2 py-2 text-[13px] ${state.suspicion[id] === k ? `${SUSPICION[k].cls} border-gold` : 'border-gold/25 text-parchment/80'}`}
          >
            {SUSPICION[k].label}
          </button>
        ))}
      </div>

      <div className="paper mt-5 space-y-3 rounded-md p-4 text-[15px]">
        <Field label="Bekende verklaring" value={latest(s.statement, state, sc)} />
        <Field label="Mogelijk motief" value={latest(s.motive, state, sc)} />
        <Field label="Alibi (21.31–21.42)" value={latest(s.alibi, state, sc)} />
        <div>
          <div className="font-type text-[11px] uppercase tracking-wider text-bordeaux">Ontdekte geheimen</div>
          {secrets.length ? (
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {secrets.map((x) => (
                <li key={x.id}>{x.text}</li>
              ))}
            </ul>
          ) : (
            <p className="italic text-paper-ink/60">Nog niets ontdekt.</p>
          )}
        </div>
      </div>

      {saved.length > 0 && (
        <>
          <SectionTitle>Bewaarde verklaringen</SectionTitle>
          <div className="space-y-2">
            {saved.map((l) => {
              const t = sc.dialogues[id].find((x) => x.id === l.topic)!;
              return (
                <div key={l.topic} className="rounded-md border border-gold/25 bg-wood-2/60 p-3 text-[14px]">
                  <div className="text-gold-2">{t.label}</div>
                  <p className="mt-1 text-parchment/85">{t.lines.filter((x) => x.who === 'suspect').map((x) => x.text).join(' ')}</p>
                </div>
              );
            })}
          </div>
        </>
      )}

      <SectionTitle>Persoonlijke notities</SectionTitle>
      <textarea
        value={state.notes[id] ?? ''}
        onChange={(e) => setNote(id, e.target.value)}
        placeholder="Wat valt je op aan deze verdachte?"
        rows={5}
        className="paper w-full rounded-md p-3 text-[15px] outline-none focus:ring-2 focus:ring-gold"
      />
    </Screen>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="font-type text-[11px] uppercase tracking-wider text-bordeaux">{label}</div>
      <p className={value && !/^Nog /.test(value) ? '' : 'italic text-paper-ink/60'}>{value ?? 'Onbekend'}</p>
    </div>
  );
}

export function Interview({ id }: { id: string }) {
  const { sc, state, ask, toggleSavedLine } = usePlaying();
  const { close } = useNav();
  const s = sc.suspects.find((x) => x.id === id)!;
  const [current, setCurrent] = useState<Topic | null>(null);
  const [round, setRound] = useState(0);
  const topRef = useRef<HTMLDivElement>(null);
  const topics = visibleTopics(sc, id, state);
  const fresh = topics.filter((t) => !state.topics.includes(t.id));
  const asked = topics.filter((t) => state.topics.includes(t.id));

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [round]);

  const pick = (t: Topic) => {
    ask(t);
    setCurrent(t);
    setRound((r) => r + 1);
  };
  const isSaved = current ? state.savedLines.some((l) => l.topic === current.id) : false;

  return (
    <Screen title={s.name} kicker="Verhoor" onBack={close}>
      <div ref={topRef} />
      <div className="flex items-center gap-3">
        <div key={`${round}-${current?.confront}`} className={current?.confront ? 'anim-shake' : ''}>
          <Avatar spec={s.avatar} name={s.name} size={72} />
        </div>
        <div className="text-[14px] text-parchment/75">{current ? (current.confront ? 'Je legt het bewijs op tafel.' : 'Je stelt je vraag.') : s.personality}</div>
      </div>

      {current && (
        <div key={round} className="mt-4 space-y-2">
          <div className="anim-rise ml-auto max-w-[85%] rounded-lg rounded-br-none bg-bordeaux px-3 py-2 text-[15px] text-parchment">
            {current.confront && <div className="font-type text-[11px] uppercase tracking-wider text-gold-2">⚖ Confrontatie</div>}
            {current.label}
          </div>
          {current.confront && (
            <div className="text-center">
              <Stamp text="Geconfronteerd" />
            </div>
          )}
          {current.lines.map((l, i) => (
            <div
              key={i}
              className={`anim-rise text-[15.5px] leading-relaxed ${
                l.who === 'suspect'
                  ? 'paper mr-auto max-w-[92%] rounded-lg rounded-bl-none px-3 py-2'
                  : l.who === 'detective'
                    ? 'ml-auto max-w-[85%] rounded-lg rounded-br-none bg-bordeaux/80 px-3 py-2'
                    : 'px-2 text-center text-[14px] italic text-muted'
              }`}
              style={{ animationDelay: `${0.15 + i * 0.35}s` }}
            >
              {l.text}
            </div>
          ))}
          <div className="anim-fade flex justify-end" style={{ animationDelay: `${0.3 + current.lines.length * 0.35}s` }}>
            <button onClick={() => toggleSavedLine(id, current.id)} className="text-[13px] text-gold-2 underline underline-offset-4">
              {isSaved ? '📌 Bewaard in je detectiveboek' : '📌 Bewaar deze verklaring'}
            </button>
          </div>
        </div>
      )}

      <SectionTitle>{current ? 'Volgende vraag' : 'Wat wil je vragen?'}</SectionTitle>
      <div className="space-y-2">
        {fresh.length === 0 && <p className="text-[14px] italic text-muted">Je hebt op dit moment alles gevraagd. Nieuw bewijs kan nieuwe vragen opleveren.</p>}
        {fresh.map((t) => (
          <TopicButton key={t.id} t={t} onClick={() => pick(t)} isNew />
        ))}
      </div>
      {asked.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer font-type text-xs uppercase tracking-[0.2em] text-gold">Eerder gevraagd ({asked.length})</summary>
          <div className="mt-2 space-y-2">
            {asked.map((t) => (
              <TopicButton key={t.id} t={t} onClick={() => pick(t)} />
            ))}
          </div>
        </details>
      )}
      <Btn kind="ghost" className="mt-6 w-full" onClick={close}>
        Verhoor beëindigen
      </Btn>
    </Screen>
  );
}

function TopicButton({ t, onClick, isNew }: { t: Topic; onClick: () => void; isNew?: boolean }) {
  return (
    <button
      onClick={onClick}
      data-testid={isNew ? 'topic-new' : 'topic-old'}
      className={`flex w-full items-start gap-2 rounded-md border px-3 py-2.5 text-left text-[15px] ${
        t.confront ? 'border-bordeaux-2 bg-bordeaux/30' : 'border-gold/30 bg-wood-2/70'
      } ${isNew ? '' : 'opacity-70'}`}
    >
      <span>{t.confront ? '⚖' : '›'}</span>
      <span className="flex-1">{t.label}</span>
      {isNew && <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-gold" />}
    </button>
  );
}
