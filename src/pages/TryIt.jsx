import { useState } from 'react';
import { Link } from 'react-router-dom';
import ExamRunner from '../components/ExamRunner.jsx';
import { PART1_1 } from '../data/part1_1.js';
import { pick, stepsP11 } from '../lib/steps.js';
import { useT } from '../i18n/index.js';
import Logo from '../components/Logo.jsx';
import { useReturning } from '../lib/returning.js';

export default function TryIt() {
  const t = useT();
  const returning = useReturning();
  const [steps] = useState(() => stepsP11([pick(PART1_1)]));
  return (
    <div className="guest-page">
      <header className="landing__top">
        <Link to="/" className="logo">
          <Logo />
        </Link>
        <Link to={returning ? '/login' : '/signup'} className="btn btn--small">
          {returning ? t('Log in') : t('Sign up free')}
        </Link>
      </header>
      <main className="main">
        <ExamRunner
          steps={steps}
          mode="guest"
          title={t('Try one Part 1.1 question')}
          intro={<p>{t('Just like the real exam: 5 seconds to think, 30 seconds to answer.')}</p>}
        />
      </main>
    </div>
  );
}
