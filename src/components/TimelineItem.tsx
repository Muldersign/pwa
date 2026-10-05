import { MapPin } from 'lucide-react';
import { assigneeName } from '../config/household';
import { MEAL_LABELS, type TimelineEntry } from '../lib/timeline';
import { CategoryIcon } from './CategoryIcon';

interface Props {
  entry: TimelineEntry;
  past?: boolean;
  compact?: boolean;
  onSelect?: () => void;
}

const MEAL_SHORT: Record<string, string> = {
  breakfast: 'Ochtend',
  lunch: 'Middag',
  snack: 'Middag',
  dinner: 'Avond',
};

export function TimelineItem({ entry, past, compact, onSelect }: Props) {
  const isMeal = entry.kind === 'meal';
  const item = entry.item;
  const timeLabel = entry.time ?? (isMeal ? MEAL_SHORT[entry.item.mealType] : 'Hele dag');

  const details: string[] = [];
  if (isMeal) details.push(MEAL_LABELS[entry.item.mealType]);
  if (entry.kind === 'activity' && entry.endTime && entry.time) details.push(`tot ${entry.endTime}`);
  const location = item.location;
  const who = assigneeName(item.assignedTo);

  return (
    <button
      type="button"
      className={`tl-item ${past ? 'is-past' : ''} ${compact ? 'tl-item--compact' : ''}`}
      onClick={onSelect}
    >
      <span className={`tl-item__time ${entry.time ? '' : 'is-soft'}`}>{timeLabel}</span>
      <CategoryIcon
        tone={isMeal ? 'meal' : entry.item.category}
        mealType={isMeal ? entry.item.mealType : undefined}
        title={item.title}
        size={compact ? 'sm' : 'md'}
      />
      <span className="tl-item__body">
        <span className="tl-item__title">{item.title}</span>
        {(details.length > 0 || location) && (
          <span className="tl-item__meta">
            {details.join(' · ')}
            {details.length > 0 && location ? ' · ' : ''}
            {location && (
              <span className="tl-item__location">
                <MapPin size={12} strokeWidth={2.2} />
                {location}
              </span>
            )}
          </span>
        )}
      </span>
      {who && !compact && (
        <span className={`avatar avatar--${item.assignedTo}`} title={who}>
          {who.charAt(0)}
        </span>
      )}
    </button>
  );
}
