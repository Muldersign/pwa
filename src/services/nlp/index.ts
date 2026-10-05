import { addDays } from 'date-fns';
import type { ParseResult } from '../../domain/actions';
import { fromISODate, toISODate } from '../../lib/dates';
import { MEAL_LABELS } from '../../lib/timeline';
import type { PlannerSnapshot } from '../../storage/repository';
import { getCurrentSession, supabase, supabaseKey, supabaseUrl } from '../../sync/supabaseClient';
import { parseLocally } from './localParser';
import { sanitizeActions } from './validate';

export interface CommandParser {
  readonly name: string;
  parse(input: string, now: Date, context?: string): Promise<ParseResult>;
}

/** Offline, rule-based Dutch parser. Always available. */
export const localParser: CommandParser = {
  name: 'local',
  parse: async (input, now) => parseLocally(input, now),
};

const AI_TIMEOUT_MS = 20_000;

/**
 * Claude via the Supabase Edge Function "parse" (supabase/functions/parse).
 * Called with plain fetch and a hard timeout, using the cached session token,
 * so a stuck auth client can never leave the chat waiting.
 */
export const supabaseAIParser: CommandParser = {
  name: 'ai',
  async parse(input, now, context) {
    if (!supabaseUrl || !supabaseKey) throw new Error('Supabase is niet ingesteld');
    const session = getCurrentSession();
    if (!session) throw new Error('Log in (Meer → Samen) om AI te gebruiken');
    if (session.expires_at && session.expires_at * 1000 < Date.now()) {
      throw new Error('Inlogsessie verlopen, open de app opnieuw');
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseKey,
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          input,
          today: toISODate(now),
          weekday: now.toLocaleDateString('nl-NL', { weekday: 'long' }),
          time: now.toTimeString().slice(0, 5),
          context,
        }),
        signal: controller.signal,
      });
      const body = (await res.json().catch(() => ({}))) as { actions?: unknown; error?: string; message?: string; msg?: string };
      if (!res.ok) throw new Error(body.error ?? body.message ?? body.msg ?? `HTTP ${res.status}`);
      return { actions: sanitizeActions(body.actions), source: 'ai' };
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') throw new Error('AI reageerde niet binnen 20 seconden');
      throw e;
    } finally {
      clearTimeout(timer);
    }
  },
};

/** AI is available when Supabase is configured; it is used when the user is signed in and online. */
export const AI_AVAILABLE = supabase !== null;

/**
 * Compact list of existing items around today, so the model can refer to
 * exactly the right item for "verplaats de training" or "geen pasta maar wraps".
 */
export function buildParseContext(data: PlannerSnapshot, now: Date): string {
  const from = toISODate(addDays(now, -3));
  const to = toISODate(addDays(now, 28));
  const lines: string[] = [];
  const inRange = (d: string) => d >= from && d <= to;
  const weekday = (d: string) => fromISODate(d).toLocaleDateString('nl-NL', { weekday: 'short' });

  for (const a of [...data.activities].filter((x) => inRange(x.date)).sort((x, y) => x.date.localeCompare(y.date))) {
    lines.push(`${a.date} (${weekday(a.date)}) | activiteit | ${a.startTime ?? '-'} | ${a.title}${a.location ? ` | ${a.location}` : ''}`);
  }
  for (const m of [...data.meals].filter((x) => inRange(x.date)).sort((x, y) => x.date.localeCompare(y.date))) {
    lines.push(`${m.date} (${weekday(m.date)}) | maaltijd ${MEAL_LABELS[m.mealType].toLowerCase()} | ${m.time ?? '-'} | ${m.title}`);
  }
  const groceries = data.groceries.filter((g) => !g.completed).map((g) => g.name);
  if (groceries.length) lines.push(`boodschappenlijst: ${groceries.join(', ')}`);
  return lines.slice(0, 200).join('\n');
}

export interface ParseOptions {
  now?: Date;
  useAI?: boolean;
  /** Existing planner data, used as context for the AI. */
  data?: PlannerSnapshot;
}

/**
 * Turns a Dutch sentence into structured planner actions.
 * Uses Claude when enabled, signed in and online; otherwise (or when the AI
 * fails) the local rule-based parser, so the app always keeps working.
 */
export async function parseNaturalLanguageCommand(input: string, options: ParseOptions = {}): Promise<ParseResult> {
  const now = options.now ?? new Date();
  const online = typeof navigator === 'undefined' || navigator.onLine;

  let aiError: string | undefined;
  if (options.useAI && AI_AVAILABLE && online) {
    try {
      const context = options.data ? buildParseContext(options.data, now) : undefined;
      const ai = await supabaseAIParser.parse(input, now, context);
      if (ai.actions.length > 0) return ai;
      aiError = undefined;
    } catch (e) {
      aiError = e instanceof Error ? e.message : String(e);
    }
  }
  return { ...parseLocally(input, now), aiError };
}
