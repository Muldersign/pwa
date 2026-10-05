-- Onze Week — shared household planning
--
-- Every row belongs to a household. Members of a household can read and write
-- its rows (row level security); nobody else can. Clients never hard-delete:
-- they set deleted_at so the deletion syncs to other devices.
--
-- Safe to run more than once: it only adds what is missing.
--
-- Sync model: clients push rows with their own updated_at (last write wins,
-- enforced by a trigger) and pull everything with synced_at > their cursor.

-- ---------------------------------------------------------------------------
-- Households & members
-- ---------------------------------------------------------------------------

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Ons huishouden' check (char_length(name) between 1 and 80),
  invite_code text not null unique default upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6)),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  member_key text check (member_key in ('glenn', 'jessica')),
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create index if not exists household_members_user_idx on public.household_members (user_id);

-- Security definer so policies can use it without recursing into RLS.
create or replace function public.is_household_member(hid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.household_members
    where household_id = hid and user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- Planner data
-- ---------------------------------------------------------------------------

create table if not exists public.activities (
  id uuid primary key,
  household_id uuid not null references public.households (id) on delete cascade,
  title text not null,
  date date not null,
  start_time text check (start_time ~ '^\d{2}:\d{2}$'),
  end_time text check (end_time ~ '^\d{2}:\d{2}$'),
  location text,
  category text not null default 'other',
  notes text,
  assigned_to text check (assigned_to in ('glenn', 'jessica', 'samen')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  synced_at timestamptz not null default now()
);

create table if not exists public.meals (
  id uuid primary key,
  household_id uuid not null references public.households (id) on delete cascade,
  title text not null,
  date date not null,
  meal_type text not null default 'dinner' check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  time text check (time ~ '^\d{2}:\d{2}$'),
  location text,
  ingredients jsonb not null default '[]'::jsonb,
  notes text,
  assigned_to text check (assigned_to in ('glenn', 'jessica', 'samen')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  synced_at timestamptz not null default now()
);

create table if not exists public.grocery_items (
  id uuid primary key,
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  quantity numeric,
  unit text,
  category text not null default 'other',
  completed boolean not null default false,
  completed_at timestamptz,
  source_meal_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  synced_at timestamptz not null default now()
);

create table if not exists public.day_notes (
  household_id uuid not null references public.households (id) on delete cascade,
  date date not null,
  text text not null default '',
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  synced_at timestamptz not null default now(),
  primary key (household_id, date)
);

create index if not exists activities_sync_idx on public.activities (household_id, synced_at);
create index if not exists meals_sync_idx on public.meals (household_id, synced_at);
create index if not exists grocery_items_sync_idx on public.grocery_items (household_id, synced_at);
create index if not exists day_notes_sync_idx on public.day_notes (household_id, synced_at);

-- Last write wins: an update carrying an older updated_at than the stored row
-- is silently ignored. Every accepted write gets a fresh synced_at, which is
-- what clients use as their pull cursor.
create or replace function public.sync_row_guard()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' then
    if new.household_id <> old.household_id then
      raise exception 'household_id cannot change';
    end if;
    if new.updated_at < old.updated_at then
      return null;
    end if;
  end if;
  new.synced_at := clock_timestamp();
  return new;
end;
$$;

drop trigger if exists activities_sync_guard on public.activities;
create trigger activities_sync_guard before insert or update on public.activities
  for each row execute function public.sync_row_guard();
drop trigger if exists meals_sync_guard on public.meals;
create trigger meals_sync_guard before insert or update on public.meals
  for each row execute function public.sync_row_guard();
drop trigger if exists grocery_items_sync_guard on public.grocery_items;
create trigger grocery_items_sync_guard before insert or update on public.grocery_items
  for each row execute function public.sync_row_guard();
drop trigger if exists day_notes_sync_guard on public.day_notes;
create trigger day_notes_sync_guard before insert or update on public.day_notes
  for each row execute function public.sync_row_guard();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.activities enable row level security;
alter table public.meals enable row level security;
alter table public.grocery_items enable row level security;
alter table public.day_notes enable row level security;

drop policy if exists "members read household" on public.households;
create policy "members read household" on public.households
  for select to authenticated using (public.is_household_member(id));
drop policy if exists "members rename household" on public.households;
create policy "members rename household" on public.households
  for update to authenticated using (public.is_household_member(id)) with check (public.is_household_member(id));

drop policy if exists "members see each other" on public.household_members;
create policy "members see each other" on public.household_members
  for select to authenticated using (public.is_household_member(household_id));
drop policy if exists "update own membership" on public.household_members;
create policy "update own membership" on public.household_members
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "leave household" on public.household_members;
create policy "leave household" on public.household_members
  for delete to authenticated using (user_id = auth.uid());

drop policy if exists "members manage activities" on public.activities;
create policy "members manage activities" on public.activities
  for all to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));
drop policy if exists "members manage meals" on public.meals;
create policy "members manage meals" on public.meals
  for all to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));
drop policy if exists "members manage grocery items" on public.grocery_items;
create policy "members manage grocery items" on public.grocery_items
  for all to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));
drop policy if exists "members manage day notes" on public.day_notes;
create policy "members manage day notes" on public.day_notes
  for all to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

revoke all on public.households, public.household_members, public.activities, public.meals,
  public.grocery_items, public.day_notes from anon;
grant select, update on public.households to authenticated;
grant select, update, delete on public.household_members to authenticated;
grant select, insert, update on public.activities, public.meals, public.grocery_items, public.day_notes to authenticated;

-- ---------------------------------------------------------------------------
-- Creating and joining a household (the only way to become a member)
-- ---------------------------------------------------------------------------

create or replace function public.create_household(p_name text default 'Ons huishouden', p_member_key text default null)
returns public.households
language plpgsql
security definer
set search_path = public
as $$
declare
  h public.households;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  insert into public.households (name, created_by)
  values (coalesce(nullif(trim(p_name), ''), 'Ons huishouden'), auth.uid())
  returning * into h;
  insert into public.household_members (household_id, user_id, member_key)
  values (h.id, auth.uid(), p_member_key);
  return h;
end;
$$;

create or replace function public.join_household(p_code text, p_member_key text default null)
returns public.households
language plpgsql
security definer
set search_path = public
as $$
declare
  h public.households;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  select * into h from public.households where invite_code = upper(trim(p_code));
  if h.id is null then
    raise exception 'invalid_invite_code';
  end if;
  insert into public.household_members (household_id, user_id, member_key)
  values (h.id, auth.uid(), p_member_key)
  on conflict (household_id, user_id) do update set member_key = coalesce(excluded.member_key, household_members.member_key);
  return h;
end;
$$;

revoke all on function public.create_household(text, text) from public, anon;
revoke all on function public.join_household(text, text) from public, anon;
revoke all on function public.is_household_member(uuid) from public, anon;
grant execute on function public.create_household(text, text) to authenticated;
grant execute on function public.join_household(text, text) to authenticated;
grant execute on function public.is_household_member(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime: devices get notified of changes (RLS still applies)
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array['activities', 'meals', 'grocery_items', 'day_notes'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;

-- Let the API pick up the new tables and functions immediately.
notify pgrst, 'reload schema';
