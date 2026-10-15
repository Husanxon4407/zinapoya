import { Link } from 'react-router-dom';
import { PARTS } from '../../data/parts.js';
import { useApp } from '../../state.jsx';
import { sfx } from '../../lib/sound.js';

const GAMES = [
  { id: 'quiz', to: '/games/quiz', emoji: '🎯', name: 'Viktorina', tag: 'Vocabulary', color: '#4f46e5', soft: '#e0e7ff', text: 'A fast quiz on topic words and idioms. Beat the clock, build combos and don’t lose your 3 lives!' },
  { id: 'sprint', to: '/games/sprint', emoji: '🏃', name: 'Word Sprint', tag: 'Speaking + vocabulary', color: '#0891b2', soft: '#cffafe', text: 'Talk for 1 minute and use topic words. Every word you say pops and gives you points.' },
  { id: 'roulette', to: '/games/roulette', part: '1.1', emoji: '🎡', name: 'Question Roulette', text: 'Spin the wheel, then answer with Answer + Reason + Example in 30 seconds.' },
  { id: 'bingo', to: '/games/bingo', part: '1.2', emoji: '🧩', name: 'Linker Bingo', text: 'Compare two pictures. Every comparison word you say lights up a square. Get a line for BINGO!' },
  { id: 'story', to: '/games/story', part: '2', emoji: '📖', name: 'Story Builder', text: 'Plan your story in 6 quick steps, then tell it. Every past-tense verb scores.' },
  { id: 'debate', to: '/games/debate', part: '3', emoji: '⚔️', name: 'Debate Arena', text: 'Sort the arguments, flip the coin, then defend your side with linking words.' },
];

export default function Games() {
  const { xp, gameScores } = useApp();
  const best = (id) => Math.max(0, ...gameScores.filter((g) => g.game === id).map((g) => g.score));
  const plays = (id) => gameScores.filter((g) => g.game === id).length;

  return (
    <div>
      <section className="xp-card">
        <div className="xp-card__level">
          <small>Level</small>
          <strong>{xp.level}</strong>
        </div>
        <div className="xp-card__body">
          <h2>
            {xp.name} <span className="muted">· {xp.total} XP</span>
          </h2>
          <div className="xp-bar">
            <span style={{ width: `${(xp.into / xp.need) * 100}%` }} />
          </div>
          <p className="muted small">
            {xp.need - xp.into} XP to level {xp.level + 1}. Earn XP by answering exam questions and playing games.
          </p>
        </div>
      </section>

      <h1>🎮 Speaking games</h1>
      <p className="muted">Short, fun challenges that train one exam skill at a time. Turn your sound on! 🔊</p>
      <div className="games-grid">
        {GAMES.map((g) => {
          const p = g.part ? PARTS[g.part] : null;
          const color = p ? p.color : g.color;
          const soft = p ? p.soft : g.soft;
          const b = best(g.id);
          return (
            <Link key={g.to} to={g.to} className="game-card" style={{ background: soft }} onClick={() => sfx('click')}>
              {plays(g.id) === 0 && <span className="game-card__new">NEW</span>}
              <span className="game-card__emoji">{g.emoji}</span>
              <span className="game-card__part" style={{ color }}>
                {p ? `${p.name} · ${p.title}` : g.tag}
              </span>
              <h3>{g.name}</h3>
              <p>{g.text}</p>
              <div className="game-card__foot">
                <span className="btn btn--small" style={{ background: color }}>
                  Play →
                </span>
                {b > 0 && <span className="game-card__best">🏆 Best {b}</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
