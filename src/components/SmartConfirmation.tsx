import { ArrowRight, Check, Info, MapPin, Undo2 } from 'lucide-react';
import type { ISODate } from '../domain/types';
import { capitalize, formatLongDate, formatWeekday, relativeDayLabel } from '../lib/dates';
import { MEAL_LABELS } from '../lib/timeline';
import type { Change } from '../services/actionExecutor';
import { CategoryIcon } from './CategoryIcon';

interface Props {
  changes: Change[];
  undone?: boolean;
  onUndo?: () => void;
  onOpenDay?: (date: ISODate) => void;
}

const MEAL_SHORT: Record<string, string> = { breakfast: 'Ochtend', lunch: 'Middag', snack: 'Middag', dinner: 'Avond' };

const isEffective = (c: Change) => c.kind !== 'exists' && c.kind !== 'notFound';

function dateOf(c: Change): ISODate | undefined {
  if (c.entity === 'activity' || c.entity === 'meal') return c.item.date;
  return undefined;
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

export function headline(changes: Change[]): { text: string; ok: boolean } {
  const effective = changes.filter(isEffective);
  if (!effective.length) return { text: 'Niets gewijzigd', ok: false };
  const kinds = new Set(effective.map((c) => (c.kind === 'restored' ? 'added' : c.kind)));
  const planned = effective.filter((c) => c.entity === 'activity' || c.entity === 'meal');
  const groceries = effective.filter((c) => c.entity === 'grocery');

  if (kinds.size === 1 && kinds.has('added')) {
    const dates = new Set(planned.map(dateOf));
    if (planned.length && !groceries.length && dates.size === 1) {
      const d = [...dates][0]!;
      const label = relativeDayLabel(d);
      const day = label === 'vandaag' || label === 'morgen' || label === 'overmorgen' ? label : formatWeekday(d);
      return { text: planned.length === 1 ? `Toegevoegd aan ${day}` : `${plural(planned.length, 'item', 'items')} toegevoegd aan ${day}`, ok: true };
    }
    if (!planned.length) return { text: `${plural(groceries.length, 'product', 'producten')} op je lijst gezet`, ok: true };
    return { text: `${plural(effective.length, 'item', 'items')} toegevoegd`, ok: true };
  }
  if (kinds.size === 1 && kinds.has('removed')) return { text: 'Verwijderd', ok: true };
  if (kinds.size === 1 && kinds.has('moved')) return { text: 'Verplaatst', ok: true };
  if (kinds.size === 1 && kinds.has('updated')) return { text: 'Gewijzigd', ok: true };
  return { text: 'Bijgewerkt', ok: true };
}

const VERB: Record<string, string> = {
  added: '',
  restored: 'Weer op je lijst',
  removed: 'Verwijderd',
  moved: 'Verplaatst',
  updated: 'Gewijzigd',
};

function ChangeRow({ change }: { change: Change }) {
  if (change.entity === 'unknown') {
    return (
      <li className="confirm-row confirm-row--note">
        <Info size={16} />
        <span>
          Ik kon “{change.query}” niet vinden{change.date ? ` op ${formatLongDate(change.date)}` : ''}.
        </span>
      </li>
    );
  }
  if (change.kind === 'exists') {
    const name = change.entity === 'grocery' ? change.item.name : change.item.title;
    return (
      <li className="confirm-row confirm-row--note">
        <Info size={16} />
        <span>
          {change.entity === 'grocery' ? `${name} staat al op je lijst.` : `${name} staat al gepland.`}
        </span>
      </li>
    );
  }
  if (change.entity === 'grocery') {
    return (
      <li className={`confirm-row ${change.kind === 'removed' ? 'is-removed' : ''}`}>
        <span className="confirm-row__check" aria-hidden="true">
          <Check size={12} strokeWidth={3} />
        </span>
        <span className="confirm-row__title">{change.item.name}</span>
        {change.kind !== 'added' && <span className="confirm-row__tag">{VERB[change.kind]}</span>}
      </li>
    );
  }
  const isMeal = change.entity === 'meal';
  const time = isMeal ? change.item.time : change.item.startTime;
  const sub = isMeal ? MEAL_LABELS[change.item.mealType] : undefined;
  const moveText =
    change.kind === 'moved' && change.before
      ? `${capitalize(formatWeekday(change.item.date))}${time ? ` · ${time}` : ''}`
      : undefined;
  return (
    <li className={`confirm-row ${change.kind === 'removed' ? 'is-removed' : ''}`}>
      <span className={`confirm-row__time ${time ? '' : 'is-soft'}`}>{time ?? (isMeal ? MEAL_SHORT[change.item.mealType] : '')}</span>
      <CategoryIcon tone={isMeal ? 'meal' : change.item.category} mealType={isMeal ? change.item.mealType : undefined} title={change.item.title} size="sm" />
      <span className="confirm-row__body">
        <span className="confirm-row__title">{change.item.title}</span>
        {(sub || change.item.location || moveText) && (
          <span className="confirm-row__meta">
            {moveText ? (
              <>
                <ArrowRight size={12} /> {moveText}
              </>
            ) : (
              <>
                {sub}
                {sub && change.item.location ? ' · ' : ''}
                {change.item.location && (
                  <>
                    <MapPin size={11} /> {change.item.location}
                  </>
                )}
              </>
            )}
          </span>
        )}
      </span>
      {change.kind !== 'added' && change.kind !== 'moved' && <span className="confirm-row__tag">{VERB[change.kind]}</span>}
    </li>
  );
}

export function SmartConfirmation({ changes, undone, onUndo, onOpenDay }: Props) {
  const head = headline(changes);
  // Group planner changes per day; groceries get their own group.
  const groups = new Map<string, Change[]>();
  for (const c of changes) {
    const key = c.entity === 'grocery' ? 'grocery' : c.entity === 'unknown' ? 'notes' : (dateOf(c) ?? 'notes');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(c);
  }
  const ordered = [...groups.entries()].sort(([a], [b]) => {
    const rank = (k: string) => (k === 'notes' ? 2 : k === 'grocery' ? 1 : 0);
    return rank(a) - rank(b) || a.localeCompare(b);
  });
  const canUndo = !!onUndo && changes.some(isEffective);
  const firstDate = changes.map(dateOf).find(Boolean);

  return (
    <div className={`confirm-card ${undone ? 'is-undone' : ''}`}>
      <div className="confirm-card__head">
        <span className={`confirm-card__badge ${head.ok ? '' : 'is-neutral'}`}>
          {head.ok ? <Check size={14} strokeWidth={3} /> : <Info size={14} strokeWidth={2.5} />}
        </span>
        <span className="confirm-card__headline">{undone ? 'Ongedaan gemaakt' : head.text}</span>
      </div>
      {ordered.map(([key, list]) => (
        <section key={key} className="confirm-group">
          {key !== 'notes' && (
            <h4 className="confirm-group__title">{key === 'grocery' ? 'Boodschappen' : capitalize(formatLongDate(key))}</h4>
          )}
          <ul>
            {list.map((c, i) => (
              <ChangeRow key={i} change={c} />
            ))}
          </ul>
        </section>
      ))}
      {!undone && (canUndo || (firstDate && onOpenDay)) && (
        <div className="confirm-card__actions">
          {canUndo && (
            <button type="button" className="chip chip--ghost chip--small" onClick={onUndo}>
              <Undo2 size={15} /> Ongedaan maken
            </button>
          )}
          {firstDate && onOpenDay && changes.some((c) => c.entity !== 'grocery' && isEffective(c) && c.kind !== 'removed') && (
            <button type="button" className="chip chip--ghost chip--small" onClick={() => onOpenDay(firstDate)}>
              Bekijk {relativeDayLabel(firstDate).split(' ')[0]} <ArrowRight size={15} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
