import { Link } from 'react-router-dom';
import { SPOTLIGHT } from '../../data/site.js';
import { useT } from '../../i18n/index.js';

const PARTS = [
  ['1.1', 'Short questions'],
  ['1.2', 'Compare pictures'],
  ['2', '2-minute talk'],
  ['3', 'Discussion'],
];

// The part that already works today: CEFR Multilevel Speaking.
export default function Spotlight() {
  const t = useT();
  return (
    <section className="home-sec" id="now" aria-labelledby="now-title">
      <div className="spotlight reveal">
        <div className="spotlight__text">
          <span className="badge-live">
            <span className="badge-live__dot" aria-hidden="true" />
            {t('Available now')}
          </span>
          <h2 id="now-title">{t('CEFR Multilevel Speaking')}</h2>
          <p>{t('Our first staircase is open: practise the real Speaking exam and hear how to sound better after every answer.')}</p>
          <ul className="spotlight__list">
            {SPOTLIGHT.map((s) => (
              <li key={s.text}>
                <span aria-hidden="true">{s.emoji}</span> {t(s.text)}
              </li>
            ))}
          </ul>
          <div className="spotlight__cta">
            <Link to="/try" className="zbtn">
              🎤 {t('Try one question')} <span className="zbtn__arrow" aria-hidden="true">↗</span>
            </Link>
            <Link to="/signup" className="text-link">
              {t('Create a free account')} →
            </Link>
          </div>
        </div>
        <ol className="spotlight__parts" aria-label={t('The four Speaking parts')}>
          {PARTS.map(([n, label], i) => (
            <li key={n} style={{ '--i': i }}>
              <span className="spotlight__part-num">{t('Part {n}', { n })}</span>
              <span>{t(label)}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
