// "Real app" pictures for the area homepages (CEFR, IELTS, SAT, School), in the same style as the
// Languages chat: one realistic screen in the middle (phone, score report, test window, notebook)
// with small cards hanging on its edges. Each scene plays in a loop; the loop number is used as a
// React key so the CSS animations start again from the beginning every round.
// The older pictures still live in AreaVisual.jsx (switch back there with USE_SCENES).
import { useEffect, useState } from 'react';
import { reducedMotion } from './useCanvasLoop.js';
import { skillName, useT } from '../../i18n/index.js';
import './scenes.css';

// { loop, t }: which round we are in and the seconds since it started (updated 10× a second).
function useLoop(seconds, stillAt) {
  const still = reducedMotion();
  const [state, setState] = useState({ loop: 0, t: still ? stillAt : 0 });
  useEffect(() => {
    if (still) return undefined;
    const start = performance.now();
    const id = setInterval(() => {
      const s = (performance.now() - start) / 1000;
      setState({ loop: Math.floor(s / seconds), t: s % seconds });
    }, 100);
    return () => clearInterval(id);
  }, [seconds, still]);
  return state;
}
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const ease = (k) => 1 - Math.pow(1 - clamp01(k), 3);

const Icon = ({ d, size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
    <path d={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ---------- CEFR: an exam recorder on a phone ---------- */
const CEFR_WORDS = 'I really love visiting Samarkand. The old buildings are amazing, and the food is delicious. On top of that, people there are really friendly.'.split(' ');
const CEFR_SCORES = [
  ['Fluency', 78],
  ['Grammar', 70],
  ['Vocabulary', 84],
  ['Pronunciation', 74],
];
export function RecorderScene() {
  const t = useT();
  const { loop, t: s } = useLoop(13, 12);
  const recording = s < 8.4;
  const shown = Math.floor(clamp01((s - 0.6) / 7.4) * CEFR_WORDS.length);
  const left = Math.max(0, 120 - Math.floor(s * 1));
  const mm = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  return (
    <div className="avis avis--scene">
      <div className="sc-stage sc-stage--phone">
        <div className="sc-phone" aria-hidden="true" translate="no">
          <div className="rec-top">
            <span className="rec-part">{t('Part {n}', { n: '2' })}</span>
            <span className={`rec-timer ${recording ? 'is-live' : ''}`}>
              <i /> {recording ? mm : '1:52'}
            </span>
          </div>
          <div className="rec-q">
            <small>{t('Question')}</small>
            <p lang="en">Describe a place you love to visit. Say where it is, what you do there and why you like it.</p>
          </div>
          <div className={`rec-wave ${recording ? '' : 'is-off'}`}>
            {Array.from({ length: 36 }, (_, i) => (
              <i key={i} style={{ '--h': `${18 + Math.round(82 * Math.abs(Math.sin(i * 0.9) * Math.cos(i * 0.37)))}%`, '--i': i }} />
            ))}
          </div>
          <p className="rec-text" lang="en">
            {CEFR_WORDS.slice(0, shown).join(' ')}
            {recording && <span className="rec-caret" />}
          </p>
          <div className="rec-bottom">
            <span className={`rec-btn ${recording ? 'is-live' : 'is-done'}`}>{recording ? <i /> : '✓'}</span>
            <small>{recording ? t('Recording…') : t('Done')}</small>
          </div>
          <div key={loop} className={`rec-result ${recording ? '' : 'is-in'}`}>
            <div className="rec-result__head">
              <span>
                <small>{t('Estimated level')}</small>
                <b>B2</b>
              </span>
              <span className="rec-badge">AI</span>
            </div>
            {CEFR_SCORES.map(([name, v], i) => (
              <div key={name} className="rec-row">
                <span>{t(name)}</span>
                <span className="rec-bar">
                  <i style={{ '--v': `${v}%`, '--i': i }} />
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="lc-card sc-tl" aria-hidden="true">
          <small>{t('Exam parts')}</small>
          <span className="sc-parts">
            {['1.1', '1.2', '2', '3'].map((p) => (
              <i key={p} className={p === '2' ? 'is-on' : ''}>
                {p}
              </i>
            ))}
          </span>
        </div>
        <div className="lc-card sc-tr" aria-hidden="true">
          <small>{t('AI tip')}</small>
          <span className="sc-tip">
            {t('Try a linking phrase:')} <b lang="en">“On top of that…”</b>
          </span>
        </div>
        <div className="lc-card sc-br" aria-hidden="true">
          <small>{t('Next level')}</small>
          <span className="sc-next">
            <b>B2</b>
            <span className="sc-meter">
              <i style={{ '--v': '72%' }} />
            </span>
            <b>C1</b>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------- IELTS: a practice score report ---------- */
const IELTS_BANDS = [
  ['Listening', 8.0],
  ['Reading', 7.5],
  ['Writing', 6.5],
  ['Speaking', 7.0],
];
export function ReportScene() {
  const t = useT();
  const { loop, t: s } = useLoop(11, 9);
  const band = (from, to, start, dur) => Math.round((from + (to - from) * ease((s - start) / dur)) * 2) / 2;
  const overall = band(5.5, 7.5, 1, 4.2);
  return (
    <div className="avis avis--scene">
      <div className="sc-stage sc-stage--doc">
        <div key={loop} className="sc-doc" aria-hidden="true" translate="no">
          <div className="rep-head">
            <span>
              <b>{t('Practice score report')}</b>
              <small>{t('Academic · Mock test {n}', { n: 4 })}</small>
            </span>
            <span className="rep-overall">
              <small>{t('Overall')}</small>
              <b>{overall.toFixed(1)}</b>
            </span>
          </div>
          <div className="rep-rows">
            {IELTS_BANDS.map(([name, v], i) => (
              <div key={name} className="rep-row" style={{ '--i': i }}>
                <span>{skillName(t, name)}</span>
                <span className="rep-bar">
                  <i style={{ '--v': `${(v / 9) * 100}%` }} />
                </span>
                <b>{band(4, v, 1 + i * 0.7, 1.4).toFixed(1)}</b>
              </div>
            ))}
          </div>
          <div className="rep-foot">
            <span>
              <small>{t('Candidate')}</small>
              <b>{t('You')}</b>
            </span>
            <span>
              <small>{t('Target')}</small>
              <b>7.0</b>
            </span>
          </div>
          <span className="rep-stamp">{t('Target reached')}</span>
        </div>

        <div className="lc-card sc-tl" aria-hidden="true">
          <small>{t('Target band')}</small>
          <span className="sc-big">7.0</span>
        </div>
        <div className="lc-card sc-tr" aria-hidden="true">
          <small>{t('Exam day')}</small>
          <span className="sc-cal">
            <b>23</b>
            <span>{t('days left')}</span>
          </span>
        </div>
        <div className="lc-card sc-br" aria-hidden="true">
          <small>{skillName(t, 'Writing')}</small>
          <span className="sc-up">
            <b>+0.5</b>
            <span>{t('this month')}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------- SAT: a test question being solved ---------- */
const SAT_OPTIONS = [
  ['A', '22'],
  ['B', '26'],
  ['C', '30'],
  ['D', '34'],
];
export function QuestionScene() {
  const t = useT();
  const { loop, t: s } = useLoop(10, 6);
  const picked = s >= 2.6;
  const checked = s >= 3.3;
  const score = Math.round((1210 + 140 * ease((s - 3.3) / 2.2)) / 10) * 10;
  return (
    <div className="avis avis--scene">
      <div className="sc-stage sc-stage--window">
        <div key={loop} className="sc-window" aria-hidden="true" translate="no">
          <div className="q-bar">
            <span>
              <b>{t('Math')}</b> · {t('Module {n}', { n: 2 })}
            </span>
            <span>{t('Question {n} of {m}', { n: 14, m: 22 })}</span>
            <span className="q-time">
              <Icon d="M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" size={14} /> 18:32
            </span>
          </div>
          <div className="q-body">
            <p className="q-text" lang="en">
              If <i>3x</i> + 5 = 20, what is the value of <i>6x</i> − 4?
            </p>
            <div className="q-opts">
              {SAT_OPTIONS.map(([k, v]) => (
                <span key={k} className={`q-opt ${k === 'B' && picked ? 'is-picked' : ''} ${k === 'B' && checked ? 'is-right' : ''}`}>
                  <b>{k}</b> {v}
                  {k === 'B' && checked && <em>✓</em>}
                </span>
              ))}
            </div>
            <div className={`q-why ${checked ? 'is-in' : ''}`} lang="en">
              <b>{t('Why')}</b> 3x = 15, so x = 5. Then 6x − 4 = 30 − 4 = <b>26</b>.
            </div>
          </div>
          <div className="q-foot">
            <span className="q-dots">
              {Array.from({ length: 22 }, (_, i) => (
                <i key={i} className={i < 13 ? 'is-done' : i === 13 ? 'is-now' : ''} />
              ))}
            </span>
            <span className={`q-next ${checked ? 'is-ready' : ''}`}>{t('Next')} →</span>
          </div>
          <svg className="q-cursor" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path d="M5 3l14 7-6 2-2 6z" fill="#fff" stroke="#0b1220" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="lc-card sc-tl" aria-hidden="true">
          <small>{t('Practice score')}</small>
          <span className="sc-big">{score}</span>
        </div>
        <div className="lc-card sc-bl" aria-hidden="true">
          <small lang="en">y = 3x + 5</small>
          <svg viewBox="0 0 120 70" className="sc-graph">
            <path d="M10 60 H112 M10 60 V6" stroke="rgba(255,255,255,.35)" strokeWidth="1.5" fill="none" />
            <path key={loop} d="M12 56 L108 12" stroke="var(--a-accent)" strokeWidth="3" strokeLinecap="round" fill="none" pathLength="1" className="sc-draw" />
          </svg>
        </div>
        <div className="lc-card sc-tr" aria-hidden="true">
          <small>{t('Sections')}</small>
          <span className="sc-split">
            <span>
              {t('Math')} <b>670</b>
            </span>
            <span>
              {t('Reading & Writing')} <b>680</b>
            </span>
          </span>
        </div>
        <div className="lc-card sc-br" aria-hidden="true">
          <span className="sc-row">
            <span className="lc-fire">🔥</span>
            <span>
              <b>{t('{n} in a row', { n: 12 })}</b>
              <small className="sc-sub">{t('correct answers')}</small>
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------- School: a notebook page that writes itself ---------- */
const NOTE_LINES = ['Solve: 2x² − 8 = 0', '2x² = 8', 'x² = 4', 'x = ±2'];
const SUBJECTS = ['Math', 'Physics', 'Chemistry', 'Coding'];
export function NotebookScene() {
  const t = useT();
  const { loop } = useLoop(12, 11);
  return (
    <div className="avis avis--scene">
      <div className="sc-stage sc-stage--paper">
        <div key={loop} className="sc-paper" aria-hidden="true" translate="no">
          <div className="nb-head">
            <span>{t('Algebra — homework')}</span>
            <span>19.11</span>
          </div>
          {NOTE_LINES.map((l, i) => (
            <span key={l} className="nb-line" style={{ '--i': i }} lang="en">
              {l}
            </span>
          ))}
          <svg className="nb-graph" viewBox="0 0 220 130" aria-hidden="true">
            <path d="M10 100 H210 M110 124 V6" className="nb-axis" pathLength="1" />
            <path d="M40 10 C 70 150, 150 150, 180 10" className="nb-curve" pathLength="1" />
            <circle cx="79" cy="100" r="5" className="nb-root" />
            <circle cx="141" cy="100" r="5" className="nb-root" />
            <text x="66" y="120" className="nb-label">−2</text>
            <text x="134" y="120" className="nb-label">2</text>
          </svg>
          <span className="nb-tick">✓</span>
          <span className="nb-grade">5</span>
          <span className="nb-note">{t('Well done!')}</span>
        </div>

        <div className="lc-card sc-tl" aria-hidden="true">
          <small>{t('Subjects')}</small>
          <span className="sc-subjects">
            {SUBJECTS.map((x, i) => (
              <i key={x} style={{ '--i': i }}>
                {t(x)}
              </i>
            ))}
          </span>
        </div>
        <div className="lc-card sc-tr" aria-hidden="true">
          <small>{t('Formula of the day')}</small>
          <span className="sc-formula" lang="en">
            a² + b² = c²
          </span>
        </div>
        <div className="lc-card sc-br sc-cubecard" aria-hidden="true">
          <span className="sc-cube">
            {['f', 'b', 'l', 'r', 't', 'd'].map((f) => (
              <i key={f} className={`sc-cube__${f}`} />
            ))}
          </span>
          <small>{t('Geometry')}</small>
        </div>
      </div>
    </div>
  );
}
