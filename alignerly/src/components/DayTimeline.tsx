import type { DaySummary } from '../lib/tracking';
import { formatClock, formatDuration } from '../lib/time';

const LABEL = { in: 'Beugel in', out: 'Beugel uit', unknown: 'Niet geregistreerd', unconfirmed: 'Niet bevestigd', future: 'Nog niet' } as const;

/** 00:00 → 24:00 bar: purple = in, pink = out, hatched = no data. */
export function DayTimeline({ day, now }: { day: DaySummary; now?: number }) {
  const span = day.end - day.start;
  const pct = (t: number) => ((t - day.start) / span) * 100;
  return (
    <div className="timeline">
      <div className="timeline-bar" role="img" aria-label={timelineLabel(day)}>
        {day.segments.map((s, i) => (
          <span
            key={i}
            className={`tl-seg tl-${s.kind}`}
            style={{ left: `${pct(s.start)}%`, width: `${pct(s.end) - pct(s.start)}%` }}
            title={`${LABEL[s.kind]} · ${formatClock(s.start)}–${s.end === day.end ? '24:00' : formatClock(s.end)}`}
          />
        ))}
        {day.isToday && now !== undefined && <span className="tl-now" style={{ left: `${pct(now)}%` }} />}
      </div>
      <div className="timeline-ticks" aria-hidden="true">
        <span>00</span>
        <span>06</span>
        <span>12</span>
        <span>18</span>
        <span>24</span>
      </div>
    </div>
  );
}

function timelineLabel(day: DaySummary): string {
  const parts = day.segments
    .filter((s) => s.kind === 'out')
    .map((s) => `uit van ${formatClock(s.start)} tot ${formatClock(s.end)}`);
  return `Tijdlijn: ${formatDuration(day.wornMs)} gedragen${parts.length ? `, ${parts.join(', ')}` : ''}.`;
}

export function TimelineLegend({ showUnknown }: { showUnknown?: boolean }) {
  return (
    <div className="legend">
      <span><i className="dot dot-in" /> In</span>
      <span><i className="dot dot-out" /> Uit</span>
      {showUnknown && <span><i className="dot dot-unknown" /> Geen gegevens</span>}
    </div>
  );
}
