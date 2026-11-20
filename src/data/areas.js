// The learning areas of Zinapoya. Each has its own homepage (/learn/:id), colours and animated
// visual, and its own main page after login. Text is English (i18n keys via t()).
//
// `theme`: colours for that area's pages.  bg/bg2 = background gradient, accent/accent2 = highlights,
// steps = the 3D staircase colours on the main homepage (bottom → top).
// `visual`: which animation the area homepage shows (components/areas/AreaVisual.jsx).
// `ready`: true when students can already practise something real.

export const AREAS = [
  {
    id: 'cefr',
    name: 'CEFR Multilevel',
    short: 'CEFR',
    emoji: '🗣️',
    ready: true,
    visual: 'voice',
    kicker: 'Uzbekistan’s Multilevel exam',
    title: 'Get the CEFR level you need.',
    text: 'Prepare for the whole Multilevel exam — Listening, Reading, Writing and Speaking — with real exam tasks, timers and AI feedback. Start with Speaking today; the other sections open step by step.',
    steps: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    theme: { bg: '#03161a', bg2: '#0b3d44', accent: '#2dd4bf', accent2: '#bef264', steps: ['#0f766e', '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#bef264'] },
    skills: [
      // `to`: where a ready skill's box leads.
      { emoji: '🎤', name: 'Speaking', text: 'All four parts: short questions, picture comparison, a 2-minute talk and a discussion.', ready: true, to: '/cefr' },
      { emoji: '🎧', name: 'Listening', text: 'Exam-style audio with the same question types and timing.' },
      { emoji: '📖', name: 'Reading', text: 'Real passage types practised against the clock.' },
      { emoji: '✍️', name: 'Writing', text: 'Emails and posts checked with the official criteria: points, style, grammar and words.', ready: true, to: '/writing' },
    ],
  },
  {
    id: 'ielts',
    name: 'IELTS',
    short: 'IELTS',
    emoji: '🎯',
    visual: 'gauge',
    kicker: 'Academic & General Training',
    title: 'Reach the band score you need.',
    text: 'Train every IELTS skill with timed practice, band-score estimates and clear advice on what to improve next.',
    steps: ['4.0', '5.0', '5.5', '6.5', '7.5', '8.0+'],
    theme: { bg: '#1a0612', bg2: '#4a1028', accent: '#fb7185', accent2: '#fbbf24', steps: ['#9f1239', '#be123c', '#e11d48', '#f43f5e', '#fb7185', '#fbbf24'] },
    skills: [
      { emoji: '🎧', name: 'Listening', text: 'Four recordings, 40 questions, the real answer formats.' },
      { emoji: '📖', name: 'Reading', text: 'Academic and General passages with every question type.' },
      { emoji: '✍️', name: 'Writing', text: 'Task 1 and Task 2 with a band estimate and model answers.' },
      { emoji: '🎤', name: 'Speaking', text: 'All three parts with recordings and AI feedback.' },
    ],
  },
  {
    id: 'sat',
    name: 'SAT',
    short: 'SAT',
    emoji: '📈',
    visual: 'graph',
    kicker: 'University admission',
    title: 'Build the score universities look for.',
    text: 'Digital SAT practice for Math and Reading & Writing, with step-by-step solutions and a score that grows with you.',
    steps: ['800', '1000', '1150', '1300', '1450', '1550+'],
    theme: { bg: '#050a1f', bg2: '#11235a', accent: '#60a5fa', accent2: '#facc15', steps: ['#1e3a8a', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#facc15'] },
    skills: [
      { emoji: '➗', name: 'Math', text: 'Algebra, advanced math, data analysis and geometry, explained step by step.' },
      { emoji: '📝', name: 'Reading & Writing', text: 'Short passages, vocabulary in context and grammar rules.' },
      { emoji: '⏱️', name: 'Practice tests', text: 'Full timed tests in the digital SAT format.' },
      { emoji: '📊', name: 'Score tracker', text: 'See your estimated score and weakest topics.' },
    ],
  },
  {
    id: 'languages',
    name: 'Languages',
    short: 'Languages',
    emoji: '🌍',
    visual: 'greetings',
    kicker: 'From first words to fluency',
    title: 'Speak to the whole world.',
    text: 'Learn a new language step by step: everyday words, real conversations, listening and speaking practice.',
    steps: ['Hello', 'Salom', 'Привет', 'Merhaba', '안녕', 'Hallo'],
    theme: { bg: '#03140d', bg2: '#0b3a26', accent: '#34d399', accent2: '#f472b6', steps: ['#047857', '#059669', '#10b981', '#34d399', '#6ee7b7', '#f472b6'] },
    skills: [
      { emoji: '🇬🇧', name: 'English', text: 'From beginner to confident speaker.' },
      { emoji: '🇷🇺', name: 'Russian', text: 'Everyday Russian for study, work and life.' },
      { emoji: '🇰🇷', name: 'Korean', text: 'Hangul, everyday phrases and TOPIK basics.' },
      { emoji: '🇹🇷', name: 'Turkish', text: 'A close cousin of Uzbek — quick to start.' },
      { emoji: '🇩🇪', name: 'German', text: 'Grammar made simple, words you really use.' },
      { emoji: '🇸🇦', name: 'Arabic', text: 'The alphabet, reading and first conversations.' },
    ],
  },
  {
    id: 'school',
    name: 'School subjects',
    short: 'School',
    emoji: '📐',
    visual: 'chalk',
    kicker: 'Clear lessons, real practice',
    title: 'Understand it once, remember it for good.',
    text: 'Short lessons and practice problems for the school subjects that matter most, explained in plain words.',
    steps: ['1 + 1', 'x²', 'π', 'H₂O', 'E = mc²', '</>'],
    theme: { bg: '#141006', bg2: '#3d2a08', accent: '#fbbf24', accent2: '#38bdf8', steps: ['#92400e', '#b45309', '#d97706', '#f59e0b', '#fbbf24', '#38bdf8'] },
    skills: [
      { emoji: '➕', name: 'Math', text: 'Arithmetic to algebra and geometry.' },
      { emoji: '🧲', name: 'Physics', text: 'Motion, forces, energy and electricity.' },
      { emoji: '⚗️', name: 'Chemistry', text: 'Atoms, reactions and the periodic table.' },
      { emoji: '🧬', name: 'Biology', text: 'Cells, the human body and nature.' },
      { emoji: '💻', name: 'IT & programming', text: 'Computers, algorithms and your first code.' },
    ],
  },
];

export const DEFAULT_AREA = 'cefr';
export const areaById = (id) => AREAS.find((a) => a.id === id) || null;
export const isArea = (id) => AREAS.some((a) => a.id === id);
// Each area's main page has its own address: /cefr, /ielts, /sat…
export const areaPath = (id) => `/${id}`;
