import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ExamRunner from '../../speaking/components/ExamRunner.jsx';
import QuestionView from '../../speaking/components/QuestionView.jsx';
import GameResult from '../components/GameResult.jsx';
import { PART2 } from '../../speaking/data/part2.js';
import { pick, stepsP2 } from '../../../shared/lib/steps.js';
import { countWords, pastTenseWords } from '../../speaking/lib/metrics.js';
import { sfx } from '../../../shared/lib/sound.js';

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

function LiveVerbs({ text, live }) {
  const n = pastTenseWords(text).length;
  const prev = useRef(0);
  useEffect(() => {
    if (live && n > prev.current) sfx('pop');
    prev.current = n;
  }, [n, live]);
  return (
    <p className="live-counter">
      ⏳ Past-tense verbs: <strong>{n}</strong>
    </p>
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
          liveExtra={(text, phase) => (
            <>
              <PlanCard plan={plan} />
              <LiveVerbs text={text} live={phase === 'speak'} />
            </>
          )}
          renderExtra={(results) => {
            const t = results[0].row.transcript || '';
            const verbs = pastTenseWords(t);
            const stars = verbs.length >= 10 ? 3 : verbs.length >= 6 ? 2 : verbs.length >= 3 ? 1 : 0;
            return (
              <GameResult game="story" score={verbs.length * 50 + Math.min(countWords(t), 250)} stars={stars} title={`⏳ ${verbs.length} past-tense verbs`} detail={{ card: card.id, verbs: verbs.length }}>
                <div className="chips chips--center">
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
              </GameResult>
            );
          }}
        />
      )}
    </div>
  );
}
