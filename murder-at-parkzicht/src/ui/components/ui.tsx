import { useState, type ReactNode } from 'react';
import type { DocBlock } from '../../engine/types';
import { useGame } from '../store';
import { MapView } from './MapView';
import { PhotoView } from './PhotoView';

export function Screen({ title, kicker, onBack, children, right }: { title: string; kicker?: string; onBack: () => void; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="desk anim-fade fixed inset-0 z-30 flex flex-col">
      <header className="safe-top sticky top-0 z-10 border-b border-gold/25 bg-ink/85 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center gap-2 px-3 py-2.5">
          <button onClick={onBack} className="-ml-1 rounded-full px-3 py-1.5 text-lg text-gold-2 active:bg-wood-3" aria-label="Terug">
            ←
          </button>
          <div className="min-w-0 flex-1">
            {kicker && <div className="font-type text-[11px] uppercase tracking-widest text-muted">{kicker}</div>}
            <h1 className="truncate font-display text-lg leading-tight text-parchment">{title}</h1>
          </div>
          {right}
        </div>
      </header>
      <main className="flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto max-w-xl px-4 pb-16 pt-4">{children}</div>
      </main>
    </div>
  );
}

export function Btn({ children, onClick, kind = 'primary', disabled, className = '' }: { children: ReactNode; onClick?: () => void; kind?: 'primary' | 'ghost' | 'gold'; disabled?: boolean; className?: string }) {
  const styles = {
    primary: 'bg-bordeaux text-parchment border-bordeaux-2 shadow-[0_3px_0_#4a121a]',
    gold: 'bg-gold text-paper-ink border-gold-2 shadow-[0_3px_0_#7a5a20]',
    ghost: 'bg-transparent text-parchment border-gold/40',
  }[kind];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border px-4 py-3 font-display text-[15px] font-semibold tracking-wide transition active:translate-y-0.5 active:shadow-none disabled:opacity-40 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

export function Stamp({ text, color = '#a33044', className = '' }: { text: string; color?: string; className?: string }) {
  return (
    <span
      className={`anim-stamp inline-block rounded-sm border-[3px] px-2 py-0.5 font-type text-sm uppercase tracking-[0.2em] ${className}`}
      style={{ color, borderColor: color, transform: 'rotate(-9deg)', mixBlendMode: 'multiply' }}
    >
      {text}
    </span>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-2 mt-6 font-type text-xs uppercase tracking-[0.2em] text-gold">{children}</h2>;
}

/** Three-level hint box. Each level is revealed on request and costs score. */
export function Hints({ hintKey, hints }: { hintKey: string; hints: [string, string, string] }) {
  const { state, hint } = useGame();
  const used = state?.hints[hintKey] ?? 0;
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4 rounded-md border border-gold/30 bg-wood-2/60 p-3">
      <button className="flex w-full items-center justify-between text-left text-sm text-gold-2" onClick={() => setOpen(!open)}>
        <span>💡 Hints {used > 0 && <span className="text-muted">({used}/3 gebruikt)</span>}</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="mt-2 space-y-2 text-[15px]">
          {hints.slice(0, used).map((h, i) => (
            <p key={i} className="anim-rise rounded bg-ink/40 p-2">
              <span className="font-type text-xs text-gold">Hint {i + 1}: </span>
              {h}
            </p>
          ))}
          {used < 3 && (
            <button className="text-sm text-parchment underline decoration-gold/50 underline-offset-4" onClick={() => hint(hintKey, used + 1)}>
              Toon hint {used + 1} {used === 2 ? '(geeft het antwoord bijna weg)' : ''} — kost een punt
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function DocView({ blocks }: { blocks: DocBlock[] }) {
  const { sc } = useGame();
  return (
    <div className="space-y-3">
      {blocks.map((b, i) => {
        switch (b.kind) {
          case 'p':
            return <p key={i}>{b.text}</p>;
          case 'h':
            return (
              <h3 key={i} className="pt-1 font-display text-base font-semibold text-bordeaux">
                {b.text}
              </h3>
            );
          case 'note':
            return (
              <p key={i} className="border-l-2 border-bordeaux/60 pl-3 text-[15px] italic text-paper-ink/80">
                {b.text}
              </p>
            );
          case 'quote':
            return (
              <blockquote key={i} className="whitespace-pre-line rounded bg-[#f7efdc] p-3 font-body text-[15px] shadow-inner">
                {b.text}
                {b.by && <footer className="mt-2 text-right font-type text-xs text-paper-ink/70">— {b.by}</footer>}
              </blockquote>
            );
          case 'stamp':
            return (
              <div key={i} className="text-right">
                <Stamp text={b.text} />
              </div>
            );
          case 'fields':
            return (
              <dl key={i} className="divide-y divide-paper-ink/15 rounded border border-paper-ink/20 bg-[#f7efdc]/60">
                {b.rows.map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[minmax(0,38%)_1fr] gap-2 px-2.5 py-2 text-[14.5px]">
                    <dt className="font-type text-[12px] uppercase leading-5 text-paper-ink/70">{k}</dt>
                    <dd className="break-words">{v}</dd>
                  </div>
                ))}
              </dl>
            );
          case 'table':
            return (
              <div key={i} className="overflow-x-auto rounded border border-paper-ink/20">
                <table className="w-full border-collapse text-left text-[14px]">
                  <thead className="bg-paper-ink/10 font-type text-[11px] uppercase">
                    <tr>
                      {b.head.map((h) => (
                        <th key={h} className="px-2 py-1.5">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r, ri) => (
                      <tr key={ri} className="border-t border-paper-ink/10 align-top">
                        {r.map((c, ci) => (
                          <td key={ci} className={`px-2 py-1.5 ${c.includes('~~') ? '' : ''}`}>
                            {c.split('~~').map((part, pi) => (pi % 2 ? <s key={pi} className="text-bordeaux">{part}</s> : <span key={pi}>{part}</span>))}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                  {b.foot && (
                    <tfoot>
                      <tr className="border-t-2 border-paper-ink/40 font-semibold">
                        {b.foot.map((f, fi) => (
                          <td key={fi} className="px-2 py-1.5" colSpan={fi === b.foot!.length - 1 ? b.head.length - b.foot!.length + 1 : 1}>
                            {f}
                          </td>
                        ))}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            );
          case 'photo': {
            const scene = sc.photos.find((p) => p.id === b.scene);
            return scene ? <PhotoView key={i} scene={scene} /> : null;
          }
          case 'map':
            return <MapView key={i} />;
          default:
            return null;
        }
      })}
    </div>
  );
}

export const KIND_LABEL: Record<string, string> = {
  rapport: 'Rapport',
  document: 'Document',
  foto: 'Foto',
  bank: 'Financieel',
  brief: 'Brief',
  verklaring: 'Verklaring',
  fysiek: 'Fysiek bewijs',
  digitaal: 'Digitaal',
  kaart: 'Kaart',
};

export const KIND_ICON: Record<string, string> = {
  rapport: '📋',
  document: '📄',
  foto: '📷',
  bank: '💶',
  brief: '✉️',
  verklaring: '🗣️',
  fysiek: '🔎',
  digitaal: '📱',
  kaart: '🗺️',
};
