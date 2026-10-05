import { ArrowUp, CloudOff, HelpCircle, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ParseResult, PlannerAction } from '../domain/actions';
import type { ISODate } from '../domain/types';
import { executeActions, type Change } from '../services/actionExecutor';
import { AI_ENDPOINT, parseNaturalLanguageCommand } from '../services/nlp';
import { useData } from '../state/DataContext';
import { getSettings } from '../state/settings';
import { useOnline } from '../lib/useOnline';
import { Sheet } from './Sheet';
import { SmartConfirmation } from './SmartConfirmation';

interface Turn {
  id: number;
  input: string;
  status: 'thinking' | 'done' | 'clarify' | 'empty' | 'error';
  changes?: Change[];
  undo?: () => Promise<void>;
  undone?: boolean;
  clarification?: ParseResult['clarification'];
  error?: string;
}

const EXAMPLES = [
  'Dinsdag komende week pizza eten en om 19:45 trainen in Bareveld',
  'Haal melk, eieren, wraps, kip, paprika en cola',
  'Morgen om 19:00 trainen',
  'Vrijdag om 18:00 eten bij mijn ouders en daarna om 20:00 verjaardag bij Mark',
  'We eten donderdag toch geen pasta maar wraps',
  'Verplaats training dinsdag naar woensdag 20:00',
];

interface Props {
  open: boolean;
  prefill?: string;
  onClose: () => void;
  onOpenDay: (date: ISODate) => void;
}

export function SmartInputSheet({ open, prefill, onClose, onOpenDay }: Props) {
  const { repo } = useData();
  const online = useOnline();
  const [value, setValue] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  useEffect(() => {
    if (!open) return;
    if (prefill !== undefined) setValue(prefill);
    // Focus after the sheet animation so iOS opens the keyboard smoothly.
    const t = window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 280);
    return () => window.clearTimeout(t);
  }, [open, prefill]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [turns]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [value]);

  const patchTurn = (id: number, patch: Partial<Turn>) =>
    setTurns((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const run = async (id: number, actions: PlannerAction[]) => {
    const result = await executeActions(repo, actions);
    patchTurn(id, { status: 'done', changes: result.changes, undo: result.undo, clarification: undefined });
    if (navigator.vibrate) navigator.vibrate(8);
  };

  const submit = async (text = value) => {
    const input = text.trim();
    if (!input || busy) return;
    const id = nextId.current++;
    setTurns((ts) => [...ts, { id, input, status: 'thinking' }]);
    setValue('');
    setBusy(true);
    try {
      const started = performance.now();
      const parsed = await parseNaturalLanguageCommand(input, { useAI: getSettings().useAI });
      // A short, deliberate pause reads as "thinking" instead of a flicker.
      const elapsed = performance.now() - started;
      if (elapsed < 420) await new Promise((r) => setTimeout(r, 420 - elapsed));

      if (parsed.clarification) {
        patchTurn(id, { status: 'clarify', clarification: parsed.clarification });
      } else if (!parsed.actions.length) {
        patchTurn(id, { status: 'empty' });
      } else {
        await run(id, parsed.actions);
      }
    } catch (e) {
      patchTurn(id, { status: 'error', error: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  };

  const undo = async (turn: Turn) => {
    await turn.undo?.();
    patchTurn(turn.id, { undone: true });
  };

  const aiActive = !!AI_ENDPOINT && getSettings().useAI && online;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      size="tall"
      className="smart-sheet"
      title={
        <span className="smart-sheet__title">
          <Sparkles size={18} className="text-accent" /> Slim plannen
        </span>
      }
      footer={
        <form
          className="composer"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <label className="visually-hidden" htmlFor="smart-input">
            Wat wil je plannen?
          </label>
          <textarea
            id="smart-input"
            ref={inputRef}
            className="composer__input"
            rows={1}
            placeholder="Wat wil je plannen?"
            value={value}
            enterKeyHint="send"
            autoComplete="off"
            autoCorrect="on"
            spellCheck
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void submit();
              }
            }}
          />
          <button type="submit" className="composer__send" disabled={!value.trim() || busy} aria-label="Versturen">
            <ArrowUp size={20} strokeWidth={2.6} />
          </button>
        </form>
      }
    >
      <div className="chat" ref={scrollRef}>
        {turns.length === 0 && (
          <div className="chat__intro">
            <p className="chat__hello">Typ gewoon wat je wilt plannen.</p>
            <p className="chat__hint">
              Activiteiten, eten en boodschappen — ook meerdere tegelijk in één zin.
              {!aiActive && AI_ENDPOINT && !online && (
                <span className="chat__offline">
                  <CloudOff size={13} /> Offline: lokale verwerking
                </span>
              )}
            </p>
            <div className="chat__examples">
              {EXAMPLES.map((ex) => (
                <button key={ex} type="button" className="example" onClick={() => void submit(ex)}>
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {turns.map((turn) => (
          <div key={turn.id} className="turn">
            <div className="bubble bubble--user">{turn.input}</div>
            {turn.status === 'thinking' && (
              <div className="bubble bubble--assistant bubble--thinking" aria-label="Bezig met verwerken">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
            )}
            {turn.status === 'done' && turn.changes && (
              <SmartConfirmation
                changes={turn.changes}
                undone={turn.undone}
                onUndo={() => void undo(turn)}
                onOpenDay={(date) => {
                  onClose();
                  onOpenDay(date);
                }}
              />
            )}
            {turn.status === 'clarify' && turn.clarification && (
              <div className="bubble bubble--assistant">
                <p className="bubble__question">
                  <HelpCircle size={16} /> {turn.clarification.question}
                </p>
                <div className="bubble__choices">
                  {turn.clarification.options.map((opt) => (
                    <button key={opt.label} type="button" className="chip chip--choice" onClick={() => void run(turn.id, opt.actions)}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {turn.status === 'empty' && (
              <div className="bubble bubble--assistant">
                Dat begreep ik niet helemaal. Probeer bijvoorbeeld <em>“morgen 19:00 trainen”</em> of <em>“haal melk en brood”</em>.
              </div>
            )}
            {turn.status === 'error' && (
              <div className="bubble bubble--assistant bubble--error">Er ging iets mis bij het opslaan. Probeer het nog eens.</div>
            )}
          </div>
        ))}
      </div>
    </Sheet>
  );
}
