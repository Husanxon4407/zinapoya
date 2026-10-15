// Turns the list of attempts into progress numbers, streaks and badges.
import { PART_KEYS } from '../data/parts.js';

const dayKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${x.getMonth() + 1}-${x.getDate()}`;
};

export function computeStreak(attempts) {
  const days = new Set(attempts.map((a) => dayKey(a.created_at)));
  let streak = 0;
  const d = new Date();
  // Today not practised yet? The streak is still alive from yesterday.
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  while (days.has(dayKey(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function overallScore(a) {
  return typeof a.scores?.overall === 'number' ? a.scores.overall : null;
}

export function computeStats(attempts) {
  const perPart = Object.fromEntries(PART_KEYS.map((k) => [k, { count: 0, scored: 0, scoreSum: 0, seconds: 0, questions: new Set() }]));
  let seconds = 0;
  for (const a of attempts) {
    const p = perPart[a.part];
    if (!p) continue;
    p.count++;
    p.seconds += a.duration_sec || 0;
    p.questions.add(a.question_id);
    seconds += a.duration_sec || 0;
    const s = overallScore(a);
    if (s !== null) {
      p.scored++;
      p.scoreSum += s;
    }
  }
  const parts = Object.fromEntries(
    Object.entries(perPart).map(([k, p]) => [k, { count: p.count, minutes: Math.round(p.seconds / 60), avg: p.scored ? Math.round(p.scoreSum / p.scored) : null, unique: p.questions.size }]),
  );

  // Weakest part: lowest average score, or the least practised one.
  const practised = PART_KEYS.filter((k) => parts[k].avg !== null);
  const weakest = practised.length
    ? practised.reduce((a, b) => (parts[a].avg <= parts[b].avg ? a : b))
    : PART_KEYS.reduce((a, b) => (parts[a].count <= parts[b].count ? a : b));

  const today = dayKey(new Date());
  return {
    total: attempts.length,
    minutes: Math.round(seconds / 60),
    todayCount: attempts.filter((a) => dayKey(a.created_at) === today).length,
    streak: computeStreak(attempts),
    parts,
    weakest,
    scoreTrend: attempts
      .filter((a) => overallScore(a) !== null)
      .slice(0, 30)
      .reverse()
      .map((a) => ({ date: a.created_at, value: overallScore(a), part: a.part })),
  };
}

export const BADGES = [
  { id: 'first', emoji: '🎤', name: 'First words', desc: 'Record your first answer', test: (s) => s.total >= 1 },
  { id: 'ten', emoji: '🔟', name: 'Warming up', desc: 'Answer 10 questions', test: (s) => s.total >= 10 },
  { id: 'fifty', emoji: '🚀', name: 'Speaking machine', desc: 'Answer 50 questions', test: (s) => s.total >= 50 },
  { id: 'all', emoji: '🧩', name: 'All-rounder', desc: 'Practise all four parts', test: (s) => PART_KEYS.every((k) => s.parts[k].count > 0) },
  { id: 'streak3', emoji: '🔥', name: 'On fire', desc: '3-day streak', test: (s) => s.streak >= 3 },
  { id: 'streak7', emoji: '🏅', name: 'Week warrior', desc: '7-day streak', test: (s) => s.streak >= 7 },
  { id: 'hour', emoji: '⏱️', name: 'Hour of power', desc: 'Speak for 60 minutes in total', test: (s) => s.minutes >= 60 },
  { id: 'b2', emoji: '⭐', name: 'B2 voice', desc: 'Get an AI score of 70+', test: (s) => s.scoreTrend.some((p) => p.value >= 70) },
];

// XP: 10 per spoken answer (+5 bonus for long Part 2/3 talks) and a tenth of game points.
const LEVEL_NAMES = ['Beginner', 'Explorer', 'Talker', 'Speaker', 'Storyteller', 'Debater', 'Orator', 'Champion', 'Legend'];
export function computeXp(attempts, gameScores) {
  const total =
    attempts.reduce((s, a) => s + 10 + (a.part === '2' || a.part === '3' ? 5 : 0), 0) +
    Math.round(gameScores.reduce((s, g) => s + (g.score || 0), 0) / 10);
  // Each level needs a little more XP than the one before.
  let level = 1;
  let need = 100;
  let left = total;
  while (left >= need) {
    left -= need;
    level++;
    need = Math.round(need * 1.35);
  }
  return { total, level, into: left, need, name: LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)] };
}

export function levelFromScore(score) {
  if (score === null || score === undefined) return '—';
  if (score >= 85) return 'C1';
  if (score >= 65) return 'B2';
  if (score >= 45) return 'B1';
  return 'A2';
}
