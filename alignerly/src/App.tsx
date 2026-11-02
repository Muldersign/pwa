import { useEffect, useState } from 'react';
import { Wand2 } from 'lucide-react';
import { ToastProvider } from './state/ToastContext';
import { DataProvider, useData } from './state/DataContext';
import { useRoute, type Tab } from './state/router';
import { TabBar } from './components/TabBar';
import { DayDetail } from './components/DayDetail';
import { TodayView } from './views/TodayView';
import { CalendarView } from './views/CalendarView';
import { StatsView } from './views/StatsView';
import { SettingsView, seedDemoIfRequested } from './views/SettingsView';
import { DEFAULT_SETTINGS, type Settings } from './domain/types';
import { loadSettings, removeFutureEvents } from './storage/repo';
import { isDemoMode, requestPersistence } from './storage/db';
import { useReminders } from './lib/useReminders';
import { Logo } from './components/Logo';

export default function App() {
  const [boot, setBoot] = useState<{ settings: Settings } | { error: string } | null>(null);
  useEffect(() => {
    (async () => {
      try {
        await seedDemoIfRequested();
        await removeFutureEvents();
        const settings = await loadSettings();
        setBoot({ settings });
        void requestPersistence();
      } catch (e) {
        setBoot({ error: (e as Error).message || 'Onbekende fout' });
      }
    })();
  }, []);

  if (!boot) return <Splash />;
  if ('error' in boot) return <Fatal message={boot.error} />;
  return (
    <ToastProvider>
      <DataProvider settings={boot.settings ?? DEFAULT_SETTINGS}>
        <Shell />
      </DataProvider>
    </ToastProvider>
  );
}

function Shell() {
  const { ready, error } = useData();
  const [route, go] = useRoute();
  useReminders();
  const demo = isDemoMode();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [route.tab]);

  if (error) return <Fatal message={error.message} />;
  if (!ready) return <Splash />;

  const openDay = (day: string) => go({ tab: route.tab, day });
  const selectTab = (tab: Tab) => go({ tab });

  return (
    <div className="app">
      {demo && (
        <div className="demo-banner">
          <Wand2 size={14} /> Demomodus met voorbeelddata · <button className="link" onClick={() => go({ tab: 'instellingen' })}>afsluiten</button>
        </div>
      )}
      <main className="main" key={route.tab}>
        {route.tab === 'vandaag' && <TodayView onOpenDay={openDay} onSettings={() => selectTab('instellingen')} />}
        {route.tab === 'kalender' && <CalendarView onOpenDay={openDay} />}
        {route.tab === 'statistieken' && <StatsView onOpenDay={openDay} />}
        {route.tab === 'instellingen' && <SettingsView onOpenDay={openDay} />}
      </main>
      <TabBar active={route.tab} onSelect={selectTab} />
      <DayDetail day={route.day} onClose={() => go({ tab: route.tab }, true)} onNavigate={(d) => go({ tab: route.tab, day: d }, true)} />
    </div>
  );
}

function Splash() {
  return (
    <div className="splash" aria-busy="true" aria-label="Alignerly wordt geladen">
      <Logo size={64} />
    </div>
  );
}

function Fatal({ message }: { message: string }) {
  return (
    <div className="fatal">
      <Logo size={48} />
      <h1>Er ging iets mis</h1>
      <p>Alignerly kon je gegevens niet openen. Dit gebeurt soms in een privévenster, waar de browser geen opslag toestaat.</p>
      <p className="muted small">{message}</p>
      <button className="btn btn-primary" onClick={() => location.reload()}>
        Opnieuw proberen
      </button>
    </div>
  );
}
