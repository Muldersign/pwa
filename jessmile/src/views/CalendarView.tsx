import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, MessageSquareText, CalendarX2 } from 'lucide-react';
import { useData } from '../state/DataContext';
import { useNow } from '../lib/useNow';
import { dayKey, formatDuration, formatLongDate, formatMonth, pad, addDays, dayRange } from '../lib/time';
import type { DaySummary, DayStatus } from '../lib/tracking';
import { StatusBadge } from '../components/StatusBadge';

const WEEKDAYS = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];

export function CalendarView({ onOpenDay }: { onOpenDay: (d: string) => void }) {
  const [tab, setTab] = useState<'maand' | 'archief'>('maand');
  return (
    <div className="view">
      <header className="page-head">
        <h1>Kalender</h1>
        <div className="segmented" role="tablist" aria-label="Weergave">
          <button role="tab" aria-selected={tab === 'maand'} className={tab === 'maand' ? 'on' : ''} onClick={() => setTab('maand')}>
            Maand
          </button>
          <button role="tab" aria-selected={tab === 'archief'} className={tab === 'archief' ? 'on' : ''} onClick={() => setTab('archief')}>
            Archief
          </button>
        </div>
      </header>
      {tab === 'maand' ? <Month onOpenDay={onOpenDay} /> : <Archive onOpenDay={onOpenDay} />}
    </div>
  );
}

function cellClass(s: DayStatus): string {
  return { achieved: 'c-green', missed: 'c-orange', today: 'c-purple', nodata: 'c-grey', unconfirmed: 'c-grey', partial: 'c-partial', future: 'c-future' }[s];
}

function Month({ onOpenDay }: { onOpenDay: (d: string) => void }) {
  const { computeDay, notes, events } = useData();
  const now = useNow(60_000).getTime();
  const todayD = new Date(now);
  const [ym, setYm] = useState({ y: todayD.getFullYear(), m: todayD.getMonth() });
  const today = dayKey(now);

  const cells = useMemo(() => {
    const first = new Date(ym.y, ym.m, 1);
    const lead = (first.getDay() + 6) % 7; // monday first
    const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate();
    const list: (DaySummary | null)[] = Array(lead).fill(null);
    for (let d = 1; d <= daysInMonth; d++) list.push(computeDay(`${ym.y}-${pad(ym.m + 1)}-${pad(d)}`, now));
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ym, computeDay, Math.floor(now / 60_000)]);

  const monthDays = cells.filter((c): c is DaySummary => !!c && c.status !== 'future');
  const achieved = monthDays.filter((d) => d.status === 'achieved').length;
  const counted = monthDays.filter((d) => d.status === 'achieved' || d.status === 'missed').length;
  const shift = (n: number) => setYm(({ y, m }) => ({ y: m + n < 0 ? y - 1 : m + n > 11 ? y + 1 : y, m: (m + n + 12) % 12 }));
  const isCurrentMonth = ym.y === todayD.getFullYear() && ym.m === todayD.getMonth();

  return (
    <>
      <section className="card">
        <div className="month-head">
          <button className="icon-btn" onClick={() => shift(-1)} aria-label="Vorige maand">
            <ChevronLeft size={20} />
          </button>
          <div className="month-title">
            <h2 className="capitalize">{formatMonth(ym.y, ym.m)}</h2>
            {counted > 0 && (
              <p className="muted">
                {achieved} van {counted} dagen doel behaald
              </p>
            )}
          </div>
          <button className="icon-btn" onClick={() => shift(1)} disabled={isCurrentMonth} aria-label="Volgende maand">
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="cal-grid" role="grid" aria-label={formatMonth(ym.y, ym.m)}>
          {WEEKDAYS.map((w) => (
            <span key={w} className="cal-wd" aria-hidden="true">
              {w}
            </span>
          ))}
          {cells.map((c, i) =>
            c ? (
              <button
                key={c.key}
                className={`cal-day ${cellClass(c.status)} ${c.key === today ? 'is-today' : ''}`}
                disabled={c.status === 'future'}
                onClick={() => onOpenDay(c.key)}
                aria-label={`${formatLongDate(c.key)}: ${statusText(c)}`}
              >
                <span className="cal-num">{Number(c.key.slice(8))}</span>
                {c.status !== 'future' && c.status !== 'nodata' && c.status !== 'unconfirmed' && (
                  <span className="cal-hours">{Math.floor(c.wornMs / 3_600_000)}u</span>
                )}
                {notes.has(c.key) && <span className="cal-note" aria-hidden="true" />}
              </button>
            ) : (
              <span key={`e${i}`} />
            ),
          )}
        </div>
        <div className="legend legend-cal">
          <span><i className="dot c-green-dot" /> Doel behaald</span>
          <span><i className="dot c-orange-dot" /> Minder dan doel</span>
          <span><i className="dot c-purple-dot" /> Vandaag</span>
          <span><i className="dot c-grey-dot" /> Geen gegevens</span>
        </div>
      </section>
      {events.length === 0 && (
        <div className="empty">
          <CalendarX2 size={28} />
          <p>Nog geen registraties. Zodra je op “Beugel in” of “Beugel uit” drukt, kleurt je kalender mee.</p>
        </div>
      )}
    </>
  );
}

function statusText(d: DaySummary): string {
  if (d.status === 'nodata') return 'geen gegevens';
  if (d.status === 'unconfirmed') return 'niet bevestigd';
  return `${formatDuration(d.wornMs)} gedragen, ${Math.round(d.progress * 100)}%`;
}

function Archive({ onOpenDay }: { onOpenDay: (d: string) => void }) {
  const { computeDay, events, notes } = useData();
  const now = useNow(60_000).getTime();
  const [limit, setLimit] = useState(30);
  const today = dayKey(now);
  const days = useMemo(() => {
    if (!events.length) return [];
    const first = dayKey(events[0].at);
    const out: DaySummary[] = [];
    for (let k = today; k >= first && out.length < limit; k = addDays(k, -1)) out.push(computeDay(k, now));
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, computeDay, limit, today, Math.floor(now / 60_000)]);
  const total = useMemo(() => (events.length ? dayRange(dayKey(events[0].at), today).length : 0), [events, today]);

  if (!days.length)
    return (
      <div className="empty">
        <CalendarX2 size={28} />
        <p>Je archief is nog leeg. Eerdere dagen verschijnen hier, van nieuw naar oud.</p>
      </div>
    );
  return (
    <section className="archive">
      {days.map((d) => (
        <button key={d.key} className="archive-row card" onClick={() => onOpenDay(d.key)}>
          <span className={`archive-bar ${cellClass(d.status)}`} aria-hidden="true">
            <span style={{ height: `${Math.min(100, d.progress * 100)}%` }} />
          </span>
          <span className="archive-main">
            <span className="archive-date capitalize">{d.isToday ? 'Vandaag' : formatLongDate(d.key)}</span>
            <span className="archive-meta">
              {d.status === 'nodata' || d.status === 'unconfirmed'
                ? 'Geen geregistreerde draagtijd'
                : `${formatDuration(d.wornMs)} in · ${formatDuration(d.outMs)} uit · ${Math.round(d.progress * 100)}%`}
            </span>
            {notes.get(d.key) && (
              <span className="archive-note">
                <MessageSquareText size={13} /> {notes.get(d.key)!.text}
              </span>
            )}
          </span>
          <StatusBadge status={d.status} />
        </button>
      ))}
      {days.length < total && (
        <button className="btn btn-soft btn-block" onClick={() => setLimit((l) => l + 30)}>
          Meer dagen laden
        </button>
      )}
    </section>
  );
}
