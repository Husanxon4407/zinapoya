import { Link } from 'react-router-dom';
import { CATALOG } from '../../data/site.js';
import { useT } from '../../i18n/index.js';

// "What you can learn": four groups; ready items are links, the rest say "Coming soon".
export default function Catalog() {
  const t = useT();
  return (
    <section className="home-sec" id="learn" aria-labelledby="learn-title">
      <div className="home-sec__head reveal">
        <span className="eyebrow">{t('One platform')}</span>
        <h2 id="learn-title">{t('Everything you want to learn')}</h2>
        <p>{t('Exams, languages and school subjects in one place — each one a staircase you climb at your own pace.')}</p>
      </div>
      <div className="catalog">
        {CATALOG.map((g, gi) => (
          <article key={g.id} className="cat-card reveal" style={{ '--c': g.color, '--d': gi }}>
            <div className="cat-card__head">
              <span className="cat-card__icon" aria-hidden="true">
                {g.emoji}
              </span>
              <span className="cat-card__num">{String(gi + 1).padStart(2, '0')}</span>
            </div>
            <h3>{t(g.name)}</h3>
            <p>{t(g.text)}</p>
            <ul className="cat-card__items">
              {g.items.map((it) =>
                it.ready ? (
                  <li key={it.name}>
                    <Link to={it.to} className="cat-item cat-item--ready">
                      <span className="cat-item__dot" aria-hidden="true" />
                      {t(it.name)}
                      <small>{t(it.note)}</small>
                      <span aria-hidden="true">↗</span>
                    </Link>
                  </li>
                ) : (
                  <li key={it.name} className="cat-item">
                    {t(it.name)}
                    <small>{t('Coming soon')}</small>
                  </li>
                ),
              )}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
