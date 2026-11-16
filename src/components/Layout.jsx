import { Suspense, useRef } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import Avatar from './Avatar.jsx';
import LangSwitch from './LangSwitch.jsx';
import { useT } from '../i18n/index.js';
import { useApp } from '../state.jsx';
import { aiEnabled, api, isLocalMode } from '../lib/api.js';
import SoundControls from './SoundControls.jsx';
import CoachChat from './CoachChat.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import Logo from './Logo.jsx';
import { AREAS, areaById } from '../data/areas.js';

const LINKS = [
  ['/', '🏠', 'Home'],
  ['/games', '🎮', 'Games'],
  ['/vocab', '📚', 'Words'],
  ['/progress', '📈', 'Progress'],
  ['/history', '🗂️', 'History'],
];

export default function Layout() {
  const { user, profile, stats, attemptsReady, loadError, area } = useApp();
  const navigate = useNavigate();
  const t = useT();
  const menuRef = useRef(null);
  const areaMenuRef = useRef(null);
  const name = profile?.name || user.name;
  const current = areaById(area);
  // Games, words, progress… belong to CEFR practice; other areas get their own pages later.
  const isCefr = area === 'cefr';
  const base = isCefr ? LINKS : [['/', current.emoji, 'Home']];
  const links = profile?.role === 'teacher' ? [...base, ['/teacher', '🧑‍🏫', 'Class']] : base;

  return (
    <div className="app">
      <header className="topbar">
        <NavLink to="/" className="logo">
          <Logo />
        </NavLink>
        <details className="areamenu" ref={areaMenuRef}>
          <summary aria-label={t('Change area')} style={{ '--ac': current.theme.accent }}>
            <span aria-hidden="true">{current.emoji}</span>
            <span className="areamenu__name">{t(current.short)}</span>
            <span aria-hidden="true" className="areamenu__caret">
              ▾
            </span>
          </summary>
          <div className="areamenu__panel">
            <small>{t('Your area')}</small>
            {AREAS.map((a) => (
              <Link
                key={a.id}
                to={`/learn/${a.id}`}
                className={a.id === area ? 'is-on' : ''}
                style={{ '--ac': a.theme.accent }}
                onClick={() => areaMenuRef.current?.removeAttribute('open')}
              >
                <span aria-hidden="true">{a.emoji}</span> {t(a.name)}
                {a.id === area && <span className="areamenu__check">✓</span>}
              </Link>
            ))}
          </div>
        </details>
        <nav className="topnav">
          {links.map(([to, icon, label]) => (
            <NavLink key={to} to={to} end={to === '/'} title={t(label)}>
              <span aria-hidden="true">{icon}</span>
              <span className="topnav__label">{t(label)}</span>
            </NavLink>
          ))}
        </nav>
        <div className="topbar__user">
          <LangSwitch />
          <ThemeToggle />
          <SoundControls />
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
        </div>
      </header>

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

      {aiEnabled && isCefr && <CoachChat />}

      <nav className={`bottomnav ${links.length < 2 ? 'bottomnav--none' : ''}`}>
        {links.map(([to, icon, label]) => (
          <NavLink key={to} to={to} end={to === '/'}>
            <span>{icon}</span>
            <small>{t(label)}</small>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
