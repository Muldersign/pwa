import { format, isSameDay } from 'date-fns';
import { nl } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, MapPin, Plus } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { CategoryIcon } from '../components/CategoryIcon';
import {
  capitalize,
  formatWeekday,
  formatWeekdayShort,
  formatWeekRange,
  fromISODate,
  shiftWeek,
  toISODate,
  weekDays,
  weekNumber,
  weekStart,
} from '../lib/dates';
import { buildDayEntries, MEAL_LABELS } from '../lib/timeline';
import { useNow } from '../lib/useNow';
import { useData } from '../state/DataContext';
import type { Route } from '../state/router';
import { useUI } from '../state/UIContext';

interface Props {
  week?: string;
  navigate: (r: Route, o?: { replace?: boolean }) => void;
}

export function WeekView({ week, navigate }: Props) {
  const { activities, meals, notes } = useData();
  const ui = useUI();
  const now = useNow();
  const anchor = week ? fromISODate(week) : now;
  const validAnchor = isNaN(anchor.getTime()) ? now : anchor;
  const weekKey = toISODate(weekStart(validAnchor));
  const days = useMemo(() => weekDays(fromISODate(weekKey)), [weekKey]);
  const isCurrentWeek = isSameDay(weekStart(validAnchor), weekStart(now));
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});

  const goWeek = (delta: number) => {
    setDirection(delta > 0 ? 'left' : 'right');
    const target = shiftWeek(validAnchor, delta);
    const isNow = isSameDay(weekStart(target), weekStart(now));
    navigate({ name: 'week', week: isNow ? undefined : toISODate(weekStart(target)) }, { replace: true });
  };

  const goToday = () => {
    setDirection(null);
    navigate({ name: 'week' }, { replace: true });
  };

  const columns = useMemo(
    () =>
      days.map((d) => {
        const iso = toISODate(d);
        return { date: d, iso, entries: buildDayEntries(iso, activities, meals), note: notes.find((n) => n.date === iso) };
      }),
    [days, activities, meals, notes],
  );
  const total = columns.reduce((n, c) => n + c.entries.length, 0);

  return (
    <div
      className="page page--week"
      onTouchStart={(e) => {
        touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }}
      onTouchEnd={(e) => {
        const start = touch.current;
        touch.current = null;
        if (!start) return;
        const dx = e.changedTouches[0].clientX - start.x;
        const dy = e.changedTouches[0].clientY - start.y;
        if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 2 && !(e.target as HTMLElement).closest('.swipe-row')) {
          goWeek(dx < 0 ? 1 : -1);
        }
      }}
    >
      <header className="week-header">
        <button type="button" className="icon-button" onClick={() => goWeek(-1)} aria-label="Vorige week">
          <ChevronLeft size={22} />
        </button>
        <div className="week-header__center">
          <h1 className="week-header__title">Week {weekNumber(validAnchor)}</h1>
          <p className="week-header__range">{formatWeekRange(validAnchor)}</p>
        </div>
        <button type="button" className="icon-button" onClick={() => goWeek(1)} aria-label="Volgende week">
          <ChevronRight size={22} />
        </button>
      </header>

      <div className="week-subbar">
        <span className="week-subbar__count">{total === 0 ? 'Nog niets gepland' : `${total} ${total === 1 ? 'item' : 'items'} deze week`}</span>
        {!isCurrentWeek && (
          <button type="button" className="chip chip--ghost chip--small" onClick={goToday}>
            Naar vandaag
          </button>
        )}
      </div>

      <div className="day-strip" role="tablist" aria-label="Dagen">
        {columns.map(({ date, iso, entries }) => {
          const isToday = isSameDay(date, now);
          return (
            <button
              key={iso}
              type="button"
              className={`day-chip ${isToday ? 'is-today' : ''}`}
              onClick={() => {
                const el = cardRefs.current[iso];
                if (el && window.matchMedia('(max-width: 1023px)').matches) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                  navigate({ name: 'day', date: iso });
                }
              }}
            >
              <span className="day-chip__name">{formatWeekdayShort(date)}</span>
              <span className="day-chip__num">{date.getDate()}</span>
              <span className="day-chip__dots" aria-hidden="true">
                {entries.slice(0, 3).map((e) => (
                  <i key={e.id} className={`dot tone-${e.kind === 'meal' ? 'meal' : e.item.category}`} />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <div key={weekKey} className={`week-days ${direction ? `slide-${direction}` : ''}`}>
        {columns.map(({ date, iso, entries, note }, idx) => {
          const isToday = isSameDay(date, now);
          const isPast = date < now && !isToday;
          return (
            <section
              key={iso}
              ref={(el) => {
                cardRefs.current[iso] = el;
              }}
              className={`day-card ${isToday ? 'is-today' : ''} ${isPast ? 'is-past' : ''}`}
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              <button type="button" className="day-card__header" onClick={() => navigate({ name: 'day', date: iso })}>
                <span className="day-card__date">
                  <span className="day-card__weekday">{capitalize(formatWeekday(date))}</span>
                  <span className="day-card__day">{format(date, 'd MMM', { locale: nl }).replace('.', '')}</span>
                </span>
                {isToday && <span className="badge">Vandaag</span>}
                <ChevronRight size={18} className="day-card__chev" />
              </button>
              {entries.length ? (
                <ul className="day-card__list" onClick={() => navigate({ name: 'day', date: iso })}>
                  {entries.map((e) => (
                    <li key={e.id} className="mini-item">
                      <span className={`mini-item__time ${e.time ? '' : 'is-soft'}`}>
                        {e.time ?? (e.kind === 'meal' ? 'Avond' : '—')}
                      </span>
                      <CategoryIcon
                        tone={e.kind === 'meal' ? 'meal' : e.item.category}
                        mealType={e.kind === 'meal' ? e.item.mealType : undefined}
                        title={e.item.title}
                        size="sm"
                      />
                      <span className="mini-item__body">
                        <span className="mini-item__title">{e.item.title}</span>
                        {(e.item.location || e.kind === 'meal') && (
                          <span className="mini-item__meta">
                            {e.item.location ? (
                              <>
                                <MapPin size={11} /> {e.item.location}
                              </>
                            ) : e.kind === 'meal' ? (
                              MEAL_LABELS[e.item.mealType]
                            ) : null}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                  {note && <li className="mini-note">{note.text}</li>}
                </ul>
              ) : (
                <button type="button" className="day-card__empty" onClick={() => ui.openAddChooser(iso)}>
                  <Plus size={15} /> Plan iets
                </button>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
