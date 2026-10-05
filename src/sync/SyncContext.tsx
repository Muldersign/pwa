import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { localRepository } from '../storage/instance';
import {
  createHousehold,
  fetchMyHousehold,
  friendlyError,
  joinHousehold,
  leaveHousehold,
  type HouseholdInfo,
  type MemberKey,
} from './household';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { SupabaseRemote } from './supabaseRemote';
import { SyncEngine, type SyncStatus } from './syncEngine';

const LINKED_KEY = 'sync.householdId';

export type LinkMode = 'merge' | 'replace';

export interface SyncState {
  configured: boolean;
  /** Auth/household state is still being resolved. */
  loading: boolean;
  email?: string;
  info: HouseholdInfo | null;
  /** True when this device is linked and syncing with the household. */
  linked: boolean;
  /** Signed in and member of a household, but this device has not been linked yet. */
  needsLink: boolean;
  status: SyncStatus;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<'signed-in' | 'confirm-email'>;
  signOut: () => Promise<void>;
  create: (name: string, me: MemberKey | undefined, keepLocal: boolean) => Promise<void>;
  join: (code: string, me: MemberKey | undefined, mode: LinkMode) => Promise<void>;
  linkDevice: (mode: LinkMode) => Promise<void>;
  leave: () => Promise<void>;
  syncNow: () => Promise<void>;
}

const SyncContext = createContext<SyncState | null>(null);

const IDLE: SyncStatus = { phase: 'idle', pending: 0 };

export function SyncProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [info, setInfo] = useState<HouseholdInfo | null>(null);
  const [linkedId, setLinkedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [status, setStatus] = useState<SyncStatus>(IDLE);
  const engine = useRef<SyncEngine | null>(null);

  // Session.
  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  // Which household this device is linked to (stored locally, works offline).
  useEffect(() => {
    void localRepository.getMeta<string>(LINKED_KEY).then((id) => setLinkedId(id ?? null));
  }, []);

  const refreshInfo = useCallback(async () => {
    if (!supabase || !session) return;
    try {
      setInfo(await fetchMyHousehold(supabase, session.user.id));
    } catch {
      // Offline: keep whatever we had; syncing continues from the linked id.
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) void refreshInfo();
    else setInfo(null);
  }, [session, refreshInfo]);

  // Run the engine whenever this device is linked and someone is signed in.
  useEffect(() => {
    if (!supabase || !session || !linkedId) return;
    const e = new SyncEngine(localRepository, new SupabaseRemote(supabase), linkedId);
    engine.current = e;
    const off = e.onStatus(setStatus);
    e.start();
    return () => {
      off();
      e.stop();
      engine.current = null;
      setStatus(IDLE);
    };
  }, [session, linkedId]);

  const link = useCallback(async (householdId: string, mode: LinkMode) => {
    if (mode === 'replace') {
      await localRepository.clearLocalOnly();
      await localRepository.setTracking(true);
    } else {
      await localRepository.ensureUuidIds();
      await localRepository.setTracking(true);
      await localRepository.enqueueAll();
    }
    await localRepository.setMeta(LINKED_KEY, householdId);
    setLinkedId(householdId);
  }, []);

  const unlink = useCallback(async () => {
    engine.current?.stop();
    await localRepository.setTracking(false);
    await localRepository.deleteMeta(LINKED_KEY);
    setLinkedId(null);
  }, []);

  const value = useMemo<SyncState>(() => {
    const guard = async <T,>(fn: () => Promise<T>): Promise<T> => {
      try {
        return await fn();
      } catch (e) {
        throw new Error(friendlyError(e instanceof Error ? e.message : String(e)));
      }
    };
    return {
      configured: isSupabaseConfigured,
      loading,
      email: session?.user.email,
      info,
      linked: !!session && !!linkedId && (!info || info.household.id === linkedId),
      needsLink: !!session && !!info && info.household.id !== linkedId,
      status,
      signIn: (email, password) =>
        guard(async () => {
          const { error } = await supabase!.auth.signInWithPassword({ email: email.trim(), password });
          if (error) throw error;
        }),
      signUp: (email, password) =>
        guard(async () => {
          const { data, error } = await supabase!.auth.signUp({
            email: email.trim(),
            password,
            options: { emailRedirectTo: window.location.origin },
          });
          if (error) throw error;
          return data.session ? 'signed-in' : 'confirm-email';
        }),
      signOut: () =>
        guard(async () => {
          await unlink();
          await supabase!.auth.signOut();
          setInfo(null);
        }),
      create: (name, me, keepLocal) =>
        guard(async () => {
          const h = await createHousehold(supabase!, name, me);
          if (!keepLocal) await localRepository.clearLocalOnly();
          await link(h.id, 'merge');
          await refreshInfo();
        }),
      join: (code, me, mode) =>
        guard(async () => {
          const h = await joinHousehold(supabase!, code, me);
          await link(h.id, mode);
          await refreshInfo();
        }),
      linkDevice: (mode) =>
        guard(async () => {
          if (info) await link(info.household.id, mode);
        }),
      leave: () =>
        guard(async () => {
          if (info && session) await leaveHousehold(supabase!, info.household.id, session.user.id);
          await unlink();
          setInfo(null);
        }),
      syncNow: () => engine.current?.sync() ?? Promise.resolve(),
    };
  }, [loading, session, info, linkedId, status, link, unlink, refreshInfo]);

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncState {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used inside SyncProvider');
  return ctx;
}
