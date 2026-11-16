// The animated picture on each area homepage. One per area, all drawn in code (no images),
// so they are light, sharp on every screen and follow the area colours.
import { useEffect, useRef } from 'react';
import { useCanvasLoop, rgba, reducedMotion } from './useCanvasLoop.js';
import { skillName, useT } from '../../i18n/index.js';

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

/* ---------- Languages: a globe that says hello ---------- */
// Greetings spread evenly around the globe (not at their real countries, which would crowd Europe).
const HELLO_WORDS = ['Hello', 'Salom', 'Привет', '안녕하세요', 'Merhaba', 'Hallo', 'مرحبا', 'Bonjour', 'Hola', 'こんにちは', '你好', 'नमस्ते', 'Olá', 'Ciao', 'Jambo', 'Sawubona'];
const HELLOS = HELLO_WORDS.map((w, i) => [w, [-38, 8, 42, -12, 28, -30, 52, 0][i % 8], (i * 360) / HELLO_WORDS.length + (i % 2) * 11]);
function GreetingsVisual({ theme }) {
  const ref = useCanvasLoop((ctx, { w, h, t }) => {
    const cx = w / 2;
    const cy = h / 2;
    const R = Math.min(w, h) * 0.36;
    const rot = t * 0.22;
    const tilt = 0.38;
    const project = (lat, lon) => {
      const la = (lat * Math.PI) / 180;
      const lo = (lon * Math.PI) / 180 + rot;
      const x = Math.cos(la) * Math.sin(lo);
      const y = Math.sin(la);
      const z = Math.cos(la) * Math.cos(lo);
      // tilt around the x axis
      const y2 = y * Math.cos(tilt) - z * Math.sin(tilt);
      const z2 = y * Math.sin(tilt) + z * Math.cos(tilt);
      return [cx + x * R, cy - y2 * R, z2];
    };
    // Glow behind the globe.
    const g = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.5);
    g.addColorStop(0, rgba(theme.accent, 0.22));
    g.addColorStop(1, rgba(theme.accent, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // Dots on the sphere.
    for (let lat = -80; lat <= 80; lat += 10) {
      const step = 360 / Math.max(8, Math.round(36 * Math.cos((lat * Math.PI) / 180)));
      for (let lon = 0; lon < 360; lon += step) {
        const [x, y, z] = project(lat, lon);
        if (z < -0.05) continue;
        ctx.beginPath();
        ctx.arc(x, y, 1.2 + z * 1.3, 0, Math.PI * 2);
        ctx.fillStyle = rgba(theme.accent, 0.15 + z * 0.6);
        ctx.fill();
      }
    }
    // Outline.
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = rgba(theme.accent, 0.35);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Greetings on the front side.
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    HELLOS.forEach(([word, lat, lon], i) => {
      const [x, y, z] = project(lat, lon);
      if (z < 0.15) return;
      const a = Math.min(1, (z - 0.15) / 0.35);
      const size = 11 + z * 9;
      ctx.font = `700 ${size}px Manrope, system-ui, sans-serif`;
      const tw = ctx.measureText(word).width + 18;
      ctx.fillStyle = rgba(theme.bg, 0.75 * a);
      ctx.strokeStyle = rgba(i % 3 === 0 ? theme.accent2 : theme.accent, 0.8 * a);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(x - tw / 2, y - size * 0.85, tw, size * 1.7, size);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fillText(word, x, y + 1);
    });
  });
  return (
    <div className="avis avis--greetings">
      <canvas ref={ref} className="avis__canvas" aria-hidden="true" />
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

const VISUALS = { voice: VoiceVisual, gauge: GaugeVisual, graph: GraphVisual, greetings: GreetingsVisual, chalk: ChalkVisual };

export default function AreaVisual({ area }) {
  const V = VISUALS[area.visual] || VoiceVisual;
  return <V theme={area.theme} />;
}
