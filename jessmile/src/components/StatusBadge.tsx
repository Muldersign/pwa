import type { DayStatus } from '../lib/tracking';

const MAP: Record<DayStatus, { label: string; cls: string }> = {
  achieved: { label: 'Doel behaald', cls: 'badge-green' },
  missed: { label: 'Doel niet behaald', cls: 'badge-orange' },
  today: { label: 'Vandaag · bezig', cls: 'badge-purple' },
  nodata: { label: 'Geen gegevens', cls: 'badge-grey' },
  partial: { label: 'Onvolledig', cls: 'badge-grey' },
  unconfirmed: { label: 'Niet bevestigd', cls: 'badge-grey' },
  future: { label: 'Nog niet begonnen', cls: 'badge-grey' },
};

export function StatusBadge({ status }: { status: DayStatus }) {
  const m = MAP[status];
  return <span className={`badge ${m.cls}`}>{m.label}</span>;
}
