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

    // Light anti-spam: ignore a repeat from the same contact/message within 30 seconds.
    if (contact) {
      const since = new Date(Date.now() - 30_000).toISOString();
      const { count } = await admin
        .from('site_questions')
        .select('id', { count: 'exact', head: true })
        .eq('contact', contact)
        .gte('created_at', since);
      if ((count ?? 0) > 0) return json({ ok: true }); // pretend success, don't store twice
    }

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
