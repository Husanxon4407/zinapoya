import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ExamRunner from '../../speaking/components/ExamRunner.jsx';
import Confetti from '../../../shared/components/Confetti.jsx';
import { VOCAB, findTopic } from '../../words/data/vocab.js';
import { pick, shuffle } from '../../../shared/lib/steps.js';
import { saidWord } from '../../../shared/lib/text.js';
import { sfx } from '../../../shared/lib/sound.js';
import { countWords } from '../../speaking/lib/metrics.js';
import { useApp } from '../../../app/state.jsx';

const TARGETS = 9;

function newRound(topicId) {
  const topic = findTopic(topicId) || pick(VOCAB);
  const question = pick(topic.questions);
  return {
    topic,
    targets: shuffle(topic.words).slice(0, TARGETS),
    step: {
      part: '1.1',
      questionId: `sprint-${topic.id}`,
      questionText: `${question} (Word Sprint: use topic words about ${topic.title})`,
      label: 'Word Sprint',
      prompt: question,
      tts: question,
      prep: 15,
      speak: 60,
    },
  };
}

// Word chips that light up (with a pop) as the student says them.
function SprintBoard({ targets, text, live }) {
  const hits = targets.filter((w) => saidWord(text, w.word)).map((w) => w.word);
  const prev = useRef(new Set());
  useEffect(() => {
    if (!live) return;
    const fresh = hits.filter((h) => !prev.current.has(h));
    if (fresh.length) {
      sfx(prev.current.size + fresh.length === TARGETS ? 'win' : 'pop');
      fresh.forEach((h) => prev.current.add(h));
    }
  }, [hits.join('|'), live]);

  return (
    <div className="sprint">
      <div className="sprint__score">
        <strong>{hits.length}</strong>/{targets.length} words · ⭐ {hits.length * 100}
      </div>
      <div className="sprint__chips">
        {targets.map((w) => {
          const on = hits.includes(w.word);
          return (
            <span key={w.word} className={`sprint-chip ${on ? 'sprint-chip--on' : ''}`} title={w.meaning}>
              {w.emoji} {w.word}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function SprintResult({ round, transcript, onAgain }) {
  const { addGameScore } = useApp();
  const [best, setBest] = useState(null);
  const [confetti, setConfetti] = useState(0);
  const hits = round.targets.filter((w) => saidWord(transcript, w.word));
  const words = countWords(transcript);
  const score = hits.length * 100 + Math.min(words, 150) * 2;
  const saved = useRef(false);

  useEffect(() => {
    if (saved.current) return;
    saved.current = true;
    addGameScore('sprint', score, { topic: round.topic.id, hits: hits.length, words }).then((b) => {
      setBest(b);
      if (hits.length >= 5 || (score > b && score > 0)) {
        sfx('win');
        setConfetti(Date.now());
      } else sfx(hits.length >= 3 ? 'star' : 'lose');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stars = hits.length >= 7 ? 3 : hits.length >= 5 ? 2 : hits.length >= 2 ? 1 : 0;
  return (
    <div className="card game-result">
      <Confetti fire={confetti} />
      <div className="stars stars--big">
        {[0, 1, 2].map((n) => (
          <span key={n} className={n < stars ? 'on' : ''} style={{ animationDelay: `${n * 0.25}s` }}>
            ★
          </span>
        ))}
      </div>
      <h2>{score} points</h2>
      <p>
        You used <strong>{hits.length}</strong> of {round.targets.length} topic words and said {words} words in total.
        {best !== null && (score > best && score > 0 ? ' 🥇 New personal record!' : best > 0 ? ` Your best: ${best}.` : '')}
      </p>
      <SprintBoard targets={round.targets} text={transcript} live={false} />
      <div className="again">
        <button className="btn" onClick={onAgain}>
          🏃 Sprint again
        </button>
        <Link className="btn btn--ghost" to={`/vocab/${round.topic.id}`}>
          📚 Learn these words
        </Link>
      </div>
    </div>
  );
}

export default function WordSprint() {
  const [params] = useSearchParams();
  const [round, setRound] = useState(() => newRound(params.get('topic')));
  const [n, setN] = useState(0);

  const again = () => {
    setRound(newRound(round.topic.id));
    setN(n + 1);
  };

  return (
    <div>
      <Link to="/games" className="back">
        ← Games
      </Link>
      <h1>🏃 Word Sprint</h1>
      <p className="muted">
        Answer the question for 1 minute and use as many topic words as you can. Every word you say <b>pops</b> and gives you 100 points!
      </p>
      <div className="filters">
        {VOCAB.map((t) => (
          <button
            key={t.id}
            className={`filter ${round.topic.id === t.id ? 'filter--on' : ''}`}
            onClick={() => {
              sfx('click');
              setRound(newRound(t.id));
              setN(n + 1);
            }}
          >
            {t.emoji} {t.title}
          </button>
        ))}
      </div>
      <ExamRunner
        key={n}
        steps={[round.step]}
        mode="game"
        title={`${round.topic.emoji} ${round.topic.title}`}
        hideNotes
        intro={
          <>
            <p className="roulette__chosen">“{round.step.prompt}”</p>
            <p className="muted">Try to use these words:</p>
            <SprintBoard targets={round.targets} text="" live={false} />
          </>
        }
        liveExtra={(text, phase) => <SprintBoard targets={round.targets} text={text} live={phase === 'speak'} />}
        renderExtra={(results) => <SprintResult round={round} transcript={results[0].row.transcript || ''} onAgain={again} />}
      />
    </div>
  );
}
