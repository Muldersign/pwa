import { useMemo, useState } from 'react';
import { Award, CalendarCheck, Flame, Timer, TrendingUp, BarChart3 } from 'lucide-react';
import { useData } from '../state/DataContext';
import { useNow } from '../lib/useNow';
import { computeDays, computeStats, lastNDays, trackedDayKeys } from '../lib/tracking';
import { dayKey, formatDuration, formatDurationWords } from '../lib/time';
import { WearChart } from '../components/WearChart';

const RANGES = [
  { n: 7, label: '7 dagen' },
  { n: 30, label: '30 dagen' },
  { n: 90, label: '90 dagen' },
];

export function StatsView({ onOpenDay }: { onOpenDay: (d: string) => void }) {
  const { events, settings, confirmed } = useData();
  const now = useNow(60_000).getTime();
  const [range, setRange] = useState(7);
  const today = dayKey(now);
  const opts = { goalMinutes: settings.goalMinutes, confirmed };

  const all = useMemo(() => computeDays(trackedDayKeys(events, now), events, now, opts), [events, now, settings.goalMinutes, confirmed]); // eslint-disable-line react-hooks/exhaustive-deps
  const stats = useMemo(() => computeStats(all), [all]);
  const chartDays = useMemo(() => computeDays(lastNDays(today, range), events, now, opts), [events, now, range, today, settings.goalMinutes, confirmed]); // eslint-disable-line react-hooks/exhaustive-deps
  const todaySummary = all[all.length - 1];

  if (!events.length)
    return (
      <div className="view">
        <header className="page-head">
          <h1>Statistieken</h1>
        </header>
        <div className="empty">
          <BarChart3 size={28} />
          <p>Hier verschijnen je gemiddelden, reeksen en grafieken zodra je een paar dagen hebt bijgehouden.</p>
        </div>
      </div>
    );

  const messages: string[] = [];
  if (stats.todayAchieved) messages.push('Je hebt je doel vandaag gehaald! 💜');
  else if (todaySummary?.isToday) {
    const left = todaySummary.goalMs - todaySummary.wornMs;
    if (left > 0 && left <= 3 * 3_600_000 && left <= todaySummary.end - now) messages.push(`Nog ${formatDurationWords(left)} tot je dagdoel.`);
  }
  if (stats.currentStreak >= 2) messages.push(`Al ${stats.currentStreak} dagen achter elkaar je doel behaald!`);
  if (stats.longestStreak >= 3 && stats.longestStreak === stats.currentStreak) messages.push('Dit is je langste reeks tot nu toe. Knap! ✨');
  if (!messages.length) messages.push('Elke dag dat je bijhoudt helpt je tanden een stapje verder. 💜');

  const rate = stats.completedDays ? Math.round((stats.achievedDays / Math.max(1, stats.completedDays + (stats.todayAchieved ? 1 : 0))) * 100) : 0;

  return (
    <div className="view">
      <header className="page-head">
        <h1>Statistieken</h1>
      </header>

      <div className="motivation-stack">
        {messages.map((m) => (
          <p key={m} className="motivation">
            {m}
          </p>
        ))}
      </div>

      <section className="tiles">
        <Tile icon={<Timer size={18} />} label="Gemiddeld per dag" value={stats.completedDays ? formatDuration(stats.averageWornMs) : '–'} sub={stats.completedDays ? `over ${stats.completedDays} afgeronde ${stats.completedDays === 1 ? 'dag' : 'dagen'}` : 'nog geen afgeronde dag'} />
        <Tile icon={<CalendarCheck size={18} />} label="Doel behaald" value={`${stats.achievedDays} ${stats.achievedDays === 1 ? 'dag' : 'dagen'}`} sub={stats.completedDays ? `${rate}% van je dagen` : undefined} />
        <Tile icon={<Flame size={18} />} label="Huidige reeks" value={`${stats.currentStreak} ${stats.currentStreak === 1 ? 'dag' : 'dagen'}`} accent />
        <Tile icon={<Award size={18} />} label="Langste reeks" value={`${stats.longestStreak} ${stats.longestStreak === 1 ? 'dag' : 'dagen'}`} />
        <Tile icon={<TrendingUp size={18} />} label="Gedragen, laatste 7 dagen" value={formatDuration(stats.last7WornMs)} sub={`gemiddeld ${formatDuration(stats.last7WornMs / 7)} per dag`} wide />
      </section>

      <section className="card">
        <div className="block-head">
          <h2 className="card-title">Draagtijd per dag</h2>
          <div className="segmented segmented-sm" role="tablist" aria-label="Periode">
            {RANGES.map((r) => (
              <button key={r.n} role="tab" aria-selected={range === r.n} className={range === r.n ? 'on' : ''} onClick={() => setRange(r.n)}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <WearChart days={chartDays} goalMs={settings.goalMinutes * 60_000} onOpenDay={onOpenDay} />
      </section>
      <p className="hint center">Alleen geregistreerde tijd telt mee. Het gemiddelde gebruikt afgeronde dagen, dus zonder vandaag.</p>
    </div>
  );
}

function Tile({ icon, label, value, sub, accent, wide }: { icon: React.ReactNode; label: string; value: string; sub?: string; accent?: boolean; wide?: boolean }) {
  return (
    <div className={`stat-card ${accent ? 'stat-accent' : ''} ${wide ? 'stat-wide' : ''}`}>
      <span className="stat-icon">{icon}</span>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  );
}
