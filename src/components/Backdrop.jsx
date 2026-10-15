// Decorative background about speaking & listening: microphones, headphones,
// speech bubbles, sound waves… drawn as soft pastel line art and gently animated.
// Pure SVG + CSS, hidden from screen readers, behind all content.

const G = {
  indigo: ['#818cf8', '#c084fc'],
  cyan: ['#67e8f9', '#818cf8'],
  coral: ['#fda4af', '#fcd34d'],
  mint: ['#6ee7b7', '#67e8f9'],
};

function Grad({ id, c }) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={c[0]} />
        <stop offset="1" stopColor={c[1]} />
      </linearGradient>
    </defs>
  );
}

const line = (id) => ({ fill: 'none', stroke: `url(#${id})`, strokeWidth: 5, strokeLinecap: 'round', strokeLinejoin: 'round' });

function Mic({ id, c }) {
  return (
    <svg viewBox="0 0 120 120">
      <Grad id={id} c={c} />
      <rect x="42" y="12" width="36" height="58" rx="18" fill={`url(#${id})`} opacity="0.35" />
      <rect x="42" y="12" width="36" height="58" rx="18" {...line(id)} />
      <path d="M30 56a30 30 0 0 0 60 0M60 86v18M44 106h32" {...line(id)} />
      <path d="M50 30h20M50 42h20" {...line(id)} strokeWidth="3" opacity="0.7" />
    </svg>
  );
}

function Headphones({ id, c }) {
  return (
    <svg viewBox="0 0 120 120">
      <Grad id={id} c={c} />
      <path d="M22 74V62a38 38 0 0 1 76 0v12" {...line(id)} />
      <rect x="14" y="66" width="22" height="36" rx="9" fill={`url(#${id})`} opacity="0.4" />
      <rect x="84" y="66" width="22" height="36" rx="9" fill={`url(#${id})`} opacity="0.4" />
      <rect x="14" y="66" width="22" height="36" rx="9" {...line(id)} strokeWidth="4" />
      <rect x="84" y="66" width="22" height="36" rx="9" {...line(id)} strokeWidth="4" />
    </svg>
  );
}

function Bubble({ id, c, text }) {
  return (
    <svg viewBox="0 0 140 110">
      <Grad id={id} c={c} />
      <path d="M20 12h100a12 12 0 0 1 12 12v44a12 12 0 0 1-12 12H58l-24 20v-20H20A12 12 0 0 1 8 68V24a12 12 0 0 1 12-12Z" fill={`url(#${id})`} opacity="0.3" />
      <path d="M20 12h100a12 12 0 0 1 12 12v44a12 12 0 0 1-12 12H58l-24 20v-20H20A12 12 0 0 1 8 68V24a12 12 0 0 1 12-12Z" {...line(id)} strokeWidth="4" />
      <text x="70" y="55" textAnchor="middle" fontFamily="Nunito, sans-serif" fontWeight="900" fontSize="26" fill={`url(#${id})`}>
        {text}
      </text>
    </svg>
  );
}

function TypingBubble({ id, c }) {
  return (
    <svg viewBox="0 0 120 100">
      <Grad id={id} c={c} />
      <path d="M100 10H20A12 12 0 0 0 8 22v38a12 12 0 0 0 12 12h50l22 18V72h8a12 12 0 0 0 12-12V22a12 12 0 0 0-12-12Z" fill={`url(#${id})`} opacity="0.3" />
      <path d="M100 10H20A12 12 0 0 0 8 22v38a12 12 0 0 0 12 12h50l22 18V72h8a12 12 0 0 0 12-12V22a12 12 0 0 0-12-12Z" {...line(id)} strokeWidth="4" />
      {[38, 60, 82].map((x, i) => (
        <circle key={x} className="typing-dot" style={{ animationDelay: `${i * 0.25}s` }} cx={x} cy="41" r="7" fill={`url(#${id})`} />
      ))}
    </svg>
  );
}

function Equalizer({ id, c }) {
  return (
    <svg viewBox="0 0 120 100">
      <Grad id={id} c={c} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect key={i} className="eq-bar" style={{ animationDelay: `${i * -0.18}s` }} x={8 + i * 16} y="10" width="10" height="80" rx="5" fill={`url(#${id})`} />
      ))}
    </svg>
  );
}

function Waveform({ id, c }) {
  return (
    <svg viewBox="0 0 220 80">
      <Grad id={id} c={c} />
      <path className="wave-line" d="M0 40 Q 14 8 28 40 T 56 40 T 84 40 T 112 40 T 140 40 T 168 40 T 196 40 T 224 40" {...line(id)} strokeWidth="5" />
      <path d="M0 40 Q 14 64 28 40 T 56 40 T 84 40 T 112 40 T 140 40 T 168 40 T 196 40 T 224 40" {...line(id)} strokeWidth="3" opacity="0.45" />
    </svg>
  );
}

function Book({ id, c }) {
  return (
    <svg viewBox="0 0 130 100">
      <Grad id={id} c={c} />
      <path d="M65 22C50 12 28 10 10 14v66c18-4 40-2 55 8 15-10 37-12 55-8V14c-18-4-40-2-55 8Z" fill={`url(#${id})`} opacity="0.3" />
      <path d="M65 22C50 12 28 10 10 14v66c18-4 40-2 55 8 15-10 37-12 55-8V14c-18-4-40-2-55 8ZM65 22v66" {...line(id)} strokeWidth="4" />
      <path d="M24 32h28M24 44h28M78 32h28M78 44h28M78 56h20" {...line(id)} strokeWidth="3" opacity="0.6" />
    </svg>
  );
}

function PlayRipple({ id, c }) {
  return (
    <svg viewBox="0 0 120 120">
      <Grad id={id} c={c} />
      <circle className="ripple" cx="60" cy="60" r="26" {...line(id)} strokeWidth="3" />
      <circle className="ripple" style={{ animationDelay: '-1.3s' }} cx="60" cy="60" r="26" {...line(id)} strokeWidth="3" />
      <circle cx="60" cy="60" r="26" fill={`url(#${id})`} opacity="0.45" />
      <path d="M53 47v26l21-13Z" fill={`url(#${id})`} />
    </svg>
  );
}

const ITEMS = [
  { C: Mic, c: G.indigo, top: '10%', left: '3%', w: 110, anim: 'geoFloat', dur: 9 },
  { C: Headphones, c: G.coral, top: '12%', left: '87%', w: 120, anim: 'geoTilt', dur: 12 },
  { C: Bubble, c: G.cyan, text: 'Hello!', top: '55%', left: '1%', w: 150, anim: 'bubblePop', dur: 7 },
  { C: TypingBubble, c: G.mint, top: '66%', left: '87%', w: 120, anim: 'geoFloat', dur: 10 },
  { C: Equalizer, c: G.indigo, top: '40%', left: '92%', w: 90, anim: 'none', dur: 1 },
  { C: Waveform, c: G.cyan, top: '86%', left: '20%', w: 220, anim: 'geoDrift', dur: 18 },
  { C: Book, c: G.coral, top: '33%', left: '7%', w: 100, anim: 'geoTilt', dur: 14 },
  { C: PlayRipple, c: G.mint, top: '4%', left: '60%', w: 80, anim: 'none', dur: 1 },
  { C: Bubble, c: G.coral, text: 'ABC', top: '84%', left: '72%', w: 110, anim: 'bubblePop', dur: 9 },
];

export default function Backdrop() {
  return (
    <div className="backdrop" aria-hidden>
      <span className="glow glow--1" />
      <span className="glow glow--2" />
      <span className="glow glow--3" />
      {ITEMS.map(({ C, c, text, top, left, w, anim, dur }, i) => (
        <div
          key={i}
          className="geo"
          style={{ top, left, width: w, animationName: anim, animationDuration: `${dur}s`, animationDelay: `${-i * 1.7}s` }}
        >
          <C id={`bd-${i}`} c={c} text={text} />
        </div>
      ))}
    </div>
  );
}
