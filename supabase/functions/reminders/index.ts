// Supabase Edge Function: SpeakUp daily reminder.
// Called once a day by the pg_cron job in supabase/migrations/04_push.sql.
// Sends a push notification to every student who turned reminders on and has not practised today (Tashkent time).
// Secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, CRON_SECRET. Optional: VAPID_CONTACT (e.g. mailto:you@example.com).
// "Verify JWT" must be OFF for this function: it checks the x-cron-secret header instead.
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
webpush.setVapidDetails(
  Deno.env.get('VAPID_CONTACT') ?? 'mailto:speakup@example.com',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
);

const TASHKENT = 5 * 3600e3;
const dayKey = (d: string | number | Date) => new Date(new Date(d).getTime() + TASHKENT).toISOString().slice(0, 10);

// Days in a row with at least one answer, counting back from yesterday.
function streakUntilYesterday(dates: string[]) {
  const days = new Set(dates.map(dayKey));
  let streak = 0;
  for (let t = Date.now() - 864e5; days.has(dayKey(t)); t -= 864e5) streak++;
  return streak;
}

function message(name: string, streak: number) {
  const first = (name || '').split(' ')[0] || 'there';
  if (streak >= 2) return { title: `🔥 Keep your ${streak}-day streak, ${first}!`, body: 'One short answer today is enough to keep it alive.' };
  if (streak === 1) return { title: `🎤 Day 2 is waiting, ${first}!`, body: 'You practised yesterday. Answer one question today to start a streak.' };
  return { title: `🎤 Time to speak, ${first}!`, body: 'Today’s challenge is ready. It takes less than 2 minutes.' };
}

Deno.serve(async (req) => {
  const secret = Deno.env.get('CRON_SECRET');
  if (!secret || req.headers.get('x-cron-secret') !== secret) return new Response('Forbidden', { status: 403 });

  const { data: subs, error } = await admin.from('push_subscriptions').select('id, user_id, endpoint, p256dh, auth');
  if (error) return new Response(error.message, { status: 500 });
  if (!subs?.length) return Response.json({ sent: 0, skipped: 0 });

  const users = [...new Set(subs.map((s) => s.user_id))];
  const since = new Date(Date.now() - 60 * 864e5).toISOString();
  const [{ data: attempts }, { data: profiles }] = await Promise.all([
    admin.from('attempts').select('user_id, created_at').in('user_id', users).gte('created_at', since),
    admin.from('profiles').select('id, name').in('id', users),
  ]);

  const today = dayKey(Date.now());
  const datesByUser = new Map<string, string[]>();
  for (const a of attempts ?? []) {
    if (!datesByUser.has(a.user_id)) datesByUser.set(a.user_id, []);
    datesByUser.get(a.user_id)!.push(a.created_at);
  }
  const nameOf = new Map((profiles ?? []).map((p) => [p.id, p.name]));

  let sent = 0;
  let skipped = 0;
  const dead: string[] = [];
  await Promise.all(
    subs.map(async (s) => {
      const dates = datesByUser.get(s.user_id) ?? [];
      if (dates.some((d) => dayKey(d) === today)) {
        skipped++; // already practised today
        return;
      }
      const msg = message(nameOf.get(s.user_id) ?? '', streakUntilYesterday(dates));
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify({ ...msg, url: '/' }), {
          TTL: 4 * 3600,
        });
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) dead.push(s.id); // the phone unsubscribed or the app was removed
        else console.warn('Push failed', code, (e as Error).message);
      }
    }),
  );
  if (dead.length) await admin.from('push_subscriptions').delete().in('id', dead);

  return Response.json({ sent, skipped, removed: dead.length });
});
