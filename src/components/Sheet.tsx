import { X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  /** Visually hidden title for screen readers when no visible title is shown. */
  ariaLabel?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** "tall" sheets fill most of the screen (smart input). */
  size?: 'auto' | 'tall';
  className?: string;
  headerAction?: ReactNode;
}

const EXIT_MS = 240;

/**
 * Bottom sheet on phones, centered dialog on larger screens.
 * Supports drag-to-dismiss on the grabber, Escape and backdrop tap.
 */
export function Sheet({ open, onClose, title, ariaLabel, children, footer, size = 'auto', className = '', headerAction }: SheetProps) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const [dragY, setDragY] = useState(0);
  const drag = useRef<{ startY: number; pointerId: number } | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    const t = window.setTimeout(() => {
      setMounted(false);
      setDragY(0);
    }, EXIT_MS);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.documentElement.classList.add('has-sheet');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.documentElement.classList.remove('has-sheet');
    };
  }, [open, onClose]);

  if (!mounted) return null;

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { startY: e.clientY, pointerId: e.pointerId };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setDragY(Math.max(0, e.clientY - drag.current.startY));
  };
  const onPointerUp = () => {
    if (!drag.current) return;
    drag.current = null;
    if (dragY > 90) onClose();
    else setDragY(0);
  };

  return (
    <div className={`sheet-layer ${visible ? 'is-visible' : ''}`}>
      <div className="sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        className={`sheet sheet--${size} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : ariaLabel}
        style={dragY ? { transform: `translateY(${dragY}px)`, transition: 'none' } : undefined}
      >
        <div
          className="sheet__grab"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <span className="sheet__handle" />
        </div>
        {(title || headerAction) && (
          <header className="sheet__header">
            <h2 id={titleId} className="sheet__title">
              {title}
            </h2>
            <div className="sheet__header-actions">
              {headerAction}
              <button type="button" className="icon-button icon-button--soft" onClick={onClose} aria-label="Sluiten">
                <X size={18} />
              </button>
            </div>
          </header>
        )}
        <div className="sheet__body">{children}</div>
        {footer && <footer className="sheet__footer">{footer}</footer>}
      </div>
    </div>
  );
}
