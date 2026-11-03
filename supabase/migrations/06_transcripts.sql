-- SpeakUp update 6: careful transcripts.
-- Paste this file into Supabase → SQL Editor → Run. Safe to run more than once.

-- What the phone/browser wrote live, the AI's checked transcript split into timed sentences,
-- and where the current transcript came from ('browser' | 'ai' | 'edited').
alter table public.attempts add column if not exists browser_transcript  text;
alter table public.attempts add column if not exists transcript_segments jsonb;
alter table public.attempts add column if not exists transcript_source   text;
