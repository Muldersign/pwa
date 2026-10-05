import { Pencil, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

interface SwipeRowProps {
  children: ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

const ACTION_WIDTH = 76;
const CLOSE_OTHERS = 'swipe-row-open';

/**
 * Row that reveals edit/delete actions when swiped left. Taps still reach the
 * content; vertical scrolling is untouched (touch-action: pan-y).
 */
export function SwipeRow({ children, onEdit, onDelete, className = '' }: SwipeRowProps) {
  const actionsCount = (onEdit ? 1 : 0) + (onDelete ? 1 : 0);
  const max = actionsCount * ACTION_WIDTH;
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; y: number; base: number; locked?: 'x' | 'y' } | null>(null);
  const moved = useRef(false);
  const id = useRef(Math.random());

  useEffect(() => {
    const onOther = (e: Event) => {
      if ((e as CustomEvent).detail !== id.current) setOffset(0);
    };
    window.addEventListener(CLOSE_OTHERS, onOther);
    return () => window.removeEventListener(CLOSE_OTHERS, onOther);
  }, []);

  if (!actionsCount) return <div className={className}>{children}</div>;

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    start.current = { x: e.clientX, y: e.clientY, base: offset };
    moved.current = false;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const s = start.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (!s.locked) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      s.locked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (s.locked === 'x') {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        setDragging(true);
        window.dispatchEvent(new CustomEvent(CLOSE_OTHERS, { detail: id.current }));
      }
    }
    if (s.locked !== 'x') return;
    moved.current = true;
    const next = Math.min(0, Math.max(-max - 24, s.base + dx));
    setOffset(next);
  };
  const onPointerUp = () => {
    const s = start.current;
    start.current = null;
    setDragging(false);
    if (s?.locked !== 'x') return;
    setOffset((o) => (o < -max / 2 ? -max : 0));
  };

  return (
    <div className={`swipe-row ${offset !== 0 || dragging ? 'is-active' : ''} ${className}`}>
      <div className="swipe-row__actions" style={{ width: max }} aria-hidden={offset === 0}>
        {onEdit && (
          <button
            type="button"
            className="swipe-row__action swipe-row__action--edit"
            tabIndex={offset === 0 ? -1 : 0}
            onClick={() => {
              setOffset(0);
              onEdit();
            }}
          >
            <Pencil size={18} />
            <span>Wijzig</span>
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            className="swipe-row__action swipe-row__action--delete"
            tabIndex={offset === 0 ? -1 : 0}
            onClick={() => {
              setOffset(0);
              onDelete();
            }}
          >
            <Trash2 size={18} />
            <span>Verwijder</span>
          </button>
        )}
      </div>
      <div
        className={`swipe-row__content ${dragging ? 'is-dragging' : ''}`}
        style={{ transform: offset ? `translateX(${offset}px)` : undefined }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={(e) => {
          if (moved.current || offset !== 0) {
            e.stopPropagation();
            e.preventDefault();
            if (!moved.current) setOffset(0);
            moved.current = false;
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
