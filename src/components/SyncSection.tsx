import { format, isToday } from 'date-fns';
import { nl } from 'date-fns/locale';
import {
  ChevronRight,
  Cloud,
  CloudAlert,
  CloudOff,
  Copy,
  LogIn,
  LogOut,
  RefreshCw,
  Share,
  UserPlus,
  Users,
  DoorOpen,
} from 'lucide-react';
import { useState } from 'react';
import type { MemberKey } from '../sync/household';
import { useSync, type LinkMode } from '../sync/SyncContext';
import type { SyncStatus } from '../sync/syncEngine';
import { useUI } from '../state/UIContext';
import { Sheet } from './Sheet';
import { useToast } from './Toast';

const MEMBER_NAMES: Record<MemberKey, string> = { glenn: 'Glenn', jessica: 'Jessica' };

function statusText(s: SyncStatus): { text: string; tone: 'ok' | 'busy' | 'warn' | 'error' } {
  const waiting = s.pending > 0 ? `${s.pending} ${s.pending === 1 ? 'wijziging wacht' : 'wijzigingen wachten'}` : '';
  if (s.phase === 'syncing') return { text: 'Synchroniseren…', tone: 'busy' };
  if (s.phase === 'offline') return { text: waiting ? `Offline · ${waiting}` : 'Offline · wordt bijgewerkt zodra je online bent', tone: 'warn' };
  if (s.phase === 'error') return { text: 'Synchroniseren mislukt — probeer het opnieuw', tone: 'error' };
  if (!s.lastSyncedAt) return { text: 'Klaar om te synchroniseren', tone: 'ok' };
  const d = new Date(s.lastSyncedAt);
  const age = Date.now() - d.getTime();
  const when = age < 60_000 ? 'zojuist' : isToday(d) ? `om ${format(d, 'HH:mm')}` : format(d, 'd MMM HH:mm', { locale: nl });
  return { text: `Gesynchroniseerd ${when}${waiting ? ` · ${waiting}` : ''}`, tone: 'ok' };
}

export function SyncSection() {
  const sync = useSync();
  const ui = useUI();
  const toast = useToast();
  const [sheet, setSheet] = useState<'auth' | 'create' | 'join' | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>, success?: string) => {
    setBusy(true);
    try {
      await fn();
      if (success) toast({ message: success });
    } catch (e) {
      toast({ message: e instanceof Error ? e.message : String(e), tone: 'error', duration: 5000 });
    } finally {
      setBusy(false);
    }
  };

  if (!sync.configured) {
    return (
      <div className="settings-card">
        <div className="settings-row settings-row--top">
          <span className="settings-row__icon tone-other">
            <Cloud size={18} />
          </span>
          <span className="settings-row__body">
            <span className="settings-row__title">Synchronisatie niet ingesteld</span>
            <span className="settings-row__sub">
              Koppel een Supabase-project om jullie planning op meerdere telefoons te delen. Tot die tijd blijft alles op dit
              toestel.
            </span>
          </span>
        </div>
      </div>
    );
  }

  const status = statusText(sync.status);
  const StatusIcon = status.tone === 'error' ? CloudAlert : status.tone === 'warn' ? CloudOff : Cloud;

  return (
    <>
      {!sync.email && (
        <div className="settings-card">
          <button type="button" className="settings-row settings-row--button" onClick={() => setSheet('auth')}>
            <span className="settings-row__icon tone-sport">
              <LogIn size={18} />
            </span>
            <span className="settings-row__body">
              <span className="settings-row__title">Inloggen of account maken</span>
              <span className="settings-row__sub">Deel de planning en boodschappen met elkaar, op al jullie apparaten.</span>
            </span>
            <ChevronRight size={18} className="text-soft" />
          </button>
        </div>
      )}

      {sync.email && sync.loading && (
        <div className="settings-card">
          <div className="settings-row">
            <span className="settings-row__icon tone-other">
              <RefreshCw size={18} className="spin" />
            </span>
            <span className="settings-row__body">
              <span className="settings-row__title">Even laden…</span>
            </span>
          </div>
        </div>
      )}

      {sync.email && !sync.loading && !sync.info && !sync.linked && (
        <div className="settings-card">
          <button type="button" className="settings-row settings-row--button" onClick={() => setSheet('create')}>
            <span className="settings-row__icon tone-sport">
              <Users size={18} />
            </span>
            <span className="settings-row__body">
              <span className="settings-row__title">Nieuw huishouden starten</span>
              <span className="settings-row__sub">Je krijgt een code om de ander uit te nodigen.</span>
            </span>
            <ChevronRight size={18} className="text-soft" />
          </button>
          <button type="button" className="settings-row settings-row--button" onClick={() => setSheet('join')}>
            <span className="settings-row__icon tone-travel">
              <UserPlus size={18} />
            </span>
            <span className="settings-row__body">
              <span className="settings-row__title">Deelnemen met een code</span>
              <span className="settings-row__sub">Heeft de ander al een huishouden? Vul de code in.</span>
            </span>
            <ChevronRight size={18} className="text-soft" />
          </button>
        </div>
      )}

      {sync.needsLink && sync.info && (
        <div className="settings-card">
          <div className="settings-row settings-row--top">
            <span className="settings-row__icon tone-sport">
              <Users size={18} />
            </span>
            <span className="settings-row__body">
              <span className="settings-row__title">Dit toestel koppelen aan “{sync.info.household.name}”</span>
              <span className="settings-row__sub">Kies wat er met de gegevens op dit toestel gebeurt.</span>
              <span className="sync-actions">
                <button type="button" className="chip chip--accent" disabled={busy} onClick={() => void run(() => sync.linkDevice('replace'), 'Gekoppeld')}>
                  Gedeelde planning gebruiken
                </button>
                <button type="button" className="chip chip--ghost" disabled={busy} onClick={() => void run(() => sync.linkDevice('merge'), 'Gekoppeld en samengevoegd')}>
                  Samenvoegen met dit toestel
                </button>
              </span>
            </span>
          </div>
        </div>
      )}

      {sync.linked && (
        <div className="settings-card">
          <div className="settings-row settings-row--top">
            <span className={`settings-row__icon sync-icon sync-icon--${status.tone}`}>
              <StatusIcon size={18} />
            </span>
            <span className="settings-row__body">
              <span className="settings-row__title">{sync.info?.household.name ?? 'Gedeelde planning'}</span>
              <span className="settings-row__sub">{status.text}</span>
              {sync.info && (
                <span className="member-row">
                  {sync.info.members.map((m) => (
                    <span key={m.userId} className={`member-chip ${m.memberKey ? `member-chip--${m.memberKey}` : ''}`}>
                      {m.memberKey ? MEMBER_NAMES[m.memberKey] : 'Lid'}
                      {m.memberKey === sync.info?.me ? ' (jij)' : ''}
                    </span>
                  ))}
                </span>
              )}
            </span>
            <button
              type="button"
              className="icon-button icon-button--soft"
              aria-label="Nu synchroniseren"
              onClick={() => void sync.syncNow()}
            >
              <RefreshCw size={16} className={sync.status.phase === 'syncing' ? 'spin' : ''} />
            </button>
          </div>
          {sync.info && <InviteRow code={sync.info.household.inviteCode} />}
        </div>
      )}

      {sync.email && (
        <div className="settings-card">
          <div className="settings-row">
            <span className="settings-row__icon tone-other">
              <LogOut size={18} />
            </span>
            <span className="settings-row__body">
              <span className="settings-row__title settings-row__title--regular">{sync.email}</span>
              <span className="settings-row__sub">Uitloggen houdt je gegevens op dit toestel.</span>
            </span>
            <button type="button" className="chip chip--ghost chip--small" disabled={busy} onClick={() => void run(sync.signOut, 'Uitgelogd')}>
              Uitloggen
            </button>
          </div>
          {sync.linked && sync.info && (
            <button
              type="button"
              className="settings-row settings-row--button"
              onClick={async () => {
                const ok = await ui.confirm({
                  title: 'Huishouden verlaten?',
                  message: 'Dit toestel stopt met synchroniseren. Je gegevens blijven hier staan; de gedeelde planning blijft bestaan voor de ander.',
                  confirmLabel: 'Verlaten',
                  destructive: true,
                });
                if (ok) await run(sync.leave, 'Huishouden verlaten');
              }}
            >
              <span className="settings-row__icon tone-social">
                <DoorOpen size={18} />
              </span>
              <span className="settings-row__body">
                <span className="settings-row__title text-danger">Huishouden verlaten</span>
              </span>
            </button>
          )}
        </div>
      )}

      <AuthSheet open={sheet === 'auth'} onClose={() => setSheet(null)} />
      <HouseholdSheet mode={sheet === 'create' || sheet === 'join' ? sheet : null} onClose={() => setSheet(null)} />
    </>
  );
}

function InviteRow({ code }: { code: string }) {
  const toast = useToast();
  const text = `Doe mee met onze planning in Onze Week. Open ${window.location.origin}, ga naar Meer → Deelnemen met een code en vul in: ${code}`;
  return (
    <div className="settings-row">
      <span className="settings-row__icon tone-travel">
        <UserPlus size={18} />
      </span>
      <span className="settings-row__body">
        <span className="settings-row__sub">Uitnodigingscode</span>
        <span className="invite-code">{code}</span>
      </span>
      <button
        type="button"
        className="chip chip--ghost chip--small"
        onClick={async () => {
          if (navigator.share) {
            try {
              await navigator.share({ title: 'Onze Week', text });
              return;
            } catch {
              // Cancelled: fall through to copying.
            }
          }
          try {
            await navigator.clipboard.writeText(code);
            toast({ message: 'Code gekopieerd' });
          } catch {
            toast({ message: `Code: ${code}`, tone: 'info' });
          }
        }}
      >
        {typeof navigator !== 'undefined' && 'share' in navigator ? <Share size={14} /> : <Copy size={14} />} Delen
      </button>
    </div>
  );
}

function AuthSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const sync = useSync();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [info, setInfo] = useState<string>();
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(undefined);
    setInfo(undefined);
    try {
      if (mode === 'in') {
        await sync.signIn(email, password);
        onClose();
      } else {
        const result = await sync.signUp(email, password);
        if (result === 'signed-in') onClose();
        else {
          setInfo('Bijna klaar: bevestig je e-mailadres via de link in je mail. Kom daarna terug in de app en log hier in.');
          setMode('in');
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={mode === 'in' ? 'Inloggen' : 'Account maken'}
      footer={
        <div className="editor-footer">
          <button type="button" className="button button--primary" disabled={busy || !email.includes('@') || password.length < 6} onClick={() => void submit()}>
            {busy ? 'Even geduld…' : mode === 'in' ? 'Inloggen' : 'Account maken'}
          </button>
        </div>
      }
    >
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div className="segmented">
          <button type="button" className={mode === 'in' ? 'is-active' : ''} onClick={() => setMode('in')}>
            Inloggen
          </button>
          <button type="button" className={mode === 'up' ? 'is-active' : ''} onClick={() => setMode('up')}>
            Nieuw account
          </button>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="auth-email">E-mailadres</label>
          <input id="auth-email" className="input" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="auth-pw">Wachtwoord</label>
          <input
            id="auth-pw"
            className="input"
            type="password"
            autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
            value={password}
            placeholder={mode === 'up' ? 'Minimaal 6 tekens' : ''}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="form-message form-message--error">{error}</p>}
        {info && <p className="form-message">{info}</p>}
        <button type="submit" hidden />
      </form>
    </Sheet>
  );
}

function HouseholdSheet({ mode, onClose }: { mode: 'create' | 'join' | null; onClose: () => void }) {
  const sync = useSync();
  const toast = useToast();
  const [lastMode, setLastMode] = useState<'create' | 'join'>('create');
  const [name, setName] = useState('Glenn & Jessica');
  const [code, setCode] = useState('');
  const [me, setMe] = useState<MemberKey | undefined>();
  const [keepLocal, setKeepLocal] = useState(true);
  const [joinMode, setJoinMode] = useState<LinkMode>('replace');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  if (mode && mode !== lastMode) setLastMode(mode);
  const m = mode ?? lastMode;
  const canSubmit = m === 'create' ? name.trim().length > 0 : code.trim().length >= 4;

  const submit = async () => {
    setBusy(true);
    setError(undefined);
    try {
      if (m === 'create') await sync.create(name, me, keepLocal);
      else await sync.join(code, me, joinMode);
      toast({ message: m === 'create' ? 'Huishouden aangemaakt' : 'Je doet nu mee' });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open={!!mode}
      onClose={onClose}
      title={m === 'create' ? 'Nieuw huishouden' : 'Deelnemen met code'}
      footer={
        <div className="editor-footer">
          <button type="button" className="button button--primary" disabled={busy || !canSubmit} onClick={() => void submit()}>
            {busy ? 'Even geduld…' : m === 'create' ? 'Aanmaken' : 'Deelnemen'}
          </button>
        </div>
      }
    >
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) void submit();
        }}
      >
        {m === 'create' ? (
          <div className="field">
            <label className="field__label" htmlFor="hh-name">Naam</label>
            <input id="hh-name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        ) : (
          <div className="field">
            <label className="field__label" htmlFor="hh-code">Uitnodigingscode</label>
            <input
              id="hh-code"
              className="input input--large invite-input"
              value={code}
              maxLength={6}
              autoCapitalize="characters"
              autoComplete="off"
              placeholder="ABC123"
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            />
          </div>
        )}

        <div className="field">
          <span className="field__label">Wie ben jij?</span>
          <div className="segmented">
            {(['glenn', 'jessica'] as MemberKey[]).map((k) => (
              <button key={k} type="button" className={me === k ? 'is-active' : ''} onClick={() => setMe(k)}>
                {MEMBER_NAMES[k]}
              </button>
            ))}
          </div>
        </div>

        {m === 'create' ? (
          <label className="check-row">
            <input type="checkbox" checked={keepLocal} onChange={(e) => setKeepLocal(e.target.checked)} />
            <span>
              <strong>Gegevens van dit toestel meenemen</strong>
              <small>Zet uit om met een lege planning te beginnen (de voorbeelddata verdwijnt dan).</small>
            </span>
          </label>
        ) : (
          <div className="field">
            <span className="field__label">Gegevens op dit toestel</span>
            <div className="segmented">
              <button type="button" className={joinMode === 'replace' ? 'is-active' : ''} onClick={() => setJoinMode('replace')}>
                Vervangen
              </button>
              <button type="button" className={joinMode === 'merge' ? 'is-active' : ''} onClick={() => setJoinMode('merge')}>
                Samenvoegen
              </button>
            </div>
            <p className="field__hint">
              {joinMode === 'replace'
                ? 'Aanbevolen: dit toestel krijgt de gedeelde planning; wat hier nu staat (zoals voorbeelddata) verdwijnt.'
                : 'Wat op dit toestel staat wordt toegevoegd aan de gedeelde planning.'}
            </p>
          </div>
        )}
        {error && <p className="form-message form-message--error">{error}</p>}
        <button type="submit" hidden />
      </form>
    </Sheet>
  );
}
