-- Zinapoya update 10: CEFR Multilevel WRITING (Phase 1).
-- Run the earlier migrations first. Then paste this file into Supabase → SQL Editor → Run.
--
-- The writing tasks themselves live in the website code (src/features/writing/data), like the
-- speaking questions. The database keeps what students write and how it was graded.

-- 1. Writing attempts ---------------------------------------------------------
-- One row per checked text. Rows are written ONLY by the "writing" Edge Function (service role),
-- so a student cannot give themselves a score. Students can read and delete their own rows.
create table if not exists public.writing_attempts (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users on delete cascade,
  part              text not null check (part in ('1.1', '1.2', '2')),
  task_id           text not null,                 -- id in src/features/writing/data
  task_title        text,
  mode              text not null default 'quick' check (mode in ('quick', 'ladder', 'exam')),
  body              text not null,
  word_count        int  not null default 0,
  time_spent_s      int,
  band              numeric(3, 1),                 -- final band for the part (after the official length rule)
  band_ai           numeric(3, 1),                 -- what the AI gave before the length rule
  capped_by         text,                          -- 'length' | 'empty' | null
  result            jsonb,                         -- full feedback (points, errors, strengths…)
  model             text,
  prompt_version    text,
  version           int  not null default 1,       -- 1 = first draft, 2+ = after fixing (Phase 2)
  parent_attempt_id uuid references public.writing_attempts on delete set null,
  created_at        timestamptz not null default now()
);
create index if not exists writing_attempts_user_created on public.writing_attempts (user_id, created_at desc);

alter table public.writing_attempts enable row level security;
drop policy if exists "own writing read" on public.writing_attempts;
create policy "own writing read" on public.writing_attempts
  for select using (auth.uid() = user_id or public.is_teacher());
drop policy if exists "own writing delete" on public.writing_attempts;
create policy "own writing delete" on public.writing_attempts
  for delete using (auth.uid() = user_id);

grant select, delete on public.writing_attempts to authenticated;
grant all on public.writing_attempts to service_role;

-- 2. Mistake Bank -------------------------------------------------------------
-- Every mistake the grader finds. Later the games are built from these (Phase 2).
create table if not exists public.writing_mistakes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  attempt_id  uuid not null references public.writing_attempts on delete cascade,
  part        text not null,
  type        text not null,          -- grammar | vocabulary | spelling | punctuation | register | …
  severity    text not null,          -- blocks_meaning | noticeable | small
  original    text not null,
  suggestion  text not null,
  sentence    text,
  explain     text,
  explain_uz  text,
  rule_id     text,
  mastered    boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists writing_mistakes_user on public.writing_mistakes (user_id, created_at desc);

alter table public.writing_mistakes enable row level security;
drop policy if exists "own mistakes read" on public.writing_mistakes;
create policy "own mistakes read" on public.writing_mistakes
  for select using (auth.uid() = user_id or public.is_teacher());
-- Students may only tick "mastered" on their own mistakes (no other column can change).
drop policy if exists "own mistakes update" on public.writing_mistakes;
create policy "own mistakes update" on public.writing_mistakes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own mistakes delete" on public.writing_mistakes;
create policy "own mistakes delete" on public.writing_mistakes
  for delete using (auth.uid() = user_id);

grant select, delete on public.writing_mistakes to authenticated;
grant update (mastered) on public.writing_mistakes to authenticated;
grant all on public.writing_mistakes to service_role;

-- 3. "This score feels wrong" reports (they grow the calibration set) -----------
create table if not exists public.writing_score_reports (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users on delete cascade,
  attempt_id   uuid not null references public.writing_attempts on delete cascade,
  reason       text,
  teacher_band numeric(3, 1),
  status       text not null default 'new',
  created_at   timestamptz not null default now()
);
alter table public.writing_score_reports enable row level security;
drop policy if exists "own report insert" on public.writing_score_reports;
create policy "own report insert" on public.writing_score_reports
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.writing_attempts a where a.id = attempt_id and a.user_id = auth.uid())
  );
drop policy if exists "report read" on public.writing_score_reports;
create policy "report read" on public.writing_score_reports
  for select using (auth.uid() = user_id or public.is_teacher());
drop policy if exists "teacher reviews reports" on public.writing_score_reports;
create policy "teacher reviews reports" on public.writing_score_reports
  for update using (public.is_teacher()) with check (public.is_teacher());

grant select, insert on public.writing_score_reports to authenticated;
grant update (teacher_band, status) on public.writing_score_reports to authenticated;
grant all on public.writing_score_reports to service_role;

-- Let the website see the new tables straight away.
notify pgrst, 'reload schema';
