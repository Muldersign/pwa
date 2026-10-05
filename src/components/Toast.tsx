import { Check, Info, TriangleAlert } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

export interface ToastOptions {
  message: string;
  tone?: 'success' | 'info' | 'error';
  action?: { label: string; onClick: () => void | Promise<void> };
  duration?: number;
}

interface ActiveToast extends ToastOptions {
  id: number;
  leaving?: boolean;
}

const ToastContext = createContext<(t: ToastOptions) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ActiveToast | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToast((t) => (t && t.id === id ? { ...t, leaving: true } : t));
    window.setTimeout(() => setToast((t) => (t && t.id === id ? null : t)), 220);
  }, []);

  const show = useCallback(
    (options: ToastOptions) => {
      const id = ++counter.current;
      window.clearTimeout(timer.current);
      setToast({ ...options, id });
      timer.current = window.setTimeout(() => dismiss(id), options.duration ?? (options.action ? 5000 : 2600));
    },
    [dismiss],
  );

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const Icon = toast?.tone === 'error' ? TriangleAlert : toast?.tone === 'info' ? Info : Check;

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toast-region" aria-live="polite">
        {toast && (
          <div key={toast.id} className={`toast toast--${toast.tone ?? 'success'} ${toast.leaving ? 'is-leaving' : ''}`} role="status">
            <span className="toast__icon">
              <Icon size={16} strokeWidth={2.5} />
            </span>
            <span className="toast__message">{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                className="toast__action"
                onClick={async () => {
                  dismiss(toast.id);
                  await toast.action?.onClick();
                }}
              >
                {toast.action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
