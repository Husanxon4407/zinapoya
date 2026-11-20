# Where things live (`src/`)

The code is organised **by feature**: everything for one part of the site sits in one folder.
If you are looking for something, start from the part of the site it belongs to.

```
src/
├── app/                 Start-up and the whole-site plumbing
│   ├── main.jsx         First file the browser runs (theme, language, service worker)
│   ├── App.jsx          All page addresses (routes) — the best place to find any page
│   └── state.jsx        Login, profile, answers and stats shared by every page (useApp)
│
├── features/            One folder per part of the site
│   ├── home/            Main page, area pages (/learn/…), "My learning"
│   │   ├── pages/       Landing, AreaLanding, AreaMain, MyLearning
│   │   ├── landing/     Main-page sections (Hero with the 3D staircase, FAQ, contacts…)
│   │   ├── areas/       Animated scenes on the area pages
│   │   └── lib/         Small helpers only these pages use
│   ├── account/         Sign up / log in, first-time questions, profile, privacy
│   ├── speaking/        CEFR Speaking: exam simulator, mock exam, try-it, AI feedback
│   │   ├── pages/       SpeakingHome (/cefr), PartPage, Practice, MockExam, TryIt
│   │   ├── components/  ExamRunner (the simulator), AnswerReview, microphone helpers…
│   │   ├── data/        Exam questions (part1_1 … part3) and timings (parts.js)
│   │   └── lib/         Recording, transcripts, speaking metrics, offline queue
│   ├── writing/         CEFR Writing: tasks, editor, AI-checked feedback
│   │   ├── rules.js     Official UzBMB numbers (bands, length rules, /75 table) + tests
│   │   ├── precheck.js  Instant checks while typing (register, contractions, length…)
│   │   ├── data/        Task bank: Part 1 emails and Part 2 posts (+ content tests)
│   │   ├── pages/       WritingHome, WritingTask, WritingResult
│   │   ├── components/  Task card, word bar, checklist, marked text, score card
│   │   └── i18n/        Uzbek and Russian text for the writing pages
│   ├── games/           Quiz, Word Sprint, Roulette, Linker Bingo, Story Builder, Debate, Say It Right
│   ├── words/           Topic vocabulary and the phrase bank
│   ├── progress/        Progress, History, My mistakes, Leaderboard
│   └── teacher/         The teacher's class page
│
├── shared/              Used by several features
│   ├── components/      Layout (top bar + menus), Gate (login wall), Logo, buttons, Coach chat…
│   ├── lib/             api.js (all server calls), sound, speech, theme, PWA, progress maths…
│   └── data/            Areas list, plans (free/paid), site contacts and FAQ, "About you" questions
│
├── styles/              Site-wide stylesheets (base, theme, games, areas, home)
└── i18n/                Uzbek (uz.js) and Russian (ru.js) translations; index.js = the t() helper
```

## Rules of thumb

- **New page?** Put it in its feature's `pages/` folder and add its address in `app/App.jsx`.
- **Used by one feature only?** Keep it inside that feature. **Used by two or more?** Move it to `shared/`.
- **Text on screen** goes through `t('English text')`; add the Uzbek and Russian versions in `i18n/`
  (or in the feature's own `i18n/` folder, like Writing).
- **Server side** (database tables and AI functions) lives outside `src/`, in `supabase/`.
- **Tests:** `npm test` runs every `*.test.js` file.
