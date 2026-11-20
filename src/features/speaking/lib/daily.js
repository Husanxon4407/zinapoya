// "Today's challenge": the same question for every student on the same day (Tashkent time).
import { PART1_1 } from '../data/part1_1.js';
import { PART1_2 } from '../data/part1_2.js';
import { PART2 } from '../data/part2.js';
import { PART3 } from '../data/part3.js';

const TASHKENT_OFFSET = 5 * 3600e3;
const ROTATION = [
  ['1.1', PART1_1],
  ['2', PART2],
  ['3', PART3],
  ['1.2', PART1_2],
];

export const tashkentDay = (date = new Date()) => Math.floor((new Date(date).getTime() + TASHKENT_OFFSET) / 864e5);

// Spreads consecutive days across the whole question list instead of walking it in order.
const mix = (n) => {
  let x = (n * 2654435761) >>> 0;
  x ^= x >>> 13;
  return (Math.imul(x, 1274126177) >>> 0) % 1e9;
};

export function dailyQuestion(date = new Date()) {
  const day = tashkentDay(date);
  const [part, list] = ROTATION[day % ROTATION.length];
  const q = list[mix(day) % list.length];
  return { part, id: q.id, text: q.text || q.statement || q.title || 'Compare two pictures', day };
}

export const DAILY_MODE = 'daily';

export function dailyDoneToday(attempts) {
  const today = tashkentDay();
  return attempts.some((a) => a.mode === DAILY_MODE && tashkentDay(a.created_at) === today);
}
