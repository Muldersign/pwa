import { useEffect, useState } from 'react';
import { unseenTopicCount } from '../engine/engine';
import { NavProvider, useNav, type Tab } from './nav';
import { Stamp } from './components/ui';
import { EvidenceDetail, EvidenceTab } from './screens/Evidence';
import { Accusation, Finale } from './screens/Finale';
import { ChapterIntro, InvestigationTab } from './screens/Investigation';
import { NotebookTab } from './screens/Notebook';
import { PuzzleScreen } from './screens/Puzzle';
import { StartScreen } from './screens/Start';
import { Interview, SuspectDossier, SuspectsTab } from './screens/Suspects';
import { TimelineTab } from './screens/Timeline';
import { useGame } from './store';

export function App() {
  const { state } = useGame();
  const [playing, setPlaying] = useState(false);
  if (!state || !playing) return <StartScreen onPlay={() => setPlaying(true)} />;
  return (
    <NavProvider>
      <Game onQuit={() => setPlaying(false)} />
    </NavProvider>
  );
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'onderzoek', label: 'Onderzoek', icon: '🕵️' },
  { id: 'verdachten', label: 'Verdachten', icon: '👥' },
  { id: 'bewijs', label: 'Bewijs', icon: '🗂️' },
  { id: 'tijdlijn', label: 'Tijdlijn', icon: '🕰️' },
  { id: 'boek', label: 'Boek', icon: '📓' },
];

function Game({ onQuit }: { onQuit: () => void }) {
  const { sc, state } = useGame();
  const { tab, setTab, stack, open } = useNav();
  const s = state!;

  // Show the chapter envelope the first time a chapter is opened.
  const [introSeen, setIntroSeen] = useState<number[]>(() => {
    try {
      return JSON.parse(sessionStorage.getItem('pz-intro') ?? '[]') as number[];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    if (!introSeen.includes(s.chapter) && !s.accusation) {
      open({ type: 'chapter', no: s.chapter });
      const next = [...introSeen, s.chapter];
      setIntroSeen(next);
      try {
        sessionStorage.setItem('pz-intro', JSON.stringify(next));
      } catch {
        /* ignore */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.chapter]);

  useEffect(() => {
    if (s.accusation && !stack.some((o) => o.type === 'finale')) open({ type: 'finale' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.accusation]);

  const newEvidence = s.evidence.filter((e) => !s.seenEvidence.includes(e)).length;
  const newTopics = sc.suspects.reduce((n, sus) => n + unseenTopicCount(sc, sus.id, s), 0);
  const badge: Partial<Record<Tab, number>> = { bewijs: newEvidence, verdachten: newTopics };

  return (
    <div className="desk flex h-full flex-col">
      <main className="flex-1 overflow-y-auto overscroll-contain">
        <div className="safe-top mx-auto max-w-xl px-4 pb-28 pt-3">
          {tab === 'onderzoek' && <InvestigationTab onQuit={onQuit} />}
          {tab === 'verdachten' && <SuspectsTab />}
          {tab === 'bewijs' && <EvidenceTab />}
          {tab === 'tijdlijn' && <TimelineTab />}
          {tab === 'boek' && <NotebookTab />}
        </div>
      </main>
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-gold/30 bg-ink/95 backdrop-blur" aria-label="Hoofdmenu">
        <div className="mx-auto grid max-w-xl grid-cols-5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] ${tab === t.id ? 'text-gold-2' : 'text-muted'}`}
              aria-current={tab === t.id ? 'page' : undefined}
            >
              <span className={`text-xl leading-none ${tab === t.id ? '' : 'opacity-70 grayscale'}`}>{t.icon}</span>
              <span className="font-type tracking-wide">{t.label}</span>
              {tab === t.id && <span className="absolute inset-x-5 top-0 h-0.5 bg-gold" />}
              {!!badge[t.id] && (
                <span className="absolute right-[18%] top-1 min-w-4 rounded-full bg-bordeaux-2 px-1 text-[10px] font-bold leading-4 text-parchment">{badge[t.id]}</span>
              )}
            </button>
          ))}
        </div>
      </nav>
      {stack.map((o, i) => (
        <div key={i}>
          {o.type === 'suspect' && <SuspectDossier id={o.id} />}
          {o.type === 'interview' && <Interview id={o.id} />}
          {o.type === 'evidence' && <EvidenceDetail id={o.id} />}
          {o.type === 'puzzle' && <PuzzleScreen id={o.id} />}
          {o.type === 'chapter' && <ChapterIntro no={o.no} />}
          {o.type === 'accuse' && <Accusation />}
          {o.type === 'finale' && <Finale onQuit={onQuit} />}
        </div>
      ))}
      <DiscoveryToast />
    </div>
  );
}

/** "ONTDEKT" stamp whenever new evidence enters the archive. */
function DiscoveryToast() {
  const { sc, discoveries, clearDiscoveries, state } = useGame();
  const { open } = useNav();
  useEffect(() => {
    if (!discoveries.length) return;
    const t = window.setTimeout(clearDiscoveries, 4200);
    return () => window.clearTimeout(t);
  }, [discoveries, clearDiscoveries]);
  if (!discoveries.length || state?.accusation) return null;
  const items = discoveries.map((d) => sc.evidence.find((e) => e.id === d)!).filter(Boolean);
  // Chapter-start evidence is announced by the envelope, not by a toast.
  if (items.length > 4) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-[max(12px,env(safe-area-inset-top))]">
      <button
        className="paper anim-rise pointer-events-auto relative w-full max-w-md rounded-md p-3 pr-24 text-left"
        onClick={() => {
          clearDiscoveries();
          open({ type: 'evidence', id: items[0].id });
        }}
      >
        <div className="font-type text-[11px] uppercase tracking-widest text-bordeaux">Nieuw bewijs</div>
        {items.map((e) => (
          <div key={e.id} className="font-display text-[15px] font-semibold">
            {e.title}
          </div>
        ))}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Stamp text="Ontdekt" />
        </div>
      </button>
    </div>
  );
}
