import type { ParseResult } from '../../domain/actions';
import { toISODate } from '../../lib/dates';
import { parseLocally } from './localParser';
import { sanitizeActions } from './validate';

export interface CommandParser {
  readonly name: string;
  parse(input: string, now: Date): Promise<ParseResult>;
}

/** Offline, rule-based Dutch parser. Always available. */
export const localParser: CommandParser = {
  name: 'local',
  parse: async (input, now) => parseLocally(input, now),
};

/**
 * Parser backed by a server route (see api/parse.ts). The browser never sees an
 * API key: it only talks to our own endpoint, which holds the secret.
 */
export function createRemoteParser(endpoint: string, timeoutMs = 9000): CommandParser {
  return {
    name: 'ai',
    async parse(input, now) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input,
            today: toISODate(now),
            weekday: now.toLocaleDateString('nl-NL', { weekday: 'long' }),
            time: now.toTimeString().slice(0, 5),
          }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`AI endpoint ${res.status}`);
        const body = (await res.json()) as { actions?: unknown };
        return { actions: sanitizeActions(body.actions), source: 'ai' };
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

/** Endpoint is configured at build time; the AI toggle lives in the app settings. */
export const AI_ENDPOINT: string | undefined = import.meta.env.VITE_AI_PARSE_ENDPOINT || undefined;

export interface ParseOptions {
  now?: Date;
  useAI?: boolean;
}

/**
 * Turns a Dutch sentence into structured planner actions.
 * Tries the AI endpoint when enabled and online, and always falls back to the
 * local parser so the app keeps working offline or without configuration.
 */
export async function parseNaturalLanguageCommand(input: string, options: ParseOptions = {}): Promise<ParseResult> {
  const now = options.now ?? new Date();
  const local = parseLocally(input, now);

  const online = typeof navigator === 'undefined' || navigator.onLine;
  if (options.useAI && AI_ENDPOINT && online) {
    try {
      const ai = await createRemoteParser(AI_ENDPOINT).parse(input, now);
      // Keep the local clarification flow: if local saw an ambiguity, ask first.
      if (ai.actions.length > 0 && !local.clarification) return ai;
    } catch {
      // Network error, timeout or misconfiguration: the local parser takes over.
    }
  }
  return local;
}
