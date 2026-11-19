// The animated picture on each area homepage. One per area, all drawn in code (no images),
// so they are light, sharp on every screen and follow the area colours.
import { useEffect, useRef, useState } from 'react';
import { useCanvasLoop, rgba, reducedMotion } from './useCanvasLoop.js';
import { skillName, useLang, useT } from '../../i18n/index.js';

/* ---------- CEFR: a live voice ---------- */
function VoiceVisual({ theme }) {
  const t = useT();
  const ref = useCanvasLoop((ctx, { w, h, t: time }) => {
    const cx = w / 2;
    const cy = h / 2;
    const R = Math.min(w, h) * 0.22;

    // Flowing voice waves across the whole picture.
    for (let layer = 0; layer < 3; layer++) {
      ctx.beginPath();
      for (let x = 0; x <= w; x += 4) {
        const k = x / w;
        const env = Math.sin(Math.PI * k) ** 2;
        const y = cy + env * (R * (0.55 - layer * 0.14)) * Math.sin(k * 14 + time * (1.6 + layer * 0.5) + layer) * Math.sin(time * 0.9 + layer * 2 + k * 3);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = rgba(layer === 1 ? theme.accent2 : theme.accent, 0.35 - layer * 0.08);
      ctx.lineWidth = 2 - layer * 0.4;
      ctx.stroke();
    }

    // Rings spreading out, like sound.
    for (let i = 0; i < 4; i++) {
      const p = (time * 0.35 + i / 4) % 1;
      ctx.beginPath();
      ctx.arc(cx, cy, R * (1.05 + p * 1.6), 0, Math.PI * 2);
      ctx.strokeStyle = rgba(theme.accent, 0.35 * (1 - p));
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // A circle of bars that "listens".
    const bars = 72;
    for (let i = 0; i < bars; i++) {
      const a = (i / bars) * Math.PI * 2 - Math.PI / 2;
      const v = 0.25 + 0.75 * Math.abs(Math.sin(i * 0.7 + time * 3.1) * Math.sin(i * 0.23 + time * 1.7));
      const len = R * 0.42 * v;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (R + 6), cy + Math.sin(a) * (R + 6));
      ctx.lineTo(cx + Math.cos(a) * (R + 6 + len), cy + Math.sin(a) * (R + 6 + len));
      ctx.strokeStyle = rgba(i % 2 ? theme.accent : theme.accent2, 0.85);
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // The microphone disc.
    const g = ctx.createRadialGradient(cx, cy - R * 0.3, R * 0.1, cx, cy, R);
    g.addColorStop(0, rgba(theme.accent, 0.95));
    g.addColorStop(1, rgba(theme.bg2, 1));
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.9)';
    ctx.lineWidth = Math.max(3, R * 0.07);
    const mw = R * 0.32;
    const mh = R * 0.62;
    ctx.beginPath();
    ctx.roundRect(cx - mw / 2, cy - mh * 0.75, mw, mh, mw / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy - mh * 0.2, mw * 0.95, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.moveTo(cx, cy + mh * 0.48);
    ctx.lineTo(cx, cy + mh * 0.68);
    ctx.stroke();
  });
  const parts = [
    ['1.1', 'Short questions'],
    ['1.2', 'Compare pictures'],
    ['2', '2-minute talk'],
    ['3', 'Discussion'],
  ];
  return (
    <div className="avis avis--voice">
      <canvas ref={ref} className="avis__canvas" aria-hidden="true" />
      {parts.map(([n, label], i) => (
        <span key={n} className={`avis-bubble avis-bubble--${i}`}>
          <b>{t('Part {n}', { n })}</b> {t(label)}
        </span>
      ))}
    </div>
  );
}

/* ---------- IELTS: the band-score dial ---------- */
const ARC_START = 150;
const ARC_SWEEP = 240;
const polar = (cx, cy, r, deg) => [cx + r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180)];
function arcPath(cx, cy, r, from, to) {
  const [x1, y1] = polar(cx, cy, r, from);
  const [x2, y2] = polar(cx, cy, r, to);
  return `M ${x1} ${y1} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2} ${y2}`;
}

function GaugeVisual({ theme }) {
  const t = useT();
  const fillRef = useRef(null);
  const needleRef = useRef(null);
  const numRef = useRef(null);
  const LEN = (Math.PI * 2 * 150 * ARC_SWEEP) / 360;

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const show = (band) => {
      const k = band / 9;
      if (fillRef.current) fillRef.current.style.strokeDashoffset = String(LEN * (1 - k));
      if (needleRef.current) needleRef.current.setAttribute('transform', `rotate(${ARC_START + ARC_SWEEP * k} 200 210)`);
      if (numRef.current) numRef.current.textContent = (Math.round(band * 2) / 2).toFixed(1);
    };
    if (reducedMotion()) {
      show(7.5);
      return undefined;
    }
    const tick = (now) => {
      // 4.0 → 8.0 in 3 s, hold, then start again (8 s loop).
      const s = ((now - start) / 1000) % 8;
      const p = s < 3.2 ? 1 - Math.pow(1 - s / 3.2, 3) : s < 7.2 ? 1 : 1 - (s - 7.2) / 0.8;
      show(4 + 4 * p);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [LEN]);

  const ticks = Array.from({ length: 10 }, (_, i) => i);
  return (
    <div className="avis avis--gauge">
      <svg viewBox="0 0 400 400" className="avis__svg" aria-hidden="true">
        <defs>
          <linearGradient id="ielts-arc" x1="0" x2="1">
            <stop offset="0" stopColor={theme.steps[1]} />
            <stop offset="0.7" stopColor={theme.accent} />
            <stop offset="1" stopColor={theme.accent2} />
          </linearGradient>
          <pattern id="ielts-dots" width="10" height="10" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.1" fill={rgba(theme.accent, 0.35)} />
          </pattern>
          <clipPath id="ielts-globe">
            <circle cx="200" cy="210" r="112" />
          </clipPath>
        </defs>
        <g clipPath="url(#ielts-globe)" className="avis-spin-slow">
          <rect x="60" y="70" width="280" height="280" fill="url(#ielts-dots)" />
          <ellipse cx="200" cy="210" rx="112" ry="40" fill="none" stroke={rgba(theme.accent, 0.25)} />
          <ellipse cx="200" cy="210" rx="50" ry="112" fill="none" stroke={rgba(theme.accent, 0.25)} />
        </g>
        <path d={arcPath(200, 210, 150, ARC_START, ARC_START + ARC_SWEEP)} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="18" strokeLinecap="round" />
        <path
          ref={fillRef}
          d={arcPath(200, 210, 150, ARC_START, ARC_START + ARC_SWEEP)}
          fill="none"
          stroke="url(#ielts-arc)"
          strokeWidth="18"
          strokeLinecap="round"
          strokeDasharray={LEN}
          strokeDashoffset={LEN}
          className="avis-glow"
        />
        {ticks.map((i) => {
          const deg = ARC_START + (ARC_SWEEP * i) / 9;
          const [x1, y1] = polar(200, 210, 172, deg);
          const [x2, y2] = polar(200, 210, 182, deg);
          const [tx, ty] = polar(200, 210, 196, deg);
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,.4)" strokeWidth="2" />
              <text x={tx} y={ty + 4} textAnchor="middle" className="avis-tick">
                {i}
              </text>
            </g>
          );
        })}
        <g ref={needleRef} transform={`rotate(${ARC_START} 200 210)`}>
          <line x1="200" y1="210" x2="318" y2="210" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
          <circle cx="318" cy="210" r="6" fill={theme.accent2} />
        </g>
        <circle cx="200" cy="210" r="58" fill={theme.bg} stroke={rgba(theme.accent, 0.5)} strokeWidth="2" />
        <text ref={numRef} x="200" y="222" textAnchor="middle" className="avis-band">
          4.0
        </text>
        <text x="200" y="246" textAnchor="middle" className="avis-band-label">
          BAND
        </text>
      </svg>
      <div className="avis-orbit" aria-hidden="true">
        {['Listening', 'Reading', 'Writing', 'Speaking'].map((s, i) => (
          <span key={s} className="avis-orbit__item" style={{ '--i': i }}>
            {/* undo the item's own angle, then keep turning backwards so the text stays upright */}
            <span className="avis-orbit__fix">
              <span className="avis-orbit__spin">
                <span className="avis-orbit__label">{skillName(t, s)}</span>
              </span>
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- SAT: a score that climbs ---------- */
function GraphVisual({ theme }) {
  const numRef = useRef(null);
  useEffect(() => {
    if (reducedMotion()) {
      if (numRef.current) numRef.current.textContent = '1550';
      return undefined;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now) => {
      const s = ((now - start) / 1000) % 7;
      const p = Math.min(1, s / 4);
      const v = 800 + Math.round((750 * (1 - Math.pow(1 - p, 3))) / 10) * 10;
      if (numRef.current) numRef.current.textContent = String(v);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  const pts = [
    [40, 290],
    [100, 262],
    [160, 250],
    [220, 205],
    [280, 168],
    [340, 110],
    [390, 62],
  ];
  const d = pts.map(([x, y], i) => (i ? `L ${x} ${y}` : `M ${x} ${y}`)).join(' ');
  return (
    <div className="avis avis--graph">
      <svg viewBox="0 0 430 340" className="avis__svg" aria-hidden="true">
        <defs>
          <pattern id="sat-grid" width="26" height="26" patternUnits="userSpaceOnUse">
            <path d="M 26 0 L 0 0 0 26" fill="none" stroke={rgba(theme.accent, 0.16)} strokeWidth="1" />
          </pattern>
          <linearGradient id="sat-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={rgba(theme.accent, 0.4)} />
            <stop offset="1" stopColor={rgba(theme.accent, 0)} />
          </linearGradient>
        </defs>
        <rect x="20" y="20" width="390" height="290" fill="url(#sat-grid)" rx="10" />
        <line x1="40" y1="300" x2="405" y2="300" stroke="rgba(255,255,255,.5)" strokeWidth="2" />
        <line x1="40" y1="300" x2="40" y2="30" stroke="rgba(255,255,255,.5)" strokeWidth="2" />
        <path d={`${d} L 390 300 L 40 300 Z`} fill="url(#sat-fill)" className="avis-fade-loop" />
        <path d={d} fill="none" stroke={theme.accent} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" pathLength="1" className="avis-draw-loop avis-glow" />
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="6" fill={i === pts.length - 1 ? theme.accent2 : '#fff'} className="avis-pop-loop" style={{ '--i': i }} />
        ))}
        <text x="56" y="56" className="avis-axis">
          f(x) = ax² + bx + c
        </text>
      </svg>
      <div className="avis-score">
        <span ref={numRef}>800</span>
        <small>SAT</small>
      </div>
      {['√x', 'π', 'Σ', '∫', 'x²', '%'].map((g, i) => (
        <span key={g} className={`avis-glyph avis-glyph--${i}`} aria-hidden="true">
          {g}
        </span>
      ))}
    </div>
  );
}

/* ---------- Languages: a live language-club chat ---------- */
// People from around the world write to the learner, one message at a time, like a real messenger:
// "typing…", then the message; one voice note; the learner ("you") answers now and then.
// Under each foreign message a small line gives its meaning in the visitor's own language.
// (Same idea as the logo: practice is a conversation.)
const CHAT = [
  { who: 'Emma', lang: 'en', text: 'Hi! Ready to practise today?', tr: 'Hi! Ready to practise today?' },
  { you: true, text: 'Yes! Let’s go 🙌' },
  { who: 'Aziz', lang: 'uz', text: 'Salom! Bugun nimani o‘rganamiz?', tr: 'Hi! What are we learning today?' },
  { who: 'Olga', lang: 'ru', text: 'Привет! Давай поговорим по-русски.', tr: "Hi! Let's talk in Russian." },
  { who: 'Minji', lang: 'ko', text: '안녕하세요! 만나서 반가워요.', tr: 'Hello! Nice to meet you.' },
  { you: true, text: 'Nice to meet you too! 😊' },
  { who: 'Emre', lang: 'tr', voice: '0:04', text: 'Merhaba! Nasılsın?', tr: 'Hello! How are you?' },
  { who: 'Lukas', lang: 'de', text: 'Hallo! Wie geht’s dir?', tr: 'Hello! How are you?' },
  { who: 'Layla', lang: 'ar', text: 'مرحبا! كيف حالك؟', tr: 'Hello! How are you?', rtl: true },
  { you: true, text: 'I’m great, thanks! 💬' },
  { who: 'Diego', lang: 'es', text: '¡Hola! ¿Practicamos juntos?', tr: 'Hi! Shall we practise together?' },
];
const PEOPLE_COLORS = { Emma: '#60a5fa', Aziz: '#34d399', Olga: '#f472b6', Minji: '#a78bfa', Emre: '#f87171', Lukas: '#fbbf24', Layla: '#2dd4bf', Diego: '#fb923c' };
const GLYPHS = ['あ', 'Ж', 'ع', '한', 'ñ', 'ß', 'ç', 'ö', '你', 'ğ', 'Ω', 'é', 'ق', 'Я', 'ü', 'ê'];
const TYPING_MS = 1100;
const READ_MS = 1700;
const KEEP = 7;

function ChatVisual() {
  const t = useT();
  const ui = useLang();
  const [items, setItems] = useState(() => (reducedMotion() ? CHAT.slice(0, 5).map((m, i) => ({ id: i, n: i, typing: false })) : []));

  useEffect(() => {
    if (reducedMotion()) return undefined;
    let n = 0;
    let id = 0;
    let timer = 0;
    const next = () => {
      const k = n % CHAT.length;
      const myId = id++;
      // the learner's own messages appear without "typing…" from the other side
      const typing = !CHAT[k].you;
      setItems((list) => [...list, { id: myId, n: k, typing }].slice(-KEEP));
      timer = setTimeout(
        () => {
          setItems((list) => list.map((it) => (it.id === myId ? { ...it, typing: false } : it)));
          n += 1;
          timer = setTimeout(next, READ_MS);
        },
        typing ? TYPING_MS : 250,
      );
    };
    timer = setTimeout(next, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="avis avis--chat">
      {GLYPHS.map((g, i) => (
        <span key={i} className="chat-glyph" aria-hidden="true" style={{ '--i': i }}>
          {g}
        </span>
      ))}
      <div className="chat" aria-hidden="true" translate="no">
        <div className="chat__head">
          <div className="chat__faces">
            {['Emma', 'Aziz', 'Minji', 'Layla'].map((p) => (
              <span key={p} style={{ '--c': PEOPLE_COLORS[p] }}>
                {p[0]}
              </span>
            ))}
          </div>
          <div className="chat__title">
            <b>{t('Language club')}</b>
            <small>
              <i className="chat__online" /> {t('{n} people online', { n: 128 })}
            </small>
          </div>
        </div>
        <div className="chat__list">
          {items.map((it) => {
            const m = CHAT[it.n];
            if (m.you) {
              return (
                <div key={it.id} className="msg msg--you">
                  <div className="msg__bubble">{m.text}</div>
                </div>
              );
            }
            const showTr = m.tr && m.lang !== ui;
            return (
              <div key={it.id} className="msg" style={{ '--c': PEOPLE_COLORS[m.who] }}>
                <span className="msg__face">{m.who[0]}</span>
                <div className={`msg__bubble ${it.typing ? 'is-typing' : ''}`}>
                  <span className="msg__who">
                    {m.who} <em>{m.lang.toUpperCase()}</em>
                  </span>
                  {it.typing ? (
                    <span className="msg__dots">
                      <i />
                      <i />
                      <i />
                    </span>
                  ) : (
                    <>
                      {m.voice && (
                        <span className="msg__voice">
                          <span className="msg__play">▶</span>
                          <span className="msg__wave">
                            {Array.from({ length: 22 }, (_, i) => (
                              <i key={i} style={{ '--h': `${30 + Math.round(70 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)))}%`, '--i': i }} />
                            ))}
                          </span>
                          <small>{m.voice}</small>
                        </span>
                      )}
                      <span className="msg__text" dir={m.rtl ? 'rtl' : 'ltr'} lang={m.lang}>
                        {m.text}
                      </span>
                      {showTr && <span className="msg__tr">{t(m.tr)}</span>}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="chat__input">
          <span>{t('Write a message…')}</span>
          <span className="chat__mic">
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
              <path d="M6 11a6 6 0 0 0 12 0M12 17v4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------- School: a chalkboard that writes itself ---------- */
function ChalkVisual({ theme }) {
  const lines = ['a² + b² = c²', 'E = mc²', '2H₂ + O₂ → 2H₂O', 'F = m · a', 'π ≈ 3.14159', 'for (i = 0; i < n; i++)'];
  return (
    <div className="avis avis--chalk">
      <div className="chalkboard">
        {lines.map((l, i) => (
          <span key={l} className="chalk-line" style={{ '--i': i }}>
            {l}
          </span>
        ))}
        <svg viewBox="0 0 200 200" className="chalk-atom" aria-hidden="true">
          {[0, 60, 120].map((r) => (
            <g key={r} transform={`rotate(${r} 100 100)`}>
              <ellipse cx="100" cy="100" rx="78" ry="28" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="2" />
              <circle r="6" fill={r === 60 ? theme.accent2 : theme.accent}>
                <animateMotion dur={`${2.4 + r / 60}s`} repeatCount="indefinite" path="M 22 100 A 78 28 0 1 1 178 100 A 78 28 0 1 1 22 100" />
              </circle>
            </g>
          ))}
          <circle cx="100" cy="100" r="12" fill={theme.accent} />
        </svg>
        <svg viewBox="0 0 160 130" className="chalk-tri" aria-hidden="true">
          <path d="M 20 110 L 140 110 L 20 20 Z" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="3" pathLength="1" className="avis-draw-loop" />
          <path d="M 20 96 L 34 96 L 34 110" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="2" />
          <text x="6" y="70" className="chalk-small">
            a
          </text>
          <text x="76" y="126" className="chalk-small">
            b
          </text>
          <text x="86" y="58" className="chalk-small">
            c
          </text>
        </svg>
      </div>
    </div>
  );
}

const VISUALS = { voice: VoiceVisual, gauge: GaugeVisual, graph: GraphVisual, greetings: ChatVisual, chalk: ChalkVisual };

export default function AreaVisual({ area }) {
  const V = VISUALS[area.visual] || VoiceVisual;
  return <V theme={area.theme} />;
}
