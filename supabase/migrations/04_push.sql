-- SpeakUp update 4: daily reminder notifications (part 1: saving students' reminder settings).
-- Paste this file into Supabase → SQL Editor → Run. Then do 05_reminder_schedule.sql.

-- 1. Which phones/browsers want a reminder ---------------------------------------
create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
drop policy if exists "own push read" on public.push_subscriptions;
create policy "own push read" on public.push_subscriptions for select using (auth.uid() = user_id);
drop policy if exists "own push delete" on public.push_subscriptions;
create policy "own push delete" on public.push_subscriptions for delete using (auth.uid() = user_id);
grant select, delete on public.push_subscriptions to authenticated;
grant all on public.push_subscriptions to service_role;

-- Saving goes through this function so a shared phone can switch to another student.
create or replace function public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text)
returns void
language sql
security definer set search_path = public
as $$
  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
  values (auth.uid(), p_endpoint, p_p256dh, p_auth)
  on conflict (endpoint) do update set user_id = auth.uid(), p256dh = excluded.p256dh, auth = excluded.auth;
$$;
revoke all on function public.save_push_subscription(text, text, text) from public, anon;
grant execute on function public.save_push_subscription(text, text, text) to authenticated;

-- 2. Server-only settings: the push keys (made by the "reminders" function on its first run)
--    and a random secret that only the 19:00 job and the function know. Students cannot read this table.
create table if not exists public.app_secrets (
  key   text primary key,
  value text not null
);
alter table public.app_secrets enable row level security;
revoke all on public.app_secrets from anon, authenticated;
grant all on public.app_secrets to service_role;
insert into public.app_secrets (key, value)
values ('cron_secret', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
on conflict (key) do nothing;

-- Let the website see the new function straight away.
notify pgrst, 'reload schema';
