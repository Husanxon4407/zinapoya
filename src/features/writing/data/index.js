// One place to look up writing tasks. A "task" is what the editor, the grader and the feedback
// screen all use: { part, id, title, emoji, context, input, instruction, points, sample, … }.
import { PART1_SETS } from './part1Sets.js';
import { GENRES, PART2_PROMPTS } from './part2Prompts.js';

// Test content copied from exam books (cefr.zip). Turn off to hide it everywhere before launch.
export const BOOK_SETS_VISIBLE = true;

const visible = (list) => (BOOK_SETS_VISIBLE ? list : list.filter((x) => x.source !== 'book'));
export const part1Sets = () => visible(PART1_SETS);
export const part2Prompts = () => visible(PART2_PROMPTS);
export { GENRES };

/** The task for one part ('1.1' | '1.2' | '2') of one bank entry, or null. */
export function getTask(part, id) {
  if (part === '1.1' || part === '1.2') {
    const s = PART1_SETS.find((x) => x.id === id);
    if (!s) return null;
    return {
      part,
      id: s.id,
      source: s.source,
      ref: s.ref,
      title: s.title,
      emoji: s.emoji,
      topic: s.topic,
      functions: s.functions,
      context: s.role,
      from: s.from,
      input: s.email,
      instruction: part === '1.1' ? s.task11 : s.task12,
      points: s.points,
      sample: s.samples?.[part] || null,
      sampleNote: s.wordsNote?.[part] || null,
      other: part === '1.1' ? '1.2' : '1.1',
    };
  }
  if (part === '2') {
    const p = PART2_PROMPTS.find((x) => x.id === id);
    if (!p) return null;
    return {
      part,
      id: p.id,
      source: p.source,
      ref: p.ref,
      title: p.title,
      emoji: p.emoji,
      topic: p.topic,
      functions: p.functions,
      genre: p.genre,
      context: GENRES[p.genre]?.name || '',
      input: p.prompt,
      instruction: 'Write 180–200 words.',
      // Part 2 has no action points; the grader checks stance, reasons, examples, paragraphs and a conclusion.
      points: [],
      sample: p.sample || null,
      sampleNote: p.wordsNote || null,
    };
  }
  return null;
}

/** Everything the grading server needs to know about the task (sent with the student's text). */
export const taskForServer = (t) => ({
  part: t.part,
  id: t.id,
  title: t.title,
  context: t.context,
  input: t.input,
  instruction: t.instruction,
  points: t.points.map((p) => p.text),
  genre: t.genre || null,
});

/** A random task the student has not done yet (or any, if all are done). */
export function nextTask(part, doneIds = new Set()) {
  const list = part === '2' ? part2Prompts() : part1Sets();
  const fresh = list.filter((x) => !doneIds.has(x.id));
  const pool = fresh.length ? fresh : list;
  return pool[Math.floor(Math.random() * pool.length)];
}
