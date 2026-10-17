-- SpeakUp update 5: daily reminder notifications (part 2: the 19:00 schedule).
-- Before running:
--   1. Database → Extensions → switch ON "pg_cron" and "pg_net".
--   2. Replace CRON_SECRET_HERE below with the same CRON_SECRET you saved for the "reminders" function.
-- Then paste this file into Supabase → SQL Editor → Run.

-- Every day at 19:00 Tashkent time (14:00 UTC), ask the "reminders" function to send them --
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
