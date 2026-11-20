import { useT } from '../../../i18n/index.js';
import { useUz } from './useUz.jsx';

const ICON = { covered: '✅', partly: '🟡', missing: '❌' };
const STATUS = { covered: 'Covered', partly: 'Partly covered', missing: 'Missing' };

// What a Part 2 post needs (official descriptors: clear position, relevant arguments, examples, paragraphs).
export const PART2_CHECKS = [
  { id: 'stance', text: 'Give your opinion clearly at the start', uz: 'Fikringizni boshida aniq ayting' },
  { id: 'reasons', text: 'Give at least two reasons', uz: 'Kamida ikkita sabab keltiring' },
  { id: 'examples', text: 'Support them with real examples', uz: 'Ularni aniq misollar bilan asoslang' },
  { id: 'other', text: 'Mention the other side (optional, makes it stronger)', uz: 'Qarshi fikrni ham eslating (ixtiyoriy, matnni kuchliroq qiladi)' },
  { id: 'conclusion', text: 'Finish with a short conclusion', uz: 'Qisqa xulosa bilan tugating' },
];

/**
 * Before checking: the 3 action points (Part 1) or the Part 2 structure, as a list to keep in mind.
 * After checking (`result`): each point marked ✅ / 🟡 / ❌ with the AI's tip.
 */
export default function Checklist({ task, result }) {
  const t = useT();
  const [uz] = useUz();
  if (task.part === '2') {
    const s = result?.part2_structure;
    const done = s && {
      stance: s.stance_clear,
      reasons: s.reasons >= 2,
      examples: s.examples >= 1,
      other: null,
      conclusion: s.conclusion,
    };
    return (
      <section className="card w-check">
        <h2 className="w-check__title">{s ? t('Structure check') : t('Your post needs')}</h2>
        <ul className="w-check__list">
          {PART2_CHECKS.map((c) => (
            <li key={c.id}>
              <span aria-hidden="true">{!done ? '○' : done[c.id] === null ? '➖' : done[c.id] ? '✅' : '❌'}</span>
              <span>{uz ? c.uz : t(c.text)}</span>
            </li>
          ))}
        </ul>
        {s && (
          <p className="muted small">
            {t('Reasons: {a} · Examples: {b} · Paragraphs: {c}', { a: s.reasons, b: s.examples, c: s.paragraphs_ok ? t('OK') : t('need work') })}
            {s.note && <> — {(uz && s.note_uz) || s.note}</>}
          </p>
        )}
      </section>
    );
  }
  const marks = result?.points;
  return (
    <section className="card w-check">
      <h2 className="w-check__title">{marks ? t('Points from the email') : t('Answer all 3 points')}</h2>
      <ol className="w-check__list w-check__list--points">
        {task.points.map((p, i) => {
          const m = marks?.[i];
          return (
            <li key={p.text} className={m ? `is-${m.status}` : ''}>
              <span aria-hidden="true">{m ? ICON[m.status] : i + 1}</span>
              <div>
                <span>{uz ? p.uz : p.text}</span>
                {m && (
                  <small className="w-check__status">
                    {t(STATUS[m.status])}
                    {m.evidence && <> · “{m.evidence}”</>}
                  </small>
                )}
                {m && m.status !== 'covered' && m.tip && <small className="w-check__tip">💡 {(uz && m.tip_uz) || m.tip}</small>}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
