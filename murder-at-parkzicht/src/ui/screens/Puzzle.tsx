import { useState } from 'react';
import type { AssignPuzzle, DiffPuzzle, HotspotPuzzle, OrderPuzzle, Puzzle } from '../../engine/types';
import { PhotoView } from '../components/PhotoView';
import { Btn, Hints, Screen, Stamp } from '../components/ui';
import { useNav } from '../nav';
import { usePlaying } from '../store';

export function PuzzleScreen({ id }: { id: string }) {
  const { sc, state } = usePlaying();
  const { close } = useNav();
  const p = sc.puzzles.find((x) => x.id === id)!;
  const solved = state.puzzles.includes(id);
  return (
    <Screen title={p.title} kicker={`Puzzel · hoofdstuk ${p.chapter}`} onBack={close}>
      <p className="text-[15px] text-parchment/85">{p.intro}</p>
      <div className="mt-4">
        {p.type === 'order' && <Order p={p} solved={solved} />}
        {p.type === 'hotspots' && <Spots p={p} solved={solved} />}
        {p.type === 'diff' && <Diff p={p} solved={solved} />}
        {p.type === 'assign' && <Assign p={p} solved={solved} />}
      </div>
      {solved ? <Solved p={p} /> : <Hints hintKey={`p:${p.id}`} hints={p.hints} />}
    </Screen>
  );
}

function Solved({ p }: { p: Puzzle }) {
  const { close } = useNav();
  return (
    <div className="paper anim-rise mt-5 rounded-md p-4 text-center">
      <Stamp text="Opgelost" color="#3d6b2f" />
      <p className="mt-3 text-[15px]">{p.success}</p>
      {p.onSolve.evidence?.length ? <p className="mt-2 text-[13px] text-paper-ink/70">Toegevoegd aan je bewijsarchief.</p> : null}
      <Btn kind="primary" className="mt-4 w-full" onClick={close}>
        Terug naar het onderzoek
      </Btn>
    </div>
  );
}

function useCheck(id: string) {
  const { solve, mistake } = usePlaying();
  const [fail, setFail] = useState(0);
  return {
    fail,
    submit: (ok: boolean) => {
      if (ok) solve(id);
      else {
        mistake(id);
        setFail((f) => f + 1);
      }
    },
  };
}

function FailMsg({ n, text = 'Nog niet helemaal. Kijk nog eens goed.' }: { n: number; text?: string }) {
  if (!n) return null;
  return (
    <p key={n} className="anim-shake mt-2 text-center text-[14px] text-bordeaux-2">
      {text}
    </p>
  );
}

// ---------- order ----------
function Order({ p, solved }: { p: OrderPuzzle; solved: boolean }) {
  const [items, setItems] = useState(() => (solved ? p.answer.map((id) => p.items.find((i) => i.id === id)!) : p.items));
  const [sel, setSel] = useState<number | null>(null);
  const { fail, submit } = useCheck(p.id);
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
    setSel(j);
  };
  return (
    <div>
      <ol className="space-y-2">
        {items.map((it, i) => (
          <li
            key={it.id}
            onClick={() => !solved && setSel(i)}
            className={`paper flex items-center gap-2 rounded-md p-2.5 text-[15px] transition ${sel === i ? 'ring-2 ring-gold' : ''}`}
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-bordeaux font-display text-sm text-gold-2">{i + 1}</span>
            <span className="flex-1">{it.text}</span>
            {!solved && (
              <span className="flex flex-col">
                <button aria-label="Omhoog" className="px-2 text-lg leading-none text-paper-ink/70 disabled:opacity-20" disabled={i === 0} onClick={(e) => { e.stopPropagation(); move(i, -1); }}>
                  ▲
                </button>
                <button aria-label="Omlaag" className="px-2 text-lg leading-none text-paper-ink/70 disabled:opacity-20" disabled={i === items.length - 1} onClick={(e) => { e.stopPropagation(); move(i, 1); }}>
                  ▼
                </button>
              </span>
            )}
          </li>
        ))}
      </ol>
      {!solved && (
        <>
          <Btn className="mt-4 w-full" onClick={() => submit(items.every((it, i) => it.id === p.answer[i]))}>
            Controleer volgorde
          </Btn>
          <FailMsg n={fail} text={`${items.filter((it, i) => it.id === p.answer[i]).length} van de ${items.length} staan goed.`} />
        </>
      )}
    </div>
  );
}

// ---------- hotspots ----------
function Spots({ p, solved }: { p: HotspotPuzzle; solved: boolean }) {
  const { sc, solve } = usePlaying();
  const scene = sc.photos.find((x) => x.id === p.scene)!;
  const [found, setFound] = useState<string[]>(solved ? p.required : []);
  const hit = found.filter((f) => p.required.includes(f));
  return (
    <div>
      <PhotoView
        scene={scene}
        found={found}
        onHotspot={(h) => {
          if (found.includes(h.id)) return;
          const next = [...found, h.id];
          setFound(next);
          if (p.required.every((r) => next.includes(r))) window.setTimeout(() => solve(p.id), 900);
        }}
      />
      <div className="mt-4 flex items-center justify-between rounded-md bg-wood-2/70 px-3 py-2 text-[14px]">
        <span>Aanwijzingen gevonden</span>
        <span className="font-type text-gold-2">
          {hit.length} / {p.required.length}
        </span>
      </div>
      {!solved && hit.length < found.length && <p className="mt-2 text-[13px] text-muted">Niet elk detail is een aanwijzing. Zoek wat het officiële verhaal tegenspreekt.</p>}
    </div>
  );
}

// ---------- diff ----------
function Diff({ p, solved }: { p: DiffPuzzle; solved: boolean }) {
  const [marked, setMarked] = useState<string[]>(solved ? p.rows.filter((r) => r.differs).map((r) => r.id) : []);
  const { fail, submit } = useCheck(p.id);
  const toggle = (id: string) => !solved && setMarked((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));
  const correct = p.rows.filter((r) => r.differs === marked.includes(r.id)).length;
  return (
    <div>
      <div className="grid grid-cols-2 gap-2 font-type text-[11px] uppercase tracking-wider">
        <div className="text-gold">{p.leftTitle}</div>
        <div className="text-bordeaux-2">{p.rightTitle}</div>
      </div>
      <div className="mt-2 space-y-2">
        {p.rows.map((r) => {
          const on = marked.includes(r.id);
          return (
            <button key={r.id} onClick={() => toggle(r.id)} className={`w-full rounded-md p-2 text-left transition ${on ? 'bg-bordeaux/40 ring-2 ring-bordeaux-2' : 'bg-wood-2/70'}`}>
              <div className="flex items-center justify-between font-type text-[11px] uppercase text-muted">
                {r.label}
                {on && <span className="text-gold-2">✎ afwijkend</span>}
              </div>
              <div className="mt-1 grid grid-cols-2 gap-2 text-[14px] leading-snug">
                <div className="paper rounded p-1.5">{r.left}</div>
                <div className={`paper rounded p-1.5 ${on ? 'underline decoration-bordeaux decoration-wavy' : ''}`}>{r.right}</div>
              </div>
            </button>
          );
        })}
      </div>
      {!solved && (
        <>
          <Btn className="mt-4 w-full" onClick={() => submit(correct === p.rows.length)}>
            Controleer markeringen ({marked.length})
          </Btn>
          <FailMsg n={fail} text={`${correct} van de ${p.rows.length} regels heb je goed beoordeeld.`} />
        </>
      )}
    </div>
  );
}

// ---------- assign ----------
function Assign({ p, solved }: { p: AssignPuzzle; solved: boolean }) {
  const initial = () => {
    const v: Record<string, string> = {};
    if (solved) for (const r of p.rows) for (const f of r.fields) v[`${r.id}.${f.id}`] = f.answer;
    return v;
  };
  const [vals, setVals] = useState<Record<string, string>>(initial);
  const { fail, submit } = useCheck(p.id);
  const all = p.rows.flatMap((r) => r.fields.map((f) => ({ key: `${r.id}.${f.id}`, f })));
  const filled = all.every((x) => vals[x.key]);
  const right = all.filter((x) => vals[x.key] === x.f.answer).length;
  const twoOptions = p.options.length === 2;
  return (
    <div>
      <div className="space-y-2">
        {p.rows.map((r) => (
          <div key={r.id} className="paper rounded-md p-3">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-lg font-bold text-bordeaux">{r.label}</span>
              {r.sub && <span className="text-[13px] text-paper-ink/70">{r.sub}</span>}
            </div>
            <div className={`mt-2 grid gap-2 ${r.fields.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {r.fields.map((f) => {
                const key = `${r.id}.${f.id}`;
                const opts = f.options ? p.options.filter((o) => f.options!.includes(o.id)) : p.options;
                return twoOptions ? (
                  <div key={key} className="grid grid-cols-2 gap-2">
                    {opts.map((o) => (
                      <button
                        key={o.id}
                        disabled={solved}
                        onClick={() => setVals((v) => ({ ...v, [key]: o.id }))}
                        className={`rounded border px-2 py-2 text-[14px] ${vals[key] === o.id ? 'border-bordeaux bg-bordeaux text-parchment' : 'border-paper-ink/25'}`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <label key={key} className="block">
                    <span className="font-type text-[11px] uppercase text-paper-ink/60">{f.label}</span>
                    <select
                      disabled={solved}
                      value={vals[key] ?? ''}
                      onChange={(e) => setVals((v) => ({ ...v, [key]: e.target.value }))}
                      className="mt-0.5 w-full rounded border border-paper-ink/30 bg-[#f7efdc] px-2 py-2 text-[14px] text-paper-ink"
                    >
                      <option value="">— kies —</option>
                      {opts.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {!solved && (
        <>
          <Btn className="mt-4 w-full" disabled={!filled} onClick={() => submit(right === all.length)}>
            Controleer
          </Btn>
          {!filled && <p className="mt-2 text-center text-[13px] text-muted">Vul alles in om te controleren.</p>}
          <FailMsg n={fail} text={`${right} van de ${all.length} keuzes kloppen.`} />
        </>
      )}
    </div>
  );
}
