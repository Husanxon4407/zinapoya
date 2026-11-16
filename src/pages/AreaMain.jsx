import { useState } from 'react';
import { Link } from 'react-router-dom';
import AreaVisual from '../components/areas/AreaVisual.jsx';
import { AREAS, areaById } from '../data/areas.js';
import { useApp } from '../state.jsx';
import { skillName, useT } from '../i18n/index.js';
import { areaStyle } from './AreaLanding.jsx';
import '../styles-areas.css';

// Main page (after login) of an area that is still being built. It already has the area's own
// look; the real lessons and practice will be added here area by area.
export default function AreaMain() {
  const t = useT();
  const { user, profile, area: areaId, chooseArea } = useApp();
  const area = areaById(areaId);
  const [busy, setBusy] = useState('');
  const name = t(area.name);
  const first = (profile?.name || user?.name || '').split(' ')[0];

  async function switchTo(id) {
    setBusy(id);
    try {
      await chooseArea(id);
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy('');
    }
  }

  return (
    <div className={`amain apage--${area.id}`} style={areaStyle(area)}>
      <section className="amain__hero">
        <div className={`abg abg--${area.visual}`} aria-hidden="true" />
        <div className="amain__text">
          <span className="ahero__kicker">
            <span aria-hidden="true">{area.emoji}</span> {name}
          </span>
          <h1>{first ? t('Welcome, {name}!', { name: first }) : t('Welcome!')}</h1>
          <p>{t('Your {name} page is ready, and the lessons are on their way. We are building {name} step by step — you will see each part here the day it opens.', { name })}</p>
          <span className="badge-soon">{t('Opening soon')}</span>
        </div>
        <div className="amain__visual">
          <AreaVisual area={area} />
        </div>
      </section>

      <section className="amain__sec">
        <h2>{t('What is coming to {name}', { name })}</h2>
        <div className="askills">
          {area.skills.map((s) => (
            <article key={s.name} className="askill">
              <div className="askill__head">
                <span className="askill__emoji" aria-hidden="true">
                  {s.emoji}
                </span>
                <span className="askill__tag">{t('Coming soon')}</span>
              </div>
              <h3>{skillName(t, s.name)}</h3>
              <p>{t(s.text)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="amain__sec">
        <h2>{t('Meanwhile, you can practise now')}</h2>
        <div className="amain__switch">
          {AREAS.filter((a) => a.ready && a.id !== area.id).map((a) => (
            <div key={a.id} className="amain__card" style={areaStyle(a)}>
              <span className="amain__card-emoji" aria-hidden="true">
                {a.emoji}
              </span>
              <div>
                <h3>{t(a.name)}</h3>
                <p>{t(a.text)}</p>
              </div>
              <button type="button" className="btn" onClick={() => switchTo(a.id)} disabled={!!busy}>
                {busy === a.id ? t('Opening…') : t('Switch to {name}', { name: t(a.short) })}
              </button>
            </div>
          ))}
        </div>
        <p className="muted amain__more">
          {t('Want a different area?')}{' '}
          {AREAS.filter((a) => a.id !== area.id).map((a, i) => (
            <span key={a.id}>
              {i > 0 && ' · '}
              <Link to={`/learn/${a.id}`}>{t(a.short)}</Link>
            </span>
          ))}
        </p>
      </section>
    </div>
  );
}
