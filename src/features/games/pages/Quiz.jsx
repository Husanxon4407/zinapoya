import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { VOCAB, findTopic } from '../../words/data/vocab.js';
import { pick, shuffle } from '../../../shared/lib/steps.js';
import { findTerm } from '../../../shared/lib/text.js';
import { sfx } from '../../../shared/lib/sound.js';
import { speak } from '../../../shared/lib/speech.js';
import Confetti from '../../../shared/components/Confetti.jsx';
import { useApp } from '../../../app/state.jsx';

const QUESTIONS = 10;
const SECONDS = 15;
const LIVES = 3;

function makeQuestions(topicId) {
  const topics = topicId ? [findTopic(topicId)] : VOCAB;
  const words = topics.flatMap((t) => t.words.map((w) => ({ ...w, topic: t })));
  const idioms = topics.flatMap((t) => t.idioms);
  const allWords = VOCAB.flatMap((t) => t.words);
  const allIdioms = VOCAB.flatMap((t) => t.idioms);

  const wrongWords = (w, from) => shuffle((from.length >= 4 ? from : allWords).filter((x) => x.word !== w.word)).slice(0, 3).map((x) => x.word);

  const qs = [];
  const usedWords = shuffle(words);
  for (const w of usedWords) {
    if (qs.length >= QUESTIONS) break;
    const sameTopic = w.topic.words;
    const kind = Math.random();
    if (kind < 0.45) {
      const hit = findTerm(w.example, w.word);
      if (hit) {
        qs.push({
          type: 'gap',
          emoji: w.emoji,
          title: 'Fill the gap',
          prompt: `${w.example.slice(0, hit[0])}_____${w.example.slice(hit[1])}`,
          answer: w.word,
          options: shuffle([w.word, ...wrongWords(w, sameTopic)]),
          explain: w.example,
        });
        continue;
      }
    }
    qs.push({
      type: 'meaning',
      emoji: w.emoji,
      title: 'Which word means…',
      prompt: `“${w.meaning}”`,
      answer: w.word,
      options: shuffle([w.word, ...wrongWords(w, sameTopic)]),
      explain: w.example,
    });
  }
  // Swap 2–3 questions for idioms to keep it surprising.
  const idiomCount = Math.min(3, idioms.length);
  shuffle(idioms)
    .slice(0, idiomCount)
    .forEach((d, i) => {
      const wrong = shuffle(allIdioms.filter((x) => x.idiom !== d.idiom)).slice(0, 3).map((x) => x.meaning);
      qs[QUESTIONS - 1 - i * 3] = {
        type: 'idiom',
        emoji: d.emoji,
        title: 'What does this idiom mean?',
        prompt: `“${d.idiom}”`,
        answer: d.meaning,
        options: shuffle([d.meaning, ...wrong]),
        explain: d.example,
      };
    });
  return qs.slice(0, QUESTIONS);
}

function multiplier(streak) {
  return Math.min(3, 1 + Math.floor(streak / 3) * 0.5);
}

export default function Quiz() {
  const [params] = useSearchParams();
  const { addGameScore } = useApp();
  const [topicId, setTopicId] = useState(params.get('topic') || '');
  const [stage, setStage] = useState('menu'); // menu | play | end
  const [qs, setQs] = useState([]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [left, setLeft] = useState(SECONDS);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [streak, setStreak] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [popup, setPopup] = useState(null);
  const [best, setBest] = useState(0);
  const [confetti, setConfetti] = useState(0);
  const timer = useRef(null);

  const q = qs[i];
  const topic = topicId ? findTopic(topicId) : null;

  function start() {
    sfx('start');
    setQs(makeQuestions(topicId));
    setI(0);
    setScore(0);
    setLives(LIVES);
    setStreak(0);
    setCorrect(0);
    setPicked(null);
    setLeft(SECONDS);
    setStage('play');
  }

  // Countdown for each question.
  useEffect(() => {
    if (stage !== 'play' || picked !== null) return undefined;
    const endsAt = Date.now() + SECONDS * 1000;
    setLeft(SECONDS);
    let last = SECONDS;
    timer.current = setInterval(() => {
      const s = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      if (s !== last) {
        last = s;
        setLeft(s);
        if (s > 0 && s <= 5) sfx('tick');
        if (s === 0) choose('__timeout__');
      }
    }, 200);
    return () => clearInterval(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, i, picked]);

  function choose(option) {
    if (picked !== null || !q) return;
    clearInterval(timer.current);
    setPicked(option);
    if (option === q.answer) {
      const newStreak = streak + 1;
      const gained = Math.round((100 + left * 10) * multiplier(streak));
      setScore((s) => s + gained);
      setStreak(newStreak);
      setCorrect((c) => c + 1);
      setPopup({ text: `+${gained}`, good: true, key: Date.now() });
      if (newStreak > 0 && newStreak % 3 === 0) sfx('combo');
      else sfx('correct');
    } else {
      setStreak(0);
      setLives((l) => l - 1);
      setPopup({ text: option === '__timeout__' ? '⏰ Time!' : '💔', good: false, key: Date.now() });
      sfx('wrong');
    }
  }

  async function next() {
    const outOfLives = lives <= 0;
    if (i + 1 >= qs.length || outOfLives) {
      setStage('end');
      const prevBest = await addGameScore('quiz', score, { topic: topicId || 'all', correct, total: qs.length });
      setBest(prevBest);
      if (score > prevBest && score > 0) {
        sfx('win');
        setConfetti(Date.now());
      } else if (correct >= 7) {
        sfx('win');
        setConfetti(Date.now());
      } else sfx(correct >= 4 ? 'star' : 'lose');
      return;
    }
    sfx('click');
    setI(i + 1);
    setPicked(null);
  }

  const stars = useMemo(() => (correct >= 9 ? 3 : correct >= 6 ? 2 : correct >= 3 ? 1 : 0), [correct]);

  return (
    <div className="quiz">
      <Confetti fire={confetti} />
      <Link to="/games" className="back">
        ← Games
      </Link>

      {stage === 'menu' && (
        <div className="card quiz-menu">
          <div className="quiz-menu__logo">🎯</div>
          <h1>Viktorina</h1>
          <p className="muted">
            {QUESTIONS} questions · {SECONDS} seconds each · {LIVES} lives. Answer quickly for bonus points and keep a streak going for a combo of up to ×3!
          </p>
          <h4>Choose a topic</h4>
          <div className="filters filters--center">
            <button className={`filter ${!topicId ? 'filter--on' : ''}`} onClick={() => { sfx('click'); setTopicId(''); }}>
              🌈 All topics
            </button>
            {VOCAB.map((t) => (
              <button key={t.id} className={`filter ${topicId === t.id ? 'filter--on' : ''}`} onClick={() => { sfx('click'); setTopicId(t.id); }}>
                {t.emoji} {t.title}
              </button>
            ))}
          </div>
          <button className="btn btn--big btn--play" onClick={start}>
            ▶ Play
          </button>
          {topic && (
            <p className="muted small">
              Want to revise first? <Link to={`/vocab/${topic.id}`}>Open {topic.title} words</Link>
            </p>
          )}
        </div>
      )}

      {stage === 'play' && q && (
        <div className="card quiz-play">
          <div className="quiz-hud">
            <span className="quiz-hud__lives">{'❤️'.repeat(Math.max(0, lives))}{'🖤'.repeat(LIVES - Math.max(0, lives))}</span>
            <span className="quiz-hud__q">
              {i + 1}/{qs.length}
            </span>
            <span className="quiz-hud__score">⭐ {score}</span>
          </div>
          <div className="quiz-timer">
            <span style={{ width: `${(left / SECONDS) * 100}%`, background: left <= 5 ? 'var(--bad)' : 'var(--good)' }} />
          </div>
          {streak >= 3 && <div className="combo">🔥 Combo ×{multiplier(streak)}</div>}

          <div className="quiz-q">
            <span className="quiz-q__emoji">{q.emoji}</span>
            <small>{q.title}</small>
            <h2>{q.prompt}</h2>
            {popup && (
              <span key={popup.key} className={`score-pop ${popup.good ? 'score-pop--good' : 'score-pop--bad'}`}>
                {popup.text}
              </span>
            )}
          </div>

          <div className="quiz-options">
            {q.options.map((o, n) => {
              const state = picked === null ? '' : o === q.answer ? 'right' : o === picked ? 'wrong' : 'dim';
              return (
                <button key={o} className={`quiz-option quiz-option--${state}`} disabled={picked !== null} onClick={() => choose(o)}>
                  <span className="quiz-option__key">{'ABCD'[n]}</span> {o}
                </button>
              );
            })}
          </div>

          {picked !== null && (
            <div className="quiz-explain">
              <p>
                {picked === q.answer ? '✅ Correct!' : `❌ The answer is “${q.answer}”.`}{' '}
                <span className="muted">e.g. {q.explain}</span>
                <button className="icon-btn" onClick={() => speak(q.explain)} title="Listen">
                  🔊
                </button>
              </p>
              <button className="btn" onClick={next}>
                {i + 1 >= qs.length || lives <= 0 ? 'See results 🏁' : 'Next →'}
              </button>
            </div>
          )}
        </div>
      )}

      {stage === 'end' && (
        <div className="card quiz-end">
          <div className="stars stars--big">
            {[0, 1, 2].map((n) => (
              <span key={n} className={n < stars ? 'on' : ''} style={{ animationDelay: `${n * 0.25}s` }}>
                ★
              </span>
            ))}
          </div>
          <h1>{lives <= 0 ? 'Game over!' : stars === 3 ? 'Amazing! 🏆' : stars === 2 ? 'Great job! 🎉' : 'Good try! 💪'}</h1>
          <p className="quiz-end__score">{score} points</p>
          <p>
            {correct} correct out of {Math.min(i + 1, qs.length)} {lives <= 0 ? '(no lives left)' : ''} {score > best && score > 0 ? '· 🥇 New personal record!' : best > 0 ? `· Your best: ${best}` : ''}
          </p>
          <div className="again">
            <button className="btn btn--big btn--play" onClick={start}>
              🔁 Play again
            </button>
            <button className="btn btn--ghost" onClick={() => setStage('menu')}>
              Change topic
            </button>
            {topic && (
              <Link className="btn btn--ghost" to={`/vocab/${topic.id}`}>
                📚 Revise words
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
