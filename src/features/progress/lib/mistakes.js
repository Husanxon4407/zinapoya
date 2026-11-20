// Collects every sentence the AI corrected into one "mistakes notebook".

export const CATEGORIES = [
  { id: 'tense', emoji: '⏳', name: 'Verb tenses', words: ['tense', 'past', 'present', 'future', 'perfect', 'continuous', 'verb form', 'infinitive', 'gerund', '-ing'] },
  { id: 'agreement', emoji: '🤝', name: 'Subject + verb', words: ['agree', 'agreement', 'singular', 'third person', 'he/she', 'plural verb', 'is/are', 'was/were', 'does', 'has'] },
  { id: 'articles', emoji: '🅰️', name: 'a / an / the', words: ['article', ' a ', ' an ', ' the ', '"a"', '"an"', '"the"'] },
  { id: 'prepositions', emoji: '📍', name: 'Prepositions', words: ['preposition', ' in ', ' on ', ' at ', ' to ', ' for ', ' of ', ' with '] },
  { id: 'plural', emoji: '👥', name: 'Plurals & countables', words: ['plural', 'countable', 'uncountable', 'many', 'much'] },
  { id: 'order', emoji: '🔀', name: 'Word order & questions', words: ['word order', 'order', 'question form', 'position'] },
  { id: 'words', emoji: '📝', name: 'Word choice & spelling', words: ['word', 'spelling', 'collocation', 'natural', 'meaning', 'pronunciation', 'instead'] },
];
export const OTHER = { id: 'other', emoji: '🧩', name: 'Other' };

export function categorise(why = '') {
  const t = ` ${why.toLowerCase()} `;
  return CATEGORIES.find((c) => c.words.some((w) => t.includes(w))) || OTHER;
}

const norm = (s) => s.toLowerCase().replace(/[^a-z' ]/g, '').replace(/\s+/g, ' ').trim();

// Newest first; the same wrong sentence is kept once (with how many times it happened).
export function collectMistakes(attempts) {
  const byText = new Map();
  for (const a of attempts) {
    (a.feedback?.corrections || []).forEach((c, i) => {
      if (!c?.original || !c?.better || norm(c.original) === norm(c.better)) return;
      const k = norm(c.original);
      const seen = byText.get(k);
      if (seen) {
        seen.times++;
        return;
      }
      byText.set(k, {
        key: `${a.id}:${i}`,
        original: c.original,
        better: c.better,
        why: c.why || '',
        part: a.part,
        question: a.question_text,
        date: a.created_at,
        category: categorise(c.why),
        times: 1,
      });
    });
  }
  return [...byText.values()];
}
