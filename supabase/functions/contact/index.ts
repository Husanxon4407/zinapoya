// Zinapoya Edge Function: "ask a question" from the main page.
// Saves the question to public.site_questions and sends the teacher a Telegram alert.
// Deploy with "Verify JWT with legacy secret" OFF (visitors are not logged in).
// Optional secrets (added in the Supabase dashboard): TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID.
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.
import { createClient } from 'npm:@supabase/supabase-js@2';

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const BOT = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? '';
const CHAT = Deno.env.get('TELEGRAM_CHAT_ID') ?? '';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// ---- Spam protection -------------------------------------------------------------------------
// Bots get a quiet "ok" (so they don't learn what stopped them); real people who send too much
// get a clear message. Nothing here needs a database change.
const OK = () => json({ ok: true });
const TOO_MANY = 'Too many questions right now. Please try again later or write to us on Telegram.';
const PER_IP_LIMIT = 3; // questions per person (IP address) ...
const PER_IP_WINDOW = 10 * 60_000; // ... per 10 minutes
const GLOBAL_HOURLY_LIMIT = 30; // all visitors together, so the teacher's Telegram is never flooded
const MIN_FILL_MS = 3000; // nobody reads the form and types a question in under 3 seconds
const MAX_LINKS = 2;

// Per-IP counter kept in memory: resets when Supabase restarts the function, which is fine for this.
const recent = new Map<string, number[]>();
function ipAllowed(ip: string) {
  if (!ip) return true;
  const now = Date.now();
  const times = (recent.get(ip) ?? []).filter((t) => now - t < PER_IP_WINDOW);
  if (times.length >= PER_IP_LIMIT) {
    recent.set(ip, times);
    return false;
  }
  times.push(now);
  recent.set(ip, times);
  if (recent.size > 5000) recent.clear(); // never grow without limit
  return true;
}

const clientIp = (req: Request) =>
  (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || req.headers.get('cf-connecting-ip') || '';

const linkCount = (s: string) => (s.match(/https?:\/\/|www\.|t\.me\//gi) ?? []).length;

async function alertTeacher(name: string, contact: string, message: string) {
  if (!BOT || !CHAT) return; // not set up yet: the row is still saved
  const text = `🆕 New question on Zinapoya\n\n👤 ${name || '—'}\n📞 ${contact || '—'}\n\n💬 ${message}`;
  try {
    await fetch(`https://api.telegram.org/bot${BOT}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(8000),
    });
  } catch (e) {
    console.error('Telegram alert failed', String(e));
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const name = clean(body.name, 80);
    const contact = clean(body.contact, 120);
    const message = clean(body.message, 2000);
    if (message.length < 3) return json({ error: 'Please write your question.' }, 400);

    // 1. Bot traps. "website" is a hidden field people never see; "elapsed" is how long the form
    //    was open. Older copies of the page don't send them, so missing values are allowed.
    if (clean(body.website, 200)) return OK();
    const elapsed = Number(body.elapsed);
    if (Number.isFinite(elapsed) && elapsed < MIN_FILL_MS) return OK();
    if (linkCount(`${name} ${message}`) > MAX_LINKS) return OK();

    // 2. One person sending too many.
    if (!ipAllowed(clientIp(req))) return json({ error: TOO_MANY }, 429);

    // 3. The same question again (double click, resend) within a day: don't store it twice.
    const dayAgo = new Date(Date.now() - 864e5).toISOString();
    const { count: same } = await admin
      .from('site_questions')
      .select('id', { count: 'exact', head: true })
      .eq('message', message)
      .gte('created_at', dayAgo);
    if ((same ?? 0) > 0) return OK();

    // 4. A flood from many addresses at once.
    const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
    const { count: lastHour } = await admin
      .from('site_questions')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', hourAgo);
    if ((lastHour ?? 0) >= GLOBAL_HOURLY_LIMIT) return json({ error: TOO_MANY }, 429);

    const { error } = await admin.from('site_questions').insert({ name, contact, message });
    if (error) {
      console.error('Insert failed', error.message);
      return json({ error: 'Could not send your question. Please try again later.' }, 500);
    }
    await alertTeacher(name, contact, message);
    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }
});
