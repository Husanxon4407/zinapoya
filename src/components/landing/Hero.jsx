import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Logo, { LogoMark } from '../Logo.jsx';
import LangSwitch from '../LangSwitch.jsx';
import TypeTitle from './TypeTitle.jsx';
import { AREAS, areaPath } from '../../data/areas.js';
import { useApp } from '../../state.jsx';
import { useFitText } from '../../lib/useFitText.js';
import { langAsked, useLang, useT } from '../../i18n/index.js';
import { useReturning } from '../../lib/returning.js';

const STEPS = 6;
const AUTO_SWITCH_MS = 4200;

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const hasWebGL = () => {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
};

// Full-screen dark opening screen: headline on the left, the 3D staircase on the right.
// The area buttons recolour the staircase and relabel its steps; each leads to that area's page.
export default function Hero() {
  const t = useT();
  const returning = useReturning();
  const { user, areas } = useApp();
  const lang = useLang();
  const stageRef = useRef(null);
  const sceneRef = useRef(null);
  const labelRefs = useRef([]);
  const [ready, setReady] = useState(false);
  // The 3D staircase starts after the headline has typed itself (its start-up is heavy). While the
  // first-visit language popup is open it can load straight away, behind the popup.
  const [sceneGo, setSceneGo] = useState(() => !langAsked() || prefersReducedMotion());
  const [paused, setPaused] = useState(false);
  const [index, setIndex] = useState(0);
  const [auto, setAuto] = useState(true);
  const [swap, setSwap] = useState(false);
  const titleRef = useFitText({ max: 80, min: 30, maxVh: 9.5 }, [lang]);
  const area = AREAS[index];

  useEffect(() => {
    if (!sceneGo || !hasWebGL()) return undefined;
    let alive = true;
    const start = () =>
      import('./stairsScene.js').then(({ createStairsScene }) => {
        if (!alive || !stageRef.current) return;
        sceneRef.current = createStairsScene(stageRef.current, {
          palette: AREAS[0].theme.steps,
          accent: AREAS[0].theme.accent,
          reduced: prefersReducedMotion(),
          onReady: () => setReady(true),
          onFrame: (pts) =>
            pts.forEach((p, i) => {
              const el = labelRefs.current[i];
              if (!el) return;
              el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) translate(-50%, -50%)`;
              el.style.opacity = p.o.toFixed(2);
              el.classList.toggle('is-on', !!p.on);
            }),
        });
      });
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 120));
    const handle = idle(() => start().catch(() => {}));
    return () => {
      alive = false;
      window.cancelIdleCallback?.(handle);
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, [sceneGo]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && sceneRef.current?.finish();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Areas cycle by themselves until someone picks one.
  useEffect(() => {
    if (!auto || paused || prefersReducedMotion()) return undefined;
    const id = setInterval(() => go((i) => (i + 1) % AREAS.length), AUTO_SWITCH_MS);
    return () => clearInterval(id);
  }, [auto, paused]);

  // Recolour the staircase for the current area.
  useEffect(() => {
    sceneRef.current?.setPalette(area.theme.steps, area.theme.accent);
  }, [area, ready]);

  function go(next) {
    setSwap(true);
    setTimeout(() => {
      setIndex(next);
      setSwap(false);
    }, 220);
  }

  function pick(i) {
    setAuto(false);
    if (i !== index) go(i);
  }

  function togglePause() {
    const p = !paused;
    setPaused(p);
    sceneRef.current?.setPaused(p);
  }

  return (
    <section className="hero3d" aria-labelledby="hero-title" style={{ '--hero-accent': area.theme.accent, '--hero-accent2': area.theme.accent2 }}>
      <div className="hero3d__sky" aria-hidden="true" />

      <header className="hero3d__top">
        <Link to="/" className="logo logo--light">
          <Logo />
        </Link>
        <nav className="hero3d__nav">
          <LangSwitch />
          {user ? (
            <Link to="/my" className="zbtn zbtn--small hero3d__signup">
              {t('My learning')} <span aria-hidden="true">↗</span>
            </Link>
          ) : returning ? (
            // Has had an account on this device: "Log in" is the main button.
            <>
              <Link to="/signup" className="hero3d__link">
                {t('Sign up')}
              </Link>
              <Link to="/login" className="zbtn zbtn--small hero3d__signup">
                {t('Log in')} <span aria-hidden="true">↗</span>
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="hero3d__link">
                {t('Log in')}
              </Link>
              <Link to="/signup" className="zbtn zbtn--small hero3d__signup">
                {t('Start free')} <span aria-hidden="true">↗</span>
              </Link>
            </>
          )}
        </nav>
      </header>

      <div className="hero3d__grid">
        <div className="hero3d__text">
          <TypeTitle lines={[t('Step up'), t('to your'), t('level')]} lang={lang} titleRef={titleRef} onDone={() => setSceneGo(true)} />
          <p className="rise" style={{ '--d': 1 }}>
            {t('Languages, exam prep and school subjects.')} {t('One clear step at a time.')}
          </p>

          <div className="tracks rise" style={{ '--d': 2 }} role="group" aria-label={t('Choose your area')}>
            <span className="tracks__label">{t('Choose your area')}</span>
            <div className="tracks__list">
              {AREAS.map((a, i) => (
                <button key={a.id} type="button" className={`track ${i === index ? 'is-on' : ''}`} aria-pressed={i === index} onClick={() => pick(i)} style={{ '--ac': a.theme.accent }}>
                  <span aria-hidden="true">{a.emoji}</span> {t(a.short)}
                </button>
              ))}
            </div>
          </div>

          <div className={`hero3d__area rise ${swap ? 'is-swapping' : ''}`} style={{ '--d': 3 }}>
            <p className="hero3d__area-text">
              <strong>{t(area.name)}</strong> — {t(area.title)}
            </p>
            <div className="hero3d__cta">
              <Link to={`/learn/${area.id}`} className="zbtn">
                {t('Explore {name}', { name: t(area.short) })} <span className="zbtn__arrow" aria-hidden="true">↗</span>
              </Link>
              {user ? (
                <Link to={areaPath(area.id)} className="hero3d__try">
                  {areas.includes(area.id) ? t('Open {name}', { name: t(area.short) }) : t('Look inside {name}', { name: t(area.short) })}
                </Link>
              ) : returning ? (
                <Link to={`/login?area=${area.id}`} className="hero3d__try">
                  {t('Log in')}
                </Link>
              ) : (
                <Link to={`/signup?area=${area.id}`} className="hero3d__try">
                  {t('Register for {name}', { name: t(area.short) })}
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="stairs3d" ref={stageRef}>
          <div className={`stairs3d__fallback ${ready ? 'is-hidden' : ''}`} aria-hidden="true">
            <LogoMark size={260} plain />
          </div>
          <div className={`stairs3d__labels ${ready ? '' : 'is-hidden'} ${swap ? 'is-swapping' : ''}`} aria-hidden="true">
            {Array.from({ length: STEPS }, (_, i) => (
              <span key={i} ref={(el) => (labelRefs.current[i] = el)} className={`step-label ${i === STEPS - 1 ? 'step-label--top' : ''}`}>
                {t(area.steps[i])}
              </span>
            ))}
          </div>
        </div>
      </div>

      <footer className="hero3d__foot">
        <span className="hero3d__brandline">
          {t('Learning platform')} <span className="hero3d__sub">/ {t('Languages · Exams · School')}</span>
        </span>
        <a className="hero3d__scroll" href="#learn">
          {t('Scroll to explore')} <span aria-hidden="true">↓</span>
        </a>
        <span className="hero3d__controls">
          {ready && !prefersReducedMotion() && (
            <>
              <button type="button" onClick={() => sceneRef.current?.replay()}>
                {t('Replay entrance')}
              </button>
              <button type="button" onClick={togglePause} aria-pressed={paused}>
                {paused ? t('Resume motion') : t('Pause motion')}
              </button>
            </>
          )}
        </span>
      </footer>
    </section>
  );
}
