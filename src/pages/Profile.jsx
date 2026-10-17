import { useEffect, useState } from 'react';
import { useApp } from '../state.jsx';
import { api } from '../lib/api.js';
import AvatarPicker from '../components/AvatarPicker.jsx';
import AppSettings from '../components/AppSettings.jsx';

export default function Profile() {
  const { user, profile, setProfile, stats, xp } = useApp();
  const [name, setName] = useState(profile?.name || user.name);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile?.name) setName(profile.name);
  }, [profile?.name]);

  async function run(kind, fn) {
    setBusy(kind);
    setError('');
    setSaved(false);
    try {
      setProfile(await fn());
      if (kind === 'name') setSaved(true);
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy('');
    }
  }

  const trimmed = name.trim();

  return (
    <div className="profile">
      <h1>👤 My profile</h1>

      <div className="card">
        <AvatarPicker
          name={trimmed || user.name}
          url={profile?.avatar_url}
          busy={busy === 'photo'}
          onPick={(blob) => run('photo', () => api.uploadAvatar(blob))}
          onRemove={() => run('photo', () => api.removeAvatar())}
          onError={setError}
        />

        <form
          className="form profile__form"
          onSubmit={(e) => {
            e.preventDefault();
            run('name', () => api.updateProfile({ name: trimmed }));
          }}
        >
          <label>
            Your name
            <input required maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <button className="btn" disabled={busy === 'name' || !trimmed || trimmed === profile?.name}>
            {busy === 'name' ? 'Saving…' : 'Save name'}
          </button>
        </form>

        {saved && <p className="notice">✅ Saved!</p>}
        {error && <p className="notice notice--warn">{error}</p>}
        <p className="muted profile__email">Email: {user.email}</p>
      </div>

      <AppSettings />

      <div className="card profile__stats">
        <div>
          <strong>{xp.level}</strong>
          <small>Level · {xp.name}</small>
        </div>
        <div>
          <strong>{stats.total}</strong>
          <small>Answers</small>
        </div>
        <div>
          <strong>{stats.minutes}</strong>
          <small>Minutes spoken</small>
        </div>
        <div>
          <strong>🔥 {stats.streak}</strong>
          <small>Day streak</small>
        </div>
      </div>
    </div>
  );
}
