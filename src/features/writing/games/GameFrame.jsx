// Shared frame for the writing games: intro card, score/timer bar, and the end screen with the
// standard results card (stars, points, personal best — saved as game score / XP) and a review list.
import { Link } from 'react-router-dom';
import { useT } from '../../../i18n/index.js';
import GameResult from '../../games/components/GameResult.jsx';
import { useUz, UzToggle } from '../components/useUz.jsx';
import '../writing.css';
import './games.css';

export function GameIntro({ emoji, title, skill, rules, onStart, children, color }) {
  const t = useT();
  return (
    <div className="wg-page">
      <nav className="w-crumbs">
        <Link to="/writing/games">🎮 {t('Writing games')}</Link> <span aria-hidden="true">›</span> <span>{title}</span>
      </nav>
      <section className="card wg-intro" style={{ '--gc': color }}>
        <span className="wg-intro__emoji" aria-hidden="true">
          {emoji}
        </span>
        <small className="wg-intro__skill">✍️ {t('Writing')} · {t(skill)}</small>
        <h1>{title}</h1>
        <ol className="wg-intro__rules">
          {rules.map((r) => (
            <li key={r}>{t(r)}</li>
          ))}
        </ol>
        {children}
        <button type="button" className="btn btn--big wg-intro__start" onClick={onStart}>
          ▶ {t('Start')}
        </button>
      </section>
    </div>
  );
}

/** Score, combo, timer and progress along the top while playing. */
export function Hud({ score, combo = 0, seconds, totalSeconds, step, steps, color }) {
  const t = useT();
  const low = seconds != null && seconds <= 10;
  return (
    <div className="wg-hud" style={{ '--gc': color }}>
      <span className="wg-hud__score">
        ⭐ {score}
        {combo >= 2 && <span className="wg-hud__combo">×{Math.min(3, 1 + Math.floor(combo / 3) * 0.5)} 🔥</span>}
      </span>
      {steps != null && (
        <span className="wg-hud__step">
          {t('{a} of {b}', { a: Math.min(step + 1, steps), b: steps })}
        </span>
      )}
      {seconds != null && (
        <span className={`wg-hud__time ${low ? 'is-low' : ''}`}>
          ⏱️ {seconds}s
          <span className="wg-hud__bar" aria-hidden="true">
            <span style={{ width: `${(seconds / totalSeconds) * 100}%` }} />
          </span>
        </span>
      )}
    </div>
  );
}

/** Points for a right answer, growing with a streak of right answers (max ×3). */
export const comboPoints = (base, combo) => Math.round(base * Math.min(3, 1 + Math.floor(combo / 3) * 0.5));

/**
 * The end screen. `review`: [{ ok, title, detail, detail_uz }] — what the student got wrong (and right),
 * so every round teaches something.
 */
export function GameEnd({ game, score, stars, title, review = [], onAgain, color }) {
  const t = useT();
  const [uz] = useUz();
  const wrong = review.filter((r) => !r.ok);
  return (
    <div className="wg-page">
      <GameResult game={game} score={score} stars={stars} title={title} detail={{ wrong: wrong.length, total: review.length }}>
        <div className="wg-end__actions">
          <button type="button" className="btn" onClick={onAgain} style={{ background: color }}>
            🔁 {t('Play again')}
          </button>
          <Link className="btn btn--ghost" to="/writing/games">
            🎮 {t('All games')}
          </Link>
          <Link className="btn btn--ghost" to="/writing">
            ✍️ {t('Writing')}
          </Link>
        </div>
      </GameResult>

      {review.length > 0 && (
        <section className="card wg-review">
          <div className="wg-review__head">
            <h2 className="w-section-title">{wrong.length ? `📒 ${t('Learn from this round')}` : `🎉 ${t('Everything right!')}`}</h2>
            <UzToggle />
          </div>
          <ul>
            {[...wrong, ...review.filter((r) => r.ok)].map((r, i) => (
              <li key={i} className={r.ok ? 'is-ok' : 'is-wrong'}>
                <span aria-hidden="true">{r.ok ? '✅' : '❌'}</span>
                <div>
                  <strong>{r.title}</strong>
                  {(r.detail || r.detail_uz) && <small>{(uz && r.detail_uz) || r.detail}</small>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/** Stars from a share of the maximum score. */
export const starsFor = (score, max) => (score >= max * 0.8 ? 3 : score >= max * 0.5 ? 2 : score >= max * 0.2 ? 1 : 0);
