import { CloudOff, Sparkles, Utensils, CalendarPlus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { ISODate } from '../domain/types';
import { formatLongDate, capitalize } from '../lib/dates';
import { useOnline } from '../lib/useOnline';
import { useData } from '../state/DataContext';
import { tabOf, type Route } from '../state/router';
import { UIContext, type ConfirmRequest, type EditorRequest, type UIActions } from '../state/UIContext';
import { ItemEditorSheet } from './ItemEditorSheet';
import { BottomNavigation, SideNavigation } from './Navigation';
import { Sheet } from './Sheet';
import { SmartInputSheet } from './SmartInputSheet';

interface Props {
  route: Route;
  navigate: (route: Route) => void;
  autoOpenInput?: boolean;
  children: ReactNode;
}

/** Keeps --kb (keyboard height) and --vvh (visible height) in sync for iOS. */
function useVisualViewportVars() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      document.documentElement.style.setProperty('--kb', `${Math.round(kb)}px`);
      document.documentElement.style.setProperty('--vvh', `${Math.round(vv.height)}px`);
      // On iOS the layout viewport does not shrink for the keyboard, so fixed
      // bars are lifted manually. Android (resizes-content) reports kb ≈ 0.
      const focusedField = document.activeElement?.matches('input, textarea') ?? false;
      document.documentElement.classList.toggle('kb-open', kb > 80 || (focusedField && vv.height < window.screen.height * 0.6));
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    const delayed = () => window.setTimeout(update, 50);
    document.addEventListener('focusin', delayed);
    document.addEventListener('focusout', delayed);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      document.removeEventListener('focusin', delayed);
      document.removeEventListener('focusout', delayed);
    };
  }, []);
}

export function AppShell({ route, navigate, autoOpenInput, children }: Props) {
  const { groceries } = useData();
  const online = useOnline();
  const [smartOpen, setSmartOpen] = useState(false);
  const [prefill, setPrefill] = useState<string | undefined>();
  const [editor, setEditor] = useState<EditorRequest | null>(null);
  const [chooserDate, setChooserDate] = useState<ISODate | null>(null);
  const [confirmState, setConfirmState] = useState<(ConfirmRequest & { resolve: (v: boolean) => void }) | null>(null);
  const lastConfirm = useRef<ConfirmRequest | null>(null);
  useVisualViewportVars();

  const openSmartInput = useCallback((text?: string) => {
    setPrefill(text);
    setSmartOpen(true);
  }, []);

  useEffect(() => {
    if (autoOpenInput) openSmartInput();
  }, [autoOpenInput, openSmartInput]);

  // Keyboard shortcut on desktop: "n" opens the smart input.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('input, textarea, select, [contenteditable]')) return;
      if (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        openSmartInput();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openSmartInput]);

  const ui = useMemo<UIActions>(
    () => ({
      openSmartInput,
      openEditor: (r) => setEditor(r),
      openAddChooser: (d) => setChooserDate(d),
      confirm: (r) =>
        new Promise<boolean>((resolve) => {
          lastConfirm.current = r;
          setConfirmState({ ...r, resolve });
        }),
    }),
    [openSmartInput],
  );

  const activeCount = groceries.filter((g) => !g.completed).length;
  const tab = tabOf(route);
  const confirmView = confirmState ?? lastConfirm.current;

  const closeConfirm = (value: boolean) => {
    confirmState?.resolve(value);
    setConfirmState(null);
  };

  return (
    <UIContext.Provider value={ui}>
      <div className="shell">
        <SideNavigation active={tab} onNavigate={navigate} onAdd={() => openSmartInput()} groceryCount={activeCount} />
        <main className="main" id="main">
          {!online && (
            <div className="offline-banner" role="status">
              <CloudOff size={14} /> Offline — alles blijft gewoon werken en wordt lokaal bewaard
            </div>
          )}
          {children}
        </main>
        <BottomNavigation active={tab} onNavigate={navigate} onAdd={() => openSmartInput()} groceryCount={activeCount} />
      </div>

      <SmartInputSheet
        open={smartOpen}
        prefill={prefill}
        onClose={() => setSmartOpen(false)}
        onOpenDay={(date) => navigate({ name: 'day', date })}
      />

      <ItemEditorSheet request={editor} onClose={() => setEditor(null)} />

      <Sheet
        open={!!chooserDate}
        onClose={() => setChooserDate(null)}
        title={chooserDate ? capitalize(formatLongDate(chooserDate)) : ''}
      >
        <div className="chooser">
          <button
            type="button"
            className="chooser__option chooser__option--smart"
            onClick={() => {
              const d = chooserDate;
              setChooserDate(null);
              if (d) openSmartInput(`${formatLongDate(d).split(' ')[0]} `);
            }}
          >
            <span className="chooser__icon"><Sparkles size={20} /></span>
            <span>
              <strong>Slim plannen</strong>
              <small>Typ het in één zin</small>
            </span>
          </button>
          <button
            type="button"
            className="chooser__option"
            onClick={() => {
              const d = chooserDate!;
              setChooserDate(null);
              setEditor({ mode: 'create', kind: 'activity', date: d });
            }}
          >
            <span className="chooser__icon tone-sport"><CalendarPlus size={20} /></span>
            <span>
              <strong>Activiteit</strong>
              <small>Afspraak, sport, werk…</small>
            </span>
          </button>
          <button
            type="button"
            className="chooser__option"
            onClick={() => {
              const d = chooserDate!;
              setChooserDate(null);
              setEditor({ mode: 'create', kind: 'meal', date: d });
            }}
          >
            <span className="chooser__icon tone-meal"><Utensils size={20} /></span>
            <span>
              <strong>Maaltijd</strong>
              <small>Ontbijt, lunch of avondeten</small>
            </span>
          </button>
        </div>
      </Sheet>

      <Sheet open={!!confirmState} onClose={() => closeConfirm(false)} ariaLabel={confirmView?.title}>
        {confirmView && (
          <div className="confirm-dialog">
            <h2>{confirmView.title}</h2>
            {confirmView.message && <p>{confirmView.message}</p>}
            <div className="confirm-dialog__actions">
              <button type="button" className="button button--secondary" onClick={() => closeConfirm(false)}>
                Annuleren
              </button>
              <button
                type="button"
                className={`button ${confirmView.destructive ? 'button--danger' : 'button--primary'}`}
                onClick={() => closeConfirm(true)}
              >
                {confirmView.confirmLabel}
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </UIContext.Provider>
  );
}
