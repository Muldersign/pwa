import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase is optional: without these variables the app runs fully local.
 * The anon/publishable key is meant to be public; row level security in the
 * database decides what each signed-in user may read and write.
 */
// Accept the dashboard's REST URL too (".../rest/v1/"): the client needs the project root.
export const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
export const supabaseKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'onze-week-auth',
          // The default navigator.locks-based lock can hang indefinitely in iOS
          // Safari / home-screen apps, which freezes every auth-dependent call.
          // This app runs in a single window, so a pass-through lock is safe.
          lock: async (_name, _timeout, fn) => fn(),
        },
      })
    : null;

export const isSupabaseConfigured = supabase !== null;

/** Latest session, kept up to date by onAuthStateChange so callers never block on the auth client. */
let currentSession: Session | null = null;
if (supabase) {
  supabase.auth.onAuthStateChange((_event, session) => {
    currentSession = session;
  });
}

export function getCurrentSession(): Session | null {
  return currentSession;
}
