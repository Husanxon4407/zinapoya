import { Link } from 'react-router-dom';
import Backdrop from '../components/Backdrop.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import LangSwitch from '../components/LangSwitch.jsx';
import Stats from '../components/landing/Stats.jsx';
import Sections from '../components/landing/Sections.jsx';
import HowItWorks from '../components/landing/HowItWorks.jsx';
import VideoBox from '../components/landing/VideoBox.jsx';
import Faq from '../components/landing/Faq.jsx';
import AskForm from '../components/landing/AskForm.jsx';
import Contacts from '../components/landing/Contacts.jsx';
import { BRAND, TAGLINE } from '../data/site.js';
import { useT } from '../i18n/index.js';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

// A little staircase of CEFR levels — the idea behind the name "Zinapoya" (staircase).
function Stairs() {
  const t = useT();
  return (
    <div className="stairs" aria-hidden="true">
      {LEVELS.map((lv, i) => (
        <div key={lv} className="stairs__step" style={{ '--i': i, height: `${40 + i * 26}px` }}>
          <span>{lv}</span>
        </div>
      ))}
      <span className="stairs__goal">{t('Exam ready!')} 🎓</span>
    </div>
  );
}

export default function Landing() {
  const t = useT();
  return (
    <div className="landing">
      <Backdrop />
      <header className="landing__top">
        <span className="logo">
          <span className="logo__mark">🪜</span> {BRAND}
        </span>
        <div className="landing__actions">
          <LangSwitch />
          <ThemeToggle />
          <Link to="/login" className="btn btn--ghost btn--small">
            {t('Log in')}
          </Link>
        </div>
      </header>

      <section className="hero">
        <div className="hero__text">
          <span className="hero__eyebrow">{t('Multilevel (CEFR) Exam Practice')}</span>
          <h1>
            {t('Step up to')} <br />
            <span className="grad">{t('your level.')}</span>
          </h1>
          <p>{t('Zinapoya helps you climb the Multilevel exam, step by step — with real questions, recordings and an AI coach. Speaking is ready now; Listening, Reading and Writing are on the way.')}</p>
          <div className="hero__cta">
            <Link to="/signup" className="btn btn--big">
              {t('Start free')}
            </Link>
            <Link to="/try" className="btn btn--big btn--outline">
              🎤 {t('Try one question')}
            </Link>
          </div>
        </div>
        <Stairs />
      </section>

      <Stats />
      <Sections />
      <HowItWorks />
      <VideoBox />
      <Faq />
      <AskForm />
      <Contacts />

      <footer className="landing__foot">
        {BRAND} · {t(TAGLINE)} 🍀 · <Link to="/privacy">{t('Privacy policy')}</Link>
      </footer>
    </div>
  );
}
