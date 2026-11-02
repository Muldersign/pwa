import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Info, Plus, CheckCircle2, CircleDashed, Clock3 } from 'lucide-react';
import type { BraceEvent } from '../domain/types';
import { Sheet } from './Sheet';
import { DayTimeline, TimelineLegend } from './DayTimeline';
import { MomentList } from './MomentList';
import { MomentEditor } from './MomentEditor';
import { AddRegistration } from './AddRegistration';
import { ProgressRing } from './ProgressRing';
import { useData } from '../state/DataContext';
import { useToast } from '../state/ToastContext';
import { stateAt } from '../lib/tracking';
import { addDays, dayKey, formatDuration, formatLongDate } from '../lib/time';
import { useNow } from '../lib/useNow';
import { StatusBadge } from './StatusBadge';

export function DayDetail({ day, onClose, onNavigate }: { day: string | undefined; onClose: () => void; onNavigate: (d: string) => void }) {
  const open = !!day;
  return open ? <DayDetailInner day={day!} onClose={onClose} onNavigate={onNavigate} /> : null;
}

function DayDetailInner({ day, onClose, onNavigate }: { day: string; onClose: () => void; onNavigate: (d: string) => void }) {
  const { computeDay, events, notes, saveNote, confirmDay, unconfirmDay, confirmed } = useData();
  const toast = useToast();
  const now = useNow(30_000).getTime();
  const summary = computeDay(day, now);
  const [editing, setEditing] = useState<BraceEvent | null>(null);
  const [adding, setAdding] = useState(false);
  const stored = notes.get(day)?.text ?? '';
  const [text, setText] = useState(stored);
  useEffect(() => setText(stored), [stored, day]);
  const today = dayKey(now);
  const carried = stateAt(events, summary.start - 1);
  const pct = Math.round(summary.progress * 100);
  const dirty = text.trim() !== stored;

  return (
    <>
      <Sheet open={!editing && !adding} onClose={onClose} title={formatLongDate(day, true)} subtitle={summary.isToday ? 'Vandaag' : undefined} size="full">
        <div className="day-nav">
          <button className="icon-btn" onClick={() => onNavigate(addDays(day, -1))} aria-label="Vorige dag">
            <ChevronLeft size={20} />
          </button>
          <StatusBadge status={summary.status} />
          <button className="icon-btn" onClick={() => onNavigate(addDays(day, 1))} disabled={day >= today} aria-label="Volgende dag">
            <ChevronRight size={20} />
          </button>
        </div>

        {summary.status === 'future' ? (
          <p className="empty-inline">Deze dag ligt nog in de toekomst.</p>
        ) : (
          <>
            <div className="day-summary">
              <ProgressRing progress={summary.progress} size={124} stroke={12} label={`${pct}% van het dagdoel`}>
                <strong className="ring-mini">{pct}%</strong>
                <span className="ring-mini-sub">van doel</span>
              </ProgressRing>
              <dl className="day-figures">
                <div>
                  <dt>Gedragen</dt>
                  <dd>{formatDuration(summary.wornMs)}</dd>
                </div>
                <div>
                  <dt>Uit</dt>
                  <dd>{formatDuration(summary.outMs)}</dd>
                </div>
                <div>
                  <dt>Dagdoel</dt>
                  <dd>{formatDuration(summary.goalMs)}</dd>
                </div>
              </dl>
            </div>

            {summary.unconfirmed && (
              <div className="notice">
                <CircleDashed size={18} />
                <div>
                  <p>
                    Er is op deze dag niets geregistreerd. Volgens het logboek was je beugel de hele dag{' '}
                    <strong>{carried?.kind === 'in' ? 'in' : 'uit'}</strong>. Klopt dat? Pas na bevestigen telt deze dag mee.
                  </p>
                  <div className="btn-row btn-row-start">
                    <button className="btn btn-primary btn-sm" onClick={() => confirmDay(day).then(() => toast.show({ text: 'Dag bevestigd' }))}>
                      Ja, dat klopt
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setAdding(true)}>
                      Aanvullen
                    </button>
                  </div>
                </div>
              </div>
            )}
            {confirmed.has(day) && summary.events.length === 0 && (
              <div className="notice notice-soft">
                <CheckCircle2 size={18} />
                <p>
                  Je hebt deze dag zonder registraties bevestigd.{' '}
                  <button className="link" onClick={() => unconfirmDay(day)}>
                    Bevestiging intrekken
                  </button>
                </p>
              </div>
            )}
            {summary.incomplete && !summary.unconfirmed && (
              <div className="notice notice-soft">
                <Info size={18} />
                <p>
                  Dit dagoverzicht is mogelijk onvolledig: voor {formatDuration(summary.unknownMs)} van deze dag is niets geregistreerd. Alleen geregistreerde tijd
                  telt mee.
                </p>
              </div>
            )}

            <section className="block">
              <h3 className="block-title">Tijdlijn</h3>
              <DayTimeline day={summary} now={now} />
              <TimelineLegend showUnknown={summary.unknownMs > 0} />
            </section>

            <section className="block">
              <div className="block-head">
                <h3 className="block-title">Momenten</h3>
                <button className="btn btn-soft btn-sm" onClick={() => setAdding(true)}>
                  <Plus size={16} /> Toevoegen
                </button>
              </div>
              <MomentList
                events={summary.events}
                carried={carried && carried.at < summary.start ? carried : null}
                dayKeyFor={day}
                onEdit={setEditing}
              />
              {carried && carried.at < summary.start && (
                <p className="hint">
                  <Clock3 size={13} /> Het eerste moment komt van een eerdere dag; de tijd wordt automatisch over beide dagen verdeeld.
                </p>
              )}
            </section>
          </>
        )}

        <section className="block">
          <h3 className="block-title">Opmerking</h3>
          <textarea
            className="note-area"
            rows={3}
            value={text}
            maxLength={1000}
            placeholder="Bijv. “Nieuwe aligner ingezet.” of “Veel druk op mijn voortanden.”"
            onChange={(e) => setText(e.target.value)}
            aria-label="Opmerking voor deze dag"
          />
          <div className="btn-row btn-row-end">
            {stored && (
              <button className="btn btn-ghost btn-sm" onClick={() => saveNote(day, '').then(() => toast.show({ text: 'Opmerking verwijderd' }))}>
                Wissen
              </button>
            )}
            <button
              className="btn btn-primary btn-sm"
              disabled={!dirty}
              onClick={() => saveNote(day, text).then(() => toast.show({ text: 'Opmerking opgeslagen 💜' }))}
            >
              Opmerking opslaan
            </button>
          </div>
        </section>
      </Sheet>
      <MomentEditor event={editing} onClose={() => setEditing(null)} />
      <AddRegistration open={adding} day={day} onClose={() => setAdding(false)} />
    </>
  );
}
