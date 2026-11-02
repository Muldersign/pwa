import { ChevronRight, LogIn, LogOut, MessageSquareText } from 'lucide-react';
import type { BraceEvent } from '../domain/types';
import { formatClock, dayKey, formatShortDate } from '../lib/time';

interface Props {
  events: BraceEvent[];
  onEdit?: (e: BraceEvent) => void;
  /** Show the date when an event is not on this day (e.g. carried over from yesterday) */
  dayKeyFor?: string;
  carried?: BraceEvent | null;
}

export function MomentList({ events, onEdit, carried, dayKeyFor }: Props) {
  const rows = carried ? [carried, ...events] : events;
  if (!rows.length) return <p className="empty-inline">Nog geen momenten geregistreerd.</p>;
  return (
    <ol className="moments">
      {rows.map((e) => {
        const otherDay = dayKeyFor && dayKey(e.at) !== dayKeyFor;
        const Icon = e.kind === 'in' ? LogIn : LogOut;
        const content = (
          <>
            <span className={`moment-icon moment-${e.kind}`}>
              <Icon size={16} />
            </span>
            <span className="moment-main">
              <span className="moment-title">
                <strong>{formatClock(e.at)}</strong> · Beugel {e.kind === 'in' ? 'in' : 'uit'}
                {otherDay && <span className="chip-mini">{formatShortDate(dayKey(e.at))}</span>}
                {e.source === 'manual' && <span className="chip-mini">handmatig</span>}
              </span>
              {e.note && (
                <span className="moment-note">
                  <MessageSquareText size={13} /> {e.note}
                </span>
              )}
            </span>
            {onEdit && <ChevronRight size={18} className="moment-chevron" />}
          </>
        );
        return (
          <li key={e.id}>
            {onEdit ? (
              <button className="moment" onClick={() => onEdit(e)} aria-label={`Moment ${formatClock(e.at)} bewerken`}>
                {content}
              </button>
            ) : (
              <div className="moment">{content}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
