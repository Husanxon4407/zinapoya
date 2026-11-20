import { useMemo } from 'react';
import { Link, Navigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import ExamRunner from '../components/ExamRunner.jsx';
import { PARTS } from '../data/parts.js';
import { randomSteps, stepsForQuestion } from '../../../shared/lib/steps.js';
import { DAILY_MODE, dailyQuestion } from '../lib/daily.js';
import { useT } from '../../../i18n/index.js';

export default function Practice() {
  const { key, id } = useParams();
  const location = useLocation();
  const [search] = useSearchParams();
  const t = useT();
  // Only today's question counts as the daily challenge (an old link is normal practice).
  const today = dailyQuestion();
  const isDaily = search.get('daily') === '1' && today.part === key && today.id === id;
  // location.key changes on every navigation, so "another random one" gets new questions.
  const steps = useMemo(() => (id === 'random' ? randomSteps(key) : stepsForQuestion(key, id)), [key, id, location.key]);
  const part = PARTS[key];
  if (!part || !steps) return <Navigate to="/speaking" replace />;

  return (
    <div>
      <Link to={`/part/${key}`} className="back">
        ← {t(part.name)}
      </Link>
      <ExamRunner
        key={location.key}
        steps={steps}
        mode={isDaily ? DAILY_MODE : 'practice'}
        title={isDaily ? `🌟 ${t('Today’s challenge')} · ${t(part.name)}` : `${part.emoji} ${t(part.name)}: ${t(part.title)}`}
        intro={
          <ul className="tips-inline">
            {part.tips.map((tip) => (
              <li key={tip}>{t(tip)}</li>
            ))}
          </ul>
        }
        renderExtra={() => (
          <div className="again">
            <Link className="btn" style={{ background: part.color }} to={`/practice/${key}/random`}>
              🎲 {t('Another random one')}
            </Link>
            <Link className="btn btn--ghost" to={`/part/${key}`}>
              {t('Back to the list')}
            </Link>
          </div>
        )}
      />
    </div>
  );
}
