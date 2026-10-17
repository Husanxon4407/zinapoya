-- SpeakUp update 5: daily reminder notifications (part 2: the 19:00 schedule).
-- Before running: Database → Extensions → switch ON "pg_cron" and "pg_net", and run 04_push.sql.
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
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select value from public.app_secrets where key = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
