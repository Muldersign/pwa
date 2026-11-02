import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { BraceEvent } from '../domain/types';
import { Sheet, ConfirmDialog } from './Sheet';
import { useData } from '../state/DataContext';
import { applyDelete, planDelete, updateEvent, type DeletePlan } from '../lib/edits';
import { formatLongDate, dayKey, fromLocalInput, toLocalInput } from '../lib/time';
import { useToast } from '../state/ToastContext';

export function MomentEditor({ event, onClose }: { event: BraceEvent | null; onClose: () => void }) {
  const { events, commit, replaceEvents } = useData();
  const toast = useToast();
  const [when, setWhen] = useState('');
  const [note, setNote] = useState('');
  const [plan, setPlan] = useState<DeletePlan | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (event) {
      setWhen(toLocalInput(event.at));
      setNote(event.note ?? '');
    }
  }, [event]);

  if (!event) return null;
  const save = async () => {
    const at = fromLocalInput(when);
    if (at === null) return toast.show({ text: 'Vul een geldige datum en tijd in.', tone: 'error' });
    setSaving(true);
    // Keep seconds when the minute did not change
    const sameMinute = Math.floor(at / 60000) === Math.floor(event.at / 60000);
    const ok = await commit(updateEvent(events, event.id, { at: sameMinute ? event.at : at, note }, Date.now()), 'Wijziging opgeslagen');
    setSaving(false);
    if (ok) onClose();
  };
  return (
    <>
      <Sheet
        open={!!event && !plan}
        onClose={onClose}
        title={`Beugel ${event.kind === 'in' ? 'in' : 'uit'}`}
        subtitle={formatLongDate(dayKey(event.at), true)}
        footer={
          <div className="btn-row">
            <button className="btn btn-ghost btn-danger-text" onClick={() => setPlan(planDelete(events, event.id))}>
              <Trash2 size={18} /> Verwijderen
            </button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              Opslaan
            </button>
          </div>
        }
      >
        <label className="field">
          <span>Datum en tijd</span>
          <input type="datetime-local" value={when} max={toLocalInput(Date.now())} onChange={(e) => setWhen(e.target.value)} />
        </label>
        <label className="field">
          <span>Korte notitie (optioneel)</span>
          <input
            type="text"
            value={note}
            maxLength={140}
            placeholder="Bijv. lunch, tandenpoetsen, nieuwe aligner"
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <p className="hint">Tijden worden gecontroleerd zodat registraties elkaar nooit overlappen.</p>
      </Sheet>
      <ConfirmDialog
        open={!!plan}
        title="Registratie verwijderen?"
        message={plan?.description ?? ''}
        confirmLabel="Verwijderen"
        danger
        onCancel={() => setPlan(null)}
        onConfirm={async () => {
          if (!plan) return;
          await replaceEvents(applyDelete(events, plan));
          toast.show({ text: 'Registratie verwijderd' });
          setPlan(null);
          onClose();
        }}
      />
    </>
  );
}
