-- Zinapoya update 8: which area (CEFR, IELTS, SAT…) each student signed up for.
-- Run the earlier migrations first. Then paste this file into Supabase → SQL Editor → Run.

-- The chosen area lives in the student's login data (auth.users), which the website cannot read.
-- This function hands it to the teacher only: one row per student, the id and the area, nothing else.
-- Students who signed up before areas existed have no area saved: they count as CEFR.
create or replace function public.teacher_student_areas()
returns table (id uuid, area text, joined_at timestamptz)
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
           coalesce(nullif(u.raw_user_meta_data->>'area', ''), 'cefr'),
           u.created_at
    from public.profiles p
    join auth.users u on u.id = p.id
    where p.role = 'student';
end;
$$;

revoke all on function public.teacher_student_areas() from public, anon;
grant execute on function public.teacher_student_areas() to authenticated;

notify pgrst, 'reload schema';
