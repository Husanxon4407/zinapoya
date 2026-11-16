// Platform-wide content for the main page. Text is English (used as i18n keys via t()).
import { PART1_1 } from './part1_1.js';
import { PART1_2 } from './part1_2.js';
import { PART2 } from './part2.js';
import { PART3 } from './part3.js';

export const BRAND = 'Zinapoya';
export const TAGLINE = 'Step up to your level.';

// Put a short intro/guide video here later (YouTube, Vimeo or an .mp4 URL). Empty = the section is hidden.
export const VIDEO_URL = '';

// Total speaking questions in the bank (shown in the stats).
export const QUESTION_COUNT = PART1_1.length + PART1_2.length + PART2.length + PART3.length;

// The labels on the six 3D steps of the main page. Students pick a track (or it cycles by itself).
// Scores and words are the same in every language; names like "Start" are translated.
export const TRACKS = [
  { id: 'cefr', name: 'CEFR', steps: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] },
  { id: 'ielts', name: 'IELTS', steps: ['4.0', '5.0', '5.5', '6.5', '7.5', '8.0+'] },
  { id: 'sat', name: 'SAT', steps: ['800', '1000', '1150', '1300', '1450', '1550+'] },
  { id: 'lang', name: 'Languages', steps: ['Hello', 'Salom', 'Привет', 'Merhaba', '안녕', 'Hallo'] },
  { id: 'school', name: 'School', steps: ['1 + 1', 'x²', 'π', 'H₂O', 'E = mc²', '</>'] },
];

// Everything the platform will teach. `ready` items work today; the rest are shown as "Coming soon".
// `to` is where a ready item leads.
export const CATALOG = [
  {
    id: 'exams',
    emoji: '🎓',
    name: 'Exam prep',
    text: 'International English certificates, practised the way the real exam works.',
    color: '#6366f1',
    items: [
      { name: 'CEFR Multilevel', note: 'Speaking is ready', ready: true, to: '/try' },
      { name: 'IELTS' },
      { name: 'TOEFL' },
    ],
  },
  {
    id: 'admission',
    emoji: '🏛️',
    name: 'University admission',
    text: 'Prepare for the tests universities ask for, at home and abroad.',
    color: '#0891b2',
    items: [{ name: 'SAT Math' }, { name: 'SAT Reading & Writing' }, { name: 'University entrance tests' }],
  },
  {
    id: 'languages',
    emoji: '🌍',
    name: 'Languages',
    text: 'Speak, listen, read and write — from your first words to fluency.',
    color: '#16a34a',
    items: [{ name: 'English' }, { name: 'Russian' }, { name: 'Korean' }, { name: 'Turkish' }, { name: 'German' }, { name: 'Arabic' }],
  },
  {
    id: 'school',
    emoji: '📐',
    name: 'School subjects',
    text: 'Clear lessons and practice for the subjects that matter at school.',
    color: '#d97706',
    items: [{ name: 'Math' }, { name: 'Physics' }, { name: 'Chemistry' }, { name: 'Biology' }, { name: 'IT & programming' }],
  },
];

// What already works today (CEFR Multilevel Speaking), shown in the "Available now" spotlight.
export const SPOTLIGHT = [
  { emoji: '🎙️', text: 'Real exam questions for all four Speaking parts' },
  { emoji: '⏱️', text: 'Examiner voice, preparation time and a real timer' },
  { emoji: '✨', text: 'AI feedback: your level, your exact words and how to fix them' },
  { emoji: '🎮', text: 'Mock exams, word games and daily challenges' },
  { emoji: '📴', text: 'Works offline — answers upload when you are back online' },
];

export const STEPS = [
  { emoji: '📝', title: 'Create a free account', text: 'Sign up in seconds. Your progress is saved on any device.' },
  { emoji: '🧭', title: 'Choose your goal', text: 'An exam, a language or a school subject — start from your own level.' },
  { emoji: '🪜', title: 'Climb step by step', text: 'Short daily practice with real tasks, timers and games.' },
  { emoji: '✨', title: 'Get AI feedback', text: 'See your level, what to fix and how to say it better.' },
];

export const FAQ = [
  { q: 'Is Zinapoya free?', a: 'Yes. Creating an account and practising is free.' },
  { q: 'What can I learn today?', a: 'CEFR Multilevel Speaking is ready now, with real exam questions, recordings and AI feedback. IELTS, SAT, languages and school subjects are being added step by step.' },
  { q: 'Do I need to install anything?', a: 'No. It works in your browser. You can also add it to your home screen to use it like an app.' },
  { q: 'Which phone or browser should I use?', a: 'Any phone or computer. Use Google Chrome (Android, computer) or Safari (iPhone) so the microphone works. Avoid opening links inside Telegram.' },
  { q: 'Will it work without internet?', a: 'After your first visit the exam and pictures work offline. Answers you record offline are saved and uploaded automatically when you are back online.' },
  { q: 'Is my voice private?', a: 'Yes. Only you and your teacher can hear your recordings. We never sell your data and show no ads.' },
  { q: 'When will new subjects open?', a: 'We add them one by one. Follow us on Telegram to hear first when a new subject opens.' },
];

export const CONTACTS = [
  { id: 'telegram', emoji: '📨', label: 'Telegram', value: '@bh_s_t', href: 'https://t.me/bh_s_t' },
  { id: 'phone', emoji: '📞', label: 'Phone', value: '+998 93 006 44 07', href: 'tel:+998930064407' },
  { id: 'instagram', emoji: '📷', label: 'Instagram', value: '@bh_s_t', href: 'https://instagram.com/bh_s_t' },
  { id: 'email', emoji: '✉️', label: 'Email', value: 'husanxonbahodirxonov@gmail.com', href: 'mailto:husanxonbahodirxonov@gmail.com' },
];
