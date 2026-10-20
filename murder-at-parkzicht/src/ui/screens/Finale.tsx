import { useEffect, useState } from 'react';
import { score } from '../../engine/engine';
import { Avatar } from '../components/Avatar';
import { Btn, KIND_ICON, Screen, SectionTitle, Stamp } from '../components/ui';
import { useNav } from '../nav';
import { useGame, usePlaying } from '../store';
import { GoldenCock } from './Start';

export function Accusation() {
  const { sc, state, accuse } = usePlaying();
  const { close } = useNav();
  const [step, setStep] = useState(0);
  const [suspect, setSuspect] = useState<string | null>(null);
  const [motive, setMotive] = useState<string | null>(null);
  const [ev, setEv] = useState<string[]>(() => state.pinned.filter((p) => state.evidence.includes(p)));
  const [confirm, setConfirm] = useState(false);
  const chosen = sc.suspects.find((s) => s.id === suspect);
  const evidence = state.evidence.map((id) => sc.evidence.find((e) => e.id === id)!);
  const steps = ['Wie?', 'Waarom?', 'Bewijs'];

  return (
    <Screen title="De laatste beschuldiging" kicker="Hoofdstuk 4 · finale" onBack={() => (step ? setStep(step - 1) : close())}>
      <div className="mb-4 grid grid-cols-3 gap-1">
        {steps.map((t, i) => (
          <div key={t} className={`rounded py-1 text-center font-type text-[12px] ${i === step ? 'bg-bordeaux text-parchment' : i < step ? 'bg-gold/70 text-paper-ink' : 'bg-wood-2 text-muted'}`}>
            {i + 1}. {t}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="anim-fade">
          <h2 className="font-display text-xl font-bold">Wie heeft Milo Dubbelspel vermoord?</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {sc.suspects.map((s) => (
              <button
                key={s.id}
                onClick={() => setSuspect(s.id)}
                className={`flex items-center gap-2 rounded-md p-2 text-left ${suspect === s.id ? 'bg-bordeaux ring-2 ring-gold' : 'bg-wood-2/80'}`}
              >
                <Avatar spec={s.avatar} name={s.name} size={40} />
                <span className="text-[14px] leading-tight">{s.name}</span>
              </button>
            ))}
          </div>
          <Btn className="mt-5 w-full" disabled={!suspect} onClick={() => setStep(1)}>
            Volgende: het motief
          </Btn>
        </div>
      )}

      {step === 1 && (
        <div className="anim-fade">
          <h2 className="font-display text-xl font-bold">Waarom deed {chosen?.name} het?</h2>
          <div className="mt-3 space-y-2">
            {sc.solution.motives.map((m) => (
              <label key={m.id} className={`flex cursor-pointer gap-2 rounded-md border p-3 text-[15px] ${motive === m.id ? 'border-gold bg-bordeaux/50' : 'border-gold/25 bg-wood-2/70'}`}>
                <input type="radio" name="motive" className="mt-1 accent-[#c9a24a]" checked={motive === m.id} onChange={() => setMotive(m.id)} />
                {m.text}
              </label>
            ))}
          </div>
          <Btn className="mt-5 w-full" disabled={!motive} onClick={() => setStep(2)}>
            Volgende: het bewijs
          </Btn>
        </div>
      )}

      {step === 2 && (
        <div className="anim-fade">
          <h2 className="font-display text-xl font-bold">Welke bewijsstukken tonen dit aan?</h2>
          <p className="text-[14px] text-parchment/70">Kies er minimaal twee. Kwaliteit telt meer dan kwantiteit.</p>
          <div className="mt-3 space-y-1.5">
            {evidence.map((e) => {
              const on = ev.includes(e.id);
              return (
                <button
                  key={e.id}
                  onClick={() => setEv((x) => (on ? x.filter((y) => y !== e.id) : [...x, e.id]))}
                  className={`flex w-full items-center gap-2 rounded-md p-2 text-left text-[14px] ${on ? 'bg-bordeaux ring-1 ring-gold' : 'bg-wood-2/70'}`}
                >
                  <span>{on ? '☑' : '☐'}</span>
                  <span>{KIND_ICON[e.kind]}</span>
                  <span className="flex-1">{e.title}</span>
                </button>
              );
            })}
          </div>
          <Btn kind="primary" className="sticky bottom-4 mt-5 w-full" disabled={ev.length < 2} onClick={() => setConfirm(true)}>
            ⚖ Beschuldig {chosen?.name} ({ev.length} bewijsstukken)
          </Btn>
        </div>
      )}

      {confirm && chosen && (
        <div className="anim-fade fixed inset-0 z-50 grid place-items-center bg-black/80 p-5">
          <div className="paper anim-rise w-full max-w-sm rounded-md p-5 text-center">
            <Avatar spec={chosen.avatar} name={chosen.name} size={72} />
            <h3 className="mt-3 font-display text-xl font-bold">Weet je het zeker?</h3>
            <p className="mt-2 text-[15px]">
              Je beschuldigt <strong>{chosen.name}</strong>. Je beschuldiging kan niet meer gewijzigd worden.
            </p>
            <div className="mt-5 flex gap-2">
              <Btn kind="ghost" className="flex-1 !text-paper-ink" onClick={() => setConfirm(false)}>
                Nog niet
              </Btn>
              <Btn kind="primary" className="flex-1" onClick={() => accuse(chosen.id, motive!, ev)}>
                Ja, beschuldig
              </Btn>
            </div>
          </div>
        </div>
      )}
    </Screen>
  );
}

export function Finale({ onQuit }: { onQuit: () => void }) {
  const { sc, state, reset } = usePlaying();
  const [phase, setPhase] = useState<'drama' | 'reveal' | 'story' | 'score'>('drama');
  useEffect(() => {
    if (phase !== 'drama') return;
    const t = window.setTimeout(() => setPhase('reveal'), 3200);
    return () => window.clearTimeout(t);
  }, [phase]);
  const acc = state.accusation!;
  const culprit = sc.suspects.find((s) => s.id === sc.solution.culprit)!;
  const accused = sc.suspects.find((s) => s.id === acc.suspect)!;
  const sb = score(sc, state);

  if (phase === 'drama')
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-black text-center">
        <div>
          <div className="anim-fade font-type text-sm uppercase tracking-[0.4em] text-muted">Je beschuldigt</div>
          <div className="anim-rise mt-3 font-display text-3xl font-bold text-parchment" style={{ animationDelay: '0.4s' }}>
            {accused.name}
          </div>
          <div className="anim-fade mt-10 font-type text-sm tracking-[0.3em] text-bordeaux-2" style={{ animationDelay: '1.4s' }}>
            DE DEUR VAN DE ACHTERKAMER GAAT OPEN…
          </div>
          <button className="anim-fade mt-10 text-xs text-muted underline" style={{ animationDelay: '2s' }} onClick={() => setPhase('reveal')}>
            overslaan
          </button>
        </div>
      </div>
    );

  return (
    <div className="desk anim-fade fixed inset-0 z-50 overflow-y-auto">
      <div className="safe-top mx-auto max-w-xl px-4 pb-16 pt-6">
        {phase === 'reveal' && (
          <div className="text-center">
            <div className="font-type text-xs uppercase tracking-[0.4em] text-muted">De moordenaar is</div>
            <div className="anim-reveal mx-auto mt-5 w-fit">
              <div className="rounded-full p-1 shadow-[0_0_60px_rgba(163,48,68,0.7)]">
                <Avatar spec={culprit.avatar} name={culprit.name} size={150} />
              </div>
            </div>
            <h1 className="anim-rise mt-5 font-display text-4xl font-extrabold" style={{ animationDelay: '0.8s' }}>
              <span className="gold-text">{culprit.name}</span>
            </h1>
            <div className="anim-fade mt-2" style={{ animationDelay: '1.2s' }}>
              <Stamp text={sb.culpritCorrect ? 'Opgelost' : 'Onjuist beschuldigd'} color={sb.culpritCorrect ? '#3d6b2f' : '#a33044'} className="!text-lg" />
            </div>
            <p className="anim-fade mx-auto mt-5 max-w-md text-[15px] text-parchment/85" style={{ animationDelay: '1.5s' }}>
              {sb.culpritCorrect
                ? `Je had gelijk. ${sb.motiveCorrect ? 'Ook het motief klopt.' : 'Het motief zat er wel naast.'}`
                : `Jij beschuldigde ${accused.name}. Die had iets te verbergen, maar is niet de moordenaar.`}
            </p>
            <div className="paper anim-rise mx-auto mt-6 max-w-md rounded-md p-4 text-left text-[15px] italic" style={{ animationDelay: '1.9s' }}>
              {sc.solution.confession.map((c, i) => (
                <p key={i} className={i ? 'mt-2' : ''}>
                  "{c}"
                </p>
              ))}
              <div className="mt-2 text-right font-type text-xs not-italic text-paper-ink/70">— {culprit.name}, verhoorkamer, 23.58 uur</div>
            </div>
            <Btn kind="gold" className="anim-fade mt-6 w-full" onClick={() => setPhase('story')}>
              Lees de volledige reconstructie
            </Btn>
          </div>
        )}

        {phase === 'story' && (
          <div className="anim-fade">
            <div className="font-type text-xs uppercase tracking-[0.3em] text-muted">Dossier gesloten</div>
            <h1 className="font-display text-3xl font-extrabold">
              <span className="gold-text">De volledige reconstructie</span>
            </h1>
            {sc.solution.reconstruction.map((sec) => (
              <section key={sec.title} className="paper mt-4 rounded-md p-4">
                <h2 className="font-display text-lg font-bold text-bordeaux">{sec.title}</h2>
                {sec.paragraphs.map((p, i) => (
                  <p key={i} className="mt-2 text-[15px] leading-relaxed">
                    {p}
                  </p>
                ))}
              </section>
            ))}
            <Btn kind="gold" className="mt-6 w-full" onClick={() => setPhase('score')}>
              Naar je beoordeling
            </Btn>
          </div>
        )}

        {phase === 'score' && (
          <div className="anim-fade text-center">
            <div className="font-type text-xs uppercase tracking-[0.3em] text-muted">Detectivebeoordeling</div>
            <h1 className="mt-1 font-display text-3xl font-extrabold">
              <span className="gold-text">{sb.rank.title}</span>
            </h1>
            <Award award={sb.rank.award} total={sb.total} />
            <p className="mx-auto mt-3 max-w-sm text-[15px] text-parchment/85">{sb.rank.text}</p>
            <div className="paper mx-auto mt-6 max-w-md rounded-md p-4 text-left text-[15px]">
              <Row label={`Dader (${accused.name})`} v={sb.culprit} max={50} />
              <Row label="Motief" v={sb.motive} max={20} />
              <Row label={`Bewijs (${sb.decisiveChosen.length} doorslaggevend)`} v={sb.evidence} max={20} />
              <Row label={`Onderzoek (${sb.hintsUsed} hints, ${sb.mistakes} fouten)`} v={sb.investigation} max={10} />
              <div className="mt-2 flex justify-between border-t-2 border-paper-ink/40 pt-2 font-display text-lg font-bold">
                <span>Totaal</span>
                <span>{sb.total} / 100</span>
              </div>
              <div className="mt-2 text-[13px] text-paper-ink/70">Speeltijd: {Math.max(1, Math.round(state.playMs / 60000))} minuten</div>
            </div>
            <SectionTitle>Doorslaggevend bewijs in deze zaak</SectionTitle>
            <ul className="mx-auto max-w-md space-y-1 text-left text-[14px]">
              {sc.solution.decisiveEvidence.map((id) => {
                const e = sc.evidence.find((x) => x.id === id)!;
                const used = acc.evidence.includes(id);
                return (
                  <li key={id} className={`rounded px-2 py-1 ${used ? 'bg-ok/25' : 'bg-wood-2/60 text-parchment/70'}`}>
                    {used ? '✔' : '·'} {e.title}
                  </li>
                );
              })}
            </ul>
            <div className="mx-auto mt-8 flex max-w-md flex-col gap-2">
              <Btn kind="ghost" onClick={() => setPhase('story')}>
                Terug naar de reconstructie
              </Btn>
              <Btn
                kind="primary"
                onClick={() => {
                  reset();
                  onQuit();
                }}
              >
                Opnieuw spelen
              </Btn>
              <RestartToTitle onQuit={onQuit} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RestartToTitle({ onQuit }: { onQuit: () => void }) {
  const { state } = useGame();
  return state ? (
    <button className="mt-2 text-sm text-muted underline" onClick={onQuit}>
      Naar het titelscherm
    </button>
  ) : null;
}

function Row({ label, v, max }: { label: string; v: number; max: number }) {
  return (
    <div className="flex justify-between py-1">
      <span>{label}</span>
      <span className="font-type">
        {v} / {max}
      </span>
    </div>
  );
}

function Award({ award, total }: { award: 'goud' | 'zilver' | 'brons' | 'geen'; total: number }) {
  const ring = { goud: '#e8c97a', zilver: '#cfd3d8', brons: '#c08a5a', geen: '#5a4a3a' }[award];
  return (
    <div className="anim-reveal mx-auto mt-5 w-fit">
      <div className="relative grid h-56 w-56 place-items-center rounded-full" style={{ background: `radial-gradient(circle, #2a1d15 55%, ${ring} 56%, ${ring} 60%, #140e0b 61%)` }}>
        <div className={award === 'geen' ? 'opacity-30 grayscale' : ''}>
          <GoldenCock size={58} />
        </div>
        <div className="absolute bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-bordeaux px-2 py-0.5 font-type text-[11px] uppercase tracking-widest text-gold-2">
          {award === 'geen' ? 'Geen award' : `Golden Cock Award · ${award}`}
        </div>
        <div className="absolute top-6 font-display text-2xl font-bold text-gold-2">{total}</div>
      </div>
    </div>
  );
}
