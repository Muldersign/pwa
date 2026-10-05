-- Keep-alive: Supabase pauses free projects after a week without activity.
-- A scheduled job (.github/workflows/supabase-keep-alive.yml) calls this
-- function every few days. It writes one heartbeat row, so the database sees
-- real activity. It exposes no planner data and is safe to call anonymously.

create table public.keep_alive (
  id int primary key default 1 check (id = 1),
  last_ping timestamptz not null default now(),
  pings bigint not null default 0
);

alter table public.keep_alive enable row level security;
revoke all on public.keep_alive from anon, authenticated;

create function public.keep_alive()
returns timestamptz
language sql
security definer
set search_path = public
as $$
  insert into public.keep_alive (id, last_ping, pings) values (1, now(), 1)
  on conflict (id) do update set last_ping = now(), pings = keep_alive.pings + 1
  returning last_ping;
$$;

revoke all on function public.keep_alive() from public;
grant execute on function public.keep_alive() to anon, authenticated;

-- Let the API pick up the new tables and functions immediately.
notify pgrst, 'reload schema';
