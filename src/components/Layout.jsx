import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useApp } from '../state.jsx';
import { api, isLocalMode } from '../lib/api.js';

const LINKS = [
  ['/', '🏠', 'Home'],
  ['/games', '🎮', 'Games'],
  ['/phrases', '💬', 'Phrases'],
  ['/progress', '📈', 'Progress'],
  ['/history', '🗂️', 'History'],
];

export default function Layout() {
  const { user, stats } = useApp();
  const navigate = useNavigate();

  return (
    <div className="app">
      <header className="topbar">
        <NavLink to="/" className="logo">
          <span className="logo__mark">🎤</span> SpeakUp
        </NavLink>
        <nav className="topnav">
          {LINKS.map(([to, icon, label]) => (
            <NavLink key={to} to={to} end={to === '/'}>
              {icon} {label}
            </NavLink>
          ))}
        </nav>
        <div className="topbar__user">
          <span className="streak" title="Days in a row">🔥 {stats.streak}</span>
          <details className="usermenu">
            <summary aria-label="Account menu">{user.name.slice(0, 1).toUpperCase()}</summary>
            <div className="usermenu__panel">
              <strong>{user.name}</strong>
              <small>{user.email}</small>
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
        <Outlet />
      </main>

      <nav className="bottomnav">
        {LINKS.map(([to, icon, label]) => (
          <NavLink key={to} to={to} end={to === '/'}>
            <span>{icon}</span>
            <small>{label}</small>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
