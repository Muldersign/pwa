import { addDays } from 'date-fns';
import type { ParseResult } from '../../domain/actions';
import { fromISODate, toISODate } from '../../lib/dates';
import { MEAL_LABELS } from '../../lib/timeline';
import type { PlannerSnapshot } from '../../storage/repository';
import { supabase } from '../../sync/supabaseClient';
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

const AI_TIMEOUT_MS = 25_000;

/**
 * Claude via the Supabase Edge Function "parse" (supabase/functions/parse).
 * The signed-in user's session authorizes the call; the API key lives in the
 * function's secrets and never reaches the browser.
 */
export const supabaseAIParser: CommandParser = {
  name: 'ai',
  async parse(input, now, context) {
    if (!supabase) throw new Error('Supabase is niet ingesteld');
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) throw new Error('Log in (Meer → Samen) om AI te gebruiken');

    const call = supabase.functions.invoke('parse', {
      body: {
        input,
        today: toISODate(now),
        weekday: now.toLocaleDateString('nl-NL', { weekday: 'long' }),
        time: now.toTimeString().slice(0, 5),
        context,
      },
    });
    const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('AI reageerde niet op tijd')), AI_TIMEOUT_MS));
    const { data, error } = await Promise.race([call, timeout]);
    if (error) {
      // FunctionsHttpError carries the response; surface the function's own message.
      let detail = error.message;
      const ctx = (error as { context?: Response }).context;
      if (ctx && typeof ctx.json === 'function') {
        try {
          const b = (await ctx.json()) as { error?: string };
          if (b.error) detail = b.error;
        } catch {
          // keep the generic message
        }
      }
      throw new Error(detail);
    }
    return { actions: sanitizeActions((data as { actions?: unknown })?.actions), source: 'ai' };
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
