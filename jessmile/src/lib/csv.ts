import type { BraceEvent, DayNote } from '../domain/types';
import type { DaySummary } from './tracking';
import { formatClock } from './time';

const esc = (v: string | number) => {
  const s = String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const minutes = (ms: number) => Math.round(ms / 60_000);

/** Semicolon-separated (opens correctly in Dutch Excel), with a BOM for UTF-8. */
export function buildCsv(days: DaySummary[], events: BraceEvent[], notes: DayNote[]): string {
  const noteMap = new Map(notes.map((n) => [n.date, n.text]));
  const lines: string[] = [];
  lines.push(['Datum', 'Gedragen (min)', 'Uit (min)', 'Onbekend (min)', 'Doel (min)', 'Percentage', 'Status', 'Opmerking'].join(';'));
  for (const d of days) {
    const status = { achieved: 'Doel behaald', missed: 'Niet behaald', today: 'Vandaag (bezig)', nodata: 'Geen gegevens', unconfirmed: 'Niet bevestigd', partial: 'Onvolledig', future: '' }[d.status];
    lines.push(
      [d.key, minutes(d.wornMs), minutes(d.outMs), minutes(d.unknownMs), minutes(d.goalMs), `${Math.round(d.progress * 100)}%`, status, noteMap.get(d.key) ?? '']
        .map(esc)
        .join(';'),
    );
  }
  lines.push('');
  lines.push(['Moment', 'Datum', 'Tijd', 'Bron', 'Notitie'].join(';'));
  for (const e of events) {
    const d = new Date(e.at);
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    lines.push([e.kind === 'in' ? 'Beugel in' : 'Beugel uit', date, formatClock(e.at), e.source === 'button' ? 'knop' : 'handmatig', e.note ?? ''].map(esc).join(';'));
  }
  return '﻿' + lines.join('\r\n');
}

export function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
