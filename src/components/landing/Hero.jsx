import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Logo, { LogoMark } from '../Logo.jsx';
import LangSwitch from '../LangSwitch.jsx';
import { TRACKS } from '../../data/site.js';
import { useT } from '../../i18n/index.js';

const STEPS = 6;
const AUTO_SWITCH_MS = 3800;

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const hasWebGL = () => {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
};

// Full-screen dark opening screen with the 3D staircase (zinapoya = "staircase").
export default function Hero() {
  const t = useT();
  const hostRef = useRef(null);
  const sceneRef = useRef(null);
  const labelRefs = useRef([]);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [track, setTrack] = useState(0);
  const [autoSwitch, setAutoSwitch] = useState(true);
  const [swap, setSwap] = useState(false);

  // Load Three.js and the scene only after the page has drawn.
  useEffect(() => {
    if (!hasWebGL()) return undefined;
    let alive = true;
    const start = () =>
      import('./stairsScene.js').then(({ createStairsScene }) => {
        if (!alive || !hostRef.current) return;
        sceneRef.current = createStairsScene(hostRef.current, {
          reduced: prefersReducedMotion(),
          onReady: () => setReady(true),
          onFrame: (pts) =>
            pts.forEach((p, i) => {
              const el = labelRefs.current[i];
              if (!el) return;
              el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) translate(-50%, -100%)`;
              el.style.opacity = p.o.toFixed(2);
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
  }, []);

  // Escape skips the entrance.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && sceneRef.current?.finish();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // The step labels cycle through the tracks until someone picks one.
  useEffect(() => {
    if (!autoSwitch || paused || prefersReducedMotion()) return undefined;
    const id = setInterval(() => changeTrack((i) => (i + 1) % TRACKS.length), AUTO_SWITCH_MS);
    return () => clearInterval(id);
  }, [autoSwitch, paused]);

  function changeTrack(next) {
    setSwap(true);
    setTimeout(() => {
      setTrack(next);
      setSwap(false);
    }, 220);
  }

  function pick(i) {
    setAutoSwitch(false);
    if (i !== track) changeTrack(i);
  }

  function togglePause() {
    const p = !paused;
    setPaused(p);
    sceneRef.current?.setPaused(p);
  }

  function replay() {
    setPaused(false);
    sceneRef.current?.replay();
  }

  const labels = TRACKS[track].steps;

  return (
    <section className="hero3d" ref={hostRef} aria-labelledby="hero-title">
      {/* Shown until the 3D scene is ready, and for browsers without WebGL. */}
      <div className={`hero3d__fallback ${ready ? 'is-hidden' : ''}`} aria-hidden="true">
        <LogoMark size={320} plain />
      </div>

      <div className={`hero3d__labels ${ready ? '' : 'is-hidden'} ${swap ? 'is-swapping' : ''}`} aria-hidden="true">
        {Array.from({ length: STEPS }, (_, i) => (
          <span key={i} ref={(el) => (labelRefs.current[i] = el)} className={`step-label ${i === STEPS - 1 ? 'step-label--top' : ''}`}>
            {t(labels[i])}
          </span>
        ))}
      </div>

      <header className="hero3d__top">
        <Link to="/" className="logo logo--light">
          <Logo />
        </Link>
        <nav className="hero3d__nav">
          <LangSwitch />
          <Link to="/login" className="hero3d__link">
            {t('Log in')}
          </Link>
          <Link to="/signup" className="zbtn zbtn--small hero3d__signup">
            {t('Start free')} <span aria-hidden="true">↗</span>
          </Link>
        </nav>
      </header>

      <div className="hero3d__text">
        <h1 id="hero-title" className="rise" style={{ '--d': 0 }}>
          {t('Step up')}
          <br />
          {t('to your')}
          <br />
          {t('level')}
          <span className="hero3d__dot">.</span>
        </h1>
        <p className="rise" style={{ '--d': 1 }}>
          {t('Languages, exam prep and school subjects.')}
          <br />
          {t('One clear step at a time.')}
        </p>
        <div className="hero3d__cta rise" style={{ '--d': 2 }}>
          <Link to="/signup" className="zbtn">
            {t('Start learning free')} <span className="zbtn__arrow" aria-hidden="true">↗</span>
          </Link>
          <Link to="/try" className="hero3d__try">
            🎤 {t('Try a speaking question')}
          </Link>
        </div>
        <div className="tracks rise" style={{ '--d': 3 }} role="group" aria-label={t('What do you want to reach?')}>
          {TRACKS.map((tr, i) => (
            <button key={tr.id} type="button" className={`track ${i === track ? 'is-on' : ''}`} aria-pressed={i === track} onClick={() => pick(i)}>
              {t(tr.name)}
            </button>
          ))}
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
              <button type="button" onClick={replay}>
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
