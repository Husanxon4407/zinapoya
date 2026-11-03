// Platform-wide content for the main page. Text is English (used as i18n keys via t()).
import { PART1_1 } from './part1_1.js';
import { PART1_2 } from './part1_2.js';
import { PART2 } from './part2.js';
import { PART3 } from './part3.js';

export const BRAND = 'Zinapoya';
export const TAGLINE = 'Step up to your level.';

// Put a short intro/guide video here later (YouTube, Vimeo or an .mp4 URL). Empty = placeholder.
export const VIDEO_URL = '';

// Total speaking questions in the bank (shown in the stats).
export const QUESTION_COUNT = PART1_1.length + PART1_2.length + PART2.length + PART3.length;

// The four Multilevel exam sections. Only Speaking is ready; the others come later.
export const SECTIONS = [
  { id: 'speaking', emoji: '🎤', name: 'Speaking', color: '#6366f1', soft: '#eef0ff', ink: '#4338ca', ready: true,
    text: 'Answer real exam questions out loud, record yourself and get instant AI feedback on all four parts.' },
  { id: 'listening', emoji: '🎧', name: 'Listening', color: '#0891b2', soft: '#cffafe', ink: '#0e7490', ready: false,
    text: 'Train your ear with exam-style audio and questions. Coming soon.' },
  { id: 'reading', emoji: '📖', name: 'Reading', color: '#16a34a', soft: '#dcfce7', ink: '#166534', ready: false,
    text: 'Practise reading passages and question types against the clock. Coming soon.' },
  { id: 'writing', emoji: '✍️', name: 'Writing', color: '#d97706', soft: '#fef3c7', ink: '#854d0e', ready: false,
    text: 'Write exam answers and get feedback on grammar, vocabulary and structure. Coming soon.' },
];

export const STEPS = [
  { emoji: '📝', title: 'Create a free account', text: 'Sign up in seconds. Your progress is saved on any device.' },
  { emoji: '🧭', title: 'Choose a part', text: 'Pick Part 1.1, 1.2, 2 or 3 — or run a full mock exam.' },
  { emoji: '🎙️', title: 'Speak & record', text: 'The examiner voice reads each question, then you answer against the timer.' },
  { emoji: '✨', title: 'Get AI feedback', text: 'See your level, your exact words, fixes with simple rules and better phrases.' },
];

export const RULES = [
  'Speaking has 4 parts: 1.1 short questions, 1.2 compare pictures, 2 a 2-minute talk, 3 a 2-minute discussion.',
  'Each question is read aloud, you get preparation time, then a timer for your answer.',
  'Find a quiet place and use Chrome or Safari so your microphone works.',
  'Speak until the timer ends — longer, clear answers score higher.',
];

export const FAQ = [
  { q: 'Is Zinapoya free?', a: 'Yes. All speaking practice, recordings and AI feedback are free for our students.' },
  { q: 'Do I need to install anything?', a: 'No. It works in your browser. You can also add it to your home screen to use it like an app.' },
  { q: 'Which phone or browser should I use?', a: 'Any phone or computer. Use Google Chrome (Android, computer) or Safari (iPhone) so the microphone works. Avoid opening links inside Telegram.' },
  { q: 'Will it work without internet?', a: 'After your first visit the exam and pictures work offline. Answers you record offline are saved and uploaded automatically when you are back online.' },
  { q: 'Is my voice private?', a: 'Yes. Only you and your teacher can hear your recordings. We never sell your data and show no ads.' },
  { q: 'When are Listening, Reading and Writing ready?', a: 'We are finishing Speaking first, then building the other sections. Follow us on Telegram for updates.' },
];

export const CONTACTS = [
  { id: 'telegram', emoji: '📨', label: 'Telegram', value: '@bh_s_t', href: 'https://t.me/bh_s_t' },
  { id: 'phone', emoji: '📞', label: 'Phone', value: '+998 93 006 44 07', href: 'tel:+998930064407' },
  { id: 'instagram', emoji: '📷', label: 'Instagram', value: '@bh_s_t', href: 'https://instagram.com/bh_s_t' },
  { id: 'email', emoji: '✉️', label: 'Email', value: 'husanxonbahodirxonov@gmail.com', href: 'mailto:husanxonbahodirxonov@gmail.com' },
];
