-- SpeakUp update 3: weekly leaderboard.
-- Run 01_profiles.sql first. Then paste this file into Supabase → SQL Editor → Run.
--
-- Points this week (Monday 00:00 Tashkent time):
--   10 per answer, +5 for each Part 2 / Part 3 answer,
--   +20 for each day the daily challenge was done,
--   + game points ÷ 10.
-- Students only see the top 10 (name, photo, points) plus their own rank. Nobody sees other people's answers.

create or replace function public.weekly_leaderboard()
returns table (rank int, user_id uuid, name text, avatar_url text, points int, is_me boolean)
language sql
stable
security definer set search_path = public
as $$
  with week as (
    select (date_trunc('week', now() at time zone 'Asia/Tashkent') at time zone 'Asia/Tashkent') as start
  ),
  answers as (
    select a.user_id,
           sum(10 + case when a.part in ('2', '3') then 5 else 0 end)
             + 20 * count(distinct case when a.mode = 'daily' then (a.created_at at time zone 'Asia/Tashkent')::date end) as pts
    from attempts a, week
    where a.created_at >= week.start
    group by a.user_id
  ),
  games as (
    select g.user_id, round(sum(g.score) / 10.0) as pts
    from game_scores g, week
    where g.created_at >= week.start
    group by g.user_id
  ),
  totals as (
    select p.id as user_id, p.name, p.avatar_url,
           (coalesce(an.pts, 0) + coalesce(ga.pts, 0))::int as points
    from profiles p
    left join answers an on an.user_id = p.id
    left join games ga on ga.user_id = p.id
    where p.role = 'student'
  ),
  ranked as (
    select (rank() over (order by points desc))::int as rank,
           row_number() over (order by points desc, name) as pos,
           user_id, name, avatar_url, points
    from totals
    where points > 0 or user_id = auth.uid()
  )
  select rank,
         -- Only the student's own id is returned; the others stay hidden.
         case when user_id = auth.uid() then user_id end,
         name, avatar_url, points, user_id = auth.uid()
  from ranked
  where (pos <= 10 and points > 0) or user_id = auth.uid()
  order by pos;
$$;

revoke all on function public.weekly_leaderboard() from public, anon;
grant execute on function public.weekly_leaderboard() to authenticated;
