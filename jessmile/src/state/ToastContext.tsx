import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';

export interface ToastInput {
  text: string;
  tone?: 'default' | 'error';
  actionLabel?: string;
  onAction?: () => void | Promise<void>;
}
interface ToastItem extends ToastInput {
  id: number;
}

const Ctx = createContext<{ show: (t: ToastInput) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const show = useCallback((t: ToastInput) => {
    window.clearTimeout(timer.current);
    const item = { ...t, id: Date.now() };
    setToast(item);
    timer.current = window.setTimeout(() => setToast((cur) => (cur?.id === item.id ? null : cur)), t.actionLabel ? 6000 : 3800);
  }, []);
  const api = useMemo(() => ({ show }), [show]);
  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="toast-region" aria-live="polite" role="status">
        {toast && (
          <div key={toast.id} className={`toast ${toast.tone === 'error' ? 'toast-error' : ''}`}>
            <span>{toast.text}</span>
            {toast.actionLabel && (
              <button
                className="toast-action"
                onClick={async () => {
                  setToast(null);
                  await toast.onAction?.();
                }}
              >
                {toast.actionLabel}
              </button>
            )}
            <button className="toast-close" aria-label="Sluiten" onClick={() => setToast(null)}>
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useToast outside ToastProvider');
  return v;
}
