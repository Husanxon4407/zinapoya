import { Suspense, useLayoutEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Avatar from './Avatar.jsx';
import LangSwitch from './LangSwitch.jsx';
import { useT } from '../../i18n/index.js';
import { useApp } from '../../app/state.jsx';
import { aiEnabled, api, isLocalMode } from '../lib/api.js';
import SoundControls from './SoundControls.jsx';
import CoachChat from './CoachChat.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import Logo from './Logo.jsx';
import { AREAS, areaById, areaPath } from '../data/areas.js';
import { useReturning } from '../lib/returning.js';

const CEFR_LINKS = [
  ['/cefr', '🏠', 'Home'],
  ['/writing', '✍️', 'Writing'],
  ['/games', '🎮', 'Games'],
  ['/vocab', '📚', 'Words'],
  ['/progress', '📈', 'Progress'],
  ['/history', '🗂️', 'History'],
];
const GUEST_HIDDEN = ['/progress', '/history'];
// Links that stay lit on their inner pages too (/games/quiz lights "Games").
const SECTIONS = ['/games', '/vocab', '/teacher', '/writing'];
const GENERAL = ['/my', '/profile', '/teacher', '/privacy', '/reset-password'];

// Which area the open page belongs to: /ielts → IELTS; games, words, practice… → CEFR;
// My learning, profile and the teacher's class belong to no area.
function useRouteArea() {
  const { pathname } = useLocation();
  if (GENERAL.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;
  const other = AREAS.find((a) => a.id !== 'cefr' && pathname === areaPath(a.id));
  return other ? other.id : 'cefr';
}

// The menu shows icons only when its labels do not fit (long Uzbek/Russian words, many links,
// a teacher's extra link…), instead of guessing a screen width that works for every language.
// Returns '' (labels fit), 'topnav--tight' (labels fit with less padding) or 'topnav--icons'.
function useFitsOrIcons(ref, deps) {
  const [mode, setMode] = useState('');
  useLayoutEffect(() => {
    const nav = ref.current;
    if (!nav) return undefined;
    let widths = null; // [with labels, with labels + tight spacing], measured once per deps change
    const measure = () => {
      const keep = nav.className;
      nav.classList.remove('topnav--icons', 'topnav--tight');
      const full = nav.scrollWidth;
      nav.classList.add('topnav--tight');
      const tight = nav.scrollWidth;
      nav.className = keep;
      widths = [full, tight];
    };
    const check = () => {
      if (!widths) measure();
      const room = nav.clientWidth + 1;
      setMode(widths[0] <= room ? '' : widths[1] <= room ? 'topnav--tight' : 'topnav--icons');
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(nav);
    // Web fonts arrive after the first paint (they load in the background, see index.html) and change
    // the label widths: measure again each time a font finishes loading.
    const remeasure = () => {
      widths = null;
      check();
    };
    document.fonts?.addEventListener?.('loadingdone', remeasure);
    return () => {
      document.fonts?.removeEventListener?.('loadingdone', remeasure);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return mode;
}

export default function Layout() {
  const { user, profile, stats, attemptsReady, loadError, areas } = useApp();
  const navigate = useNavigate();
  const t = useT();
  const returning = useReturning();
  const menuRef = useRef(null);
  const areaMenuRef = useRef(null);
  const routeArea = useRouteArea();
  const current = routeArea && areaById(routeArea);
  const name = profile?.name || user?.name || '';
  // Games, words, progress… belong to CEFR practice; other areas get their own pages later.
  const isCefr = routeArea === 'cefr';
  let links = isCefr ? CEFR_LINKS : current ? [[areaPath(current.id), current.emoji, 'Home']] : [];
  if (!user) links = links.filter(([to]) => !GUEST_HIDDEN.includes(to));
  if (user) links = [...links, ['/my', '🧭', 'My learning']];
  if (profile?.role === 'teacher') links = [...links, ['/teacher', '🧑‍🏫', 'Class']];
  const navRef = useRef(null);
  const navFit = useFitsOrIcons(navRef, [links.length, t]);
  const closeAreaMenu = () => areaMenuRef.current?.removeAttribute('open');
  // The switcher lists the student's own areas first; guests see all of them.
  const menuAreas = user ? AREAS.filter((a) => areas.includes(a.id)) : AREAS;

  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="logo" title={t('Zinapoya homepage')}>
          <Logo />
        </Link>
        <details className="areamenu" ref={areaMenuRef}>
          <summary aria-label={t('Change area')} style={{ '--ac': current?.theme.accent || '#94a3b8' }}>
            <span aria-hidden="true">{current ? current.emoji : '🧭'}</span>
            <span className="areamenu__name">{current ? t(current.short) : t('My learning')}</span>
            <span aria-hidden="true" className="areamenu__caret">
              ▾
            </span>
          </summary>
          <div className="areamenu__panel">
            {user && (
              <Link to="/my" className={!current ? 'is-on' : ''} onClick={closeAreaMenu}>
                <span aria-hidden="true">🧭</span> {t('My learning')}
              </Link>
            )}
            <small>{user ? t('My areas') : t('Areas')}</small>
            {menuAreas.map((a) => (
              <Link
                key={a.id}
                to={areaPath(a.id)}
                className={a.id === routeArea ? 'is-on' : ''}
                style={{ '--ac': a.theme.accent }}
                onClick={closeAreaMenu}
              >
                <span aria-hidden="true">{a.emoji}</span> {t(a.name)}
                {a.id === routeArea && <span className="areamenu__check">✓</span>}
              </Link>
            ))}
            <Link to="/" className="areamenu__all" onClick={closeAreaMenu}>
              ✨ {user ? t('Join another area') : t('Zinapoya homepage')}
            </Link>
          </div>
        </details>
        <nav className={`topnav ${navFit}`} ref={navRef}>
          {links.map(([to, icon, label]) => (
            <NavLink key={to} to={to} end={!SECTIONS.includes(to)} title={t(label)}>
              <span aria-hidden="true">{icon}</span>
              <span className="topnav__label">{t(label)}</span>
            </NavLink>
          ))}
        </nav>
        <div className="topbar__user">
          <LangSwitch />
          <ThemeToggle />
          <SoundControls />
          {user ? (
            <>
              <span className="streak" title={t('Days in a row')}>🔥 {stats.streak}</span>
              <details className="usermenu" ref={menuRef}>
                <summary aria-label={t('Account menu')}>
                  <Avatar name={name} url={profile?.avatar_url} size={40} />
                </summary>
                <div className="usermenu__panel">
                  <strong>{name}</strong>
                  <small>{user.email}</small>
                  <Link className="btn btn--small" to="/profile" onClick={() => menuRef.current?.removeAttribute('open')}>
                    👤 {t('My profile')}
                  </Link>
                  {profile && 'onboarded_at' in profile && (
                    <Link className="btn btn--ghost btn--small" to="/welcome?edit=1&next=%2Fmy" onClick={() => menuRef.current?.removeAttribute('open')}>
                      📝 {t('About you')}
                    </Link>
                  )}
                  <button
                    className="btn btn--ghost btn--small"
                    onClick={async () => {
                      await api.signOut();
                      navigate('/');
                    }}
                  >
                    {t('Log out')}
                  </button>
                  <Link className="usermenu__privacy" to="/privacy" onClick={() => menuRef.current?.removeAttribute('open')}>
                    {t('Privacy policy')}
                  </Link>
                </div>
              </details>
            </>
          ) : (
            <span className="topbar__guest">
              {returning ? (
                <Link to="/login" className="btn btn--small">
                  {t('Log in')}
                </Link>
              ) : (
                <>
                  <Link to="/login" className="topbar__login">
                    {t('Log in')}
                  </Link>
                  <Link to="/signup" className="btn btn--small">
                    {t('Start free')}
                  </Link>
                </>
              )}
            </span>
          )}
        </div>
      </header>

      {!user && (
        <div className="guest-banner">
          {returning ? (
            <>
              <span>👋 {t('Welcome back! Log in to record answers and see your progress.')}</span>
              <Link to="/login" className="btn btn--small">
                {t('Log in')}
              </Link>
            </>
          ) : (
            <>
              <span>👋 {t('You are looking around as a guest. Create a free account to record answers and save your progress.')}</span>
              <Link to="/signup" className="btn btn--small">
                {t('Create a free account')}
              </Link>
            </>
          )}
        </div>
      )}

      {isLocalMode && (
        <div className="demo-banner">
          {t('Local demo mode — your account and progress are saved only in this browser. AI feedback is switched off.')}
        </div>
      )}

      <main className="main">
        {loadError && <p className="notice notice--warn">{loadError}</p>}
        {attemptsReady ? (
          <Suspense
            fallback={
              <div className="loading-progress">
                <div className="spinner" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        ) : (
          <div className="loading-progress">
            <div className="spinner" />
            <p className="muted">{t('Loading your progress…')}</p>
          </div>
        )}
      </main>

      {aiEnabled && isCefr && user && <CoachChat />}

      <nav className={`bottomnav ${links.length < 2 ? 'bottomnav--none' : ''}`}>
        {links.map(([to, icon, label]) => (
          <NavLink key={to} to={to} end={!SECTIONS.includes(to)}>
            <span>{icon}</span>
            <small>{t(label)}</small>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
