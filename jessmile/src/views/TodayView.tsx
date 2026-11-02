import { useMemo, useState } from 'react';
import { CheckCircle2, Clock, Hourglass, Sparkles, Timer, Info, Plus, PenLine, ChevronRight, CircleOff } from 'lucide-react';
import { useData } from '../state/DataContext';
import { useNow } from '../lib/useNow';
import { ProgressRing } from '../components/ProgressRing';
import { DayTimeline, TimelineLegend } from '../components/DayTimeline';
import { MomentList } from '../components/MomentList';
import { MomentEditor } from '../components/MomentEditor';
import { AddRegistration } from '../components/AddRegistration';
import { Logo } from '../components/Logo';
import { StorageNotice } from '../components/StorageNotice';
import type { BraceEvent, Kind } from '../domain/types';
import { computeStats, computeDays, lastNDays } from '../lib/tracking';
import { dayKey, formatClock, formatDuration, formatDurationWords, formatLongDate, formatStopwatch } from '../lib/time';

export function TodayView({ onOpenDay, onSettings }: { onOpenDay: (d: string) => void; onSettings: () => void }) {
  const { computeDay, current, toggle, settings, events, notes } = useData();
  const nowDate = useNow(1000);
  const now = nowDate.getTime();
  const today = dayKey(now);
  const day = computeDay(today, now);
  const state = current(now);
  const [pressed, setPressed] = useState(false);
  const [editing, setEditing] = useState<BraceEvent | null>(null);
  const [adding, setAdding] = useState(false);

  // Streak for the motivation line (recomputed once a minute is plenty)
  const minuteKey = Math.floor(now / 60_000);
  const stats = useMemo(() => {
    const keys = lastNDays(today, 60);
    return computeStats(computeDays(keys, events, now, { goalMinutes: settings.goalMinutes }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, minuteKey, settings.goalMinutes]);

  const remainingBudget = Math.max(0, day.budgetMs - day.outMs);
  const overBudget = day.outMs > day.budgetMs;
  const pct = Math.round(day.progress * 100);
  const sinceMs = state.since ? now - state.since : 0;
  const goalLeft = Math.max(0, day.goalMs - day.wornMs);

  const press = async (initial?: Kind) => {
    setPressed(true);
    await toggle(initial);
    window.setTimeout(() => setPressed(false), 450);
  };

  const message = motivation({ achieved: day.achieved, streak: stats.currentStreak, goalLeft, kind: state.kind, sinceMs, overBudget });
  const note = notes.get(today);

  return (
    <div className="view today">
      <header className="hello">
        <div>
          <p className="eyebrow">Jessmile</p>
          <h1>Hoi {settings.name || 'Jessica'}! 💜</h1>
          <p className="muted capitalize">{formatLongDate(today)}</p>
        </div>
        <button className="avatar-btn" onClick={onSettings} aria-label="Instellingen">
          <Logo size={44} />
        </button>
      </header>

      <StorageNotice />

      <section className="card hero">
        <h2 className="hero-title">Vandaag gedragen</h2>
        <ProgressRing progress={day.progress} label={`${formatDuration(day.wornMs)} gedragen, ${pct}% van ${formatDuration(day.goalMs)}`}>
          <strong className="ring-value">{formatDuration(day.wornMs)}</strong>
          <span className="ring-sub">Dagdoel: {formatGoal(settings.goalMinutes)}</span>
          <span className={`ring-pct ${day.achieved ? 'ring-pct-done' : ''}`}>
            {day.achieved ? (
              <>
                <CheckCircle2 size={15} /> Doel behaald
              </>
            ) : (
              `${pct}% behaald`
            )}
          </span>
        </ProgressRing>

        {state.kind === null ? (
          <div className="onboard">
            <p className="onboard-title">Welkom! Zit je beugel er nu in?</p>
            <p className="muted">Kies hoe het nu is. Vanaf dat moment houdt Jessmile alles automatisch bij, ook als je de app sluit.</p>
            <div className="btn-row">
              <button className="btn btn-primary btn-xl" onClick={() => press('in')}>
                Hij zit nu in
              </button>
              <button className="btn btn-soft btn-xl" onClick={() => press('out')}>
                Hij is nu uit
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={`status-pill ${state.kind === 'in' ? 'pill-in' : 'pill-out'}`} aria-live="polite">
              {state.kind === 'in' ? <CheckCircle2 size={17} /> : <CircleOff size={17} />}
              <span>
                {state.kind === 'in' ? 'Je beugel zit erin' : 'Je beugel is uit'} · sinds {formatClock(state.since!)}
              </span>
            </div>

            <button
              className={`big-btn ${state.kind === 'in' ? 'big-btn-out' : 'big-btn-in'} ${pressed ? 'is-pressed' : ''}`}
              onClick={() => press()}
              aria-label={state.kind === 'in' ? 'Beugel uit: registreer dat je je beugel uitdoet' : 'Beugel in: registreer dat je je beugel indoet'}
            >
              <Timer size={22} />
              {state.kind === 'in' ? 'Beugel uit' : 'Beugel in'}
            </button>

            <div className="live-line">
              {state.kind === 'out' ? (
                <>
                  <span className="live-big">Al {formatDurationWords(sinceMs)} uit</span>
                  <span className={`live-sub ${overBudget ? 'warn-soft' : ''}`}>
                    {overBudget
                      ? `${formatDuration(day.outMs - day.budgetMs)} over je uit-budget van vandaag`
                      : `Nog ${formatDuration(remainingBudget)} uit-budget over vandaag`}
                    {' · '}
                    <span className="mono">{formatStopwatch(sinceMs)}</span>
                  </span>
                </>
              ) : (
                <>
                  <span className="live-big">Lekker bezig! 💜</span>
                  <span className="live-sub">
                    Al {formatDuration(sinceMs)} in sinds {formatClock(state.since!)} · <span className="mono">{formatStopwatch(sinceMs)}</span>
                  </span>
                </>
              )}
            </div>
          </>
        )}
      </section>

      <section className="stat-grid" aria-label="Vandaag in cijfers">
        <StatCard icon={<Sparkles size={18} />} label="Vandaag gedragen" value={formatDuration(day.wornMs)} />
        <StatCard icon={<Clock size={18} />} label="Vandaag uit geweest" value={formatDuration(day.outMs)} tone="pink" />
        <StatCard
          icon={<Hourglass size={18} />}
          label="Resterend uit-budget"
          value={overBudget ? '0m' : formatDuration(remainingBudget)}
          sub={overBudget ? `${formatDuration(day.outMs - day.budgetMs)} overschreden` : `van ${formatDuration(day.budgetMs)}`}
        />
      </section>

      {message && <p className="motivation">{message}</p>}

      {day.incomplete && (
        <div className="notice notice-soft">
          <Info size={18} />
          <p>
            Het overzicht van vandaag is mogelijk onvolledig: voor {formatDuration(day.unknownMs)} is nog niets geregistreerd. Alleen geregistreerde tijd telt mee.
          </p>
        </div>
      )}

      {state.kind !== null && (
        <section className="card">
          <div className="block-head">
            <h2 className="card-title">Tijdlijn van vandaag</h2>
            <button className="btn btn-soft btn-sm" onClick={() => setAdding(true)} aria-label="Vergeten moment toevoegen">
              <Plus size={16} /> Aanvullen
            </button>
          </div>
          <DayTimeline day={day} now={now} />
          <TimelineLegend showUnknown={day.unknownMs > 0} />
          <MomentList events={[...day.events].reverse()} onEdit={setEditing} />
          <button className="row-link" onClick={() => onOpenDay(today)}>
            <PenLine size={17} />
            <span>{note ? `Opmerking: “${note.text}”` : 'Opmerking toevoegen voor vandaag'}</span>
            <ChevronRight size={18} />
          </button>
        </section>
      )}

      <MomentEditor event={editing} onClose={() => setEditing(null)} />
      <AddRegistration open={adding} day={today} onClose={() => setAdding(false)} />
    </div>
  );
}

function StatCard({ icon, label, value, sub, tone }: { icon: React.ReactNode; label: string; value: string; sub?: string; tone?: 'pink' }) {
  return (
    <div className={`stat-card ${tone === 'pink' ? 'stat-pink' : ''}`}>
      <span className="stat-icon">{icon}</span>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  );
}

export function formatGoal(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}u ${m}m` : `${h} uur`;
}

function motivation(p: { achieved: boolean; streak: number; goalLeft: number; kind: Kind | null; sinceMs: number; overBudget: boolean }): string | null {
  if (p.kind === null) return null;
  if (p.achieved && p.streak >= 2) return `Al ${p.streak} dagen achter elkaar je doel behaald! 💜`;
  if (p.achieved) return 'Je hebt je doel vandaag gehaald! 💜';
  if (p.streak >= 2) return `Je zit op een reeks van ${p.streak} dagen. Mooi zo, ga zo door!`;
  if (p.goalLeft > 0 && p.goalLeft <= 3 * 60 * 60_000 && p.kind === 'in') return `Nog ${formatDurationWords(p.goalLeft)} tot je dagdoel.`;
  if (p.overBudget) return 'Geeft niks. Elke minuut dat je beugel erin zit, telt. 💜';
  return null;
}
