import { Link } from 'react-router-dom';
import { PARTS, PART_KEYS } from '../data/parts.js';
import { aiEnabled } from '../lib/api.js';
import ThemeToggle from '../components/ThemeToggle.jsx';

const FEATURES = [
  ['⏱️', 'Real exam simulator', 'Same questions, same timers. The examiner voice reads every question.'],
  ['🎧', 'Hear yourself', 'Every answer is recorded so you can listen and notice your mistakes.'],
  ['✨', aiEnabled ? 'AI speaking coach' : 'AI speaking coach (coming soon)', 'Get your level, corrected sentences and better words in seconds.'],
  ['🎮', 'Fun mini-games', 'Question Roulette, Linker Bingo, Story Builder and Debate Arena.'],
  ['📈', 'Track your progress', 'Your streak, scores and full history — on any device.'],
  ['💬', 'Phrase bank', 'Ready-made phrases for every part, with pronunciation.'],
];

export default function Landing() {
  return (
    <div className="landing">
      <header className="landing__top">
        <span className="logo">
          <span className="logo__mark">🎤</span> SpeakUp
        </span>
        <div className="landing__actions">
          <ThemeToggle />
          <Link to="/login" className="btn btn--ghost btn--small">
            Log in
          </Link>
        </div>
      </header>

      <section className="hero">
        <div className="hero__text">
          <span className="hero__eyebrow">Multilevel (CEFR) Speaking Exam</span>
          <h1>
            Speak better.
            <br />
            <span className="grad">Every day. In 10 minutes.</span>
          </h1>
          <p>Practise all four parts of the speaking exam with real exam questions, a timer, your own recordings and an AI coach.</p>
          <div className="hero__cta">
            <Link to="/signup" className="btn btn--big">
              Start free
            </Link>
            <Link to="/try" className="btn btn--big btn--outline">
              🎤 Try one question
            </Link>
          </div>
        </div>
        <div className="hero__parts">
          {PART_KEYS.map((k) => (
            <div key={k} className="mini-part" style={{ backgroundImage: `linear-gradient(${PARTS[k].soft}, ${PARTS[k].soft})`, color: PARTS[k].color }}>
              <span className="mini-part__emoji">{PARTS[k].emoji}</span>
              <strong>{PARTS[k].name}</strong>
              <small>{PARTS[k].title}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="features">
        {FEATURES.map(([icon, title, text]) => (
          <div key={title} className="card feature">
            <span className="feature__icon">{icon}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        ))}
      </section>

      <footer className="landing__foot">Made for our students · Good luck in your exam! 🍀</footer>
    </div>
  );
}
