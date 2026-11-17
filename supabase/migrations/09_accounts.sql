-- Zinapoya update 9: one account for every area + the quick "About you" questions.
-- Run the earlier migrations first. Then paste this file into Supabase → SQL Editor → Run.

-- 1. "About you" answers, saved on the student's profile -------------------------
-- All optional. onboarded_at = when the student finished (or skipped) the questions;
-- empty means the website asks them once.
alter table public.profiles
  add column if not exists goal         text check (goal is null or goal in ('exam', 'abroad', 'school', 'work', 'fun')),
  add column if not exists level        text check (level is null or level in ('beginner', 'intermediate', 'upper', 'advanced', 'unsure')),
  add column if not exists exam_date    date,
  add column if not exists age_range    text check (age_range is null or age_range in ('u14', '14-17', '18-24', '25+')),
  add column if not exists phone        text check (phone is null or char_length(phone) <= 24),
  add column if not exists onboarded_at timestamptz;

-- Students may fill these in themselves (still never their role).
grant update (goal, level, exam_date, age_range, phone, onboarded_at) on public.profiles to authenticated;

-- The teacher (role 'teacher') is never asked.
update public.profiles set onboarded_at = now() where role = 'teacher' and onboarded_at is null;

-- 2. Areas: a student can now join several (CEFR + IELTS…) -----------------------
-- They live in the login data (auth.users → areas). The teacher's "Areas students chose" card
-- gets every student's list. Older accounts only have one area, or none (= CEFR).
drop function if exists public.teacher_student_areas();
create function public.teacher_student_areas()
returns table (id uuid, areas text[], joined_at timestamptz)
language plpgsql
stable
security definer set search_path = public
as $$
begin
  if not public.is_teacher() then
    raise exception 'Only the teacher can see this.' using errcode = '42501';
  end if;
  return query
    select p.id,
           case
             when jsonb_typeof(u.raw_user_meta_data->'areas') = 'array'
                  and jsonb_array_length(u.raw_user_meta_data->'areas') > 0
               then array(select jsonb_array_elements_text(u.raw_user_meta_data->'areas'))
             when coalesce(u.raw_user_meta_data->>'area', '') <> ''
               then array[u.raw_user_meta_data->>'area']
             else array['cefr']
           end,
           u.created_at
    from public.profiles p
    join auth.users u on u.id = p.id
    where p.role = 'student';
end;
$$;

revoke all on function public.teacher_student_areas() from public, anon;
grant execute on function public.teacher_student_areas() to authenticated;

notify pgrst, 'reload schema';
