import {
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  HelpCircle,
  MapPin,
  Minus,
  Pencil,
  Plus,
  Settings,
  Share,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { DateField, TimeField } from '../components/DateTimeFields';
import { EmptyState } from '../components/EmptyState';
import { Sheet } from '../components/Sheet';
import { SwipeRow } from '../components/SwipeRow';
import { useToast } from '../components/Toast';
import type { ListItem, ListItemStatus, PlannerList } from '../domain/types';
import { capitalize, formatLongDate, todayISO } from '../lib/dates';
import { listStats, STATUS_LABELS, type ListStats } from '../lib/listStatus';
import { useData } from '../state/DataContext';
import type { Route } from '../state/router';
import { useUI } from '../state/UIContext';

type Navigate = (r: Route, o?: { replace?: boolean }) => void;

function dateLine(list: PlannerList): string | undefined {
  if (!list.date) return undefined;
  return `${capitalize(formatLongDate(list.date))}${list.time ? ` · ${list.time}` : ''}`;
}

/** Segmented bar: komt / misschien / niet / geen reactie. */
function StatsBar({ stats }: { stats: ListStats }) {
  if (!stats.total) return <div className="rsvp-bar rsvp-bar--empty" />;
  const pct = (n: number) => `${(n / stats.total) * 100}%`;
  return (
    <div className="rsvp-bar" role="img" aria-label={`${stats.yes} komen, ${stats.maybe} misschien, ${stats.no} niet, ${stats.pending} geen reactie`}>
      <span className="rsvp-bar__seg rsvp-bar__seg--yes" style={{ width: pct(stats.yes) }} />
      <span className="rsvp-bar__seg rsvp-bar__seg--maybe" style={{ width: pct(stats.maybe) }} />
      <span className="rsvp-bar__seg rsvp-bar__seg--no" style={{ width: pct(stats.no) }} />
    </div>
  );
}

function statsLine(s: ListStats): string {
  const parts = [`${s.yes} ${s.yes === 1 ? 'komt' : 'komen'}`];
  if (s.maybe) parts.push(`${s.maybe} misschien`);
  if (s.no) parts.push(`${s.no} niet`);
  if (s.pending) parts.push(`${s.pending} nog geen reactie`);
  return parts.join(' · ');
}

/* -------------------------------------------------------------------------- */
/*  Overview                                                                  */
/* -------------------------------------------------------------------------- */

export function ListsView({ navigate }: { navigate: Navigate }) {
  const { lists, listItems, status } = useData();
  const [editing, setEditing] = useState<PlannerList | 'new' | null>(null);
  const today = todayISO();

  const sorted = useMemo(() => {
    const rank = (l: PlannerList) => (l.archived ? 2 : l.date && l.date < today ? 1 : 0);
    return [...lists].sort((a, b) => rank(a) - rank(b) || (a.date ?? '9999').localeCompare(b.date ?? '9999') || a.title.localeCompare(b.title));
  }, [lists, today]);

  return (
    <div className="page page--lists">
      <header className="page-header page-header--row">
        <div>
          <h1 className="page-header__title">Lijstjes</h1>
          <p className="page-header__sub">{lists.length ? `${lists.length} ${lists.length === 1 ? 'lijst' : 'lijsten'}` : 'Gastenlijsten en meer'}</p>
        </div>
        <div className="header-actions">
          <button type="button" className="icon-button icon-button--soft mobile-only" aria-label="Meer en instellingen" onClick={() => navigate({ name: 'more' })}>
            <Settings size={18} />
          </button>
          <button type="button" className="chip chip--accent" onClick={() => setEditing('new')}>
            <Plus size={16} /> Nieuwe lijst
          </button>
        </div>
      </header>

      {status !== 'loading' && !lists.length && (
        <EmptyState
          icon={ClipboardList}
          title="Nog geen lijstjes"
          text="Maak een gastenlijst voor een feestje en houd bij wie er komt."
          action={
            <button type="button" className="button button--primary button--small" onClick={() => setEditing('new')}>
              <Plus size={16} /> Nieuwe lijst
            </button>
          }
        />
      )}

      <div className="list-cards">
        {sorted.map((list, idx) => {
          const items = listItems.filter((i) => i.listId === list.id);
          const stats = listStats(items);
          const past = list.archived || (list.date && list.date < today);
          return (
            <button
              key={list.id}
              type="button"
              className={`list-card ${past ? 'is-past' : ''}`}
              style={{ animationDelay: `${idx * 40}ms` }}
              onClick={() => navigate({ name: 'list', id: list.id })}
            >
              <span className="list-card__top">
                <span className="list-card__icon">
                  <Users size={20} />
                </span>
                <span className="list-card__titles">
                  <span className="list-card__title">{list.title}</span>
                  {dateLine(list) && <span className="list-card__date">{dateLine(list)}</span>}
                </span>
                <span className="list-card__count">
                  <b>{stats.yes}</b>/{stats.total}
                </span>
                <ChevronRight size={18} className="text-soft" />
              </span>
              <StatsBar stats={stats} />
              <span className="list-card__stats">{statsLine(stats)}</span>
            </button>
          );
        })}
      </div>

      <ListEditorSheet
        list={editing === 'new' ? null : editing}
        open={editing !== null}
        onClose={() => setEditing(null)}
        onCreated={(l) => navigate({ name: 'list', id: l.id })}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  One list                                                                  */
/* -------------------------------------------------------------------------- */

type Filter = 'all' | ListItemStatus;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Iedereen' },
  { id: 'yes', label: 'Komt' },
  { id: 'maybe', label: 'Misschien' },
  { id: 'no', label: 'Niet' },
  { id: 'pending', label: 'Geen reactie' },
];

export function ListDetailView({ id, canGoBack, navigate }: { id: string; canGoBack: boolean; navigate: Navigate }) {
  const { lists, listItems, repo, status } = useData();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>('all');
  const [editingList, setEditingList] = useState(false);
  const [editingItem, setEditingItem] = useState<ListItem | null>(null);
  const list = lists.find((l) => l.id === id);
  const items = useMemo(
    () => listItems.filter((i) => i.listId === id).sort((a, b) => a.position - b.position || a.createdAt.localeCompare(b.createdAt)),
    [listItems, id],
  );
  const stats = listStats(items);

  const back = () => (canGoBack ? history.back() : navigate({ name: 'lists' }));

  if (!list) {
    return (
      <div className="page">
        <button type="button" className="back-button" onClick={() => navigate({ name: 'lists' })}>
          <ChevronLeft size={22} /> Lijstjes
        </button>
        {status !== 'loading' && <EmptyState icon={ClipboardList} title="Deze lijst bestaat niet meer" />}
      </div>
    );
  }

  const setStatus = async (item: ListItem, next: ListItemStatus) => {
    const value = item.status === next ? 'pending' : next;
    if (navigator.vibrate) navigator.vibrate(6);
    await repo.updateListItem(item.id, { status: value });
  };

  const removeItem = async (item: ListItem) => {
    await repo.deleteListItem(item.id);
    toast({ message: `${item.name} verwijderd`, action: { label: 'Ongedaan maken', onClick: () => repo.putListItem(item) } });
  };

  const addNames = async (text: string) => {
    const names = text
      .split(/\s*,\s*|\s+en\s+|\n/i)
      .map((n) => n.trim())
      .filter(Boolean);
    if (!names.length) return false;
    let position = Math.max(-1, ...items.map((i) => i.position));
    const existing = new Set(items.map((i) => i.name.toLowerCase()));
    let added = 0;
    for (const name of names) {
      if (existing.has(name.toLowerCase())) continue;
      await repo.addListItem({ listId: id, name: capitalize(name), status: 'pending', position: ++position });
      added++;
    }
    if (added < names.length) toast({ message: added ? `${added} toegevoegd, de rest stond er al` : 'Die staan al op de lijst', tone: 'info' });
    return true;
  };

  const share = async () => {
    const group = (s: ListItemStatus) => items.filter((i) => i.status === s).map((i) => (i.count && i.count > 1 ? `${i.name} (${i.count})` : i.name));
    const text = [
      `${list.title}${list.date ? ` — ${dateLine(list)}` : ''}`,
      `${stats.yes} komen (${stats.people} personen), ${stats.maybe} misschien, ${stats.no} niet, ${stats.pending} nog geen reactie`,
      '',
      `✅ Komt: ${group('yes').join(', ') || '—'}`,
      `❔ Misschien: ${group('maybe').join(', ') || '—'}`,
      `❌ Komt niet: ${group('no').join(', ') || '—'}`,
      `⏳ Nog geen reactie: ${group('pending').join(', ') || '—'}`,
    ].join('\n');
    if (navigator.share) {
      try {
        await navigator.share({ title: list.title, text });
        return;
      } catch {
        // cancelled: fall back to copying
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      toast({ message: 'Overzicht gekopieerd' });
    } catch {
      toast({ message: 'Kopiëren lukte niet', tone: 'error' });
    }
  };

  const visible = filter === 'all' ? items : items.filter((i) => i.status === filter);
  const count = (f: Filter) => (f === 'all' ? stats.total : stats[f]);

  return (
    <div className="page page--list" key={id}>
      <header className="day-header">
        <button type="button" className="back-button" onClick={back}>
          <ChevronLeft size={22} /> Lijstjes
        </button>
        <div className="day-header__nav">
          <button type="button" className="icon-button" aria-label="Overzicht delen" onClick={() => void share()}>
            <Share size={19} />
          </button>
          <button type="button" className="icon-button" aria-label="Lijst wijzigen" onClick={() => setEditingList(true)}>
            <Pencil size={19} />
          </button>
        </div>
      </header>

      <div className="day-title">
        <h1 className="page-header__title">{list.title}</h1>
        <p className="list-meta">
          {list.date && (
            <span>
              <Clock size={14} /> {dateLine(list)}
            </span>
          )}
          {list.location && (
            <span>
              <MapPin size={14} /> {list.location}
            </span>
          )}
        </p>
        {list.notes && <p className="list-notes">{list.notes}</p>}
      </div>

      <section className="rsvp-summary">
        <div className="rsvp-summary__numbers">
          <div>
            <span className="rsvp-summary__big">{stats.yes}</span>
            <span className="rsvp-summary__label">{stats.yes === 1 ? 'komt' : 'komen'}</span>
          </div>
          {stats.people !== stats.yes && (
            <div className="rsvp-summary__people">
              <Users size={15} /> {stats.people} personen
            </div>
          )}
          <div className="rsvp-summary__of">van {stats.total} uitgenodigd</div>
        </div>
        <StatsBar stats={stats} />
        <div className="filter-chips" role="tablist">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              className={`filter-chip filter-chip--${f.id} ${filter === f.id ? 'is-active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label} <b>{count(f.id)}</b>
            </button>
          ))}
        </div>
      </section>

      {items.length === 0 ? (
        <EmptyState compact icon={Users} title="Nog niemand op deze lijst" text="Voeg hieronder namen toe, gescheiden door komma's." />
      ) : visible.length === 0 ? (
        <p className="muted-line center">Niemand in deze groep.</p>
      ) : (
        <ul className="guest-list">
          {visible.map((item) => (
            <li key={item.id} className={`guest guest--${item.status}`}>
              <SwipeRow onEdit={() => setEditingItem(item)} onDelete={() => void removeItem(item)}>
                <div className="guest__row">
                  <button type="button" className="guest__name" onClick={() => setEditingItem(item)}>
                    <span className="guest__title">
                      {item.name}
                      {item.count && item.count > 1 ? <span className="guest__count">+{item.count - 1}</span> : null}
                    </span>
                    <span className="guest__status">{STATUS_LABELS[item.status]}{item.note ? ` · ${item.note}` : ''}</span>
                  </button>
                  <div className="rsvp-buttons" role="group" aria-label={`Reactie van ${item.name}`}>
                    <button
                      type="button"
                      className={`rsvp-btn rsvp-btn--yes ${item.status === 'yes' ? 'is-active' : ''}`}
                      aria-pressed={item.status === 'yes'}
                      aria-label={`${item.name} komt`}
                      onClick={() => void setStatus(item, 'yes')}
                    >
                      <Check size={18} strokeWidth={2.6} />
                    </button>
                    <button
                      type="button"
                      className={`rsvp-btn rsvp-btn--maybe ${item.status === 'maybe' ? 'is-active' : ''}`}
                      aria-pressed={item.status === 'maybe'}
                      aria-label={`${item.name} misschien`}
                      onClick={() => void setStatus(item, 'maybe')}
                    >
                      <HelpCircle size={18} strokeWidth={2.3} />
                    </button>
                    <button
                      type="button"
                      className={`rsvp-btn rsvp-btn--no ${item.status === 'no' ? 'is-active' : ''}`}
                      aria-pressed={item.status === 'no'}
                      aria-label={`${item.name} komt niet`}
                      onClick={() => void setStatus(item, 'no')}
                    >
                      <X size={18} strokeWidth={2.6} />
                    </button>
                  </div>
                </div>
              </SwipeRow>
            </li>
          ))}
        </ul>
      )}

      <AddNamesInput onAdd={addNames} />

      <ListEditorSheet list={list} open={editingList} onClose={() => setEditingList(false)} onDeleted={() => navigate({ name: 'lists' }, { replace: true })} />
      <GuestEditorSheet item={editingItem} onClose={() => setEditingItem(null)} />
    </div>
  );
}

function AddNamesInput({ onAdd }: { onAdd: (text: string) => Promise<boolean> }) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const submit = async () => {
    if (!value.trim() || busy) return;
    setBusy(true);
    const ok = await onAdd(value);
    setBusy(false);
    if (ok) setValue('');
    ref.current?.focus();
  };
  return (
    <form
      className="add-item"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <input
        ref={ref}
        className="add-item__input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Naam toevoegen…"
        aria-label="Naam toevoegen"
        enterKeyHint="done"
        autoComplete="off"
        autoCapitalize="words"
      />
      <button type="submit" className="add-item__button" disabled={!value.trim() || busy} aria-label="Toevoegen">
        <ArrowUp size={18} strokeWidth={2.6} />
      </button>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sheets                                                                    */
/* -------------------------------------------------------------------------- */

function ListEditorSheet({
  list,
  open,
  onClose,
  onCreated,
  onDeleted,
}: {
  list: PlannerList | null;
  open: boolean;
  onClose: () => void;
  onCreated?: (l: PlannerList) => void;
  onDeleted?: () => void;
}) {
  const { repo } = useData();
  const ui = useUI();
  const toast = useToast();
  const [seed, setSeed] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [names, setNames] = useState('');

  // Reset the form whenever the sheet opens for another list.
  const key = open ? (list?.id ?? 'new') : null;
  if (key !== seed) {
    setSeed(key);
    if (key) {
      setTitle(list?.title ?? '');
      setDate(list?.date ?? '');
      setTime(list?.time ?? '');
      setLocation(list?.location ?? '');
      setNotes(list?.notes ?? '');
      setNames('');
    }
  }

  const save = async () => {
    if (!title.trim()) return;
    const data = {
      title: capitalize(title.trim()),
      date: date || undefined,
      time: time || undefined,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
    };
    if (list) {
      await repo.updateList(list.id, data);
      toast({ message: 'Opgeslagen' });
      onClose();
    } else {
      const created = await repo.addList(data);
      const people = names
        .split(/\s*,\s*|\s+en\s+|\n/i)
        .map((n) => n.replace(/^\d+[.)]\s*/, '').trim())
        .filter(Boolean);
      for (const [position, name] of people.entries()) {
        await repo.addListItem({ listId: created.id, name: capitalize(name), status: 'pending', position });
      }
      onClose();
      onCreated?.(created);
    }
  };

  const remove = async () => {
    if (!list) return;
    const ok = await ui.confirm({
      title: `“${list.title}” verwijderen?`,
      message: 'De lijst en alle namen worden verwijderd.',
      confirmLabel: 'Verwijderen',
      destructive: true,
    });
    if (!ok) return;
    const removed = await repo.deleteList(list.id);
    onClose();
    onDeleted?.();
    if (removed) {
      toast({
        message: `${list.title} verwijderd`,
        action: {
          label: 'Ongedaan maken',
          onClick: async () => {
            await repo.putList(removed.list);
            for (const i of removed.items) await repo.putListItem(i);
          },
        },
      });
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={list ? 'Lijst wijzigen' : 'Nieuwe lijst'}
      footer={
        <div className="editor-footer">
          {list && (
            <button type="button" className="button button--danger-soft" onClick={() => void remove()}>
              <Trash2 size={17} /> Verwijderen
            </button>
          )}
          <button type="button" className="button button--primary" disabled={!title.trim()} onClick={() => void save()}>
            {list ? 'Opslaan' : 'Aanmaken'}
          </button>
        </div>
      }
    >
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <div className="field">
          <label className="field__label" htmlFor="ls-title">Naam</label>
          <input id="ls-title" className="input input--large" value={title} placeholder="Bijv. Verjaardag familie" onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field-row">
          <div className="field">
            <label className="field__label" htmlFor="ls-date">Datum</label>
            <DateField id="ls-date" value={date} onChange={setDate} />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="ls-time">Tijd</label>
            <TimeField id="ls-time" value={time} onChange={setTime} />
          </div>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="ls-loc">Locatie</label>
          <input id="ls-loc" className="input" value={location} placeholder="Optioneel" onChange={(e) => setLocation(e.target.value)} />
        </div>
        {!list && (
          <div className="field">
            <label className="field__label" htmlFor="ls-names">Namen</label>
            <textarea
              id="ls-names"
              className="input textarea"
              rows={4}
              value={names}
              placeholder={'Eén per regel of met komma’s:\nOma, Gerard, Hannah'}
              onChange={(e) => setNames(e.target.value)}
            />
          </div>
        )}
        <div className="field">
          <label className="field__label" htmlFor="ls-notes">Notitie</label>
          <textarea id="ls-notes" className="input textarea" rows={2} value={notes} placeholder="Optioneel" onChange={(e) => setNotes(e.target.value)} />
        </div>
        <button type="submit" hidden />
      </form>
    </Sheet>
  );
}

function GuestEditorSheet({ item, onClose }: { item: ListItem | null; onClose: () => void }) {
  const { repo } = useData();
  const [seed, setSeed] = useState<ListItem | null>(null);
  const [name, setName] = useState('');
  const [count, setCount] = useState(1);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<ListItemStatus>('pending');

  if (item && item !== seed) {
    setSeed(item);
    setName(item.name);
    setCount(item.count ?? 1);
    setNote(item.note ?? '');
    setStatus(item.status);
  }

  const save = async () => {
    if (!seed || !name.trim()) return;
    await repo.updateListItem(seed.id, {
      name: name.trim(),
      count: count > 1 ? count : undefined,
      note: note.trim() || undefined,
      status,
    });
    onClose();
  };

  return (
    <Sheet
      open={!!item}
      onClose={onClose}
      title="Gast wijzigen"
      footer={
        <div className="editor-footer">
          <button type="button" className="button button--primary" disabled={!name.trim()} onClick={() => void save()}>
            Opslaan
          </button>
        </div>
      }
    >
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <div className="field">
          <label className="field__label" htmlFor="gs-name">Naam</label>
          <input id="gs-name" className="input input--large" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <span className="field__label">Reactie</span>
          <div className="segmented">
            {(['yes', 'maybe', 'no', 'pending'] as ListItemStatus[]).map((s) => (
              <button key={s} type="button" className={status === s ? 'is-active' : ''} onClick={() => setStatus(s)}>
                {s === 'pending' ? 'Nog niet' : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <span className="field__label">Aantal personen</span>
          <div className="stepper">
            <button type="button" className="icon-button icon-button--soft" aria-label="Minder" disabled={count <= 1} onClick={() => setCount((c) => Math.max(1, c - 1))}>
              <Minus size={18} />
            </button>
            <span className="stepper__value">{count}</span>
            <button type="button" className="icon-button icon-button--soft" aria-label="Meer" onClick={() => setCount((c) => Math.min(20, c + 1))}>
              <Plus size={18} />
            </button>
            <span className="stepper__hint">{count > 1 ? `${name || 'Deze gast'} + ${count - 1}` : 'Alleen deze persoon'}</span>
          </div>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="gs-note">Notitie</label>
          <input id="gs-note" className="input" value={note} placeholder="Bijv. komt later, neemt taart mee" onChange={(e) => setNote(e.target.value)} />
        </div>
        <button type="submit" hidden />
      </form>
    </Sheet>
  );
}
