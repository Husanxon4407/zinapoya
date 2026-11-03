import { Link } from 'react-router-dom';
import { SECTIONS } from '../../data/site.js';
import { useT } from '../../i18n/index.js';

export default function Sections() {
  const t = useT();
  return (
    <section className="sections" id="sections">
      <h2 className="section-title">{t('Four sections, one place')}</h2>
      <p className="section-lead">{t('Everything you need for the Multilevel exam — we start with Speaking.')}</p>
      <div className="section-grid">
        {SECTIONS.map((sec) => (
          <div
            key={sec.id}
            className={`section-card ${sec.ready ? 'section-card--ready' : 'section-card--soon'}`}
            style={{ '--sc': sec.color, '--ss': sec.soft, '--si': sec.ink }}
          >
            <span className="section-card__emoji">{sec.emoji}</span>
            <h3>{t(sec.name)}</h3>
            <p>{t(sec.text)}</p>
            {sec.ready ? (
              <Link to="/signup" className="btn btn--small section-card__btn">
                {t('Start now')}
              </Link>
            ) : (
              <span className="section-card__badge">{t('Coming soon')}</span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
