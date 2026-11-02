import { useEffect, useState } from 'react';
import type { Kind } from '../domain/types';
import { Sheet } from './Sheet';
import { useData } from '../state/DataContext';
import { addMoment, addPeriod } from '../lib/edits';
import { dayEnd, dayKey, dayStart, fromLocalInput, toLocalInput } from '../lib/time';
import { useToast } from '../state/ToastContext';

type Mode = 'period' | 'moment';

/** Add a forgotten period ("beugel uit van 12:15 tot 12:50") or a single moment. */
export function AddRegistration({ open, day, onClose }: { open: boolean; day: string; onClose: () => void }) {
  const { events, commit } = useData();
  const toast = useToast();
  const [mode, setMode] = useState<Mode>('period');
  const [kind, setKind] = useState<Kind>('out');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open) return;
    const now = Date.now();
    const isToday = dayKey(now) === day;
    const base = isToday ? now - 60 * 60_000 : dayStart(day) + 12 * 3600_000;
    const clamped = Math.max(dayStart(day), Math.min(base, dayEnd(day) - 60_000));
    setFrom(toLocalInput(clamped));
    setTo(toLocalInput(Math.min(clamped + 30 * 60_000, now)));
    setNote('');
    setMode(events.length ? 'period' : 'moment');
    setKind('out');
  }, [open, day, events.length]);

  const save = async () => {
    const f = fromLocalInput(from);
    const t = fromLocalInput(to);
    if (f === null || (mode === 'period' && t === null)) return toast.show({ text: 'Vul geldige tijden in.', tone: 'error' });
    const now = Date.now();
    const result = mode === 'period' ? addPeriod(events, kind, f, t!, now, note) : addMoment(events, kind, f, now, note);
    if (await commit(result, mode === 'period' ? 'Periode toegevoegd' : 'Moment toegevoegd')) onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Registratie toevoegen"
      subtitle="Vergeten op de knop te drukken? Vul het hier aan."
      footer={
        <div className="btn-row">
          <button className="btn btn-ghost" onClick={onClose}>
            Annuleren
          </button>
          <button className="btn btn-primary" onClick={save}>
            Toevoegen
          </button>
        </div>
      }
    >
      <div className="segmented" role="tablist" aria-label="Soort registratie">
        <button role="tab" aria-selected={mode === 'period'} className={mode === 'period' ? 'on' : ''} onClick={() => setMode('period')}>
          Periode
        </button>
        <button role="tab" aria-selected={mode === 'moment'} className={mode === 'moment' ? 'on' : ''} onClick={() => setMode('moment')}>
          Los moment
        </button>
      </div>
      <div className="kind-pick" role="radiogroup" aria-label="Beugel in of uit">
        {(['out', 'in'] as Kind[]).map((k) => (
          <button key={k} role="radio" aria-checked={kind === k} className={`kind-opt kind-${k} ${kind === k ? 'on' : ''}`} onClick={() => setKind(k)}>
            {mode === 'period' ? `Beugel ${k === 'in' ? 'in' : 'uit'} geweest` : `Beugel ${k === 'in' ? 'in' : 'uit'}`}
          </button>
        ))}
      </div>
      <label className="field">
        <span>{mode === 'period' ? 'Van' : 'Tijdstip'}</span>
        <input type="datetime-local" value={from} max={toLocalInput(Date.now())} onChange={(e) => setFrom(e.target.value)} />
      </label>
      {mode === 'period' && (
        <label className="field">
          <span>Tot</span>
          <input type="datetime-local" value={to} max={toLocalInput(Date.now())} onChange={(e) => setTo(e.target.value)} />
        </label>
      )}
      <label className="field">
        <span>Korte notitie (optioneel)</span>
        <input type="text" value={note} maxLength={140} placeholder="Bijv. diner bij vrienden" onChange={(e) => setNote(e.target.value)} />
      </label>
      <p className="hint">
        {mode === 'period'
          ? 'Een periode voegt automatisch het begin- en eindmoment toe. Perioden over middernacht worden over beide dagen verdeeld.'
          : 'Een los moment kan alleen vóór je eerste of na je laatste registratie; gebruik anders een periode.'}
      </p>
    </Sheet>
  );
}
