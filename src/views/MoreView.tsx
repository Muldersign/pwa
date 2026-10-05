import {
  ChevronRight,
  CircleCheck,
  Download,
  HardDrive,
  RotateCcw,
  Share,
  Smartphone,
  Sparkles,
  SquarePlus,
  Trash2,
  Upload,
} from 'lucide-react';
import { useRef } from 'react';
import { useToast } from '../components/Toast';
import { isIOS, isStandalone, useInstallPrompt } from '../lib/install';
import { AI_ENDPOINT } from '../services/nlp';
import { useData } from '../state/DataContext';
import { useSettings } from '../state/settings';
import { useUI } from '../state/UIContext';
import { clearAllData, resetToDemoData } from '../storage/seed';
import type { PlannerSnapshot } from '../storage/repository';

const EXAMPLES = [
  'Dinsdag komende week pizza eten en om 19:45 trainen in Bareveld',
  "Zaterdag naar Groningen en 's avonds sushi eten",
  'Zondag verjaardag oma om 15:00',
  'Vrijdag geen training',
  'Verwijder pizza van donderdag',
  'Zet maandag nasi op het menu',
  'Volgende week vrijdag uit eten bij De Gulle Boergondiër',
  'Zet cola bij boodschappen',
  'Verwijder melk van boodschappen',
];

export function MoreView() {
  const { repo, activities, meals, groceries } = useData();
  const ui = useUI();
  const toast = useToast();
  const [settings, update] = useSettings();
  const install = useInstallPrompt();
  const fileRef = useRef<HTMLInputElement>(null);
  const standalone = isStandalone();

  const exportData = async () => {
    const data = await repo.loadAll();
    const blob = new Blob([JSON.stringify({ app: 'onze-week', version: 1, exportedAt: new Date().toISOString(), data }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `onze-week-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast({ message: 'Back-up gedownload' });
  };

  const importData = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as { data?: PlannerSnapshot };
      const d = parsed.data;
      if (!d || !Array.isArray(d.activities) || !Array.isArray(d.meals) || !Array.isArray(d.groceries)) throw new Error('format');
      const ok = await ui.confirm({
        title: 'Back-up terugzetten?',
        message: 'Je huidige planning en boodschappen worden vervangen door de back-up.',
        confirmLabel: 'Terugzetten',
        destructive: true,
      });
      if (!ok) return;
      await repo.replaceAll({ ...d, notes: Array.isArray(d.notes) ? d.notes : [] });
      toast({ message: 'Back-up teruggezet' });
    } catch {
      toast({ message: 'Dit bestand is geen geldige back-up', tone: 'error' });
    }
  };

  return (
    <div className="page page--more">
      <header className="page-header">
        <h1 className="page-header__title">Meer</h1>
        <p className="page-header__sub">
          {activities.length} activiteiten · {meals.length} maaltijden · {groceries.length} producten
        </p>
      </header>

      <section className="settings-group">
        <h2 className="settings-group__title">Slimme invoer</h2>
        <div className="settings-card">
          <div className="settings-row">
            <span className="settings-row__icon tone-sport">
              <Sparkles size={18} />
            </span>
            <span className="settings-row__body">
              <span className="settings-row__title">AI-verwerking</span>
              <span className="settings-row__sub">
                {AI_ENDPOINT
                  ? 'Gebruikt de AI-server voor lastige zinnen. Offline valt de app terug op de lokale verwerking.'
                  : 'Lokale verwerking is actief en werkt volledig offline. Een AI-server kan later gekoppeld worden.'}
              </span>
            </span>
            {AI_ENDPOINT ? (
              <button
                type="button"
                role="switch"
                aria-checked={settings.useAI}
                aria-label="AI-verwerking"
                className={`switch ${settings.useAI ? 'is-on' : ''}`}
                onClick={() => update({ useAI: !settings.useAI })}
              >
                <span />
              </button>
            ) : (
              <span className="badge badge--soft">Lokaal</span>
            )}
          </div>
        </div>
        <div className="settings-card">
          <p className="settings-card__label">Probeer bijvoorbeeld</p>
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" className="settings-row settings-row--button" onClick={() => ui.openSmartInput(ex)}>
              <span className="settings-row__body">
                <span className="settings-row__title settings-row__title--regular">“{ex}”</span>
              </span>
              <ChevronRight size={18} className="text-soft" />
            </button>
          ))}
        </div>
      </section>

      <section className="settings-group">
        <h2 className="settings-group__title">App</h2>
        <div className="settings-card">
          {standalone ? (
            <div className="settings-row">
              <span className="settings-row__icon tone-sport">
                <CircleCheck size={18} />
              </span>
              <span className="settings-row__body">
                <span className="settings-row__title">Geïnstalleerd</span>
                <span className="settings-row__sub">Onze Week staat op je beginscherm.</span>
              </span>
            </div>
          ) : install.canPrompt ? (
            <button type="button" className="settings-row settings-row--button" onClick={() => void install.prompt()}>
              <span className="settings-row__icon tone-sport">
                <Smartphone size={18} />
              </span>
              <span className="settings-row__body">
                <span className="settings-row__title">Installeer op je telefoon</span>
                <span className="settings-row__sub">Opent dan fullscreen vanaf je beginscherm.</span>
              </span>
              <ChevronRight size={18} className="text-soft" />
            </button>
          ) : (
            <div className="settings-row settings-row--top">
              <span className="settings-row__icon tone-sport">
                <Smartphone size={18} />
              </span>
              <span className="settings-row__body">
                <span className="settings-row__title">Zet op je beginscherm</span>
                {isIOS() ? (
                  <span className="settings-row__sub">
                    Tik in Safari op <Share size={13} className="inline-icon" /> <b>Deel</b> en kies <SquarePlus size={13} className="inline-icon" />{' '}
                    <b>Zet op beginscherm</b>.
                  </span>
                ) : (
                  <span className="settings-row__sub">Open het browsermenu en kies <b>App installeren</b> of <b>Toevoegen aan startscherm</b>.</span>
                )}
              </span>
            </div>
          )}
          <div className="settings-row">
            <span className="settings-row__icon tone-work">
              <HardDrive size={18} />
            </span>
            <span className="settings-row__body">
              <span className="settings-row__title">Lokaal opgeslagen</span>
              <span className="settings-row__sub">Je gegevens staan veilig op dit apparaat en werken ook offline.</span>
            </span>
          </div>
        </div>
      </section>

      <section className="settings-group">
        <h2 className="settings-group__title">Gegevens</h2>
        <div className="settings-card">
          <button type="button" className="settings-row settings-row--button" onClick={() => void exportData()}>
            <span className="settings-row__icon tone-travel">
              <Download size={18} />
            </span>
            <span className="settings-row__body">
              <span className="settings-row__title">Back-up downloaden</span>
            </span>
            <ChevronRight size={18} className="text-soft" />
          </button>
          <button type="button" className="settings-row settings-row--button" onClick={() => fileRef.current?.click()}>
            <span className="settings-row__icon tone-travel">
              <Upload size={18} />
            </span>
            <span className="settings-row__body">
              <span className="settings-row__title">Back-up terugzetten</span>
            </span>
            <ChevronRight size={18} className="text-soft" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) void importData(f);
            }}
          />
          <button
            type="button"
            className="settings-row settings-row--button"
            onClick={async () => {
              const ok = await ui.confirm({
                title: 'Demo-data herstellen?',
                message: 'Je huidige planning en boodschappen worden vervangen door de voorbeelddata van deze week.',
                confirmLabel: 'Herstellen',
                destructive: true,
              });
              if (ok) {
                await resetToDemoData(repo);
                toast({ message: 'Demo-data hersteld' });
              }
            }}
          >
            <span className="settings-row__icon tone-home">
              <RotateCcw size={18} />
            </span>
            <span className="settings-row__body">
              <span className="settings-row__title">Demo-data herstellen</span>
            </span>
            <ChevronRight size={18} className="text-soft" />
          </button>
          <button
            type="button"
            className="settings-row settings-row--button"
            onClick={async () => {
              const ok = await ui.confirm({
                title: 'Alles wissen?',
                message: 'Alle activiteiten, maaltijden, notities en boodschappen worden verwijderd. Dit kan niet ongedaan worden gemaakt.',
                confirmLabel: 'Alles wissen',
                destructive: true,
              });
              if (ok) {
                await clearAllData(repo);
                toast({ message: 'Alles gewist' });
              }
            }}
          >
            <span className="settings-row__icon tone-social">
              <Trash2 size={18} />
            </span>
            <span className="settings-row__body">
              <span className="settings-row__title text-danger">Alles wissen</span>
            </span>
          </button>
        </div>
      </section>

      <p className="footnote">Onze Week · versie {__APP_VERSION__}</p>
    </div>
  );
}
