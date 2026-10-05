import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  icon: LucideIcon;
  title: string;
  text?: string;
  action?: ReactNode;
  compact?: boolean;
}

export function EmptyState({ icon: Icon, title, text, action, compact }: Props) {
  return (
    <div className={`empty ${compact ? 'empty--compact' : ''}`}>
      <span className="empty__icon">
        <Icon size={compact ? 20 : 26} strokeWidth={1.8} />
      </span>
      <p className="empty__title">{title}</p>
      {text && <p className="empty__text">{text}</p>}
      {action}
    </div>
  );
}
