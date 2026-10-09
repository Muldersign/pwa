import { CalendarDays, CalendarRange, ClipboardList, Ellipsis, Plus, ShoppingBasket, Sparkles, type LucideIcon } from 'lucide-react';
import type { Route, TabName } from '../state/router';

interface NavProps {
  active: TabName;
  onNavigate: (route: Route) => void;
  onAdd: () => void;
  groceryCount: number;
}

const TABS: { name: TabName; label: string; icon: LucideIcon; route: Route }[] = [
  { name: 'today', label: 'Vandaag', icon: CalendarDays, route: { name: 'today' } },
  { name: 'week', label: 'Week', icon: CalendarRange, route: { name: 'week' } },
  { name: 'groceries', label: 'Boodschappen', icon: ShoppingBasket, route: { name: 'groceries' } },
  { name: 'lists', label: 'Lijstjes', icon: ClipboardList, route: { name: 'lists' } },
  { name: 'more', label: 'Meer', icon: Ellipsis, route: { name: 'more' } },
];

function TabButton({ tab, active, onNavigate, badge }: { tab: (typeof TABS)[number]; active: boolean; onNavigate: NavProps['onNavigate']; badge?: number }) {
  const Icon = tab.icon;
  return (
    <button
      type="button"
      className={`tab ${active ? 'is-active' : ''}`}
      aria-current={active ? 'page' : undefined}
      onClick={() => onNavigate(tab.route)}
    >
      <span className="tab__icon">
        <Icon size={23} strokeWidth={active ? 2.3 : 1.9} />
        {badge ? <span className="tab__badge">{badge > 99 ? '99+' : badge}</span> : null}
      </span>
      <span className="tab__label">{tab.label}</span>
    </button>
  );
}

/** Fixed bottom bar for phones. */
export function BottomNavigation({ active, onNavigate, onAdd, groceryCount }: NavProps) {
  return (
    <nav className="bottom-nav" aria-label="Hoofdmenu">
      <TabButton tab={TABS[0]} active={active === 'today'} onNavigate={onNavigate} />
      <TabButton tab={TABS[1]} active={active === 'week'} onNavigate={onNavigate} />
      <div className="bottom-nav__center">
        <button type="button" className="fab" onClick={onAdd} aria-label="Iets plannen">
          <Plus size={28} strokeWidth={2.4} />
        </button>
      </div>
      <TabButton tab={TABS[2]} active={active === 'groceries'} onNavigate={onNavigate} badge={groceryCount} />
      <TabButton tab={TABS[3]} active={active === 'lists'} onNavigate={onNavigate} />
    </nav>
  );
}

/** Left sidebar for tablets and desktops. */
export function SideNavigation({ active, onNavigate, onAdd, groceryCount }: NavProps) {
  return (
    <aside className="side-nav" aria-label="Hoofdmenu">
      <div className="brand">
        <span className="brand__mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="18" height="18">
            <path d="M7 17.5l5.5 5.5L25 10.5" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="brand__name">Onze Week</span>
      </div>
      <button type="button" className="side-nav__add" onClick={onAdd}>
        <Sparkles size={18} />
        <span>Iets plannen</span>
        <kbd>N</kbd>
      </button>
      <div className="side-nav__tabs">
        {TABS.map((tab) => (
          <TabButton
            key={tab.name}
            tab={tab}
            active={active === tab.name}
            onNavigate={onNavigate}
            badge={tab.name === 'groceries' ? groceryCount : undefined}
          />
        ))}
      </div>
    </aside>
  );
}
