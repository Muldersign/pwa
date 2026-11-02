import { useEffect, useRef, useState } from 'react';
import { Bell, BellOff, Download, FileJson, Upload, Wand2, Trash2, PenLine, Smartphone, Target, User, ChevronRight, ShieldCheck } from 'lucide-react';
import { useData } from '../state/DataContext';
import { useToast } from '../state/ToastContext';
import type { Backup, Settings } from '../domain/types';
import { notificationsSupported, showNotification } from '../lib/reminders';
import { buildCsv, download } from '../lib/csv';
import { computeDays, trackedDayKeys } from '../lib/tracking';
import * as repo from '../storage/repo';
import { DEMO_FLAG, isDemoMode } from '../storage/db';
import { seedDemo } from '../storage/demo';
import { ConfirmDialog } from '../components/Sheet';
import { dayKey } from '../lib/time';
import { isIOS, isStandalone, useInstallPrompt } from '../lib/install';
import { formatGoal } from './TodayView';
import { Logo } from '../components/Logo';

export function SettingsView({ onOpenDay }: { onOpenDay: (d: string) => void }) {
  const { settings, saveSettings, events, notes, confirmed } = useData();
  const toast = useToast();
  const [name, setName] = useState(settings.name);
  const [confirm, setConfirm] = useState<null | 'wipe' | 'import' | 'demo'>(null);
  const [pendingImport, setPendingImport] = useState<Backup | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const install = useInstallPrompt();
  const demo = isDemoMode();
  const [perm, setPerm] = useState<NotificationPermission | 'unsupported'>(notificationsSupported() ? Notification.permission : 'unsupported');

  useEffect(() => setName(settings.name), [settings.name]);

  const update = async (patch: Partial<Settings>) => {
    await saveSettings({ ...settings, ...patch });
  };
  const updateReminder = async (key: keyof Settings['reminders'], value: unknown) => {
    await saveSettings({ ...settings, reminders: { ...settings.reminders, [key]: value } });
  };

  const toggleReminders = async (on: boolean) => {
    if (on) {
      if (!notificationsSupported()) {
        toast.show({ text: 'Deze browser ondersteunt geen meldingen. Herinneringen verschijnen dan alleen in de app.' });
      } else if (Notification.permission !== 'granted') {
        const p = await Notification.requestPermission();
        setPerm(p);
        if (p !== 'granted') {
          toast.show({ text: 'Geen toestemming voor meldingen. Je kunt dit later in je browserinstellingen aanpassen.', tone: 'error' });
          return;
        }
      }
    }
    await updateReminder('enabled', on);
    if (on) toast.show({ text: 'Herinneringen staan aan 💜' });
  };

  const exportCsv = () => {
    const now = Date.now();
    const days = computeDays(trackedDayKeys(events, now), events, now, { goalMinutes: settings.goalMinutes, confirmed });
    download(`alignerly-${dayKey(now)}.csv`, buildCsv(days, events, [...notes.values()]), 'text/csv;charset=utf-8');
  };
  const exportBackup = async () => {
    const b = await repo.exportBackup();
    download(`alignerly-backup-${dayKey(Date.now())}.json`, JSON.stringify(b, null, 2), 'application/json');
    toast.show({ text: 'Back-up gedownload' });
  };
  const onFile = async (file: File) => {
    try {
      const parsed = repo.parseBackup(JSON.parse(await file.text()));
      setPendingImport(parsed);
      setConfirm('import');
    } catch (e) {
      toast.show({ text: e instanceof SyntaxError ? 'Dit bestand kan niet gelezen worden.' : (e as Error).message, tone: 'error' });
    }
  };

  const goalHours = settings.goalMinutes / 60;
  const r = settings.reminders;
  const remindersOn = r.enabled && (perm === 'granted' || perm === 'unsupported');

  return (
    <div className="view">
      <header className="page-head">
        <h1>Instellingen</h1>
      </header>

      <section className="card settings-group">
        <h2 className="group-title">
          <User size={17} /> Profiel
        </h2>
        <label className="field">
          <span>Naam</span>
          <input
            type="text"
            value={name}
            maxLength={30}
            autoComplete="given-name"
            onChange={(e) => setName(e.target.value)}
            onBlur={() => name.trim() !== settings.name && update({ name: name.trim() || 'Jessica' })}
          />
        </label>
        <div className="field">
          <span id="goal-label">
            <Target size={15} /> Dagelijks draagdoel
          </span>
          <div className="stepper" role="group" aria-labelledby="goal-label">
            <button className="icon-btn" onClick={() => update({ goalMinutes: Math.max(12 * 60, settings.goalMinutes - 30) })} aria-label="Doel verlagen met een half uur">
              −
            </button>
            <strong>{formatGoal(settings.goalMinutes)}</strong>
            <button className="icon-btn" onClick={() => update({ goalMinutes: Math.min(24 * 60, settings.goalMinutes + 30) })} aria-label="Doel verhogen met een half uur">
              +
            </button>
          </div>
          <small className="hint">
            Uit-budget per dag: {formatGoal(Math.round((24 - goalHours) * 60))}. Een gewijzigd doel geldt ook voor eerdere dagen.
          </small>
        </div>
      </section>

      <section className="card settings-group">
        <h2 className="group-title">
          <Bell size={17} /> Herinneringen
        </h2>
        <Toggle label="Herinneringen aan" checked={remindersOn} onChange={toggleReminders} />
        {perm === 'denied' && (
          <p className="hint">
            <BellOff size={13} /> Meldingen zijn geblokkeerd in je browser. Sta ze toe via de site-instellingen om herinneringen te ontvangen.
          </p>
        )}
        <div className={`reminder-list ${remindersOn ? '' : 'is-disabled'}`}>
          <ReminderRow label="Eerste herinnering als de beugel uit is" value={r.first} onChange={(v) => updateReminder('first', v)} options={[15, 20, 30, 45]} />
          <ReminderRow label="Tweede herinnering" value={r.second} onChange={(v) => updateReminder('second', v)} options={[45, 60, 90, 120]} />
          <ReminderRow label="Als het uit-budget bijna op is (nog …)" value={r.budgetLow} onChange={(v) => updateReminder('budgetLow', v)} options={[5, 10, 15, 30]} />
          <ReminderRow label="Na het eten, als de beugel nog uit is" value={r.meal} onChange={(v) => updateReminder('meal', v)} options={[30, 40, 45, 60]} />
        </div>
        {remindersOn && perm === 'granted' && (
          <button className="btn btn-soft btn-sm" onClick={() => showNotification('Alignerly', 'Zo zien je herinneringen eruit 💜')}>
            Testmelding sturen
          </button>
        )}
        <p className="hint">
          Herinneringen werken zolang de app open is of op de achtergrond actief blijft. {isIOS() ? 'Op iPhone werken meldingen alleen als Alignerly op je beginscherm staat (iOS 16.4+).' : ''}
        </p>
      </section>

      <section className="card settings-group">
        <h2 className="group-title">
          <PenLine size={17} /> Registraties
        </h2>
        <button className="row-link" onClick={() => onOpenDay(dayKey(Date.now()))}>
          <PenLine size={17} />
          <span>Registraties van vandaag corrigeren</span>
          <ChevronRight size={18} />
        </button>
        <p className="hint">Voor een andere dag: open die dag in de Kalender. Daar kun je tijden aanpassen, vergeten momenten toevoegen of iets verwijderen.</p>
      </section>

      <section className="card settings-group">
        <h2 className="group-title">
          <ShieldCheck size={17} /> Gegevens
        </h2>
        <p className="hint">Alles wordt alleen op dit apparaat bewaard. Maak af en toe een back-up.</p>
        <div className="btn-stack">
          <button className="btn btn-soft" onClick={exportCsv} disabled={!events.length}>
            <Download size={18} /> Exporteren naar CSV
          </button>
          <button className="btn btn-soft" onClick={exportBackup}>
            <FileJson size={18} /> Back-up exporteren
          </button>
          <button className="btn btn-soft" onClick={() => fileRef.current?.click()}>
            <Upload size={18} /> Back-up importeren
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) void onFile(f);
            }}
          />
          <button className="btn btn-soft" onClick={() => (demo ? leaveDemo() : setConfirm('demo'))}>
            <Wand2 size={18} /> {demo ? 'Demo afsluiten' : 'Demo met voorbeelddata bekijken'}
          </button>
          <button className="btn btn-ghost btn-danger-text" onClick={() => setConfirm('wipe')}>
            <Trash2 size={18} /> {demo ? 'Demogegevens wissen' : 'Alle gegevens wissen'}
          </button>
        </div>
      </section>

      {!isStandalone() && (
        <section className="card settings-group">
          <h2 className="group-title">
            <Smartphone size={17} /> Installeren
          </h2>
          {install.canPrompt ? (
            <button className="btn btn-primary" onClick={() => install.prompt()}>
              Alignerly installeren
            </button>
          ) : isIOS() ? (
            <p className="hint">Tik in Safari op <strong>Deel</strong> en kies <strong>Zet op beginscherm</strong>. Alignerly opent dan als een echte app.</p>
          ) : (
            <p className="hint">Open het browsermenu en kies <strong>App installeren</strong> of <strong>Toevoegen aan startscherm</strong>.</p>
          )}
        </section>
      )}

      <footer className="about">
        <Logo size={36} />
        <p>
          <strong>Alignerly</strong> · Jessica’s beugeltracker
          <br />
          <span className="muted">Versie {__APP_VERSION__}</span>
        </p>
      </footer>

      <ConfirmDialog
        open={confirm === 'wipe'}
        title={demo ? 'Demogegevens wissen?' : 'Alle gegevens wissen?'}
        message={
          demo
            ? 'De voorbeelddata wordt gewist. Je echte logboek blijft onaangetast.'
            : 'Al je registraties, opmerkingen en bevestigingen worden definitief verwijderd van dit apparaat. Maak eventueel eerst een back-up. Dit kan niet ongedaan worden gemaakt.'
        }
        confirmLabel="Ja, alles wissen"
        danger
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          await repo.wipeAll();
          setConfirm(null);
          toast.show({ text: 'Alle gegevens zijn gewist' });
        }}
      />
      <ConfirmDialog
        open={confirm === 'import'}
        title="Back-up terugzetten?"
        message={`Deze back-up bevat ${pendingImport?.events.length ?? 0} registraties en ${pendingImport?.notes.length ?? 0} opmerkingen. Je huidige gegevens worden hierdoor vervangen.`}
        confirmLabel="Terugzetten"
        onCancel={() => {
          setConfirm(null);
          setPendingImport(null);
        }}
        onConfirm={async () => {
          if (pendingImport) await repo.restoreBackup(pendingImport);
          setConfirm(null);
          setPendingImport(null);
          toast.show({ text: 'Back-up teruggezet 💜' });
        }}
      />
      <ConfirmDialog
        open={confirm === 'demo'}
        title="Demo bekijken?"
        message="De demo gebruikt een aparte opslag met ongeveer vier weken voorbeelddata. Je eigen logboek blijft volledig gescheiden en onaangetast. Je kunt de demo altijd hier weer afsluiten."
        confirmLabel="Demo openen"
        onCancel={() => setConfirm(null)}
        onConfirm={enterDemo}
      />
    </div>
  );
}

async function enterDemo() {
  try {
    localStorage.setItem(DEMO_FLAG, '1');
  } catch {
    /* ignore */
  }
  // The demo database is opened on reload; seed it right after.
  sessionStorage.setItem('alignerly-seed-demo', '1');
  location.hash = '#/vandaag';
  location.reload();
}

function leaveDemo() {
  try {
    localStorage.removeItem(DEMO_FLAG);
  } catch {
    /* ignore */
  }
  location.hash = '#/vandaag';
  location.reload();
}

export async function seedDemoIfRequested() {
  if (isDemoMode() && sessionStorage.getItem('alignerly-seed-demo') === '1') {
    sessionStorage.removeItem('alignerly-seed-demo');
    await seedDemo();
  }
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <input type="checkbox" role="switch" className="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

function ReminderRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: { on: boolean; minutes: number };
  options: number[];
  onChange: (v: { on: boolean; minutes: number }) => void;
}) {
  const opts = options.includes(value.minutes) ? options : [...options, value.minutes].sort((a, b) => a - b);
  return (
    <div className="reminder-row">
      <label className="toggle-row">
        <span>{label}</span>
        <input type="checkbox" role="switch" className="switch" checked={value.on} onChange={(e) => onChange({ ...value, on: e.target.checked })} />
      </label>
      <select value={value.minutes} disabled={!value.on} onChange={(e) => onChange({ ...value, minutes: Number(e.target.value) })} aria-label={`${label}: minuten`}>
        {opts.map((m) => (
          <option key={m} value={m}>
            {m} min
          </option>
        ))}
      </select>
    </div>
  );
}
