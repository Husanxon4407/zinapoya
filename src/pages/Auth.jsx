import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, isLocalMode } from '../lib/api.js';
import { PENDING_AVATAR, useApp } from '../state.jsx';
import AvatarPicker from '../components/AvatarPicker.jsx';
import { blobToDataUrl } from '../lib/image.js';
import LangSwitch from '../components/LangSwitch.jsx';
import { useT } from '../i18n/index.js';

function AuthShell({ title, subtitle, children }) {
  const t = useT();
  return (
    <div className="auth">
      <div className="auth__top">
        <Link to="/" className="logo auth__logo">
          <span className="logo__mark">🪜</span> Zinapoya
        </Link>
        <LangSwitch full />
      </div>
      <div className="card auth__card">
        <h1>{t(title)}</h1>
        {subtitle && <p className="muted">{t(subtitle)}</p>}
        {children}
      </div>
    </div>
  );
}

function GoogleButton() {
  const t = useT();
  if (isLocalMode) return null;
  return (
    <>
      <button type="button" className="btn btn--outline btn--block" onClick={() => api.signInWithGoogle().catch((e) => alert(e.message))}>
        <span aria-hidden>🇬</span> {t('Continue with Google')}
      </button>
      <div className="divider">{t('or')}</div>
    </>
  );
}

// When Google sign-in fails, Supabase sends the student back with ?error_description=… in the address.
export function signInErrorFromUrl() {
  const params = new URLSearchParams(window.location.search || window.location.hash.slice(1));
  const code = params.get('error_code');
  const text = params.get('error_description');
  if (!code && !text) return '';
  if (code === 'bad_oauth_state' || /expired/i.test(text || '')) return 'The Google sign-in took too long and expired. Please tap “Continue with Google” again.';
  return `Google sign-in did not work: ${text || code}. Please try again.`;
}

export function Login() {
  const t = useT();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(signInErrorFromUrl);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.signIn({ email, password });
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Welcome back 👋" subtitle="Log in to continue your practice.">
      <GoogleButton />
      <form onSubmit={submit} className="form">
        <label>
          {t('Email')}
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          {t('Password')}
          <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="notice notice--warn">{t(error)}</p>}
        <button className="btn btn--block" disabled={busy}>
          {busy ? t('Logging in…') : t('Log in')}
        </button>
      </form>
      <p className="auth__links">
        <Link to="/forgot">{t('Forgot password?')}</Link> · <Link to="/signup">{t('Create an account')}</Link>
      </p>
    </AuthShell>
  );
}

export function Signup() {
  const t = useT();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const [photo, setPhoto] = useState(null); // data URL of the chosen photo

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      // The photo is uploaded right after the first login (see state.jsx).
      if (photo) localStorage.setItem(PENDING_AVATAR, photo);
      else localStorage.removeItem(PENDING_AVATAR);
      const { needsConfirmation } = await api.signUp({ name: name.trim(), email, password });
      if (needsConfirmation) setCheckEmail(true);
      else navigate('/');
    } catch (err) {
      localStorage.removeItem(PENDING_AVATAR);
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (checkEmail) {
    return (
      <AuthShell title="Check your email 📬">
        <p>
          {t('We sent a confirmation link to')} <strong>{email}</strong>. {t('Click it, then come back and log in.')}
        </p>
        <Link className="btn btn--block" to="/login">
          {t('Go to log in')}
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Create your account" subtitle="Free. Your progress is saved and you can log in from any device.">
      <GoogleButton />
      <form onSubmit={submit} className="form">
        <AvatarPicker
          name={name}
          url={photo}
          onPick={async (blob) => setPhoto(await blobToDataUrl(blob))}
          onRemove={() => setPhoto(null)}
          onError={setError}
        />
        <label>
          {t('Your name')}
          <input required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          {t('Email')}
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          {t('Password')} <small className="muted">({t('at least 6 characters')})</small>
          <input type="password" required minLength={6} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="notice notice--warn">{t(error)}</p>}
        <button className="btn btn--block" disabled={busy}>
          {busy ? t('Creating…') : t('Sign up')}
        </button>
      </form>
      <p className="auth__links">
        {t('Already have an account?')} <Link to="/login">{t('Log in')}</Link>
      </p>
      <p className="auth__links">
        <Link to="/privacy">{t('Privacy policy')}</Link>
      </p>
    </AuthShell>
  );
}

export function ForgotPassword() {
  const t = useT();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      await api.resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AuthShell title="Reset your password" subtitle="We’ll email you a link to choose a new password.">
      {sent ? (
        <p className="notice">📬 {t('If an account exists for {email}, a reset link is on its way.', { email })}</p>
      ) : (
        <form onSubmit={submit} className="form">
          <label>
            {t('Email')}
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          {error && <p className="notice notice--warn">{t(error)}</p>}
          <button className="btn btn--block">{t('Send reset link')}</button>
        </form>
      )}
      <p className="auth__links">
        <Link to="/login">{t('Back to log in')}</Link>
      </p>
    </AuthShell>
  );
}

export function ResetPassword() {
  const t = useT();
  const navigate = useNavigate();
  const { setRecovering } = useApp();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    try {
      await api.updatePassword(password);
      setRecovering(false);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AuthShell title="Choose a new password">
      <form onSubmit={submit} className="form">
        <label>
          {t('New password')}
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="notice notice--warn">{t(error)}</p>}
        <button className="btn btn--block">{t('Save password')}</button>
      </form>
    </AuthShell>
  );
}
