-- SpeakUp database setup.
-- Paste this whole file into Supabase → SQL Editor → New query → Run.

-- 1. Every recorded answer -------------------------------------------------
create table if not exists public.attempts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users on delete cascade,
  part          text not null check (part in ('1.1', '1.2', '2', '3')),
  question_id   text not null,
  question_text text not null,
  mode          text not null default 'practice',
  transcript    text not null default '',
  duration_sec  int  not null default 0,
  target_sec    int,
  word_count    int  not null default 0,
  wpm           int  not null default 0,
  filler_count  int  not null default 0,
  scores        jsonb,          -- {fluency, vocabulary, grammar, task, overall, level}
  feedback      jsonb,          -- full AI feedback
  recording_path text,          -- path inside the "recordings" storage bucket
  created_at    timestamptz not null default now()
);
create index if not exists attempts_user_created on public.attempts (user_id, created_at desc);

alter table public.attempts enable row level security;
drop policy if exists "own attempts" on public.attempts;
create policy "own attempts" on public.attempts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2. Saved phrases ----------------------------------------------------------
create table if not exists public.bookmarks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  kind       text not null default 'phrase',
  ref        text,
  text       text not null,
  created_at timestamptz not null default now()
);
alter table public.bookmarks enable row level security;
drop policy if exists "own bookmarks" on public.bookmarks;
create policy "own bookmarks" on public.bookmarks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3. Model answers (written once by the AI, shared by all students) ----------
create table if not exists public.model_answers (
  question_id text primary key,
  answer      text not null,
  created_at  timestamptz not null default now()
);
alter table public.model_answers enable row level security;
drop policy if exists "students read model answers" on public.model_answers;
create policy "students read model answers" on public.model_answers
  for select to authenticated using (true);
-- Only the server function (service role) writes here.

-- 4. AI usage log for the daily limit (only the server function touches it) ---
create table if not exists public.ai_usage (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users on delete cascade,
  kind       text not null,
  created_at timestamptz not null default now()
);
create index if not exists ai_usage_user_created on public.ai_usage (user_id, created_at desc);
alter table public.ai_usage enable row level security;
-- No policies: students cannot read or change it.

-- 5. Private storage for recordings -----------------------------------------
insert into storage.buckets (id, name, public)
values ('recordings', 'recordings', false)
on conflict (id) do nothing;

drop policy if exists "own recordings read" on storage.objects;
drop policy if exists "own recordings write" on storage.objects;
drop policy if exists "own recordings delete" on storage.objects;
create policy "own recordings read" on storage.objects for select to authenticated
  using (bucket_id = 'recordings' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own recordings write" on storage.objects for insert to authenticated
  with check (bucket_id = 'recordings' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own recordings delete" on storage.objects for delete to authenticated
  using (bucket_id = 'recordings' and (storage.foldername(name))[1] = auth.uid()::text);
