import { Link } from 'react-router-dom';
import { AREAS } from '../../data/areas.js';
import { useT } from '../../i18n/index.js';

// "Choose your area": one big card per area, each in its own colours, leading to its homepage.
export default function Catalog() {
  const t = useT();
  return (
    <section className="home-sec" id="learn" aria-labelledby="learn-title">
      <div className="home-sec__head reveal">
        <span className="eyebrow">{t('One platform')}</span>
        <h2 id="learn-title">{t('Choose your area')}</h2>
        <p>{t('Exams, languages and school subjects in one place — each one a staircase you climb at your own pace.')}</p>
      </div>
      <div className="areas-grid">
        {AREAS.map((a, i) => (
          <Link
            key={a.id}
            to={`/learn/${a.id}`}
            className={`area-card area-card--${a.id} reveal`}
            style={{ '--d': i, '--a-bg': a.theme.bg, '--a-bg2': a.theme.bg2, '--a-accent': a.theme.accent, '--a-accent2': a.theme.accent2 }}
          >
            <span className={`abg abg--${a.visual}`} aria-hidden="true" />
            <span className="area-card__top">
              <span className="area-card__emoji" aria-hidden="true">
                {a.emoji}
              </span>
              {a.ready ? (
                <span className="area-card__live">
                  <span className="badge-live__dot" aria-hidden="true" /> {t('Open now')}
                </span>
              ) : (
                <span className="area-card__soon">{t('Coming soon')}</span>
              )}
            </span>
            <span className="area-card__name">{t(a.name)}</span>
            <span className="area-card__title">{t(a.title)}</span>
            <span className="area-card__steps" aria-hidden="true">
              {a.steps.map((s, k) => (
                <span key={s} style={{ '--k': k }}>
                  {t(s)}
                </span>
              ))}
            </span>
            <span className="area-card__go">
              {t('Explore {name}', { name: t(a.short) })} <span aria-hidden="true">→</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
