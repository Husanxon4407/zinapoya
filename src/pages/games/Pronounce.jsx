import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { VOCAB, findTopic } from '../../data/vocab.js';
import { shuffle } from '../../lib/steps.js';
import { listenOnce, recognitionSupported, speak } from '../../lib/speech.js';
import { checkSaid, TRICKY, words } from '../../lib/pronounce.js';
import { sfx } from '../../lib/sound.js';
import GameResult from '../../components/GameResult.jsx';
import { translate, useT } from '../../i18n/index.js';

const ROUND = 8;
const TRIES = 3;

function makeRound(setId, mode) {
  if (setId === 'tricky') {
    const pool = TRICKY.filter((t) => (mode === 'sentences' ? words(t.text).length > 3 : words(t.text).length <= 3));
    return shuffle(pool).slice(0, ROUND);
  }
  const topic = findTopic(setId) || VOCAB[0];
  const pool = mode === 'sentences' ? topic.words.map((w) => ({ text: w.example, tip: w.meaning })) : topic.words.map((w) => ({ text: w.word.replace(/\(.*?\)/g, '').trim(), tip: w.meaning, emoji: w.emoji }));
  return shuffle(pool).slice(0, ROUND);
}

// Points for one item: how much was heard right, minus a little for each extra try.
const pointsFor = (score, tries) => Math.max(0, Math.round(score * 100) - (tries - 1) * 20);

function Setup({ onStart }) {
  const [params] = useSearchParams();
  const [setId, setSetId] = useState(params.get('topic') || 'tricky');
  const [mode, setMode] = useState('words');
  const t = useT();

  return (
    <div className="card pron-setup">
      <h3>1. {t('Choose words')}</h3>
      <div className="filters">
        <button className={`filter ${setId === 'tricky' ? 'filter--on' : ''}`} onClick={() => setSetId('tricky')}>
          👅 {t('Tricky sounds')}
        </button>
        {VOCAB.map((topic) => (
          <button key={topic.id} className={`filter ${setId === topic.id ? 'filter--on' : ''}`} onClick={() => setSetId(topic.id)}>
            {topic.emoji} {t(topic.title)}
          </button>
        ))}
      </div>
      <h3>2. {t('Words or sentences?')}</h3>
      <div className="tabs">
        <button className={`tab ${mode === 'words' ? 'tab--on' : ''}`} onClick={() => setMode('words')}>
          🔤 {t('Words')}
        </button>
        <button className={`tab ${mode === 'sentences' ? 'tab--on' : ''}`} onClick={() => setMode('sentences')}>
          💬 {t('Sentences')}
        </button>
      </div>
      <button className="btn btn--block pron-setup__go" onClick={() => onStart(setId, mode)}>
        🎤 {t('Start')} ({ROUND} {mode === 'words' ? t('words') : t('sentences')})
      </button>
    </div>
  );
}

function Item({ item, index, total, onDone }) {
  const [tries, setTries] = useState(0);
  const [check, setCheck] = useState(null); // { marks, score, heard }
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const session = useRef(null);
  const t = useT();
  const target = words(item.text);
  const perfect = check && check.score === 1;
  const finished = perfect || tries >= TRIES;

  useEffect(() => {
    speak(item.text);
    return () => session.current?.stop();
  }, [item.text]);

  async function say() {
    setError('');
    setListening(true);
    sfx('click');
    session.current = listenOnce({ timeoutMs: Math.min(15000, 4000 + target.length * 700) });
    try {
      const guesses = await session.current.result;
      if (!guesses.length) {
        setError(translate('I didn’t hear anything. Press 🎤 and speak a little louder.'));
        return;
      }
      const c = checkSaid(item.text, guesses);
      setCheck(c);
      setTries((t) => t + 1);
      sfx(c.score === 1 ? 'pop' : c.score >= 0.6 ? 'star' : 'lose');
    } catch (e) {
      setError(e.message);
    } finally {
      setListening(false);
    }
  }

  // Show the text word by word, green when heard, red when missed (only after a try).
  const shown = item.text.split(/(\s+)/);
  let w = -1;

  return (
    <div className="card pron-item">
      <div className="pron-item__top">
        <span className="muted">
          {index + 1} / {total}
        </span>
        <span className="pron-item__tries" aria-label={t('Try {a} of {b}', { a: Math.min(tries + 1, TRIES), b: TRIES })}>
          {Array.from({ length: TRIES }, (_, i) => (
            <span key={i} className={i < tries ? 'used' : ''} />
          ))}
        </span>
      </div>

      <p className={`pron-item__text ${target.length > 3 ? 'pron-item__text--long' : ''}`}>
        {item.emoji && <span aria-hidden="true">{item.emoji} </span>}
        {shown.map((part, i) => {
          if (/^\s+$/.test(part)) return part;
          const n = words(part).length;
          const idx = w + 1;
          w += n;
          if (!check || n === 0) return <span key={i}>{part}</span>;
          const ok = check.marks.slice(idx, idx + n).every(Boolean);
          return (
            <span key={i} className={ok ? 'pron-ok' : 'pron-miss'}>
              {part}
            </span>
          );
        })}
      </p>
      {item.tip && <p className="pron-item__tip">💡 {t(item.tip)}</p>}

      <div className="pron-item__listen">
        <button className="btn btn--ghost btn--small" onClick={() => speak(item.text)}>
          🔊 {t('Listen')}
        </button>
        <button className="btn btn--ghost btn--small" onClick={() => speak(item.text, { rate: 0.6 })}>
          🐢 {t('Slowly')}
        </button>
      </div>

      {!finished && (
        <button className={`pron-mic ${listening ? 'pron-mic--on' : ''}`} onClick={listening ? () => session.current?.stop() : say} aria-label={listening ? t('Stop listening') : t('Say it')}>
          {listening ? '👂' : '🎤'}
          <small>{listening ? t('Listening… speak now') : tries ? t('Try again') : t('Press and say it')}</small>
        </button>
      )}

      {error && <p className="notice notice--warn">{error}</p>}

      {check && (
        <div className={`pron-result ${perfect ? 'pron-result--good' : ''}`}>
          <p>
            {perfect ? `🎉 ${t('Perfect!')}` : check.score >= 0.6 ? `👍 ${t('Almost! Practise the red words.')}` : `🤔 ${t('Not quite. Listen again and copy the sounds.')}`}
          </p>
          <small className="muted">
            {t('I heard:')} “{check.heard || '…'}”
          </small>
        </div>
      )}

      {finished && (
        <button className="btn btn--block" onClick={() => onDone(check?.score ?? 0, tries, item)}>
          {index + 1 === total ? t('See my score') : t('Next')} →
        </button>
      )}
      {!finished && tries > 0 && (
        <button className="btn btn--ghost btn--small pron-skip" onClick={() => onDone(check?.score ?? 0, tries, item)}>
          {t('Skip')} →
        </button>
      )}
    </div>
  );
}

export default function Pronounce() {
  const [round, setRound] = useState(null); // { setId, mode, items }
  const [i, setI] = useState(0);
  const [results, setResults] = useState([]);
  const supported = recognitionSupported();
  const t = useT();

  function start(setId, mode) {
    setRound({ setId, mode, items: makeRound(setId, mode) });
    setI(0);
    setResults([]);
  }

  function done(score, tries, item) {
    const next = [...results, { item, score, tries, points: tries ? pointsFor(score, tries) : 0 }];
    setResults(next);
    setI(i + 1);
  }

  const finished = round && i >= round.items.length;
  const total = results.reduce((s, r) => s + r.points, 0);
  const avg = results.length ? total / results.length : 0;
  const stars = avg >= 85 ? 3 : avg >= 60 ? 2 : avg >= 30 ? 1 : 0;
  const again = results.filter((r) => r.score < 1);
  const setName = round ? t(round.setId === 'tricky' ? 'Tricky sounds' : findTopic(round.setId)?.title || '') : '';

  return (
    <div className="pron">
      <Link to="/games" className="back">
        ← {t('Games')}
      </Link>
      <h1>🗣️ Say It Right</h1>
      <p className="muted">{t('Listen, say it, and see which words the computer understood. Clear words help you get a better exam score!')}</p>

      {!supported && (
        <p className="notice notice--warn">
          {t('This browser cannot check your pronunciation. Please open SpeakUp in Chrome, Edge or Safari. You can still listen to the words here.')}
        </p>
      )}

      {!round && <Setup onStart={start} />}

      {round && !finished && <Item key={`${round.setId}-${i}`} item={round.items[i]} index={i} total={round.items.length} onDone={done} />}

      {finished && (
        <GameResult game="pronounce" score={total} stars={stars} title={stars === 3 ? `${t('Crystal clear!')} 🌟` : stars === 2 ? t('Very good!') : t('Keep practising!')} detail={{ set: round.setId, mode: round.mode }}>
          <p className="muted">
            {setName} · {round.mode === 'words' ? t('Words') : t('Sentences')}
          </p>
          {again.length > 0 && (
            <div className="pron-again">
              <h3>{t('Practise these again')}</h3>
              <ul>
                {again.map((r) => (
                  <li key={r.item.text}>
                    <button className="icon-btn" title={t('Listen')} onClick={() => speak(r.item.text)}>
                      🔊
                    </button>{' '}
                    {r.item.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="again">
            <button className="btn" onClick={() => start(round.setId, round.mode)}>
              🔁 {t('Play again')}
            </button>
            <button className="btn btn--ghost" onClick={() => setRound(null)}>
              {t('Choose other words')}
            </button>
          </div>
        </GameResult>
      )}
    </div>
  );
}
