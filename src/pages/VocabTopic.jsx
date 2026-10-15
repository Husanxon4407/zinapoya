import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { findTopic } from '../data/vocab.js';
import { speak } from '../lib/speech.js';
import { sfx } from '../lib/sound.js';
import useSaved from '../components/useSaved.js';
import { findTerm } from '../lib/text.js';

// Bold the vocabulary word inside its example sentence.
function Highlight({ text, term }) {
  const hit = findTerm(text, term);
  if (!hit) return text;
  return (
    <>
      {text.slice(0, hit[0])}
      <b>{text.slice(hit[0], hit[1])}</b>
      {text.slice(hit[1])}
    </>
  );
}

function SaveStar({ text, ref_, saved }) {
  const on = saved.isSaved(text);
  return (
    <button
      className={`icon-btn star ${on ? 'star--on' : ''}`}
      title={on ? 'Saved' : 'Save'}
      onClick={(e) => {
        e.stopPropagation();
        sfx(on ? 'click' : 'pop');
        saved.toggle(text, ref_);
      }}
    >
      {on ? '★' : '☆'}
    </button>
  );
}

function WordCard({ w, saved, topicId }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className={`flip ${flipped ? 'flip--on' : ''}`} onClick={() => { sfx('flip'); setFlipped(!flipped); }}>
      <div className="flip__inner">
        <div className="flip__front">
          <span className="flip__emoji">{w.emoji}</span>
          <strong>{w.word}</strong>
          <small>{w.pos}</small>
          <span className="flip__hint">tap to see meaning</span>
        </div>
        <div className="flip__back">
          <div className="flip__top">
            <strong>{w.word}</strong>
            <span>
              <button className="icon-btn" title="Listen" onClick={(e) => { e.stopPropagation(); speak(w.word); }}>
                🔊
              </button>
              <SaveStar text={w.word} ref_={topicId} saved={saved} />
            </span>
          </div>
          <p className="flip__meaning">{w.meaning}</p>
          <p className="flip__example">
            “<Highlight text={w.example} term={w.word} />”
            <button className="icon-btn" title="Listen to the sentence" onClick={(e) => { e.stopPropagation(); speak(w.example); }}>
              🔊
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VocabTopic() {
  const { id } = useParams();
  const topic = findTopic(id);
  const [tab, setTab] = useState('words');
  const saved = useSaved();
  if (!topic) return <Navigate to="/vocab" replace />;

  return (
    <div className="vocab-topic" style={{ '--c': topic.color }}>
      <Link to="/vocab" className="back">
        ← All topics
      </Link>
      <section className="vocab-hero">
        <span className="vocab-hero__emoji">{topic.emoji}</span>
        <div>
          <h1>{topic.title}</h1>
          <p>{topic.intro}</p>
          <div className="vocab-hero__actions">
            <Link className="btn" to={`/games/quiz?topic=${topic.id}`}>
              🎯 Viktorina on this topic
            </Link>
            <Link className="btn btn--ghost" to={`/games/sprint?topic=${topic.id}`}>
              🏃 Word Sprint: speak with these words
            </Link>
          </div>
        </div>
      </section>

      <div className="tabs">
        {[
          ['words', `🔤 Words (${topic.words.length})`],
          ['structures', `🧱 Structures (${topic.structures.length})`],
          ['idioms', `🦄 Idioms (${topic.idioms.length})`],
        ].map(([k, label]) => (
          <button key={k} className={`tab ${tab === k ? 'tab--on' : ''}`} style={tab === k ? { background: topic.color } : undefined} onClick={() => { sfx('click'); setTab(k); }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'words' && (
        <div className="flip-grid">
          {topic.words.map((w) => (
            <WordCard key={w.word} w={w} saved={saved} topicId={topic.id} />
          ))}
        </div>
      )}

      {tab === 'structures' && (
        <div className="structure-list">
          {topic.structures.map((s) => (
            <div key={s.pattern} className="card structure">
              <div className="structure__top">
                <code>{s.pattern}</code>
                <SaveStar text={s.pattern} ref_={topic.id} saved={saved} />
              </div>
              <p className="muted">✏️ Use it to {s.meaning}.</p>
              <p className="structure__example">
                “{s.example}”
                <button className="icon-btn" onClick={() => speak(s.example)} title="Listen">
                  🔊
                </button>
              </p>
            </div>
          ))}
        </div>
      )}

      {tab === 'idioms' && (
        <div className="idiom-grid">
          {topic.idioms.map((d) => (
            <div key={d.idiom} className="card idiom">
              <span className="idiom__emoji">{d.emoji}</span>
              <div className="idiom__body">
                <div className="structure__top">
                  <strong>“{d.idiom}”</strong>
                  <span>
                    <button className="icon-btn" onClick={() => speak(d.idiom)} title="Listen">
                      🔊
                    </button>
                    <SaveStar text={d.idiom} ref_={topic.id} saved={saved} />
                  </span>
                </div>
                <p>
                  <span className="pill">means</span> {d.meaning}
                </p>
                <p className="structure__example">e.g. {d.example}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card speak-these">
        <h3>🎤 Use these words in an exam answer</h3>
        <ul>
          {topic.questions.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
        <Link className="btn" to={`/games/sprint?topic=${topic.id}`}>
          Try it in Word Sprint →
        </Link>
      </div>
    </div>
  );
}
