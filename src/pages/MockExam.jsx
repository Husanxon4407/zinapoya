import { useState } from 'react';
import { Link } from 'react-router-dom';
import ExamRunner from '../components/ExamRunner.jsx';
import { mockExamSteps, workoutSteps } from '../lib/steps.js';
import { useApp } from '../state.jsx';
import { PARTS } from '../data/parts.js';
import { levelFromScore } from '../lib/progress.js';

function MockSummary({ results }) {
  const { attempts } = useApp();
  // Pull fresh rows (they gain scores as feedback arrives).
  const rows = results.map((r) => attempts.find((a) => a.id === r.row.id) || r.row);
  const scored = rows.filter((r) => typeof r.scores?.overall === 'number');
  const avg = scored.length ? Math.round(scored.reduce((s, r) => s + r.scores.overall, 0) / scored.length) : null;
  return (
    <div className="card mock-summary">
      <h3>📋 Mock exam report</h3>
      {avg === null ? (
        <p className="muted">Ask the AI coach for feedback on each answer below — your overall level will appear here.</p>
      ) : (
        <p>
          Average score so far: <strong>{avg}/100</strong> · estimated level <strong>{levelFromScore(avg)}</strong> ({scored.length}/{rows.length} answers checked)
        </p>
      )}
    </div>
  );
}

export function MockExam() {
  const [steps, setSteps] = useState(() => mockExamSteps());
  const [round, setRound] = useState(0);
  return (
    <div>
      <Link to="/" className="back">
        ← Home
      </Link>
      <ExamRunner
        key={round}
        steps={steps}
        mode="mock"
        title="🎓 Full mock exam"
        intro={<p>All four parts in a row, just like exam day. Don’t stop between questions — the examiner won’t wait!</p>}
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
                🔁 Another mock exam
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
  return (
    <div>
      <Link to="/" className="back">
        ← Home
      </Link>
      <ExamRunner
        steps={steps}
        mode="workout"
        title="⚡ Daily 10-minute workout"
        intro={
          <p>
            Warm up with three quick questions, then train your focus part: <strong style={{ color: weak.color }}>{weak.name} — {weak.title}</strong>.
          </p>
        }
      />
    </div>
  );
}
