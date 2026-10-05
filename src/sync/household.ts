import type { SupabaseClient } from '@supabase/supabase-js';

export type MemberKey = 'glenn' | 'jessica';

export interface Household {
  id: string;
  name: string;
  inviteCode: string;
}

export interface HouseholdMember {
  userId: string;
  memberKey?: MemberKey;
}

export interface HouseholdInfo {
  household: Household;
  members: HouseholdMember[];
  me?: MemberKey;
}

interface HouseholdRow {
  id: string;
  name: string;
  invite_code: string;
}

const toHousehold = (r: HouseholdRow): Household => ({ id: r.id, name: r.name, inviteCode: r.invite_code });

/** Translates database errors into short Dutch messages. */
export function friendlyError(message: string): string {
  if (/schema cache|Could not find the (function|table)|relation .* does not exist/i.test(message)) {
    return 'De database is nog niet ingericht. Voer in Supabase (SQL Editor) het script supabase/migrations/20261005120000_onze_week.sql uit en probeer het opnieuw.';
  }
  if (/invalid_invite_code/.test(message)) return 'Deze code is onbekend. Controleer de code en probeer het opnieuw.';
  if (/Invalid login credentials/i.test(message)) return 'E-mailadres of wachtwoord klopt niet.';
  if (/Email not confirmed/i.test(message)) return 'Bevestig eerst je e-mailadres via de link in je mail.';
  if (/User already registered/i.test(message)) return 'Er bestaat al een account met dit e-mailadres. Log in.';
  if (/Password should be at least/i.test(message)) return 'Kies een wachtwoord van minimaal 6 tekens.';
  if (/rate limit/i.test(message)) return 'Te veel pogingen. Wacht even en probeer het opnieuw.';
  if (/fetch|network/i.test(message)) return 'Geen verbinding met de server. Ben je online?';
  return message;
}

export async function fetchMyHousehold(client: SupabaseClient, userId: string): Promise<HouseholdInfo | null> {
  const { data, error } = await client
    .from('household_members')
    .select('household_id, member_key, households (id, name, invite_code)')
    .eq('user_id', userId)
    .order('joined_at', { ascending: true })
    .limit(1);
  if (error) throw new Error(error.message);
  const row = data?.[0] as unknown as { member_key: MemberKey | null; households: HouseholdRow | HouseholdRow[] | null } | undefined;
  const h = Array.isArray(row?.households) ? row?.households[0] : row?.households;
  if (!row || !h) return null;

  const { data: members, error: mErr } = await client
    .from('household_members')
    .select('user_id, member_key')
    .eq('household_id', h.id);
  if (mErr) throw new Error(mErr.message);

  return {
    household: toHousehold(h),
    me: row.member_key ?? undefined,
    members: (members ?? []).map((m) => ({ userId: m.user_id as string, memberKey: (m.member_key ?? undefined) as MemberKey | undefined })),
  };
}

export async function createHousehold(client: SupabaseClient, name: string, me?: MemberKey): Promise<Household> {
  const { data, error } = await client.rpc('create_household', { p_name: name, p_member_key: me ?? null });
  if (error) throw new Error(error.message);
  return toHousehold(data as HouseholdRow);
}

export async function joinHousehold(client: SupabaseClient, code: string, me?: MemberKey): Promise<Household> {
  const { data, error } = await client.rpc('join_household', { p_code: code.trim(), p_member_key: me ?? null });
  if (error) throw new Error(error.message);
  return toHousehold(data as HouseholdRow);
}

export async function leaveHousehold(client: SupabaseClient, householdId: string, userId: string) {
  const { error } = await client.from('household_members').delete().eq('household_id', householdId).eq('user_id', userId);
  if (error) throw new Error(error.message);
}
