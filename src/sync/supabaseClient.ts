import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase is optional: without these variables the app runs fully local.
 * The anon/publishable key is meant to be public; row level security in the
 * database decides what each signed-in user may read and write.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;

export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'onze-week-auth' },
      })
    : null;

export const isSupabaseConfigured = supabase !== null;
