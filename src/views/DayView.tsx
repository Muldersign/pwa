import { addDays, format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { CalendarPlus, ChevronLeft, ChevronRight, MapPin, Plus, ShoppingBasket, Users, Utensils } from 'lucide-react';
import { listStats } from '../lib/listStatus';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CategoryIcon } from '../components/CategoryIcon';
import { DayTimeline } from '../components/DayTimeline';
import { EmptyState } from '../components/EmptyState';
import { SwipeRow } from '../components/SwipeRow';
import { useToast } from '../components/Toast';
import type { Meal } from '../domain/types';
import { capitalize, formatWeekday, fromISODate, nowMinutes, relativeDayLabel, toISODate, weekStart } from '../lib/dates';
import { buildDayEntries, MEAL_LABELS } from '../lib/timeline';
import { useNow } from '../lib/useNow';
import { useTimelineActions } from '../lib/useTimelineActions';
import { addMealIngredientsToGroceries } from '../services/actionExecutor';
import { useData } from '../state/DataContext';
import type { Route } from '../state/router';
import { useUI } from '../state/UIContext';

const MEAL_ORDER = { breakfast: 0, lunch: 1, snack: 2, dinner: 3 };

interface Props {
  date: string;
  /** True when the previous screen was inside the app, so browser history can be used. */
  canGoBack: boolean;
  navigate: (r: Route, o?: { replace?: boolean }) => void;
}

export function DayView({ date, canGoBack, navigate }: Props) {
  const { activities, meals, notes, repo, lists, listItems } = useData();
  const dayLists = lists.filter((l) => l.date === date && !l.archived);
  const ui = useUI();
  const toast = useToast();
  const now = useNow();
  const { select, remove } = useTimelineActions();
  const d = fromISODate(date);
  const isToday = date === toISODate(now);

  const activityEntries = useMemo(
    () => buildDayEntries(date, activities, []),
    [date, activities],
  );
  const dayMeals = useMemo(
    () => meals.filter((m) => m.date === date).sort((a, b) => MEAL_ORDER[a.mealType] - MEAL_ORDER[b.mealType]),
    [date, meals],
  );
  const savedNote = notes.find((n) => n.date === date)?.text ?? '';

  const goDay = (delta: number) => navigate({ name: 'day', date: toISODate(addDays(d, delta)) }, { replace: true });

  const removeMeal = async (meal: Meal) => {
    await repo.deleteMeal(meal.id);
    toast({ message: `${meal.title} verwijderd`, action: { label: 'Ongedaan maken', onClick: () => repo.putMeal(meal) } });
  };

  const ingredientsToList = async (meal: Meal) => {
    const result = await addMealIngredientsToGroceries(repo, meal);
    const added = result.changes.filter((c) => c.kind === 'added' || c.kind === 'restored').length;
    toast({
      message: added ? `${added} ${added === 1 ? 'product' : 'producten'} op je lijst gezet` : 'Alles stond al op je lijst',
      tone: added ? 'success' : 'info',
      action: added ? { label: 'Ongedaan maken', onClick: result.undo } : undefined,
    });
  };

  const rel = relativeDayLabel(date, now);
  const eyebrow = ['vandaag', 'morgen', 'overmorgen', 'gisteren'].includes(rel) ? capitalize(rel) : `Week ${format(d, 'I')}`;

  return (
    <div className="page page--day" key={date}>
      <header className="day-header">
        <button
          type="button"
          className="back-button"
          onClick={() => {
            if (canGoBack) history.back();
            else navigate({ name: 'week', week: toISODate(weekStart(d)) });
          }}
          aria-label="Terug naar week"
        >
          <ChevronLeft size={22} /> Week
        </button>
        <div className="day-header__nav">
          <button type="button" className="icon-button" onClick={() => goDay(-1)} aria-label="Vorige dag">
            <ChevronLeft size={20} />
          </button>
          <button type="button" className="icon-button" onClick={() => goDay(1)} aria-label="Volgende dag">
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      <div className="day-title">
        <p className="page-header__eyebrow">{eyebrow}</p>
        <h1 className="page-header__title">
          {capitalize(formatWeekday(d))} <span className="text-soft">{format(d, 'd MMMM', { locale: nl })}</span>
        </h1>
      </div>

      <button type="button" className="ask-bar ask-bar--compact" onClick={() => ui.openAddChooser(date)}>
        <Plus size={18} className="text-accent" />
        <span>Iets toevoegen aan {rel === 'vandaag' || rel === 'morgen' ? rel : formatWeekday(d)}</span>
      </button>

      <div className="day-columns">
        <section className="card">
          <div className="card__header">
            <h2 className="card__title">Eten</h2>
            <button type="button" className="icon-button icon-button--soft" aria-label="Maaltijd toevoegen" onClick={() => ui.openEditor({ mode: 'create', kind: 'meal', date })}>
              <Plus size={18} />
            </button>
          </div>
          {dayMeals.length ? (
            <ul className="meal-list">
              {dayMeals.map((meal) => (
                <li key={meal.id} className="meal-list__row">
                  <SwipeRow onEdit={() => ui.openEditor({ mode: 'edit', kind: 'meal', item: meal })} onDelete={() => void removeMeal(meal)}>
                    <div className="meal-card">
                      <button type="button" className="meal-card__main" onClick={() => ui.openEditor({ mode: 'edit', kind: 'meal', item: meal })}>
                        <CategoryIcon tone="meal" mealType={meal.mealType} size="lg" />
                        <span className="meal-card__body">
                          <span className="meal-card__type">
                            {MEAL_LABELS[meal.mealType]}
                            {meal.time ? ` · ${meal.time}` : ''}
                          </span>
                          <span className="meal-card__title">{meal.title}</span>
                          {meal.location && (
                            <span className="meal-card__meta">
                              <MapPin size={12} /> {meal.location}
                            </span>
                          )}
                        </span>
                      </button>
                      {meal.ingredients.length > 0 && (
                        <div className="meal-card__ingredients">
                          <p className="meal-card__ing-text">{meal.ingredients.map((i) => i.name).join(' · ')}</p>
                          <button type="button" className="chip chip--accent chip--small" onClick={() => void ingredientsToList(meal)}>
                            <ShoppingBasket size={14} /> Voeg ingrediënten toe aan boodschappen
                          </button>
                        </div>
                      )}
                    </div>
                  </SwipeRow>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              compact
              icon={Utensils}
              title="Nog geen maaltijd gepland"
              action={
                <button type="button" className="chip chip--ghost" onClick={() => ui.openEditor({ mode: 'create', kind: 'meal', date })}>
                  <Plus size={15} /> Maaltijd toevoegen
                </button>
              }
            />
          )}
        </section>

        <section className="card">
          <div className="card__header">
            <h2 className="card__title">Activiteiten</h2>
            <button type="button" className="icon-button icon-button--soft" aria-label="Activiteit toevoegen" onClick={() => ui.openEditor({ mode: 'create', kind: 'activity', date })}>
              <Plus size={18} />
            </button>
          </div>
          {activityEntries.length ? (
            <DayTimeline
              entries={activityEntries}
              nowMinutes={isToday ? nowMinutes(now) : undefined}
              onSelect={select}
              onDelete={(e) => void remove(e)}
            />
          ) : (
            <EmptyState
              compact
              icon={CalendarPlus}
              title="Geen activiteiten"
              action={
                <button type="button" className="chip chip--ghost" onClick={() => ui.openEditor({ mode: 'create', kind: 'activity', date })}>
                  <Plus size={15} /> Activiteit toevoegen
                </button>
              }
            />
          )}
          {activityEntries.length > 0 && <p className="hint">Tip: veeg een item naar links om te wijzigen of te verwijderen.</p>}
        </section>

        {dayLists.length > 0 && (
          <section className="card card--quiet">
            <div className="card__header">
              <h2 className="card__title">Lijstjes</h2>
            </div>
            {dayLists.map((l) => {
              const stats = listStats(listItems.filter((i) => i.listId === l.id));
              return (
                <button key={l.id} type="button" className="day-list-link" onClick={() => navigate({ name: 'list', id: l.id })}>
                  <span className="list-card__icon">
                    <Users size={18} />
                  </span>
                  <span className="day-list-link__body">
                    <strong>{l.title}</strong>
                    <small>
                      {stats.yes} komen · {stats.pending} nog geen reactie
                    </small>
                  </span>
                  <ChevronRight size={18} className="text-soft" />
                </button>
              );
            })}
          </section>
        )}

        <NoteCard key={date} date={date} saved={savedNote} />
      </div>
    </div>
  );
}

function NoteCard({ date, saved }: { date: string; saved: string }) {
  const { repo } = useData();
  const [text, setText] = useState(saved);
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const timer = useRef<number | undefined>(undefined);
  const dirty = useRef(false);

  useEffect(() => {
    if (!dirty.current) setText(saved);
  }, [saved]);

  const persist = async (value: string) => {
    setState('saving');
    await repo.setNote(date, value);
    dirty.current = false;
    setState('saved');
    window.setTimeout(() => setState('idle'), 1400);
  };

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <section className="card">
      <div className="card__header">
        <h2 className="card__title">Notities</h2>
        <span className={`save-state ${state !== 'idle' ? 'is-visible' : ''}`}>{state === 'saving' ? 'Opslaan…' : 'Opgeslagen'}</span>
      </div>
      <textarea
        className="note-input"
        placeholder="Iets om te onthouden voor deze dag…"
        value={text}
        rows={3}
        onChange={(e) => {
          dirty.current = true;
          setText(e.target.value);
          window.clearTimeout(timer.current);
          const value = e.target.value;
          timer.current = window.setTimeout(() => void persist(value), 700);
        }}
        onBlur={() => {
          if (dirty.current) {
            window.clearTimeout(timer.current);
            void persist(text);
          }
        }}
      />
    </section>
  );
}
