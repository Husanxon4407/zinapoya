import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../state.jsx';
import { useT } from '../i18n/index.js';
import { hasAccess } from '../data/plans.js';

// Pages that save something (recording answers, progress, profile…) need a free account.
// Guests see this card in place of the page; after logging in they come straight back here.
// `feature` (data/plans.js) will also lock paid parts once payment exists.
export default function Gate({ children, feature, why = 'Create a free account to record your answers and keep your progress.' }) {
  const { user, profile } = useApp();
  const { pathname, search } = useLocation();
  const t = useT();

  if (!user) {
    const next = encodeURIComponent(pathname + search);
    return (
      <div className="card gate">
        <span className="gate__icon" aria-hidden="true">
          🔐
        </span>
        <h1>{t('Free account needed')}</h1>
        <p className="muted">{t(why)}</p>
        <div className="gate__actions">
          {/* replace: after logging in, Back skips the login page and this card */}
          <Link className="btn" to={`/signup?next=${next}`} replace>
            {t('Create a free account')}
          </Link>
          <Link className="btn btn--ghost" to={`/login?next=${next}`} replace>
            {t('Log in')}
          </Link>
        </div>
      </div>
    );
  }

  if (!hasAccess(feature, profile?.plan)) {
    return (
      <div className="card gate">
        <span className="gate__icon" aria-hidden="true">
          ⭐
        </span>
        <h1>{t('Part of a paid plan')}</h1>
        <p className="muted">{t('This part needs a Zinapoya plan.')}</p>
      </div>
    );
  }

  return children;
}
