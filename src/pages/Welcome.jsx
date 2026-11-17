import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import LangSwitch from '../components/LangSwitch.jsx';
import { AREAS } from '../data/areas.js';
import { AGES, GOALS, LEVELS } from '../data/about.js';
import { safePath } from '../lib/area.js';
import { useApp } from '../state.jsx';
import { useT } from '../i18n/index.js';

// "About you": a few quick questions, one per screen, asked once after registering
// (and editable later from the account menu). Only the phone number is typed; everything else is a tap.
export default function Welcome() {
  const t = useT();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safePath(params.get('next')) || '/my';
  const editing = params.get('edit') === '1';
  const { profile, areas, saveAreas, saveAbout, area } = useApp();

  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState(areas);
  const [goal, setGoal] = useState(profile?.goal || '');
  const [level, setLevel] = useState(profile?.level || '');
  const [examDate, setExamDate] = useState(profile?.exam_date || '');
  const [age, setAge] = useState(profile?.age_range || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!profile) return <div className="splash"><div className="spinner" /></div>;
  // The database does not have the "About you" fields yet (migration 09 not run): nothing to ask.
  if (!('onboarded_at' in profile)) return <Navigate to={next} replace />;

  const wantsDate = goal === 'exam' || goal === 'abroad';
  const steps = ['areas', 'goal', 'level', ...(wantsDate ? ['date'] : []), 'age', 'phone'];
  const kind = steps[Math.min(step, steps.length - 1)];
  const go = (n) => {
    setError('');
    setStep(n);
  };
  const forward = () => go(step + 1);
  const choose = (setter) => (value) => {
    setter(value);
    setTimeout(forward, 160); // a short moment to see the choice light up
  };

  async function finish(skip = false) {
    const cleanPhone = phone.trim();
    if (!skip && cleanPhone && !/^\+?[\d\s()-]{7,20}$/.test(cleanPhone)) {
      setError('Please check the phone number (digits only, for example +998 90 123 45 67).');
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (!skip && picked.join() !== areas.join()) await saveAreas(picked, picked.includes(area) ? area : picked[0]);
      await saveAbout(
        skip
          ? {}
          : {
              goal: goal || null,
              level: level || null,
              exam_date: wantsDate && examDate ? examDate : null,
              age_range: age || null,
              phone: cleanPhone || null,
            },
      );
      navigate(next, { replace: true });
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  const Choice = ({ on, onClick, emoji, label, hint }) => (
    <button type="button" className={`about-choice ${on ? 'is-on' : ''}`} onClick={onClick} aria-pressed={on}>
      {emoji && (
        <span className="about-choice__emoji" aria-hidden="true">
          {emoji}
        </span>
      )}
      <span className="about-choice__label">{t(label)}</span>
      {hint && <small>{hint}</small>}
    </button>
  );

  return (
    <div className="about">
      <header className="about__top">
        <Link to="/" className="logo logo--light">
          <Logo />
        </Link>
        <LangSwitch />
      </header>

      <div className="about__card">
        <div className="about__progress" aria-hidden="true">
          {steps.map((s, i) => (
            <span key={s} className={i <= step ? 'is-on' : ''} />
          ))}
        </div>
        <p className="about__count">
          {editing ? t('About you') : t('Quick setup')} · {t('{n} of {m}', { n: step + 1, m: steps.length })}
        </p>

        {kind === 'areas' && (
          <>
            <h1>{t('What do you want to learn?')}</h1>
            <p className="muted">{t('Pick one or more. You can add others any time.')}</p>
            <div className="about__grid">
              {AREAS.map((a) => (
                <Choice
                  key={a.id}
                  on={picked.includes(a.id)}
                  emoji={a.emoji}
                  label={a.name}
                  hint={a.ready ? t('Open now') : t('Opening soon')}
                  onClick={() => setPicked((p) => (p.includes(a.id) ? p.filter((x) => x !== a.id) : [...p, a.id]))}
                />
              ))}
            </div>
            {error && <p className="notice notice--warn">{t(error)}</p>}
            <button
              type="button"
              className="btn btn--block"
              onClick={() => (picked.length ? forward() : setError('Choose at least one area.'))}
            >
              {t('Continue')}
            </button>
          </>
        )}

        {kind === 'goal' && (
          <>
            <h1>{t('What is your main goal?')}</h1>
            <div className="about__grid">
              {GOALS.map((g) => (
                <Choice key={g.id} on={goal === g.id} emoji={g.emoji} label={g.label} onClick={() => choose(setGoal)(g.id)} />
              ))}
            </div>
          </>
        )}

        {kind === 'level' && (
          <>
            <h1>{t('What is your level now?')}</h1>
            <p className="muted">{t('A guess is fine — we use it to choose where you start.')}</p>
            <div className="about__grid">
              {LEVELS.map((l) => (
                <Choice key={l.id} on={level === l.id} emoji={l.emoji} label={l.label} hint={l.hint} onClick={() => choose(setLevel)(l.id)} />
              ))}
            </div>
          </>
        )}

        {kind === 'date' && (
          <>
            <h1>{t('When is your exam?')}</h1>
            <p className="muted">{t('We will count down the days with you.')}</p>
            <input
              type="date"
              className="about__date"
              value={examDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setExamDate(e.target.value)}
              aria-label={t('Exam date')}
            />
            <div className="about__row">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  setExamDate('');
                  forward();
                }}
              >
                {t('No date yet')}
              </button>
              <button type="button" className="btn" onClick={forward} disabled={!examDate}>
                {t('Continue')}
              </button>
            </div>
          </>
        )}

        {kind === 'age' && (
          <>
            <h1>{t('How old are you?')}</h1>
            <p className="muted">{t('So the lessons and examples fit you.')}</p>
            <div className="about__grid about__grid--4">
              {AGES.map((a) => (
                <Choice key={a.id} on={age === a.id} label={a.label} onClick={() => choose(setAge)(a.id)} />
              ))}
            </div>
          </>
        )}

        {kind === 'phone' && (
          <>
            <h1>{t('Your phone number')}</h1>
            <p className="muted">{t('Optional. Only for reminders and important news about your lessons — never shared, never for ads.')}</p>
            <input
              type="tel"
              className="about__phone"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+998 90 123 45 67"
              value={phone}
              maxLength={24}
              onChange={(e) => setPhone(e.target.value)}
              aria-label={t('Phone number')}
            />
            {error && <p className="notice notice--warn">{t(error)}</p>}
            <button type="button" className="btn btn--block" onClick={() => finish()} disabled={busy}>
              {busy ? t('Saving…') : editing ? t('Save') : t('Finish')}
            </button>
          </>
        )}

        <div className="about__foot">
          {step > 0 ? (
            <button type="button" className="about__link" onClick={() => go(step - 1)}>
              ← {t('Back')}
            </button>
          ) : (
            <span />
          )}
          {editing ? (
            <Link to={next} className="about__link">
              {t('Cancel')}
            </Link>
          ) : (
            <button type="button" className="about__link" onClick={() => finish(true)} disabled={busy}>
              {t('Skip for now')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
