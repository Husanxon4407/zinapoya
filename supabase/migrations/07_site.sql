-- Zinapoya update 7: public stats for the main page + the "ask a question" inbox.
-- Run the earlier migrations first. Then paste this file into Supabase → SQL Editor → Run.

-- 1. Public usage numbers for the main (landing) page ------------------------
-- Returns only totals, never any personal data, so it is safe for logged-out visitors.
create or replace function public.public_stats()
returns json
language sql
stable
security definer set search_path = public
as $$
  select json_build_object(
    'students',    (select count(*) from profiles where role = 'student'),
    'answers',     (select count(*) from attempts),
    'active_week', (select count(distinct user_id) from attempts where created_at >= now() - interval '7 days')
  );
$$;

revoke all on function public.public_stats() from public;
grant execute on function public.public_stats() to anon, authenticated;

-- 2. Questions sent from the main page --------------------------------------
create table if not exists public.site_questions (
  id         uuid primary key default gen_random_uuid(),
  name       text,
  contact    text,
  message    text not null,
  answered   boolean not null default false,
  answer     text,
  created_at timestamptz not null default now()
);
create index if not exists site_questions_created on public.site_questions (created_at desc);

alter table public.site_questions enable row level security;
-- Visitors never read or write this table directly; the "contact" Edge Function inserts rows
-- with the service role. Only the teacher can read and answer them.
drop policy if exists "teacher reads questions" on public.site_questions;
create policy "teacher reads questions" on public.site_questions
  for select using (public.is_teacher());
drop policy if exists "teacher answers questions" on public.site_questions;
create policy "teacher answers questions" on public.site_questions
  for update using (public.is_teacher()) with check (public.is_teacher());

grant select, update on public.site_questions to authenticated;
grant all on public.site_questions to service_role;

-- Let the website see the new table and function straight away.
notify pgrst, 'reload schema';
