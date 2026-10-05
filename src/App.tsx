import { useEffect, useRef } from 'react';
import { AppShell } from './components/AppShell';
import { ToastProvider } from './components/Toast';
import { DataProvider, useData } from './state/DataContext';
import { SyncProvider } from './sync/SyncContext';
import { tabOf, useHashRouter, type Route } from './state/router';
import { DayView } from './views/DayView';
import { GroceryView } from './views/GroceryView';
import { MoreView } from './views/MoreView';
import { TodayView } from './views/TodayView';
import { WeekView } from './views/WeekView';
import { TriangleAlert } from 'lucide-react';

function Screens() {
  const { route, query, navigate } = useHashRouter();
  const { status, error, reload } = useData();
  const previous = useRef<Route | null>(null);
  const current = useRef<Route>(route);

  if (current.current !== route) {
    previous.current = current.current;
    current.current = route;
  }

  // Scroll to top when switching tabs or days (not when changing week).
  const scrollKey = route.name === 'day' ? `day-${route.date}` : tabOf(route);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [scrollKey]);

  const autoOpen = query.get('invoer') === '1';

  let screen: React.ReactNode;
  if (status === 'error') {
    screen = (
      <div className="page">
        <div className="empty">
          <span className="empty__icon"><TriangleAlert size={26} /></span>
          <p className="empty__title">Je gegevens konden niet worden geladen</p>
          <p className="empty__text">{error ?? 'Onbekende fout'} — probeer het opnieuw. Gebruik je een privévenster? Daar is opslag soms uitgeschakeld.</p>
          <button type="button" className="button button--primary button--small" onClick={() => void reload()}>Opnieuw proberen</button>
        </div>
      </div>
    );
  } else {
    switch (route.name) {
      case 'today':
        screen = <TodayView navigate={navigate} />;
        break;
      case 'week':
        screen = <WeekView week={route.week} navigate={navigate} />;
        break;
      case 'day':
        screen = <DayView date={route.date} navigate={navigate} canGoBack={previous.current !== null} />;
        break;
      case 'groceries':
        screen = <GroceryView />;
        break;
      case 'more':
        screen = <MoreView />;
        break;
    }
  }

  return (
    <AppShell route={route} navigate={navigate} autoOpenInput={autoOpen}>
      <div key={tabOf(route) + (route.name === 'day' ? '-day' : '')} className="screen">
        {screen}
      </div>
    </AppShell>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <DataProvider>
        <SyncProvider>
          <Screens />
        </SyncProvider>
      </DataProvider>
    </ToastProvider>
  );
}
