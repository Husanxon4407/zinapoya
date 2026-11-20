// /cefr — the CEFR Multilevel hub: one card per exam section. Each section has its own pages and menu
// (Speaking at /speaking, Writing at /writing); Listening and Reading are coming.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../../app/state.jsx';
import { api } from '../../../shared/lib/api.js';
import JoinBar from '../../../shared/components/JoinBar.jsx';
import { useT } from '../../../i18n/index.js';
import './cefr-hub.css';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function CefrHub() {
  const t = useT();
  const { user, profile, stats } = useApp();
  const [writing, setWriting] = useState(null); // number of checked texts, once loaded

  useEffect(() => {
    if (!user) return;
    api.writing
      .list()
      .then((rows) => setWriting(rows.length))
      .catch(() => setWriting(null));
  }, [user]);

  const sections = [
    {
      id: 'speaking',
      to: '/speaking',
      emoji: '🎤',
      name: 'Speaking',
      color: '#0d9488',
      text: 'All four parts: short questions, picture comparison, a 2-minute talk and a discussion.',
      facts: ['4 parts', 'about 15 minutes'],
      stat: user && stats.total > 0 ? t('Answers: {n}', { n: stats.total }) : null,
    },
    {
      id: 'writing',
      to: '/writing',
      emoji: '✍️',
      name: 'Writing',
      color: '#7c3aed',
      text: 'A friendly email, a formal email and an online post, checked with the official criteria.',
      facts: ['3 tasks', '60 minutes', 'score out of 75'],
      stat: user && writing ? t('Texts checked: {n}', { n: writing }) : null,
    },
    { id: 'listening', emoji: '🎧', name: 'Listening', color: '#64748b', text: 'Exam-style audio with the same question types and timing.', soon: true },
    { id: 'reading', emoji: '📖', name: 'Reading', color: '#64748b', text: 'Real passage types practised against the clock.', soon: true },
  ];

  return (
    <div className="cefr-hub">
      <JoinBar areaId="cefr" />
      <section className="cefr-hub__head">
        <div>
          <small className="cefr-hub__kicker">🗣️ CEFR Multilevel</small>
          <h1>{user ? `${t(greeting())}, ${(profile?.name || user.name).split(' ')[0]}!` : t('Get the CEFR level you need.')} 👋</h1>
          <p className="muted">{t('Choose a section of the exam to practise.')}</p>
        </div>
        {user && stats.streak > 0 && (
          <div className="cefr-hub__streak" title={t('Days in a row')}>
            🔥 <strong>{stats.streak}</strong>
            <small>{t('day streak')}</small>
          </div>
        )}
      </section>

      <div className="cefr-hub__grid">
        {sections.map((s) =>
          s.soon ? (
            <div key={s.id} className="card cefr-sec is-soon" aria-disabled="true">
              <span className="cefr-sec__emoji" aria-hidden="true">
                {s.emoji}
              </span>
              <h2>{t(s.name)}</h2>
              <p>{t(s.text)}</p>
              <span className="cefr-sec__soon">{t('Coming soon')}</span>
            </div>
          ) : (
            <Link key={s.id} to={s.to} className="card cefr-sec" style={{ '--sc': s.color }}>
              <span className="cefr-sec__emoji" aria-hidden="true">
                {s.emoji}
              </span>
              <h2>{t(s.name)}</h2>
              <p>{t(s.text)}</p>
              <div className="cefr-sec__facts">
                {s.facts.map((f) => (
                  <span key={f}>{t(f)}</span>
                ))}
              </div>
              <div className="cefr-sec__foot">
                {s.stat ? <small>{s.stat}</small> : <span />}
                <span className="cefr-sec__go">{t('Open')} →</span>
              </div>
            </Link>
          ),
        )}
      </div>
    </div>
  );
}
