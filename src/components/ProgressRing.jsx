export default function ProgressRing({ value, max, color, size = 64 }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const frac = max ? Math.min(1, value / max) : 0;
  return (
    <svg className="progress-ring" width={size} height={size} viewBox="0 0 64 64" aria-label={`${value} of ${max}`}>
      <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="7" />
      <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - frac)} transform="rotate(-90 32 32)" />
      <text x="32" y="36" textAnchor="middle" fontSize="13" fontWeight="800" fill={color}>
        {Math.round(frac * 100)}%
      </text>
    </svg>
  );
}
