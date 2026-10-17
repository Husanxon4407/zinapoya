# 🎤 SpeakUp — Multilevel Speaking Practice

A website where students practise the four parts of the Multilevel (CEFR) speaking exam
with real exam questions, exam timers, their own recordings, an AI coach, games and a
personal progress dashboard.

| Part | Content in the site |
|---|---|
| 1.1 About you | 59 real exam questions in 6 topics |
| 1.2 Compare pictures | 26 picture pairs with Q4–Q6 |
| 2 Tell a story | 22 cue cards (6 written + 16 picture cards) |
| 3 Argue a point | 31 For/Against topics |

All questions live in `src/data/` — edit those files to add or change questions.
Pictures are in `public/images/`.

---

## 1. Try it on your computer (no setup)

You need [Node.js](https://nodejs.org) 20+.

```bash
npm install
npm run dev
```

Open http://localhost:5173. Without the `.env` file the site runs in **local demo mode**:
accounts and progress are stored only in that browser and AI feedback is off.

## 2. Switch on real accounts + AI feedback (Supabase, free tier)

1. Create a free project at https://supabase.com.
2. **Database:** open *SQL Editor → New query*, paste all of `supabase/schema.sql`, press **Run**.
3. **Keys for the website:** *Project Settings → API*. Copy `.env.example` to `.env` and fill in
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (the *anon public* key).
4. **AI coach (Google Gemini, free key):**
   - Get a key at https://aistudio.google.com → *Get API key* → *Create API key*.
   - Deploy `supabase/functions/feedback/index.ts` as the function `feedback` (dashboard *Edge Functions*
     editor, or `supabase functions deploy feedback`). Turn **off** "Verify JWT with legacy secret".
   - In Supabase → *Edge Functions → Secrets* add `GEMINI_API_KEY` = your key.
   - Set `VITE_AI_ENABLED=true` (in `.env` and in Vercel's environment variables, then redeploy) so the
     AI feedback, model answers and the "Ask the coach" chat appear.
   - Optional secrets: `GEMINI_MODEL` (default `gemini-flash-lite-latest`, the fastest on the free key), `DAILY_AI_LIMIT` (feedback/model answers
     per student per 24 h, default 25), `DAILY_CHAT_LIMIT` (coach messages per student per 24 h, default 40).
   - Note: with the free key Google may use the text it receives (student transcripts) to improve its products.
5. **Login settings:** *Authentication → URL Configuration* → set *Site URL* to your website
   address (e.g. `https://speakup.vercel.app`) and add `http://localhost:5173` to *Redirect URLs*.
   Email confirmation is on by default; you can turn it off under *Authentication → Providers → Email*.
   For the "Continue with Google" button, enable the Google provider there.

## 3. Put it online (free)

Push this folder to GitHub, then import it on [Vercel](https://vercel.com) or
[Netlify](https://netlify.com): build command `npm run build`, output folder `dist`,
and add the two `VITE_SUPABASE_…` variables in the host's settings.
`vercel.json` / `public/_redirects` make page links like `/progress` work after refresh.

## 4. New features: photos, teacher dashboard, leaderboard, reminders

Do these once in the Supabase dashboard, in this order. Every SQL file is safe to run again.

1. **Profile photos**: SQL Editor → paste `supabase/migrations/01_profiles.sql` → Run.
2. **Teacher dashboard**: paste `supabase/migrations/02_teacher.sql` (it already has the teacher's email) into the SQL Editor → Run. Log out and back in: a **🧑‍🏫 Class** tab appears.
3. **Leaderboard**: SQL Editor → paste `supabase/migrations/03_leaderboard.sql` → Run.
4. **Daily reminders** (19:00 Tashkent time):
   1. Edge Functions → Secrets: add `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and `CRON_SECRET`. The public key must match `VITE_VAPID_PUBLIC_KEY` in `.env.production`.
   2. Edge Functions → Deploy a new function → name it `reminders` → paste `supabase/functions/reminders/index.ts` → Deploy. In its settings, switch **Verify JWT** OFF (it checks `CRON_SECRET` instead).
   3. SQL Editor → paste `supabase/migrations/04_push.sql` → Run. (Students can now turn the reminder on.)
   4. Database → Extensions: switch on **pg_cron** and **pg_net**.
   5. Open `supabase/migrations/05_reminder_schedule.sql`, replace `CRON_SECRET_HERE` with your `CRON_SECRET`, paste it into the SQL Editor → Run.

Students turn reminders on in **My profile → 🔔 Daily reminder**. On iPhone this works only after "Add to Home Screen" (iOS 16.4 or newer).

## Notes

- Speech-to-text uses the browser's built-in recogniser: works best in **Chrome or Edge**
  (desktop and Android). In other browsers students can still record, listen back and type
  what they said.
- Each student keeps their newest 30 recordings (older audio is deleted to stay inside the
  free 1 GB storage); transcripts, scores and feedback are kept forever.
- Model answers are generated once per question by the AI and then shared with all students
  (table `model_answers`). You can read or edit them in the Supabase table editor.
- Local demo test account used during development: `student@speakup.test` / `practice123`
  (exists only in the browser where it was created).

## Project structure

```
src/data/        exam questions, timings, phrase bank
src/lib/         speech (TTS, recording, recognition), metrics, progress, data API
src/components/  ExamRunner (exam simulator), AnswerReview, FeedbackView, …
src/pages/       Home, Part lists, Practice, Mock exam, Games, Phrases, Progress, History, Auth
supabase/        schema.sql + the "feedback" AI function
```
