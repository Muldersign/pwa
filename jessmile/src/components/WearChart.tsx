import { useState } from 'react';
import type { DaySummary } from '../lib/tracking';
import { formatDuration, formatShortDate, parseDayKey } from '../lib/time';

/** Wear time per day, with the daily goal as a dashed reference line. Tap a bar for details. */
export function WearChart({ days, goalMs, onOpenDay }: { days: DaySummary[]; goalMs: number; onOpenDay: (d: string) => void }) {
  const [active, setActive] = useState<string | null>(null);
  const H = 160;
  const maxMs = 24 * 3_600_000;
  const y = (ms: number) => H - (Math.min(ms, maxMs) / maxMs) * H;
  const many = days.length > 14;
  const sel = days.find((d) => d.key === active) ?? null;

  return (
    <div className="chart">
      <div className="chart-tip" aria-live="polite">
        {sel ? (
          <>
            <strong className="capitalize">{formatShortDate(sel.key)}</strong> · {formatDuration(sel.wornMs)} gedragen ({Math.round(sel.progress * 100)}%)
            <button className="link" onClick={() => onOpenDay(sel.key)}>
              Bekijk dag
            </button>
          </>
        ) : (
          <span className="muted">Tik op een staaf voor details</span>
        )}
      </div>
      <div className="chart-plot" style={{ height: H }}>
        <div className="chart-grid" aria-hidden="true">
          {[24, 12, 0].map((h) => (
            <span key={h} style={{ top: y(h * 3_600_000) }}>
              {h}u
            </span>
          ))}
        </div>
        <div className="chart-goal" style={{ top: y(goalMs) }} aria-hidden="true">
          <span>doel</span>
        </div>
        <div className="chart-bars" style={{ gap: many ? 2 : 6 }}>
          {days.map((d) => {
            const h = (Math.min(d.wornMs, maxMs) / maxMs) * 100;
            const cls = d.status === 'achieved' ? 'bar-ok' : d.status === 'today' ? 'bar-today' : d.status === 'missed' ? 'bar-low' : 'bar-none';
            return (
              <button
                key={d.key}
                className={`chart-bar ${cls} ${active === d.key ? 'is-active' : ''}`}
                onClick={() => setActive(active === d.key ? null : d.key)}
                aria-label={`${formatShortDate(d.key)}: ${formatDuration(d.wornMs)} gedragen`}
              >
                <span style={{ height: `${Math.max(h, d.wornMs > 0 ? 2 : 0)}%` }} />
              </button>
            );
          })}
        </div>
      </div>
      <div className="chart-x" aria-hidden="true">
        {days.map((d, i) => (
          <span key={d.key}>{!many || i % 5 === 0 || i === days.length - 1 ? xLabel(d.key, many) : ''}</span>
        ))}
      </div>
      <div className="legend">
        <span><i className="dot bar-ok-dot" /> Doel behaald</span>
        <span><i className="dot bar-low-dot" /> Onder doel</span>
        <span><i className="dot bar-today-dot" /> Vandaag</span>
      </div>
    </div>
  );
}

function xLabel(key: string, many: boolean): string {
  const d = parseDayKey(key);
  return many ? String(d.getDate()) : ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'][d.getDay()];
}
