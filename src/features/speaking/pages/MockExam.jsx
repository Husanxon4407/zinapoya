import { useState } from 'react';
import { Link } from 'react-router-dom';
import ExamRunner from '../components/ExamRunner.jsx';
import { mockExamSteps, workoutSteps } from '../../../shared/lib/steps.js';
import { useApp } from '../../../app/state.jsx';
import { PARTS } from '../data/parts.js';
import { levelFromScore } from '../../../shared/lib/progress.js';
import { useT } from '../../../i18n/index.js';

function MockSummary({ results }) {
  const { attempts } = useApp();
  const t = useT();
  // Pull fresh rows (they gain scores as feedback arrives).
  const rows = results.map((r) => attempts.find((a) => a.id === r.row.id) || r.row);
  const scored = rows.filter((r) => typeof r.scores?.overall === 'number');
  const avg = scored.length ? Math.round(scored.reduce((s, r) => s + r.scores.overall, 0) / scored.length) : null;
  return (
    <div className="card mock-summary">
      <h3>📋 {t('Mock exam report')}</h3>
      {avg === null ? (
        <p className="muted">{t('Ask the AI coach for feedback on each answer below — your overall level will appear here.')}</p>
      ) : (
        <p>
          {t('Average score so far:')} <strong>{avg}/100</strong> · {t('estimated level')} <strong>{levelFromScore(avg)}</strong> ({t('{a}/{b} answers checked', { a: scored.length, b: rows.length })})
        </p>
      )}
    </div>
  );
}

export function MockExam() {
  const [steps, setSteps] = useState(() => mockExamSteps());
  const [round, setRound] = useState(0);
  const t = useT();
  return (
    <div>
      <Link to="/cefr" className="back">
        ← {t('Home')}
      </Link>
      <ExamRunner
        key={round}
        steps={steps}
        mode="mock"
        title={`🎓 ${t('Full mock exam')}`}
        intro={<p>{t('All four parts in a row, just like exam day. Don’t stop between questions — the examiner won’t wait!')}</p>}
        renderExtra={(results) => (
          <>
            <MockSummary results={results} />
            <div className="again">
              <button
                className="btn"
                onClick={() => {
                  setSteps(mockExamSteps());
                  setRound(round + 1);
                }}
              >
                🔁 {t('Another mock exam')}
              </button>
            </div>
          </>
        )}
      />
    </div>
  );
}

export function Workout() {
  const { stats } = useApp();
  const [steps] = useState(() => workoutSteps(stats.weakest));
  const weak = PARTS[stats.weakest];
  const t = useT();
  return (
    <div>
      <Link to="/cefr" className="back">
        ← {t('Home')}
      </Link>
      <ExamRunner
        steps={steps}
        mode="workout"
        title={`⚡ ${t('Daily 10-minute workout')}`}
        intro={
          <p>
            {t('Warm up with three quick questions, then train your focus part:')}{' '}
            <strong style={{ color: weak.ink }}>
              {t(weak.name)} — {t(weak.title)}
            </strong>
            .
          </p>
        }
      />
    </div>
  );
}
