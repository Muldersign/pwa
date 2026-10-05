import { Plus, ShoppingBasket, Trash2, Wand2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { HOUSEHOLD } from '../config/household';
import type { Activity, ActivityCategory, Assignee, Ingredient, Meal, MealType } from '../domain/types';
import { CATEGORY_LABELS, MEAL_LABELS } from '../lib/timeline';
import { addMealIngredientsToGroceries } from '../services/actionExecutor';
import { categorizeActivity } from '../services/nlp/lexicon';
import { parseIngredientList, suggestIngredients } from '../services/recipes';
import { useData } from '../state/DataContext';
import type { EditorRequest } from '../state/UIContext';
import { CategoryIcon } from './CategoryIcon';
import { DateField, TimeField } from './DateTimeFields';
import { Sheet } from './Sheet';
import { useToast } from './Toast';

interface Props {
  request: EditorRequest | null;
  onClose: () => void;
}

const CATEGORIES: ActivityCategory[] = ['work', 'sport', 'social', 'home', 'appointment', 'travel', 'other'];
const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

interface FormState {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  notes: string;
  category: ActivityCategory;
  categoryTouched: boolean;
  mealType: MealType;
  ingredients: Ingredient[];
  assignedTo?: Assignee;
}

function initialState(req: EditorRequest): FormState {
  const base: FormState = {
    title: '',
    date: req.mode === 'create' ? req.date : req.item.date,
    startTime: '',
    endTime: '',
    location: '',
    notes: '',
    category: 'other',
    categoryTouched: false,
    mealType: 'dinner',
    ingredients: [],
  };
  if (req.mode === 'create') return base;
  if (req.kind === 'activity') {
    const a = req.item;
    return {
      ...base,
      title: a.title,
      startTime: a.startTime ?? '',
      endTime: a.endTime ?? '',
      location: a.location ?? '',
      notes: a.notes ?? '',
      category: a.category,
      categoryTouched: true,
      assignedTo: a.assignedTo,
    };
  }
  const m = req.item;
  return {
    ...base,
    title: m.title,
    startTime: m.time ?? '',
    location: m.location ?? '',
    notes: m.notes ?? '',
    mealType: m.mealType,
    ingredients: m.ingredients ?? [],
    assignedTo: m.assignedTo,
  };
}

export function ItemEditorSheet({ request, onClose }: Props) {
  const { repo } = useData();
  const toast = useToast();
  const [form, setForm] = useState<FormState | null>(request ? initialState(request) : null);
  const [ingredientDraft, setIngredientDraft] = useState('');
  const [lastRequest, setLastRequest] = useState(request);

  useEffect(() => {
    if (request) {
      setForm(initialState(request));
      setIngredientDraft('');
      setLastRequest(request);
    }
  }, [request]);

  const req = request ?? lastRequest;
  if (!req || !form) return <Sheet open={false} onClose={onClose}>{null}</Sheet>;

  const isMeal = req.kind === 'meal';
  const set = (patch: Partial<FormState>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const canSave = form.title.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(form.date);
  const suggestion = isMeal && form.title.trim() ? suggestIngredients(form.title) : [];

  const save = async () => {
    if (!canSave) return;
    const title = form.title.trim().replace(/^./, (c) => c.toUpperCase());
    if (isMeal) {
      const data = {
        title,
        date: form.date,
        mealType: form.mealType,
        time: form.startTime || undefined,
        location: form.location.trim() || undefined,
        notes: form.notes.trim() || undefined,
        ingredients: form.ingredients,
        assignedTo: form.assignedTo,
      };
      if (req.mode === 'edit') await repo.updateMeal(req.item.id, data);
      else await repo.addMeal(data);
    } else {
      const data = {
        title,
        date: form.date,
        startTime: form.startTime || undefined,
        endTime: form.endTime || undefined,
        location: form.location.trim() || undefined,
        notes: form.notes.trim() || undefined,
        category: form.categoryTouched ? form.category : categorizeActivity(title),
        assignedTo: form.assignedTo,
      };
      if (req.mode === 'edit') await repo.updateActivity(req.item.id, data);
      else await repo.addActivity(data);
    }
    toast({ message: req.mode === 'edit' ? 'Opgeslagen' : 'Toegevoegd' });
    onClose();
  };

  const remove = async () => {
    if (req.mode !== 'edit') return;
    if (req.kind === 'meal') {
      const item: Meal = req.item;
      await repo.deleteMeal(item.id);
      toast({ message: `${item.title} verwijderd`, action: { label: 'Ongedaan maken', onClick: () => repo.putMeal(item) } });
    } else {
      const item: Activity = req.item;
      await repo.deleteActivity(item.id);
      toast({ message: `${item.title} verwijderd`, action: { label: 'Ongedaan maken', onClick: () => repo.putActivity(item) } });
    }
    onClose();
  };

  const addIngredients = (text: string) => {
    const parsed = parseIngredientList(text);
    if (!parsed.length) return;
    set({ ingredients: [...form.ingredients, ...parsed.filter((p) => !form.ingredients.some((i) => i.name.toLowerCase() === p.name.toLowerCase()))] });
    setIngredientDraft('');
  };

  const sendIngredientsToList = async () => {
    if (req.mode !== 'edit' || req.kind !== 'meal') return;
    // Persist edits first so the grocery link uses the current ingredient list.
    await repo.updateMeal(req.item.id, { ingredients: form.ingredients });
    const result = await addMealIngredientsToGroceries(repo, { ...req.item, ingredients: form.ingredients });
    const added = result.changes.filter((c) => c.kind === 'added' || c.kind === 'restored').length;
    toast({
      message: added ? `${added} ${added === 1 ? 'product' : 'producten'} op je lijst gezet` : 'Alles stond al op je lijst',
      tone: added ? 'success' : 'info',
      action: added ? { label: 'Ongedaan maken', onClick: result.undo } : undefined,
    });
  };

  const titleText = req.mode === 'edit' ? (isMeal ? 'Maaltijd wijzigen' : 'Activiteit wijzigen') : isMeal ? 'Maaltijd toevoegen' : 'Activiteit toevoegen';

  return (
    <Sheet
      open={!!request}
      onClose={onClose}
      title={titleText}
      footer={
        <div className="editor-footer">
          {req.mode === 'edit' && (
            <button type="button" className="button button--danger-soft" onClick={() => void remove()}>
              <Trash2 size={17} /> Verwijderen
            </button>
          )}
          <button type="button" className="button button--primary" disabled={!canSave} onClick={() => void save()}>
            {req.mode === 'edit' ? 'Opslaan' : 'Toevoegen'}
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
          <label htmlFor="ed-title" className="field__label">
            {isMeal ? 'Wat eten jullie?' : 'Wat ga je doen?'}
          </label>
          <input
            id="ed-title"
            className="input input--large"
            value={form.title}
            placeholder={isMeal ? 'Bijv. Pasta pesto' : 'Bijv. Training'}
            onChange={(e) => set({ title: e.target.value })}
            autoComplete="off"
            enterKeyHint="done"
          />
        </div>

        {isMeal ? (
          <div className="field">
            <span className="field__label">Maaltijd</span>
            <div className="segmented" role="radiogroup">
              {MEAL_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={form.mealType === t}
                  className={form.mealType === t ? 'is-active' : ''}
                  onClick={() => set({ mealType: t })}
                >
                  {t === 'dinner' ? 'Avond' : MEAL_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="field-row">
          <div className="field">
            <label htmlFor="ed-date" className="field__label">Datum</label>
            <DateField id="ed-date" value={form.date} onChange={(date) => set({ date })} />
          </div>
          <div className="field">
            <label htmlFor="ed-start" className="field__label">{isMeal ? 'Tijd' : 'Van'}</label>
            <TimeField id="ed-start" value={form.startTime} onChange={(startTime) => set({ startTime })} />
          </div>
          {!isMeal && (
            <div className="field">
              <label htmlFor="ed-end" className="field__label">Tot</label>
              <TimeField id="ed-end" value={form.endTime} onChange={(endTime) => set({ endTime })} />
            </div>
          )}
        </div>

        <div className="field">
          <label htmlFor="ed-location" className="field__label">Locatie</label>
          <input
            id="ed-location"
            className="input"
            value={form.location}
            placeholder="Optioneel"
            onChange={(e) => set({ location: e.target.value })}
          />
        </div>

        {!isMeal && (
          <div className="field">
            <span className="field__label">Soort</span>
            <div className="category-picker">
              {CATEGORIES.map((c) => {
                const active = (form.categoryTouched ? form.category : categorizeActivity(form.title)) === c;
                return (
                  <button
                    key={c}
                    type="button"
                    className={`category-option ${active ? 'is-active' : ''}`}
                    onClick={() => set({ category: c, categoryTouched: true })}
                    aria-pressed={active}
                  >
                    <CategoryIcon tone={c} size="sm" />
                    <span>{CATEGORY_LABELS[c]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {isMeal && (
          <div className="field">
            <span className="field__label">Ingrediënten</span>
            {form.ingredients.length > 0 && (
              <ul className="ingredient-list">
                {form.ingredients.map((ing, i) => (
                  <li key={`${ing.name}-${i}`} className="ingredient">
                    <span>{ing.name}</span>
                    <button
                      type="button"
                      aria-label={`${ing.name} verwijderen`}
                      onClick={() => set({ ingredients: form.ingredients.filter((_, j) => j !== i) })}
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="inline-add">
              <input
                className="input"
                value={ingredientDraft}
                placeholder="Ingrediënt toevoegen…"
                enterKeyHint="enter"
                onChange={(e) => setIngredientDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addIngredients(ingredientDraft);
                  }
                }}
              />
              <button type="button" className="icon-button icon-button--soft" aria-label="Ingrediënt toevoegen" onClick={() => addIngredients(ingredientDraft)}>
                <Plus size={18} />
              </button>
            </div>
            <div className="ingredient-actions">
              {form.ingredients.length === 0 && suggestion.length > 0 && (
                <button type="button" className="chip chip--ghost" onClick={() => set({ ingredients: suggestion })}>
                  <Wand2 size={15} /> Voorstel: {suggestion.map((s) => s.name).join(', ')}
                </button>
              )}
              {req.mode === 'edit' && form.ingredients.length > 0 && (
                <button type="button" className="chip chip--accent" onClick={() => void sendIngredientsToList()}>
                  <ShoppingBasket size={15} /> Voeg ingrediënten toe aan boodschappen
                </button>
              )}
            </div>
          </div>
        )}

        <div className="field">
          <span className="field__label">Voor wie</span>
          <div className="segmented">
            <button type="button" className={!form.assignedTo ? 'is-active' : ''} onClick={() => set({ assignedTo: undefined })}>
              —
            </button>
            {HOUSEHOLD.map((p) => (
              <button key={p.id} type="button" className={form.assignedTo === p.id ? 'is-active' : ''} onClick={() => set({ assignedTo: p.id })}>
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="ed-notes" className="field__label">Notitie</label>
          <textarea id="ed-notes" className="input textarea" rows={2} value={form.notes} placeholder="Optioneel" onChange={(e) => set({ notes: e.target.value })} />
        </div>
        <button type="submit" hidden />
      </form>
    </Sheet>
  );
}
