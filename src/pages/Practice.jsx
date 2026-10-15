import { useMemo } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import ExamRunner from '../components/ExamRunner.jsx';
import { PARTS } from '../data/parts.js';
import { randomSteps, stepsForQuestion } from '../lib/steps.js';

export default function Practice() {
  const { key, id } = useParams();
  const location = useLocation();
  // location.key changes on every navigation, so "another random one" gets new questions.
  const steps = useMemo(() => (id === 'random' ? randomSteps(key) : stepsForQuestion(key, id)), [key, id, location.key]);
  const part = PARTS[key];
  if (!part || !steps) return <Navigate to="/" replace />;

  return (
    <div>
      <Link to={`/part/${key}`} className="back">
        ← {part.name}
      </Link>
      <ExamRunner
        key={location.key}
        steps={steps}
        title={`${part.emoji} ${part.name}: ${part.title}`}
        intro={
          <ul className="tips-inline">
            {part.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        }
        renderExtra={() => (
          <div className="again">
            <Link className="btn" style={{ background: part.color }} to={`/practice/${key}/random`}>
              🎲 Another random one
            </Link>
            <Link className="btn btn--ghost" to={`/part/${key}`}>
              Back to the list
            </Link>
          </div>
        )}
      />
    </div>
  );
}
