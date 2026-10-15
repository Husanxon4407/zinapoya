import { useState } from 'react';
import { Link } from 'react-router-dom';
import ExamRunner from '../../components/ExamRunner.jsx';
import QuestionView from '../../components/QuestionView.jsx';
import { PART2 } from '../../data/part2.js';
import { pick, stepsP2 } from '../../lib/steps.js';
import { pastTenseWords } from '../../lib/metrics.js';

const PLAN = [
  ['when', '🕐 When?', 'e.g. two years ago, in summer'],
  ['where', '📍 Where?', 'e.g. at my school in Tashkent'],
  ['who', '👥 Who was there?', 'e.g. my best friend and my teacher'],
  ['what', '⚡ What happened?', 'e.g. I had to give a speech…'],
  ['feel', '❤️ How did you feel?', 'e.g. nervous at first, then proud'],
  ['lesson', '💡 What did you learn?', 'e.g. practice makes things easier'],
];

function PlanCard({ plan }) {
  return (
    <div className="plan-card">
      {PLAN.filter(([k]) => plan[k]?.trim()).map(([k, label]) => (
        <div key={k}>
          <small>{label}</small> {plan[k]}
        </div>
      ))}
    </div>
  );
}

export default function StoryBuilder() {
  const [card, setCard] = useState(() => pick(PART2));
  const [plan, setPlan] = useState({});
  const [stage, setStage] = useState('plan'); // plan | speak
  const [round, setRound] = useState(0);

  const filled = PLAN.filter(([k]) => plan[k]?.trim()).length;
  const step = { ...stepsP2(card)[0], prep: 15, tts: card.questions.join(' ') };

  function restart() {
    setCard(pick(PART2));
    setPlan({});
    setStage('plan');
    setRound(round + 1);
  }

  return (
    <div>
      <Link to="/games" className="back">
        ← Games
      </Link>
      <h1>📖 Story Builder</h1>
      <p className="muted">Great Part 2 answers are stories. Plan yours with short notes (just key words!), then tell it in 2 minutes.</p>

      {stage === 'plan' ? (
        <div className="runner__grid">
          <div className="card">
            <QuestionView step={step} />
            <button className="btn btn--ghost btn--small" onClick={() => setCard(pick(PART2))}>
              🔀 Different card
            </button>
          </div>
          <div className="card">
            <h3>Plan your story ({filled}/6)</h3>
            <div className="planner">
              {PLAN.map(([k, label, ph]) => (
                <label key={k}>
                  <span>{label}</span>
                  <input value={plan[k] || ''} maxLength={80} placeholder={ph} onChange={(e) => setPlan({ ...plan, [k]: e.target.value })} />
                </label>
              ))}
            </div>
            <button className="btn btn--big" disabled={filled < 4} onClick={() => setStage('speak')}>
              {filled < 4 ? `Fill at least 4 boxes` : '🎤 Tell my story'}
            </button>
          </div>
        </div>
      ) : (
        <ExamRunner
          key={round}
          steps={[step]}
          mode="game"
          title="Ready to tell your story?"
          hideNotes
          intro={<PlanCard plan={plan} />}
          liveExtra={(text) => (
            <>
              <PlanCard plan={plan} />
              <p className="muted">Past-tense verbs so far: {pastTenseWords(text).length}</p>
            </>
          )}
          renderExtra={(results) => {
            const verbs = pastTenseWords(results[0].row.transcript || '');
            return (
              <div className="card game-result">
                <h3>⏳ Past-tense check: {verbs.length} different verbs</h3>
                <div className="chips">
                  {verbs.map((v) => (
                    <span key={v} className="chip chip--good">
                      {v}
                    </span>
                  ))}
                </div>
                <p>{verbs.length >= 8 ? 'Great storytelling — lots of past tenses! 📚' : 'Try to use more past verbs: was, went, felt, decided, realised…'}</p>
                <button className="btn" onClick={restart}>
                  📖 New story
                </button>
              </div>
            );
          }}
        />
      )}
    </div>
  );
}
