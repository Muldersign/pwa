import { useState } from 'react';
import { check } from '../../engine/engine';
import { usePlaying } from '../store';

const toMin = (t: string) => {
  const m = t.match(/(\d{2})\.(\d{2})/);
  if (!m) return 0;
  const h = Number(m[1]);
  // After midnight belongs to the same night.
  return (h < 12 ? h + 24 : h) * 60 + Number(m[2]);
};

export function TimelineTab() {
  const { sc, state } = usePlaying();
  const [era, setEra] = useState<'2026' | '2024'>('2026');
  const entries = sc.timeline.filter((t) => t.era === era && check(t.when, state, sc));
  // The night is sorted by clock time; the old case keeps its authored (chronological) order.
  const list = era === '2026' ? [...entries].sort((a, b) => toMin(a.time) - toMin(b.time)) : entries;
  const total = sc.timeline.filter((t) => t.era === era).length;
  return (
    <div className="anim-fade">
      <h1 className="font-display text-[26px] font-extrabold">
        <span className="gold-text">Tijdlijn</span>
      </h1>
      <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg bg-wood-2 p-1">
        {(['2026', '2024'] as const).map((e) => (
          <button key={e} onClick={() => setEra(e)} className={`rounded-md py-2 text-[14px] ${era === e ? 'bg-bordeaux text-parchment' : 'text-parchment/70'}`}>
            {e === '2026' ? 'De moordavond (24-10-2026)' : 'De oude zaak (2024–2026)'}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[13px] text-muted">
        {entries.length} van {total} gebeurtenissen gereconstrueerd. Doorgestreepte regels zijn aantoonbaar onjuist.
      </p>
      <ol className="relative mt-4 border-l-2 border-gold/40 pl-5">
        {list.map((t) => {
          const disputed = t.disputed && check(t.disputed, state, sc);
          return (
            <li key={t.id} className="anim-rise relative mb-4">
              <span className={`absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 ${disputed ? 'border-bordeaux-2 bg-ink' : 'border-gold bg-gold'}`} />
              <div className="font-type text-[13px] text-gold-2">
                {t.date && <span className="text-muted">{t.date} · </span>}
                {t.time !== '—' && t.time}
              </div>
              <div className={`text-[15px] ${disputed ? 'text-parchment/50 line-through decoration-bordeaux-2 decoration-2' : ''}`}>{t.text}</div>
              {disputed && <div className="text-[12px] font-semibold uppercase tracking-wider text-bordeaux-2">Weerlegd</div>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
