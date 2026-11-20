import { useT } from '../../../i18n/index.js';
import { bandLabel, PARTS } from '../rules.js';
import { PART_COLORS } from './TaskCard.jsx';
import { useUz } from './useUz.jsx';

const SUBSKILLS = [
  ['task', 'Task'],
  ['organisation', 'Organisation'],
  ['vocabulary', 'Vocabulary'],
  ['grammar', 'Grammar'],
  ['spelling_punctuation', 'Spelling & punctuation'],
];

/** The part band, its level name and the honesty notes (plan 6.5 #1). */
export default function ScoreCard({ attempt }) {
  const t = useT();
  const [uz] = useUz();
  const r = attempt.result;
  const p = PARTS[attempt.part];
  return (
    <section className="card w-score" style={{ '--wc': PART_COLORS[attempt.part] }}>
      <div className="w-score__band">
        <span className="w-score__num">{r.band}</span>
        <span className="w-score__max">/ {p.maxBand}</span>
      </div>
      <div className="w-score__body">
        <small className="w-score__part">
          {t(p.name)} · {t(p.kind)}
        </small>
        <h2 className="w-score__label">{t(bandLabel(attempt.part, r.band))}</h2>
        {r.summary && <p className="w-score__summary">{(uz && r.summary_uz) || r.summary}</p>}
        {r.capped_by === 'length' && (
          <p className="w-score__cap">
            ⚠️ {t('The AI gave {a}, but the official length rule lowers it to {b}: your text has {n} words.', { a: r.band_ai, b: r.band, n: r.words })}
          </p>
        )}
        {r.on_topic !== 'yes' && <p className="w-score__cap">⚠️ {r.on_topic === 'no' ? t('Your text does not answer this task.') : t('Part of your text is off the topic.')}</p>}
        <p className="w-score__note muted small">
          🤖 {t('AI estimate, not an official result.')} {r.confidence === 'low' && t('The checker is not very sure about this one.')}
        </p>
      </div>
    </section>
  );
}

/** 5 small bars — a practice guide, not official sub-scores (plan 6.5 #5). */
export function Subskills({ subskills }) {
  const t = useT();
  return (
    <section className="card w-sub">
      <h2 className="w-section-title">{t('Skills')}</h2>
      {SUBSKILLS.map(([k, name]) => (
        <div key={k} className="w-sub__row">
          <span>{t(name)}</span>
          <span className="w-sub__track" aria-hidden="true">
            <span className="w-sub__fill" style={{ width: `${(subskills[k] / 5) * 100}%` }} />
          </span>
          <strong>{subskills[k]}/5</strong>
        </div>
      ))}
      <p className="muted small">{t('A practice guide, not official sub-scores — the exam gives one score per task.')}</p>
    </section>
  );
}
