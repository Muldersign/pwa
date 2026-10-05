import { Fragment } from 'react';
import { entryEndMinutes, type TimelineEntry } from '../lib/timeline';
import { SwipeRow } from './SwipeRow';
import { TimelineItem } from './TimelineItem';

interface Props {
  entries: TimelineEntry[];
  /** Minutes since midnight; when set, past items are dimmed and a "now" marker is shown. */
  nowMinutes?: number;
  onSelect: (entry: TimelineEntry) => void;
  onDelete?: (entry: TimelineEntry) => void;
  compact?: boolean;
}

export function DayTimeline({ entries, nowMinutes, onSelect, onDelete, compact }: Props) {
  const nowIndex =
    nowMinutes === undefined ? -1 : entries.findIndex((e) => e.sortMinutes >= 0 && e.sortMinutes > nowMinutes);
  const showNow = nowMinutes !== undefined && nowIndex > 0;

  return (
    <ol className={`timeline ${compact ? 'timeline--compact' : ''}`}>
      {entries.map((entry, i) => {
        const past = nowMinutes !== undefined && entry.sortMinutes >= 0 && entryEndMinutes(entry) <= nowMinutes;
        return (
          <Fragment key={entry.id}>
            {showNow && i === nowIndex && (
              <li className="timeline__now" aria-label="Nu">
                <span>Nu</span>
              </li>
            )}
            <li className="timeline__row" style={{ animationDelay: `${Math.min(i, 8) * 35}ms` }}>
              <SwipeRow
                onEdit={onDelete ? () => onSelect(entry) : undefined}
                onDelete={onDelete ? () => onDelete(entry) : undefined}
              >
                <TimelineItem entry={entry} past={past} compact={compact} onSelect={() => onSelect(entry)} />
              </SwipeRow>
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}
