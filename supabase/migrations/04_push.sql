-- SpeakUp update 4: daily reminder notifications.
-- Before running: Database → Extensions → switch ON "pg_cron" and "pg_net".
-- Replace CRON_SECRET_HERE below with the same secret you saved for the "reminders" function.
-- Then paste this file into Supabase → SQL Editor → Run.

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

-- 2. Every day at 19:00 Tashkent time (14:00 UTC), ask the "reminders" function to send them --
select cron.unschedule('speakup-daily-reminder')
where exists (select 1 from cron.job where jobname = 'speakup-daily-reminder');

select cron.schedule(
  'speakup-daily-reminder',
  '0 14 * * *',
  $$
  select net.http_post(
    url := 'https://tmmwqvffwulfcvjesmlr.supabase.co/functions/v1/reminders',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', 'CRON_SECRET_HERE'),
    body := '{}'::jsonb
  );
  $$
);
