import { BarChart3, CalendarDays, House, Settings } from 'lucide-react';
import type { Tab } from '../state/router';
import { haptic } from '../lib/haptics';

const ITEMS: { tab: Tab; label: string; Icon: typeof House }[] = [
  { tab: 'vandaag', label: 'Vandaag', Icon: House },
  { tab: 'kalender', label: 'Kalender', Icon: CalendarDays },
  { tab: 'statistieken', label: 'Statistieken', Icon: BarChart3 },
  { tab: 'instellingen', label: 'Instellingen', Icon: Settings },
];

export function TabBar({ active, onSelect }: { active: Tab; onSelect: (t: Tab) => void }) {
  return (
    <nav className="tabbar" aria-label="Hoofdmenu">
      {ITEMS.map(({ tab, label, Icon }) => (
        <button
          key={tab}
          className={`tab ${active === tab ? 'tab-active' : ''}`}
          aria-current={active === tab ? 'page' : undefined}
          onClick={() => {
            if (active !== tab) haptic(6);
            onSelect(tab);
          }}
        >
          <span className="tab-icon">
            <Icon size={22} strokeWidth={active === tab ? 2.3 : 1.8} />
          </span>
          <span className="tab-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}
