// Decorative background: soft pastel geometric shapes (prisms, cubes, hexagons,
// rings…) that slowly float and rotate behind the page. Pure SVG + CSS.

function Defs() {
  return (
    <defs>
      <linearGradient id="g-indigo" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#818cf8" />
        <stop offset="1" stopColor="#c084fc" />
      </linearGradient>
      <linearGradient id="g-cyan" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#67e8f9" />
        <stop offset="1" stopColor="#818cf8" />
      </linearGradient>
      <linearGradient id="g-coral" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fda4af" />
        <stop offset="1" stopColor="#fcd34d" />
      </linearGradient>
      <linearGradient id="g-mint" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#6ee7b7" />
        <stop offset="1" stopColor="#67e8f9" />
      </linearGradient>
    </defs>
  );
}

// A 3D triangular prism: front face, top face and side face in three shades.
function Prism({ g }) {
  return (
    <svg viewBox="0 0 120 120">
      <Defs />
      <polygon points="20,95 60,25 60,25 60,95" fill={`url(#${g})`} opacity="0.55" />
      <polygon points="60,25 100,40 100,105 60,95" fill={`url(#${g})`} opacity="0.3" />
      <polygon points="20,95 60,95 100,105 60,108" fill={`url(#${g})`} opacity="0.2" />
      <polyline points="20,95 60,25 100,40 100,105 60,95 20,95" fill="none" stroke={`url(#${g})`} strokeWidth="2" strokeLinejoin="round" />
      <line x1="60" y1="25" x2="60" y2="95" stroke={`url(#${g})`} strokeWidth="2" />
    </svg>
  );
}

function Cube({ g }) {
  return (
    <svg viewBox="0 0 120 120">
      <Defs />
      <polygon points="60,15 100,37 60,59 20,37" fill={`url(#${g})`} opacity="0.5" />
      <polygon points="20,37 60,59 60,105 20,83" fill={`url(#${g})`} opacity="0.32" />
      <polygon points="100,37 60,59 60,105 100,83" fill={`url(#${g})`} opacity="0.18" />
      <path d="M60 15 100 37 100 83 60 105 20 83 20 37Z M20 37 60 59 100 37 M60 59 60 105" fill="none" stroke={`url(#${g})`} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function Hexagon({ g }) {
  return (
    <svg viewBox="0 0 120 120">
      <Defs />
      <polygon points="60,8 105,34 105,86 60,112 15,86 15,34" fill="none" stroke={`url(#${g})`} strokeWidth="3" />
      <polygon points="60,30 86,45 86,75 60,90 34,75 34,45" fill={`url(#${g})`} opacity="0.25" />
    </svg>
  );
}

function Diamond({ g }) {
  return (
    <svg viewBox="0 0 120 120">
      <Defs />
      <polygon points="60,6 110,60 60,114 10,60" fill={`url(#${g})`} opacity="0.35" />
      <polygon points="60,6 110,60 60,60" fill="#fff" opacity="0.25" />
      <polygon points="60,6 110,60 60,114 10,60" fill="none" stroke={`url(#${g})`} strokeWidth="2.5" />
    </svg>
  );
}

function Ring({ g }) {
  return (
    <svg viewBox="0 0 120 120">
      <Defs />
      <circle cx="60" cy="60" r="48" fill="none" stroke={`url(#${g})`} strokeWidth="10" opacity="0.6" />
      <circle cx="60" cy="60" r="48" fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="6 10" opacity="0.5" />
    </svg>
  );
}

function Triangle({ g }) {
  return (
    <svg viewBox="0 0 120 120">
      <Defs />
      <polygon points="60,10 110,100 10,100" fill={`url(#${g})`} opacity="0.4" />
      <polygon points="60,10 110,100 10,100" fill="none" stroke={`url(#${g})`} strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

function Dots({ g }) {
  const dots = [];
  for (let x = 0; x < 6; x++) for (let y = 0; y < 6; y++) dots.push(<circle key={`${x}-${y}`} cx={10 + x * 20} cy={10 + y * 20} r="3" fill={`url(#${g})`} />);
  return (
    <svg viewBox="0 0 120 120">
      <Defs />
      {dots}
    </svg>
  );
}

function Plus({ g }) {
  return (
    <svg viewBox="0 0 120 120">
      <Defs />
      <path d="M50 10h20v40h40v20H70v40H50V70H10V50h40Z" fill={`url(#${g})`} opacity="0.5" />
    </svg>
  );
}

const SHAPES = [
  { C: Prism, g: 'g-indigo', top: '9%', left: '4%', size: 150, anim: 'geoFloat', dur: 18 },
  { C: Hexagon, g: 'g-cyan', top: '62%', left: '2%', size: 120, anim: 'geoSpin', dur: 60 },
  { C: Cube, g: 'g-coral', top: '14%', left: '86%', size: 130, anim: 'geoTilt', dur: 22 },
  { C: Ring, g: 'g-mint', top: '70%', left: '88%', size: 140, anim: 'geoSpin', dur: 45 },
  { C: Diamond, g: 'g-indigo', top: '42%', left: '93%', size: 70, anim: 'geoFloat', dur: 14 },
  { C: Triangle, g: 'g-coral', top: '84%', left: '30%', size: 80, anim: 'geoTilt', dur: 20 },
  { C: Dots, g: 'g-cyan', top: '30%', left: '12%', size: 110, anim: 'geoDrift', dur: 26 },
  { C: Plus, g: 'g-mint', top: '6%', left: '55%', size: 48, anim: 'geoSpin', dur: 30 },
  { C: Prism, g: 'g-mint', top: '78%', left: '62%', size: 100, anim: 'geoFloat', dur: 24 },
  { C: Diamond, g: 'g-coral', top: '48%', left: '-2%', size: 60, anim: 'geoTilt', dur: 16 },
];

export default function Backdrop() {
  return (
    <div className="backdrop" aria-hidden>
      <span className="glow glow--1" />
      <span className="glow glow--2" />
      <span className="glow glow--3" />
      {SHAPES.map(({ C, g, top, left, size, anim, dur }, i) => (
        <div
          key={i}
          className="geo"
          style={{ top, left, width: size, height: size, animationName: anim, animationDuration: `${dur}s`, animationDelay: `${-i * 3}s` }}
        >
          <C g={g} />
        </div>
      ))}
    </div>
  );
}
