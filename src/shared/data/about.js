// The quick "About you" questions asked once after registering (features/account/pages/Welcome.jsx).
// Saved in the student's profile (migration 09). Labels are English i18n keys.

export const GOALS = [
  { id: 'exam', emoji: '🎓', label: 'Pass an exam' },
  { id: 'abroad', emoji: '✈️', label: 'Study abroad' },
  { id: 'school', emoji: '🏫', label: 'Do better at school' },
  { id: 'work', emoji: '💼', label: 'For work' },
  { id: 'fun', emoji: '🌱', label: 'For myself' },
];

export const LEVELS = [
  { id: 'beginner', emoji: '🌱', label: 'Beginner', hint: 'A1–A2' },
  { id: 'intermediate', emoji: '🌿', label: 'Intermediate', hint: 'B1' },
  { id: 'upper', emoji: '🌳', label: 'Upper-intermediate', hint: 'B2' },
  { id: 'advanced', emoji: '🏔️', label: 'Advanced', hint: 'C1–C2' },
  { id: 'unsure', emoji: '🤔', label: 'Not sure yet' },
];

export const AGES = [
  { id: 'u14', label: 'Under 14' },
  { id: '14-17', label: '14–17' },
  { id: '18-24', label: '18–24' },
  { id: '25+', label: '25 or older' },
];

export const optionOf = (list, id) => list.find((o) => o.id === id) || null;

// Whole days from today until the exam (null when there is no date or it has passed).
export function daysUntil(date) {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = Math.round((new Date(`${date}T00:00:00`) - today) / 864e5);
  return d >= 0 ? d : null;
}
