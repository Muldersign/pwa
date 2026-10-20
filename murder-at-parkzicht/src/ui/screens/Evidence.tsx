import { useEffect, useState } from 'react';
import { DocView, KIND_ICON, KIND_LABEL, Screen } from '../components/ui';
import { useNav } from '../nav';
import { usePlaying } from '../store';

export function EvidenceTab() {
  const { sc, state } = usePlaying();
  const { open } = useNav();
  const [kind, setKind] = useState<string>('alle');
  const [era, setEra] = useState<'alle' | '2024' | '2026'>('alle');
  const items = state.evidence
    .map((id) => sc.evidence.find((e) => e.id === id)!)
    .filter((e) => (kind === 'alle' || (kind === 'pinned' ? state.pinned.includes(e.id) : e.kind === kind)) && (era === 'alle' || e.era === era))
    .reverse();
  const kinds = Array.from(new Set(state.evidence.map((id) => sc.evidence.find((e) => e.id === id)!.kind)));
  const chip = (active: boolean) => `shrink-0 rounded-full border px-3 py-1 text-[13px] ${active ? 'border-gold bg-gold text-paper-ink' : 'border-gold/30 text-parchment/80'}`;
  return (
    <div className="anim-fade">
      <h1 className="font-display text-[26px] font-extrabold">
        <span className="gold-text">Bewijsarchief</span>
      </h1>
      <p className="mt-1 text-[14px] text-parchment/70">
        {state.evidence.length} stukken. Markeer met ★ wat je bij je beschuldiging wilt gebruiken.
      </p>
      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        <button className={chip(kind === 'alle')} onClick={() => setKind('alle')}>
          Alles
        </button>
        <button className={chip(kind === 'pinned')} onClick={() => setKind('pinned')}>
          ★ Gemarkeerd ({state.pinned.length})
        </button>
        {kinds.map((k) => (
          <button key={k} className={chip(kind === k)} onClick={() => setKind(k)}>
            {KIND_ICON[k]} {KIND_LABEL[k]}
          </button>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        {(['alle', '2024', '2026'] as const).map((e) => (
          <button key={e} className={chip(era === e)} onClick={() => setEra(e)}>
            {e === 'alle' ? 'Beide zaken' : e === '2024' ? 'De oude zaak' : 'De moordavond'}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {items.length === 0 && <p className="italic text-muted">Niets in deze selectie.</p>}
        {items.map((e) => {
          const unseen = !state.seenEvidence.includes(e.id);
          return (
            <button key={e.id} onClick={() => open({ type: 'evidence', id: e.id })} className="paper flex w-full items-start gap-3 rounded-md p-3 text-left">
              <span className="text-2xl">{KIND_ICON[e.kind]}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="font-display text-[15px] font-semibold leading-tight">{e.title}</span>
                  {unseen && <span className="rounded bg-bordeaux px-1.5 text-[10px] font-bold uppercase text-parchment">Nieuw</span>}
                </span>
                <span className="mt-0.5 block text-[13px] text-paper-ink/75">{e.summary}</span>
                <span className="mt-1 block font-type text-[10px] uppercase tracking-wider text-paper-ink/50">
                  {KIND_LABEL[e.kind]} · hoofdstuk {e.chapter} · {e.era === '2024' ? 'oude zaak' : 'moordavond'}
                </span>
              </span>
              {state.pinned.includes(e.id) && <span className="text-gold">★</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function EvidenceDetail({ id }: { id: string }) {
  const { sc, state, markSeen, togglePin } = usePlaying();
  const { close } = useNav();
  const e = sc.evidence.find((x) => x.id === id)!;
  useEffect(() => markSeen(id), [id]); // eslint-disable-line react-hooks/exhaustive-deps
  const pinned = state.pinned.includes(id);
  return (
    <Screen
      title={e.title}
      kicker={`${KIND_ICON[e.kind]} ${KIND_LABEL[e.kind]}`}
      onBack={close}
      right={
        <button onClick={() => togglePin(id)} className={`rounded-full px-3 py-1.5 text-xl ${pinned ? 'text-gold-2' : 'text-muted'}`} aria-label={pinned ? 'Markering verwijderen' : 'Markeren voor beschuldiging'}>
          {pinned ? '★' : '☆'}
        </button>
      }
    >
      <div className="paper anim-rise rounded-md p-4 text-[15.5px]">
        <p className="mb-3 text-[14px] italic text-paper-ink/70">{e.summary}</p>
        <DocView blocks={e.content} />
      </div>
      <button onClick={() => togglePin(id)} className="mt-4 w-full rounded-md border border-gold/30 py-2.5 text-[14px] text-gold-2">
        {pinned ? '★ Gemarkeerd voor je beschuldiging' : '☆ Markeer voor je beschuldiging'}
      </button>
    </Screen>
  );
}
