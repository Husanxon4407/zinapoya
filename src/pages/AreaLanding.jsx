import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import LangSwitch from '../components/LangSwitch.jsx';
import AreaVisual from '../components/areas/AreaVisual.jsx';
import { AREAS, areaById, areaPath } from '../data/areas.js';
import { SPOTLIGHT } from '../data/site.js';
import { useReveal } from '../lib/useReveal.js';
import { useApp } from '../state.jsx';
import { skillName, useT } from '../i18n/index.js';
import '../styles-home.css';
import '../styles-areas.css';

// The CSS variables that give each area its own colours.
export const areaStyle = (area) => ({
  '--a-bg': area.theme.bg,
  '--a-bg2': area.theme.bg2,
  '--a-accent': area.theme.accent,
  '--a-accent2': area.theme.accent2,
});

// Homepage of one learning area: /learn/cefr, /learn/ielts, …
export default function AreaLanding() {
  const { id } = useParams();
  const area = areaById(id);
  const t = useT();
  const navigate = useNavigate();
  const { user, areas, joinArea } = useApp();
  const pageRef = useRef(null);
  const [busy, setBusy] = useState(false);
  useReveal(pageRef);

  useEffect(() => {
    if (area) document.title = `${area.name} — Zinapoya`;
    return () => {
      document.title = 'Zinapoya — Step up to your level';
    };
  }, [area]);

  if (!area) return <Navigate to="/" replace />;

  const name = t(area.name);
  const mine = user && areas.includes(area.id);

  // Already have an account? Joining another area is one tap — no new registration.
  async function joinHere() {
    setBusy(true);
    try {
      await joinArea(area.id);
      navigate(areaPath(area.id));
    } catch (e) {
      alert(e.message);
      setBusy(false);
    }
  }

  const primary = !user ? (
    <Link to={`/signup?area=${area.id}`} className="zbtn">
      {t('Register for {name}', { name })} <span className="zbtn__arrow" aria-hidden="true">↗</span>
    </Link>
  ) : mine ? (
    <Link to={areaPath(area.id)} className="zbtn">
      {t('Open my {name} page', { name })} <span className="zbtn__arrow" aria-hidden="true">↗</span>
    </Link>
  ) : (
    <button type="button" className="zbtn" onClick={joinHere} disabled={busy}>
      {busy ? t('Joining…') : t('Join {name} — free', { name })} <span className="zbtn__arrow" aria-hidden="true">↗</span>
    </button>
  );

  return (
    <div className={`zhome apage apage--${area.id}`} style={areaStyle(area)} ref={pageRef}>
      <section className="ahero" aria-labelledby="area-title">
        <div className={`abg abg--${area.visual}`} aria-hidden="true" />

        <header className="ahero__top">
          <Link to="/" className="logo logo--light">
            <Logo />
          </Link>
          <nav className="hero3d__nav">
            <LangSwitch />
            {!user && (
              <Link to={`/login?area=${area.id}`} className="hero3d__link">
                {t('Log in')}
              </Link>
            )}
            {user && (
              <Link to="/my" className="hero3d__link">
                {t('My learning')}
              </Link>
            )}
          </nav>
        </header>

        <div className="ahero__grid">
          <div className="ahero__text">
            <span className="ahero__kicker rise" style={{ '--d': 0 }}>
              <span aria-hidden="true">{area.emoji}</span> {name} · {t(area.kicker)}
            </span>
            <h1 id="area-title" className="ahero__title rise" style={{ '--d': 1 }}>
              {t(area.title)}
            </h1>
            <p className="rise" style={{ '--d': 2 }}>
              {t(area.text)}
            </p>
            <div className="ahero__status rise" style={{ '--d': 3 }}>
              {area.ready ? (
                <span className="badge-live">
                  <span className="badge-live__dot" aria-hidden="true" />
                  {t('Speaking is open now')}
                </span>
              ) : (
                <span className="badge-soon">{t('Opening soon — register now to be first in')}</span>
              )}
            </div>
            <div className="hero3d__cta rise" style={{ '--d': 4 }}>
              {primary}
              {!mine && (
                <Link to={areaPath(area.id)} className="hero3d__try">
                  {t('Look inside first')} →
                </Link>
              )}
              {!user && area.ready && (
                <Link to="/try" className="hero3d__try">
                  🎤 {t('Try a speaking question')}
                </Link>
              )}
            </div>
          </div>
          <div className="ahero__visual">
            <AreaVisual area={area} />
          </div>
        </div>

        <nav className="ahero__areas" aria-label={t('Other areas')}>
          <Link to="/" className="ahero__all">
            ← {t('All areas')}
          </Link>
          {AREAS.filter((a) => a.id !== area.id).map((a) => (
            <Link key={a.id} to={`/learn/${a.id}`} className="area-chip" style={{ '--ac': a.theme.accent }}>
              <span aria-hidden="true">{a.emoji}</span> {t(a.short)}
            </Link>
          ))}
        </nav>
      </section>

      <div className="home-fade afade" aria-hidden="true" />

      <main className="home-main">
        <section className="home-sec" aria-labelledby="skills-title">
          <div className="home-sec__head reveal">
            <span className="eyebrow">{name}</span>
            <h2 id="skills-title">{t('What you will practise')}</h2>
          </div>
          <div className="askills">
            {area.skills.map((s, i) => (
              <article key={s.name} className="askill reveal" style={{ '--d': i }}>
                <div className="askill__head">
                  <span className="askill__emoji" aria-hidden="true">
                    {s.emoji}
                  </span>
                  {s.ready ? <span className="askill__tag askill__tag--live">{t('Open now')}</span> : <span className="askill__tag">{t('Coming soon')}</span>}
                </div>
                <h3>{skillName(t, s.name)}</h3>
                <p>{t(s.text)}</p>
              </article>
            ))}
          </div>
        </section>

        {area.ready && (
          <section className="home-sec" aria-labelledby="ready-title">
            <div className="spotlight reveal">
              <div className="spotlight__text">
                <span className="badge-live">
                  <span className="badge-live__dot" aria-hidden="true" />
                  {t('Available now')}
                </span>
                <h2 id="ready-title">{t('CEFR Multilevel Speaking')}</h2>
                <ul className="spotlight__list">
                  {SPOTLIGHT.map((s) => (
                    <li key={s.text}>
                      <span aria-hidden="true">{s.emoji}</span> {t(s.text)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        <section className="home-sec" aria-labelledby="path-title">
          <div className="home-sec__head reveal">
            <span className="eyebrow">{t('Your path')}</span>
            <h2 id="path-title">{t('Climb {name} step by step', { name })}</h2>
          </div>
          <ol className="apath">
            {area.steps.map((s, i) => (
              <li key={s} className="apath__step reveal" style={{ '--d': i, '--h': `${36 + i * 14}px` }}>
                <span className="apath__bar" aria-hidden="true" />
                <span className="apath__label">{t(s)}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="home-final apage-final reveal" aria-labelledby="final-title">
          <h2 id="final-title">{area.ready ? t('Start practising {name} today', { name }) : t('Be the first to learn {name} here', { name })}</h2>
          <p>{area.ready ? t('It takes less than a minute to start, and it is free.') : t('Register now: your {name} page will be waiting for you, and we will tell you the day it opens.', { name })}</p>
          {primary}
        </section>
      </main>

      <footer className="home-foot">
        <Link to="/" className="logo">
          <Logo size={30} />
        </Link>
        <nav className="home-foot__links">
          {AREAS.map((a) => (
            <Link key={a.id} to={`/learn/${a.id}`}>
              {t(a.short)}
            </Link>
          ))}
          <Link to="/privacy">{t('Privacy policy')}</Link>
        </nav>
      </footer>
    </div>
  );
}
