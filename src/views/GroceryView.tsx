import { ArrowUp, Check, ChevronDown, Eye, EyeOff, PartyPopper, ShoppingBasket, Trash2 } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { Sheet } from '../components/Sheet';
import { SwipeRow } from '../components/SwipeRow';
import { useToast } from '../components/Toast';
import type { GroceryCategory, GroceryItem } from '../domain/types';
import { executeActions } from '../services/actionExecutor';
import { categorizeGrocery, GROCERY_CATEGORIES, GROCERY_CATEGORY_MAP } from '../services/groceryCategorizer';
import { parseGroceryInput } from '../services/nlp/localParser';
import { useData } from '../state/DataContext';
import { useSettings } from '../state/settings';
import { useUI } from '../state/UIContext';

function quantityLabel(g: GroceryItem): string | undefined {
  if (!g.quantity && !g.unit) return undefined;
  if (g.quantity && g.unit) return `${g.quantity} ${g.unit}`;
  return g.quantity ? `${g.quantity}×` : g.unit;
}

export function GroceryView() {
  const { groceries, repo, status } = useData();
  const ui = useUI();
  const toast = useToast();
  const [settings, updateSettings] = useSettings();
  const [pending, setPending] = useState<Record<string, 'checking' | 'leaving'>>({});
  const [editing, setEditing] = useState<GroceryItem | null>(null);
  const timers = useRef<number[]>([]);

  const active = groceries.filter((g) => !g.completed);
  const completed = groceries
    .filter((g) => g.completed)
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));

  const groups = useMemo(() => {
    const map = new Map<GroceryCategory, GroceryItem[]>();
    for (const g of active) {
      if (!map.has(g.category)) map.set(g.category, []);
      map.get(g.category)!.push(g);
    }
    return [...map.entries()]
      .sort((a, b) => GROCERY_CATEGORY_MAP[a[0]].order - GROCERY_CATEGORY_MAP[b[0]].order)
      .map(([cat, items]) => [cat, items.sort((a, b) => a.createdAt.localeCompare(b.createdAt))] as const);
  }, [active]);

  const check = (item: GroceryItem) => {
    if (pending[item.id]) return;
    if (navigator.vibrate) navigator.vibrate(6);
    setPending((p) => ({ ...p, [item.id]: 'checking' }));
    timers.current.push(
      window.setTimeout(() => setPending((p) => ({ ...p, [item.id]: 'leaving' })), 300),
      window.setTimeout(async () => {
        await repo.updateGrocery(item.id, { completed: true, completedAt: new Date().toISOString() });
        setPending((p) => {
          const next = { ...p };
          delete next[item.id];
          return next;
        });
      }, 520),
    );
  };

  const uncheck = (item: GroceryItem) => repo.updateGrocery(item.id, { completed: false, completedAt: undefined });

  const removeItem = async (item: GroceryItem) => {
    await repo.deleteGrocery(item.id);
    toast({ message: `${item.name} verwijderd`, action: { label: 'Ongedaan maken', onClick: () => repo.putGrocery(item) } });
  };

  const clearCompleted = async () => {
    const ok = await ui.confirm({
      title: 'Afgevinkte producten wissen?',
      message: `${completed.length} ${completed.length === 1 ? 'product wordt' : 'producten worden'} van je lijst verwijderd.`,
      confirmLabel: 'Wissen',
      destructive: true,
    });
    if (!ok) return;
    const removed = await repo.clearCompletedGroceries();
    toast({
      message: 'Afgevinkte producten gewist',
      action: { label: 'Ongedaan maken', onClick: async () => { for (const g of removed) await repo.putGrocery(g); } },
    });
  };

  const addFromInput = async (text: string) => {
    const actions = parseGroceryInput(text);
    if (!actions.length) return false;
    const result = await executeActions(repo, actions);
    const exists = result.changes.filter((c) => c.kind === 'exists');
    const added = result.changes.filter((c) => c.kind === 'added' || c.kind === 'restored');
    if (exists.length && !added.length) {
      const name = exists[0].entity === 'grocery' ? exists[0].item.name : '';
      toast({ message: exists.length === 1 ? `${name} staat al op je lijst.` : 'Die staan al op je lijst.', tone: 'info' });
    } else if (added.length === 1 && added[0].kind === 'restored' && !exists.length) {
      toast({ message: `${added[0].entity === 'grocery' ? added[0].item.name : ''} staat weer op je lijst` });
    } else if (added.length > 1 || exists.length) {
      toast({
        message: `${added.length} toegevoegd${exists.length ? `, ${exists.length} stond${exists.length === 1 ? '' : 'en'} er al` : ''}`,
        action: { label: 'Ongedaan maken', onClick: result.undo },
      });
    }
    return true;
  };

  return (
    <div className="page page--groceries">
      <header className="page-header page-header--row">
        <div>
          <h1 className="page-header__title">Boodschappen</h1>
          <p className="page-header__sub">
            {active.length === 0 ? 'Niets meer te halen' : `${active.length} ${active.length === 1 ? 'product' : 'producten'}`}
          </p>
        </div>
        {completed.length > 0 && (
          <button
            type="button"
            className="chip chip--ghost"
            onClick={() => updateSettings({ showCompletedGroceries: !settings.showCompletedGroceries })}
            aria-pressed={settings.showCompletedGroceries}
          >
            {settings.showCompletedGroceries ? <EyeOff size={15} /> : <Eye size={15} />}
            {settings.showCompletedGroceries ? 'Verberg afgevinkt' : 'Toon afgevinkt'}
          </button>
        )}
      </header>

      {status !== 'loading' && groceries.length === 0 && (
        <EmptyState
          icon={ShoppingBasket}
          title="Je lijst is leeg"
          text="Voeg hieronder iets toe, of zeg in de slimme invoer: “haal melk, brood en kaas”."
        />
      )}
      {active.length === 0 && completed.length > 0 && (
        <EmptyState icon={PartyPopper} title="Alles is gehaald" text="Lekker bezig. Wis de afgevinkte producten of voeg iets nieuws toe." />
      )}

      <div className="grocery-groups">
        {groups.map(([cat, items]) => (
          <section key={cat} className="grocery-group">
            <h2 className="grocery-group__title">
              {GROCERY_CATEGORY_MAP[cat].label}
              <span>{items.length}</span>
            </h2>
            <ul className="grocery-list">
              {items.map((item) => (
                <li key={item.id} className={`grocery-list__row ${pending[item.id] === 'leaving' ? 'is-leaving' : ''}`}>
                  <div className="grocery-list__inner">
                    <SwipeRow onEdit={() => setEditing(item)} onDelete={() => void removeItem(item)}>
                      <button
                        type="button"
                        className={`grocery-item ${pending[item.id] ? 'is-checked' : ''}`}
                        onClick={() => check(item)}
                        aria-label={`${item.name} afvinken`}
                      >
                        <span className="checkbox" aria-hidden="true">
                          <Check size={16} strokeWidth={3} />
                        </span>
                        <span className="grocery-item__name">{item.name}</span>
                        {quantityLabel(item) && <span className="grocery-item__qty">{quantityLabel(item)}</span>}
                      </button>
                    </SwipeRow>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {completed.length > 0 && (
        <section className={`completed ${settings.showCompletedGroceries ? 'is-open' : ''}`}>
          <div className="completed__header">
            <button
              type="button"
              className="completed__toggle"
              onClick={() => updateSettings({ showCompletedGroceries: !settings.showCompletedGroceries })}
              aria-expanded={settings.showCompletedGroceries}
            >
              Afgevinkt ({completed.length}) <ChevronDown size={16} />
            </button>
            <button type="button" className="text-button text-button--danger" onClick={() => void clearCompleted()}>
              <Trash2 size={15} /> Wis afgevinkte producten
            </button>
          </div>
          <div className="completed__body">
            <div>
              <ul className="grocery-list grocery-list--done">
                {completed.map((item) => (
                  <li key={item.id}>
                    <button type="button" className="grocery-item is-done" onClick={() => void uncheck(item)} aria-label={`${item.name} terugzetten`}>
                      <span className="checkbox" aria-hidden="true">
                        <Check size={16} strokeWidth={3} />
                      </span>
                      <span className="grocery-item__name">{item.name}</span>
                      {quantityLabel(item) && <span className="grocery-item__qty">{quantityLabel(item)}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      <AddItemInput onAdd={addFromInput} />
      <GroceryEditSheet item={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function AddItemInput({ onAdd }: { onAdd: (text: string) => Promise<boolean> }) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = async () => {
    const text = value.trim();
    if (!text || busy) return;
    setBusy(true);
    const ok = await onAdd(text);
    setBusy(false);
    if (ok) setValue('');
    inputRef.current?.focus();
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
        ref={inputRef}
        className="add-item__input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Product toevoegen…"
        aria-label="Product toevoegen"
        enterKeyHint="done"
        autoComplete="off"
        autoCapitalize="sentences"
      />
      <button type="submit" className="add-item__button" disabled={!value.trim() || busy} aria-label="Toevoegen">
        <ArrowUp size={18} strokeWidth={2.6} />
      </button>
    </form>
  );
}

function GroceryEditSheet({ item, onClose }: { item: GroceryItem | null; onClose: () => void }) {
  const { repo } = useData();
  const [last, setLast] = useState<GroceryItem | null>(item);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [category, setCategory] = useState<GroceryCategory>('other');

  if (item && item !== last) {
    setLast(item);
    setName(item.name);
    setQuantity(item.quantity ? String(item.quantity) : '');
    setUnit(item.unit ?? '');
    setCategory(item.category);
  }

  const save = async () => {
    if (!last || !name.trim()) return;
    const q = Number(quantity.replace(',', '.'));
    await repo.updateGrocery(last.id, {
      name: name.trim().replace(/^./, (c) => c.toUpperCase()),
      quantity: quantity && q > 0 ? q : undefined,
      unit: unit.trim() || undefined,
      category,
    });
    onClose();
  };

  return (
    <Sheet
      open={!!item}
      onClose={onClose}
      title="Product wijzigen"
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
          <label className="field__label" htmlFor="gr-name">Product</label>
          <input
            id="gr-name"
            className="input input--large"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (last && category === last.category) setCategory(categorizeGrocery(e.target.value));
            }}
          />
        </div>
        <div className="field-row">
          <div className="field">
            <label className="field__label" htmlFor="gr-q">Aantal</label>
            <input id="gr-q" className="input" inputMode="decimal" value={quantity} placeholder="—" onChange={(e) => setQuantity(e.target.value)} />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="gr-u">Eenheid</label>
            <input id="gr-u" className="input" value={unit} placeholder="bijv. l, kg, pak" onChange={(e) => setUnit(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <span className="field__label">Categorie</span>
          <div className="pill-picker">
            {GROCERY_CATEGORIES.map((c) => (
              <button key={c.id} type="button" className={category === c.id ? 'is-active' : ''} onClick={() => setCategory(c.id)}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <button type="submit" hidden />
      </form>
    </Sheet>
  );
}
