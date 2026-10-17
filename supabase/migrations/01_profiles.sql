-- SpeakUp update 1: profiles and profile photos.
-- Paste this whole file into Supabase → SQL Editor → New query → Run. Safe to run more than once.

-- 1. One profile row per account ----------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  name       text not null default '',
  avatar_url text,
  role       text not null default 'student' check (role in ('student', 'teacher')),
  created_at timestamptz not null default now()
);

-- Every new account gets a profile automatically (Google sign-in brings its photo).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Profiles for accounts that already exist.
insert into public.profiles (id, name, avatar_url)
select id,
       coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)),
       raw_user_meta_data->>'avatar_url'
from auth.users
on conflict (id) do nothing;

-- Is the logged-in user the teacher? (Used by the teacher dashboard rules.)
create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher');
$$;

alter table public.profiles enable row level security;
drop policy if exists "own profile read" on public.profiles;
create policy "own profile read" on public.profiles
  for select using (auth.uid() = id or public.is_teacher());
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Students may change their name and photo, never their role.
revoke all on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (name, avatar_url) on public.profiles to authenticated;
grant all on public.profiles to service_role;

-- 2. Public storage for profile photos ------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "own avatar write" on storage.objects;
drop policy if exists "own avatar update" on storage.objects;
drop policy if exists "own avatar delete" on storage.objects;
create policy "own avatar write" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own avatar update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own avatar delete" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
