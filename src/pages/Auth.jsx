import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, isLocalMode } from '../lib/api.js';
import { PENDING_AVATAR, useApp } from '../state.jsx';
import AvatarPicker from '../components/AvatarPicker.jsx';
import { blobToDataUrl } from '../lib/image.js';
import LangSwitch from '../components/LangSwitch.jsx';
import { useT } from '../i18n/index.js';
import Logo from '../components/Logo.jsx';
import { AREAS, isArea } from '../data/areas.js';
import { setPendingArea } from '../lib/area.js';

function AuthShell({ title, subtitle, children }) {
  const t = useT();
  return (
    <div className="auth">
      <div className="auth__top">
        <Link to="/" className="logo auth__logo">
          <Logo />
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

// The area from the address (?area=ielts), set by the area pages' Register / Log in buttons.
// It is only saved for the account when the student actually logs in or signs up.
function useAreaFromUrl() {
  const [params] = useSearchParams();
  const fromUrl = params.get('area');
  return isArea(fromUrl) ? fromUrl : null;
}

// "Which area do you want to study?" — big tappable choices.
function AreaPicker({ value, onChange }) {
  const t = useT();
  return (
    <fieldset className="area-pick">
      <legend>{t('What do you want to study?')}</legend>
      <div className="area-pick__grid">
        {AREAS.map((a) => (
          <label key={a.id} className={`area-pick__item ${value === a.id ? 'is-on' : ''}`} style={{ '--ac': a.theme.accent, '--ab': a.theme.bg2 }}>
            <input type="radio" name="area" value={a.id} checked={value === a.id} onChange={() => onChange(a.id)} />
            <span className="area-pick__emoji" aria-hidden="true">
              {a.emoji}
            </span>
            <span className="area-pick__name">{t(a.short)}</span>
            {a.ready && <span className="area-pick__live">{t('Open now')}</span>}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function GoogleButton({ area, requireArea = false, onMissingArea }) {
  const t = useT();
  if (isLocalMode) return null;
  return (
    <>
      <button
        type="button"
        className="btn btn--outline btn--block"
        onClick={() => {
          if (requireArea && !area) {
            onMissingArea?.();
            return;
          }
          // Google leaves the site; the area waits in this browser until we are back.
          setPendingArea(area); // (no area clears an old choice)
          api.signInWithGoogle().catch((e) => alert(e.message));
        }}
      >
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
  // Logging in from an area page ("Log in" on /learn/ielts) opens that area afterwards.
  const area = useAreaFromUrl();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(signInErrorFromUrl);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      setPendingArea(area);
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
      <GoogleButton area={area} />
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
        <Link to="/forgot">{t('Forgot password?')}</Link> · <Link to={area ? `/signup?area=${area}` : '/signup'}>{t('Create an account')}</Link>
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
  const [area, setArea] = useState(useAreaFromUrl() || '');

  async function submit(e) {
    e.preventDefault();
    if (!area) {
      setError('Please choose what you want to study.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      setPendingArea(area);
      // The photo is uploaded right after the first login (see state.jsx).
      if (photo) localStorage.setItem(PENDING_AVATAR, photo);
      else localStorage.removeItem(PENDING_AVATAR);
      const { needsConfirmation } = await api.signUp({ name: name.trim(), email, password, area });
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
      <AreaPicker
        value={area}
        onChange={(id) => {
          setArea(id);
          setError('');
        }}
      />
      {error === 'Please choose what you want to study.' && <p className="notice notice--warn">{t(error)}</p>}
      <GoogleButton area={area} requireArea onMissingArea={() => setError('Please choose what you want to study.')} />
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
        {error && error !== 'Please choose what you want to study.' && <p className="notice notice--warn">{t(error)}</p>}
        <button className="btn btn--block" disabled={busy}>
          {busy ? t('Creating…') : t('Sign up')}
        </button>
      </form>
      <p className="auth__links">
        {t('Already have an account?')} <Link to={area ? `/login?area=${area}` : '/login'}>{t('Log in')}</Link>
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
