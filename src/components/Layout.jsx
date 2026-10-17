import { useRef } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import Avatar from './Avatar.jsx';
import { useApp } from '../state.jsx';
import { aiEnabled, api, isLocalMode } from '../lib/api.js';
import SoundControls from './SoundControls.jsx';
import CoachChat from './CoachChat.jsx';
import ThemeToggle from './ThemeToggle.jsx';

const LINKS = [
  ['/', '🏠', 'Home'],
  ['/games', '🎮', 'Games'],
  ['/vocab', '📚', 'Words'],
  ['/progress', '📈', 'Progress'],
  ['/history', '🗂️', 'History'],
];

export default function Layout() {
  const { user, profile, stats, attemptsReady, loadError } = useApp();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const name = profile?.name || user.name;
  const links = profile?.role === 'teacher' ? [...LINKS, ['/teacher', '🧑‍🏫', 'Class']] : LINKS;

  return (
    <div className="app">
      <header className="topbar">
        <NavLink to="/" className="logo">
          <span className="logo__mark">🎤</span> SpeakUp
        </NavLink>
        <nav className="topnav">
          {links.map(([to, icon, label]) => (
            <NavLink key={to} to={to} end={to === '/'}>
              {icon} {label}
            </NavLink>
          ))}
        </nav>
        <div className="topbar__user">
          <ThemeToggle />
          <SoundControls />
          <span className="streak" title="Days in a row">🔥 {stats.streak}</span>
          <details className="usermenu" ref={menuRef}>
            <summary aria-label="Account menu">
              <Avatar name={name} url={profile?.avatar_url} size={40} />
            </summary>
            <div className="usermenu__panel">
              <strong>{name}</strong>
              <small>{user.email}</small>
              <Link className="btn btn--small" to="/profile" onClick={() => menuRef.current?.removeAttribute('open')}>
                👤 My profile
              </Link>
              <button
                className="btn btn--ghost btn--small"
                onClick={async () => {
                  await api.signOut();
                  navigate('/');
                }}
              >
                Log out
              </button>
            </div>
          </details>
        </div>
      </header>

      {isLocalMode && (
        <div className="demo-banner">
          Local demo mode — your account and progress are saved only in this browser. AI feedback is switched off.
        </div>
      )}

      <main className="main">
        {loadError && <p className="notice notice--warn">{loadError}</p>}
        {attemptsReady ? (
          <Outlet />
        ) : (
          <div className="loading-progress">
            <div className="spinner" />
            <p className="muted">Loading your progress…</p>
          </div>
        )}
      </main>

      {aiEnabled && <CoachChat />}

      <nav className="bottomnav">
        {links.map(([to, icon, label]) => (
          <NavLink key={to} to={to} end={to === '/'}>
            <span>{icon}</span>
            <small>{label}</small>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
