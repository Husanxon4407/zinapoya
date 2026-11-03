import { useState } from 'react';
import { Link } from 'react-router-dom';
import ExamRunner from '../components/ExamRunner.jsx';
import { PART1_1 } from '../data/part1_1.js';
import { pick, stepsP11 } from '../lib/steps.js';

export default function TryIt() {
  const [steps] = useState(() => stepsP11([pick(PART1_1)]));
  return (
    <div className="guest-page">
      <header className="landing__top">
        <Link to="/" className="logo">
          <span className="logo__mark">🪜</span> Zinapoya
        </Link>
        <Link to="/signup" className="btn btn--small">
          Sign up free
        </Link>
      </header>
      <main className="main">
        <ExamRunner steps={steps} mode="guest" title="Try one Part 1.1 question" intro={<p>Just like the real exam: 5 seconds to think, 30 seconds to answer.</p>} />
      </main>
    </div>
  );
}
