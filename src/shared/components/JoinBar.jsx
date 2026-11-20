import { useState } from 'react';
import { useApp } from '../../app/state.jsx';
import { useT } from '../../i18n/index.js';
import { areaById } from '../data/areas.js';

// Shown on an area's main page when a logged-in student has not joined that area yet:
// one tap adds it to "My learning" (no new registration).
export default function JoinBar({ areaId }) {
  const { user, areas, joinArea } = useApp();
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const area = areaById(areaId);
  if (!user || !area || areas.includes(areaId)) return null;

  async function join() {
    setBusy(true);
    setError('');
    try {
      await joinArea(areaId);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <div className="joinbar" style={{ '--ac': area.theme.accent }}>
      <span aria-hidden="true">{area.emoji}</span>
      <p>
        {t('You have not joined {name} yet. Join to keep it in My learning — it is free and takes one tap.', { name: t(area.name) })}
        {error && <small className="joinbar__error"> {error}</small>}
      </p>
      <button type="button" className="btn btn--small" onClick={join} disabled={busy}>
        {busy ? t('Joining…') : t('Join {name}', { name: t(area.short) })}
      </button>
    </div>
  );
}
