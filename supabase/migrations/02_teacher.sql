-- SpeakUp update 2: teacher dashboard.
-- Run 01_profiles.sql first. Then paste this file into Supabase → SQL Editor → Run.

-- The teacher can read every student's answers, game scores and recordings (never change them).
drop policy if exists "teacher reads attempts" on public.attempts;
create policy "teacher reads attempts" on public.attempts
  for select using (public.is_teacher());

drop policy if exists "teacher reads game scores" on public.game_scores;
create policy "teacher reads game scores" on public.game_scores
  for select using (public.is_teacher());

drop policy if exists "teacher reads recordings" on storage.objects;
create policy "teacher reads recordings" on storage.objects for select to authenticated
  using (bucket_id = 'recordings' and public.is_teacher());

-- Make YOUR account the teacher: put the email you log in with between the quotes.
update public.profiles set role = 'teacher'
where id = (select id from auth.users where email = 'canikissyou4407@gmail.com');
