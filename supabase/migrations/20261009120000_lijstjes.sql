-- Onze Week — lijstjes (guest lists with responses)
-- Safe to run more than once: it only adds what is missing.

create table if not exists public.lists (
  id uuid primary key,
  household_id uuid not null references public.households (id) on delete cascade,
  title text not null,
  date date,
  time text check (time ~ '^\d{2}:\d{2}$'),
  location text,
  notes text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  synced_at timestamptz not null default now()
);

-- list_id has no foreign key on purpose: items and lists sync independently.
create table if not exists public.list_items (
  id uuid primary key,
  household_id uuid not null references public.households (id) on delete cascade,
  list_id uuid not null,
  name text not null,
  status text not null default 'pending' check (status in ('pending', 'yes', 'maybe', 'no')),
  count integer check (count is null or count between 0 and 50),
  note text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  synced_at timestamptz not null default now()
);

create index if not exists lists_sync_idx on public.lists (household_id, synced_at);
create index if not exists list_items_sync_idx on public.list_items (household_id, synced_at);
create index if not exists list_items_list_idx on public.list_items (list_id);

drop trigger if exists lists_sync_guard on public.lists;
create trigger lists_sync_guard before insert or update on public.lists
  for each row execute function public.sync_row_guard();
drop trigger if exists list_items_sync_guard on public.list_items;
create trigger list_items_sync_guard before insert or update on public.list_items
  for each row execute function public.sync_row_guard();

alter table public.lists enable row level security;
alter table public.list_items enable row level security;

drop policy if exists "members manage lists" on public.lists;
create policy "members manage lists" on public.lists
  for all to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));
drop policy if exists "members manage list items" on public.list_items;
create policy "members manage list items" on public.list_items
  for all to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

revoke all on public.lists, public.list_items from anon;
grant select, insert, update on public.lists, public.list_items to authenticated;

do $$
declare
  t text;
begin
  foreach t in array array['lists', 'list_items'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Glenn's verjaardag: three guest lists + the parties in the agenda.
-- Added to the household with the most members (yours). Fixed ids, so running
-- this script again does not create duplicates.
-- ---------------------------------------------------------------------------

do $$
declare
  hid uuid;
begin
  select h.id into hid
  from public.households h
  left join public.household_members m on m.household_id = h.id
  group by h.id
  order by count(m.user_id) desc, min(h.created_at) asc
  limit 1;

  if hid is null then
    raise notice 'Geen huishouden gevonden: maak eerst in de app een huishouden aan en voer dit script daarna opnieuw uit.';
    return;
  end if;

  insert into public.lists (id, household_id, title, date, time)
  select v.id, hid, v.title, v.date, v.time
  from (values
    ('f3d3d85d-5352-5da3-9bdd-1716125fd7e5'::uuid, 'Familie', '2026-10-30'::date, '19:30'),
    ('dd7c16c7-6952-575c-833c-e7063f3fdfb0'::uuid, 'Vrienden', '2026-10-31'::date, '20:00'),
    ('01551973-b052-5948-a70c-898194f2b5a8'::uuid, 'Bier', '2026-10-24'::date, '20:00')
  ) as v(id, title, date, time)
  on conflict (id) do nothing;

  insert into public.list_items (id, household_id, list_id, name, position)
  select v.id, hid, v.list_id, v.name, v.position
  from (values
    ('1b7f893a-30d5-5f0e-ac1a-17cb5922617c'::uuid, 'f3d3d85d-5352-5da3-9bdd-1716125fd7e5'::uuid, 'Oma', 0),
    ('a2f512a1-e743-5713-8349-1c960bbce430'::uuid, 'f3d3d85d-5352-5da3-9bdd-1716125fd7e5'::uuid, 'Gerard', 1),
    ('f08defa3-4902-50f0-85dd-6f0d8a0c4739'::uuid, 'f3d3d85d-5352-5da3-9bdd-1716125fd7e5'::uuid, 'Hannah', 2),
    ('1fa44b46-c8c7-5a2c-a536-c512b8a571c7'::uuid, 'f3d3d85d-5352-5da3-9bdd-1716125fd7e5'::uuid, 'Alma', 3),
    ('11451976-9c4d-5a52-86f8-044abf2d5175'::uuid, 'f3d3d85d-5352-5da3-9bdd-1716125fd7e5'::uuid, 'Jan', 4),
    ('43741252-5e8a-544a-9247-33e596107c15'::uuid, 'f3d3d85d-5352-5da3-9bdd-1716125fd7e5'::uuid, 'Bryan', 5),
    ('47ede706-7ac4-5fe1-9456-52eb07034b77'::uuid, 'f3d3d85d-5352-5da3-9bdd-1716125fd7e5'::uuid, 'Melanie', 6),
    ('84fa4746-2a34-5f5d-bcdc-e0075a9bacc4'::uuid, 'f3d3d85d-5352-5da3-9bdd-1716125fd7e5'::uuid, 'Noor', 7),
    ('8c9e24d0-418a-56a8-b894-5dee4ac19097'::uuid, 'f3d3d85d-5352-5da3-9bdd-1716125fd7e5'::uuid, 'Betsy', 8),
    ('e50d7302-5833-5cf6-914e-90314fa324b9'::uuid, 'f3d3d85d-5352-5da3-9bdd-1716125fd7e5'::uuid, 'Jeroen', 9),
    ('8c0d7a2b-a867-54b3-9a55-dacdc0f6c7e0'::uuid, 'f3d3d85d-5352-5da3-9bdd-1716125fd7e5'::uuid, 'Rick?', 10),
    ('6cea5cae-0f7d-5b66-9f13-33a2d3a9d5ee'::uuid, 'dd7c16c7-6952-575c-833c-e7063f3fdfb0'::uuid, 'Rick', 0),
    ('fcec6245-c748-5025-bb5f-2c261487d3ae'::uuid, 'dd7c16c7-6952-575c-833c-e7063f3fdfb0'::uuid, 'Jolien', 1),
    ('72aa2a85-ff56-566f-9965-8a63e0b02c5c'::uuid, 'dd7c16c7-6952-575c-833c-e7063f3fdfb0'::uuid, 'Sanne', 2),
    ('8c214d1e-7691-50b1-9a3e-5505000cf5c4'::uuid, 'dd7c16c7-6952-575c-833c-e7063f3fdfb0'::uuid, 'Alex', 3),
    ('205aeb95-392d-5a21-b1b5-f9c05149a6bb'::uuid, 'dd7c16c7-6952-575c-833c-e7063f3fdfb0'::uuid, 'Sander', 4),
    ('a79be9e8-baa4-5624-bb3b-947adbdd07bf'::uuid, 'dd7c16c7-6952-575c-833c-e7063f3fdfb0'::uuid, 'Rosalie', 5),
    ('aa611d5d-3724-5377-bcc7-d2d4b44a3fd4'::uuid, 'dd7c16c7-6952-575c-833c-e7063f3fdfb0'::uuid, 'Daniël', 6),
    ('cc329a32-1b20-54b0-a75e-19b903f64eb1'::uuid, 'dd7c16c7-6952-575c-833c-e7063f3fdfb0'::uuid, 'Jennifer', 7),
    ('b8d0a37e-37e4-5cba-bc44-112a6ad0548a'::uuid, 'dd7c16c7-6952-575c-833c-e7063f3fdfb0'::uuid, 'Bart', 8),
    ('cfdc82f0-bafc-581a-a010-f39440d1939d'::uuid, 'dd7c16c7-6952-575c-833c-e7063f3fdfb0'::uuid, 'Eleni', 9),
    ('d0c8b0a5-a55d-5917-b91f-1c8fdb7c9a1e'::uuid, 'dd7c16c7-6952-575c-833c-e7063f3fdfb0'::uuid, 'Daniëlle', 10),
    ('16657adb-0f8d-5d5b-9e7c-eac6e8946c7b'::uuid, 'dd7c16c7-6952-575c-833c-e7063f3fdfb0'::uuid, 'Stefan', 11),
    ('315eead6-9554-521e-8200-61a03ee0dd25'::uuid, 'dd7c16c7-6952-575c-833c-e7063f3fdfb0'::uuid, 'Maureen', 12),
    ('fbd2b0a3-fae4-52a1-8f6f-01687a24902c'::uuid, 'dd7c16c7-6952-575c-833c-e7063f3fdfb0'::uuid, 'Yvan', 13),
    ('2741fa69-4c2a-5540-8f27-6efe89d96c84'::uuid, '01551973-b052-5948-a70c-898194f2b5a8'::uuid, 'Arno', 0),
    ('9bdc04e1-6da2-5a9d-9f3f-0c6003ec3526'::uuid, '01551973-b052-5948-a70c-898194f2b5a8'::uuid, 'Bryan', 1),
    ('ebd4e503-8114-53a7-9ad3-0ee8918fe663'::uuid, '01551973-b052-5948-a70c-898194f2b5a8'::uuid, 'Jon', 2),
    ('51620472-37f2-5afb-b0a4-7196e84e6a0e'::uuid, '01551973-b052-5948-a70c-898194f2b5a8'::uuid, 'Jorrik', 3),
    ('d1c0515e-a512-5470-9361-5b61d960316b'::uuid, '01551973-b052-5948-a70c-898194f2b5a8'::uuid, 'Jos', 4),
    ('b04622b2-ba0a-5ef8-b342-50835d4997fa'::uuid, '01551973-b052-5948-a70c-898194f2b5a8'::uuid, 'Korné', 5),
    ('784f544d-871d-500a-9030-24da88e8f417'::uuid, '01551973-b052-5948-a70c-898194f2b5a8'::uuid, 'Niels', 6),
    ('21f58563-eb25-5295-8fb3-8eefaeb37585'::uuid, '01551973-b052-5948-a70c-898194f2b5a8'::uuid, 'Nick', 7),
    ('ad045e23-7ed9-54d0-824c-d5b123751a85'::uuid, '01551973-b052-5948-a70c-898194f2b5a8'::uuid, 'Stefan', 8),
    ('9716932e-98e4-5644-9ad5-89e5df96f64f'::uuid, '01551973-b052-5948-a70c-898194f2b5a8'::uuid, 'Rob', 9),
    ('33db0205-a58a-53a7-a281-17783ff29b34'::uuid, '01551973-b052-5948-a70c-898194f2b5a8'::uuid, 'Reint', 10),
    ('3427450e-2853-5903-ace6-05573792a5d2'::uuid, '01551973-b052-5948-a70c-898194f2b5a8'::uuid, 'Tristan', 11)
  ) as v(id, list_id, name, position)
  on conflict (id) do nothing;

  insert into public.activities (id, household_id, title, date, start_time, category, assigned_to)
  select v.id, hid, v.title, v.date, v.start_time, 'social', 'samen'
  from (values
    ('3114f2e7-cfb6-547d-a1c7-66408b946fdd'::uuid, 'Verjaardag familie', '2026-10-30'::date, '19:30'),
    ('08feaf88-c611-51bc-b78d-aeacfb17d6bd'::uuid, 'Verjaardag vrienden', '2026-10-31'::date, '20:00'),
    ('1cb17605-f70d-5aae-b463-12c90271e1ec'::uuid, 'Verjaardag bier', '2026-10-24'::date, '20:00')
  ) as v(id, title, date, start_time)
  on conflict (id) do nothing;
end;
$$;

-- Let the API pick up the new tables immediately.
notify pgrst, 'reload schema';
