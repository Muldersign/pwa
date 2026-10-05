import {
  Briefcase,
  Cake,
  CalendarDays,
  Car,
  Coffee,
  Cookie,
  Dumbbell,
  House,
  PartyPopper,
  Sandwich,
  Stethoscope,
  Utensils,
  type LucideIcon,
} from 'lucide-react';
import type { ActivityCategory, MealType } from '../domain/types';

export type Tone = ActivityCategory | 'meal';

const ACTIVITY_ICONS: Record<ActivityCategory, LucideIcon> = {
  work: Briefcase,
  sport: Dumbbell,
  social: PartyPopper,
  home: House,
  appointment: Stethoscope,
  travel: Car,
  other: CalendarDays,
};

const MEAL_ICONS: Record<MealType, LucideIcon> = {
  breakfast: Coffee,
  lunch: Sandwich,
  dinner: Utensils,
  snack: Cookie,
};

interface Props {
  tone: Tone;
  mealType?: MealType;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function CategoryIcon({ tone, mealType, title, size = 'md' }: Props) {
  let Icon: LucideIcon = tone === 'meal' ? MEAL_ICONS[mealType ?? 'dinner'] : ACTIVITY_ICONS[tone];
  if (tone === 'social' && title && /verjaardag|jarig/i.test(title)) Icon = Cake;
  const px = size === 'sm' ? 15 : size === 'lg' ? 22 : 18;
  return (
    <span className={`cat-icon cat-icon--${size} tone-${tone}`} aria-hidden="true">
      <Icon size={px} strokeWidth={2} />
    </span>
  );
}
