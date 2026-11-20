// /writing/games — the writing games, in the same card style as the speaking games page.
import { Link } from 'react-router-dom';
import { useApp } from '../../../app/state.jsx';
import { sfx } from '../../../shared/lib/sound.js';
import { useT } from '../../../i18n/index.js';
import { WRITING_GAMES } from './list.js';
import '../writing.css';

export default function WritingGames() {
  const t = useT();
  const { gameScores } = useApp();
  const best = (id) => Math.max(0, ...gameScores.filter((g) => g.game === id).map((g) => g.score));
  const plays = (id) => gameScores.filter((g) => g.game === id).length;

  return (
    <div className="w-page">
      <nav className="section-crumbs">
        <Link to="/cefr">🗣️ CEFR</Link> <span aria-hidden="true">›</span> <Link to="/writing">✍️ {t('Writing')}</Link> <span aria-hidden="true">›</span>{' '}
        <span>🎮 {t('Games')}</span>
      </nav>
      <div>
        <h1>🎮 {t('Writing games')}</h1>
        <p className="muted">{t('Train the skills the writing criteria check: the task points, formal style, organisation and accuracy.')}</p>
      </div>
      <div className="games-grid">
        {WRITING_GAMES.map((g) => {
          const b = best(g.id);
          return (
            <Link key={g.to} to={g.to} className="game-card" style={{ '--pc': g.color, '--ps': `color-mix(in srgb, ${g.color} 12%, transparent)` }} onClick={() => sfx('click')}>
              {plays(g.id) === 0 && <span className="game-card__new">{t('NEW')}</span>}
              <span className="game-card__emoji">{g.emoji}</span>
              <span className="game-card__part" style={{ color: g.color }}>
                {t(g.tag)}
              </span>
              <h3>{g.name}</h3>
              <p>{t(g.text)}</p>
              <div className="game-card__foot">
                <span className="btn btn--small game-card__play" style={{ background: g.color }}>
                  {t('Play')} →
                </span>
                {b > 0 && <span className="game-card__best">🏆 {t('Best')} {b}</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
