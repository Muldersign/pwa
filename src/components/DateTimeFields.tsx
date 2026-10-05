import { CalendarDays, Clock, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { capitalize, formatShortDate, isValidClockTime } from '../lib/dates';

interface DateFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
}

/**
 * Shows the date in Dutch ("di 13 okt") regardless of the device language,
 * while a transparent native date input on top provides the platform picker.
 */
export function DateField({ id, value, onChange }: DateFieldProps) {
  return (
    <div className="picker-field">
      <span className="input picker-field__display" aria-hidden="true">
        <span>{value ? capitalize(formatShortDate(value)) : 'Kies datum'}</span>
        <CalendarDays size={17} className="text-soft" />
      </span>
      <input
        id={id}
        type="date"
        className="picker-field__native"
        value={value}
        required
        onChange={(e) => e.target.value && onChange(e.target.value)}
      />
    </div>
  );
}

interface TimeFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/** Normalizes "1945", "19.45", "9:5", "9" → "19:45", "19:45", "09:05", "09:00". */
export function normalizeTimeInput(raw: string): string | undefined {
  const s = raw.trim().replace(/[.,h ]/g, ':');
  if (!s) return '';
  let h: number;
  let m: number;
  const colon = /^(\d{1,2}):(\d{1,2})$/.exec(s);
  const digits = /^(\d{1,4})$/.exec(s);
  if (colon) {
    h = Number(colon[1]);
    m = Number(colon[2]);
  } else if (digits) {
    const d = digits[1];
    if (d.length <= 2) {
      h = Number(d);
      m = 0;
    } else {
      h = Number(d.slice(0, d.length - 2));
      m = Number(d.slice(-2));
    }
  } else {
    return undefined;
  }
  const out = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  return isValidClockTime(out) ? out : undefined;
}

/** 24-hour time entry that never shows AM/PM, whatever the device language. */
export function TimeField({ id, value, onChange, placeholder = '--:--' }: TimeFieldProps) {
  const [draft, setDraft] = useState(value);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    setDraft(value);
    setInvalid(false);
  }, [value]);

  const commit = () => {
    const normalized = normalizeTimeInput(draft);
    if (normalized === undefined) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    setDraft(normalized);
    if (normalized !== value) onChange(normalized);
  };

  return (
    <div className={`time-field ${invalid ? 'is-invalid' : ''}`}>
      <Clock size={16} className="time-field__icon" aria-hidden="true" />
      <input
        id={id}
        className="input time-field__input"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        maxLength={5}
        value={draft}
        aria-invalid={invalid}
        onChange={(e) => {
          let v = e.target.value.replace(/[^\d:.]/g, '');
          // Insert the colon automatically: "194" → "19:4" stays editable, "1945" → "19:45".
          if (/^\d{3,4}$/.test(v)) v = `${v.slice(0, v.length - 2)}:${v.slice(-2)}`;
          setDraft(v);
          setInvalid(false);
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
        }}
      />
      {draft && (
        <button
          type="button"
          className="time-field__clear"
          aria-label="Tijd wissen"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setDraft('');
            setInvalid(false);
            onChange('');
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
