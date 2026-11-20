import { useRef } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../landing/Hero.jsx';
import Catalog from '../landing/Catalog.jsx';
import Spotlight from '../landing/Spotlight.jsx';
import Stats from '../landing/Stats.jsx';
import HowItWorks from '../landing/HowItWorks.jsx';
import VideoBox from '../landing/VideoBox.jsx';
import Faq from '../landing/Faq.jsx';
import AskForm from '../landing/AskForm.jsx';
import Contacts from '../landing/Contacts.jsx';
import Logo from '../../../shared/components/Logo.jsx';
import ThemeToggle from '../../../shared/components/ThemeToggle.jsx';
import { useReveal } from '../lib/useReveal.js';
import { TAGLINE } from '../../../shared/data/site.js';
import { useT } from '../../../i18n/index.js';
import { useApp } from '../../../app/state.jsx';
import '../../../styles/home.css';

// The public main page: a dark 3D opening screen, a fade into the page, then what Zinapoya offers.
export default function Landing() {
  const t = useT();
  const { user } = useApp();
  const pageRef = useRef(null);
  useReveal(pageRef);

  return (
    <div className="zhome" ref={pageRef}>
      <Hero />
      <div className="home-fade" aria-hidden="true" />

      <main className="home-main">
        <Catalog />
        <Spotlight />
        <Stats />
        <HowItWorks />
        <VideoBox />
        <div className="home-qa">
          <Faq />
          <AskForm />
        </div>
        <Contacts />

        <section className="home-final reveal" aria-labelledby="final-title">
          <h2 id="final-title">{user ? t('Ready for your next step?') : t('Ready for your first step?')}</h2>
          <p>{user ? t('Your areas and progress are waiting in My learning.') : t('It takes less than a minute to start, and it is free.')}</p>
          <Link to={user ? '/my' : '/signup'} className="zbtn">
            {user ? t('Go to My learning') : t('Start learning free')} <span className="zbtn__arrow" aria-hidden="true">↗</span>
          </Link>
        </section>
      </main>

      <footer className="home-foot">
        <Link to="/" className="logo">
          <Logo size={30} />
        </Link>
        <span className="home-foot__tag">{t(TAGLINE)}</span>
        <nav className="home-foot__links">
          <a href="#learn">{t('Subjects')}</a>
          <a href="#faq">{t('FAQ')}</a>
          <a href="#contacts">{t('Contacts')}</a>
          <Link to="/privacy">{t('Privacy policy')}</Link>
          <ThemeToggle />
        </nav>
        <span className="home-foot__copy">© {new Date().getFullYear()} Zinapoya</span>
      </footer>
    </div>
  );
}
