// Supabase Edge Function: AI speaking coach.
//   mode "feedback": scores a saved answer and stores the result on the attempt.
//   mode "model":    writes a B2 model answer for a question (cached for everyone).
// Secrets needed: ANTHROPIC_API_KEY (SUPABASE_URL, SUPABASE_ANON_KEY and
// SUPABASE_SERVICE_ROLE_KEY are provided by Supabase automatically).
import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient } from 'npm:@supabase/supabase-js@2';

const MODEL = Deno.env.get('CLAUDE_MODEL') ?? 'claude-haiku-5-5';
const DAILY_LIMIT = Number(Deno.env.get('DAILY_AI_LIMIT') ?? '25');

const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const PART_GUIDE: Record<string, string> = {
  '1.1': 'Part 1.1: a short personal question. A good answer (30 seconds) answers directly, gives a reason and an example.',
  '1.2': 'Part 1.2: comparing two pictures (45 seconds) or answering a related question (30 seconds). A good answer describes both pictures, compares them with linking words and gives an opinion with reasons.',
  '2': 'Part 2: a 2-minute talk about a personal experience covering all three cue-card questions. A good answer tells a clear story with past tenses, feelings and a reflection.',
  '3': 'Part 3: a 2-minute discussion of a statement with arguments for and against. A good answer has an introduction, arguments from both sides linked with discourse markers, and a clear conclusion with an opinion.',
};

const FEEDBACK_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['level', 'scores', 'strengths', 'corrections', 'better_phrases', 'tip', 'improved_answer'],
  properties: {
    level: { type: 'string', enum: ['A1', 'A2', 'B1', 'B2', 'C1'] },
    scores: {
      type: 'object',
      additionalProperties: false,
      required: ['fluency', 'vocabulary', 'grammar', 'task'],
      properties: {
        fluency: { type: 'integer' },
        vocabulary: { type: 'integer' },
        grammar: { type: 'integer' },
        task: { type: 'integer' },
      },
    },
    strengths: { type: 'array', items: { type: 'string' } },
    corrections: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['original', 'better', 'why'],
        properties: { original: { type: 'string' }, better: { type: 'string' }, why: { type: 'string' } },
      },
    },
    better_phrases: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['instead_of', 'try'],
        properties: { instead_of: { type: 'string' }, try: { type: 'string' } },
      },
    },
    tip: { type: 'string' },
    improved_answer: { type: 'string' },
  },
};

const COACH_SYSTEM = `You are a friendly, encouraging English speaking examiner and coach for teenage and adult students preparing for the Uzbek Multilevel (CEFR) speaking exam.
You receive the exam question and a transcript of the student's spoken answer. The transcript comes from automatic speech recognition, so ignore missing punctuation and capital letters, and do not punish words that were obviously misheard.

Score each criterion from 0 to 10 for the student's actual level:
- fluency: length of the answer for the time given, flow, few hesitations or fillers
- vocabulary: range and accuracy of words and phrases
- grammar: range and accuracy of structures and tenses
- task: how fully and relevantly the answer addresses the question(s)
Give an overall CEFR level estimate (A1-C1). A very short or off-topic answer must get low fluency and task scores.

Then write, in simple English a B1 student understands:
- strengths: 1-3 specific things the student did well
- corrections: up to 3 real mistakes from the transcript (original = the student's words, better = corrected version, why = a very short reason). Use an empty list if there are none.
- better_phrases: up to 3 simple words or phrases the student used, each with a more advanced alternative
- tip: one concrete thing to do differently next time
- improved_answer: the student's own answer rewritten at a strong B2 level, keeping their ideas, about the right length for the time limit
Speak directly to the student ("you"). Be warm and motivating. Never mention that you are an AI.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    // Who is calling?
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { data: auth } = await userClient.auth.getUser();
    const user = auth.user;
    if (!user) return json({ error: 'Please log in again.' }, 401);

    const body = await req.json();

    // Daily limit per student keeps the AI bill small.
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { count } = await admin.from('ai_usage').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', since);
    if ((count ?? 0) >= DAILY_LIMIT) {
      return json({ error: `You have used your ${DAILY_LIMIT} AI checks for today. Come back tomorrow! 🌙` }, 429);
    }

    if (body.mode === 'model') return await modelAnswer(body, user.id);
    return await feedback(body, user.id);
  } catch (err) {
    console.error(err);
    if (err instanceof Anthropic.RateLimitError) return json({ error: 'The coach is busy right now. Try again in a minute.' }, 429);
    if (err instanceof Anthropic.APIError) return json({ error: 'The AI coach is not available right now. Try again later.' }, 502);
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }
});

async function feedback(body: { attempt_id: string; transcript?: string }, userId: string) {
  const { data: attempt } = await admin.from('attempts').select('*').eq('id', body.attempt_id).eq('user_id', userId).maybeSingle();
  if (!attempt) return json({ error: 'Answer not found.' }, 404);

  const transcript = (typeof body.transcript === 'string' ? body.transcript : attempt.transcript).slice(0, 6000).trim();
  if (transcript.split(/\s+/).length < 5) return json({ error: 'Your answer is too short to check. Try speaking for longer!' }, 400);

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 16000,
    system: COACH_SYSTEM,
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: FEEDBACK_SCHEMA } },
    messages: [
      {
        role: 'user',
        content: `${PART_GUIDE[attempt.part] ?? ''}
Time limit: ${attempt.target_sec ?? 'unknown'} seconds. The student spoke for ${attempt.duration_sec} seconds (${attempt.word_count} words, ${attempt.filler_count} fillers like "um").

<question>
${attempt.question_text}
</question>

<transcript>
${transcript}
</transcript>`,
      },
    ],
  });

  if (response.stop_reason === 'refusal') return json({ error: 'The coach could not check this answer. Try a different answer.' }, 422);
  if (response.stop_reason === 'max_tokens') return json({ error: 'The feedback was too long. Please try again.' }, 502);
  const text = response.content.find((b) => b.type === 'text');
  if (!text || text.type !== 'text') return json({ error: 'No feedback was returned. Please try again.' }, 502);

  const fb = JSON.parse(text.text);
  const clamp = (n: number) => Math.max(0, Math.min(10, Math.round(Number(n) || 0)));
  const s = { fluency: clamp(fb.scores.fluency), vocabulary: clamp(fb.scores.vocabulary), grammar: clamp(fb.scores.grammar), task: clamp(fb.scores.task) };
  const scores = { ...s, overall: Math.round(((s.fluency + s.vocabulary + s.grammar + s.task) / 4) * 10), level: fb.level };
  const feedbackJson = {
    level: fb.level,
    strengths: fb.strengths.slice(0, 3),
    corrections: fb.corrections.slice(0, 3),
    better_phrases: fb.better_phrases.slice(0, 3),
    tip: fb.tip,
    improved_answer: fb.improved_answer,
  };

  await admin.from('attempts').update({ feedback: feedbackJson, scores, transcript }).eq('id', attempt.id);
  await admin.from('ai_usage').insert({ user_id: userId, kind: 'feedback' });
  return json({ feedback: feedbackJson, scores });
}

async function modelAnswer(body: { question_id: string; part: string; question_text: string }, userId: string) {
  const { data: cached } = await admin.from('model_answers').select('answer').eq('question_id', body.question_id).maybeSingle();
  if (cached) return json({ answer: cached.answer });

  const seconds: Record<string, string> = { '1.1': '30 seconds (about 70 words)', '1.2': '30-45 seconds (about 80-100 words)', '2': '2 minutes (about 230 words)', '3': '2 minutes (about 230 words)' };
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: 'low' },
    system:
      'You write model spoken answers for the Uzbek Multilevel (CEFR) English speaking exam. Write natural spoken English at a strong B2 level, as a student from Uzbekistan would say it, using useful linking phrases. Output only the answer text, no title or notes.',
    messages: [
      {
        role: 'user',
        content: `${PART_GUIDE[body.part] ?? ''}\nLength: ${seconds[body.part] ?? 'about 80 words'}.\n\n<question>\n${String(body.question_text).slice(0, 2000)}\n</question>`,
      },
    ],
  });
  if (response.stop_reason === 'refusal') return json({ error: 'No model answer is available for this question.' }, 422);
  const text = response.content.find((b) => b.type === 'text');
  if (!text || text.type !== 'text') return json({ error: 'No answer was returned. Please try again.' }, 502);

  const answer = text.text.trim();
  await admin.from('model_answers').upsert({ question_id: body.question_id, answer });
  await admin.from('ai_usage').insert({ user_id: userId, kind: 'model' });
  return json({ answer });
}
