import { addDays } from 'date-fns';
import { ChevronRight, Plus, Settings, ShoppingBasket, Sparkles, Sun, Utensils } from 'lucide-react';
import { useMemo } from 'react';
import { DayTimeline } from '../components/DayTimeline';
import { EmptyState } from '../components/EmptyState';
import { capitalize, formatLongDate, greeting, nowMinutes, toISODate } from '../lib/dates';
import { buildDayEntries } from '../lib/timeline';
import { useNow } from '../lib/useNow';
import { useTimelineActions } from '../lib/useTimelineActions';
import { GROCERY_CATEGORY_MAP } from '../services/groceryCategorizer';
import type { GroceryCategory } from '../domain/types';
import { useData } from '../state/DataContext';
import type { Route } from '../state/router';
import { useUI } from '../state/UIContext';

export function TodayView({ navigate }: { navigate: (r: Route) => void }) {
  const { activities, meals, groceries, notes, status } = useData();
  const ui = useUI();
  const now = useNow();
  const { select, remove } = useTimelineActions();
  const today = toISODate(now);
  const tomorrow = toISODate(addDays(now, 1));

  const entries = useMemo(() => buildDayEntries(today, activities, meals), [today, activities, meals]);
  const tomorrowEntries = useMemo(() => buildDayEntries(tomorrow, activities, meals), [tomorrow, activities, meals]);
  const minutes = nowMinutes(now);
  const next = entries.find((e) => e.sortMinutes > minutes && e.time);
  const dinner = entries.find((e) => e.kind === 'meal' && e.item.mealType === 'dinner');
  const activeGroceries = groceries.filter((g) => !g.completed);
  const note = notes.find((n) => n.date === today);

  const groceryCategories = useMemo(() => {
    const counts = new Map<GroceryCategory, number>();
    activeGroceries.forEach((g) => counts.set(g.category, (counts.get(g.category) ?? 0) + 1));
    return [...counts.entries()]
      .sort((a, b) => GROCERY_CATEGORY_MAP[a[0]].order - GROCERY_CATEGORY_MAP[b[0]].order)
      .slice(0, 4);
  }, [activeGroceries]);

  if (status === 'loading') return <TodaySkeleton />;

  return (
    <div className="page page--today">
      <header className="page-header page-header--row">
        <div>
          <p className="page-header__eyebrow">{greeting(now)} 👋</p>
          <h1 className="page-header__title">{capitalize(formatLongDate(now))}</h1>
        </div>
        <button type="button" className="icon-button icon-button--soft mobile-only" aria-label="Meer en instellingen" onClick={() => navigate({ name: 'more' })}>
          <Settings size={18} />
        </button>
      </header>

      <div className="today-grid">
        <div className="today-grid__main">
          <section className="hero" aria-label="Samenvatting van vandaag">
            <div className="hero__top">
              <span className="hero__label">
                <Sun size={15} /> Vandaag
              </span>
              <span className="hero__count">
                {entries.length === 0 ? 'Vrije dag' : `${entries.length} ${entries.length === 1 ? 'ding' : 'dingen'} gepland`}
              </span>
            </div>
            <p className="hero__next">
              {next ? (
                <>
                  <span className="hero__next-time">{next.time}</span>
                  <span className="hero__next-title">{next.item.title}</span>
                </>
              ) : entries.length ? (
                <span className="hero__next-title">Alles voor vandaag is gedaan</span>
              ) : (
                <span className="hero__next-title">Nog niets gepland</span>
              )}
            </p>
            <div className="hero__footer">
              <span className="hero__pill">
                <Utensils size={14} /> {dinner ? dinner.item.title : 'Nog geen avondeten'}
              </span>
              {activeGroceries.length > 0 && (
                <button type="button" className="hero__pill hero__pill--button" onClick={() => navigate({ name: 'groceries' })}>
                  <ShoppingBasket size={14} /> {activeGroceries.length}
                </button>
              )}
            </div>
          </section>

          <button type="button" className="ask-bar" onClick={() => ui.openSmartInput()}>
            <Sparkles size={18} className="text-accent" />
            <span>Wat wil je plannen?</span>
            <span className="ask-bar__send" aria-hidden="true">
              <Plus size={18} strokeWidth={2.4} />
            </span>
          </button>

          <section className="card">
            <div className="card__header">
              <h2 className="card__title">Vandaag</h2>
              <button type="button" className="icon-button icon-button--soft" aria-label="Iets toevoegen aan vandaag" onClick={() => ui.openAddChooser(today)}>
                <Plus size={18} />
              </button>
            </div>
            {entries.length ? (
              <DayTimeline entries={entries} nowMinutes={minutes} onSelect={select} onDelete={(e) => void remove(e)} />
            ) : (
              <EmptyState
                icon={Sun}
                title="Nog niets gepland voor vandaag."
                text="Geniet ervan — of plan iets in één zin."
                action={
                  <button type="button" className="button button--primary button--small" onClick={() => ui.openSmartInput()}>
                    <Plus size={16} /> Plan iets
                  </button>
                }
              />
            )}
            {note && (
              <button type="button" className="note-preview" onClick={() => navigate({ name: 'day', date: today })}>
                {note.text}
              </button>
            )}
          </section>
        </div>

        <div className="today-grid__side">
          <section className="card card--quiet">
            <button type="button" className="card__header card__header--link" onClick={() => navigate({ name: 'day', date: tomorrow })}>
              <h2 className="card__title">Morgen</h2>
              <span className="card__link">
                {capitalize(formatLongDate(tomorrow).split(' ')[0])} <ChevronRight size={16} />
              </span>
            </button>
            {tomorrowEntries.length ? (
              <DayTimeline entries={tomorrowEntries} onSelect={select} compact />
            ) : (
              <p className="muted-line">Nog niets gepland.</p>
            )}
          </section>

          <section className="card card--quiet">
            <button type="button" className="card__header card__header--link" onClick={() => navigate({ name: 'groceries' })}>
              <h2 className="card__title">Boodschappen</h2>
              <span className="card__link">
                {activeGroceries.length ? `${activeGroceries.length} ${activeGroceries.length === 1 ? 'product' : 'producten'}` : 'Lijst is leeg'}
                <ChevronRight size={16} />
              </span>
            </button>
            {groceryCategories.length > 0 && (
              <div className="tag-row">
                {groceryCategories.map(([cat, count]) => (
                  <span key={cat} className="tag">
                    {GROCERY_CATEGORY_MAP[cat].label} <b>{count}</b>
                  </span>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function TodaySkeleton() {
  return (
    <div className="page" aria-busy="true" aria-label="Laden">
      <div className="skeleton skeleton--text" style={{ width: 120 }} />
      <div className="skeleton skeleton--title" style={{ width: 240 }} />
      <div className="skeleton skeleton--hero" />
      <div className="skeleton skeleton--card" />
    </div>
  );
}
