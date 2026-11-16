import { useId } from 'react';
import { BRAND } from '../data/site.js';

// The Zinapoya mark: a staircase (zinapoya = "staircase" in Uzbek) with the learner, a warm
// dot, standing above the top step. Same drawing as public/favicon.svg and the app icons.
export function LogoMark({ size = 38, plain = false }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className="logo__svg" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`g${id}`} x1="12" y1="52" x2="52" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
        <radialGradient id={`b${id}`} cx="0.72" cy="0.28" r="0.95">
          <stop offset="0" stopColor="#16345f" />
          <stop offset="0.55" stopColor="#071328" />
          <stop offset="1" stopColor="#020914" />
        </radialGradient>
      </defs>
      {!plain && <rect width="64" height="64" rx="15" fill={`url(#b${id})`} />}
      <path d="M12 52V44H21V36H30V28H39V20H52V52Z" fill={`url(#g${id})`} stroke={`url(#g${id})`} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M12 44H21M21 36H30M30 28H39M39 20H52" stroke="#fff" strokeOpacity=".55" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="45.5" cy="11.5" r="5.4" fill="#fbbf24" opacity=".35" />
      <circle cx="45.5" cy="11.5" r="3.8" fill="#fcd34d" />
    </svg>
  );
}

// Mark + wordmark "Zinapoya." (the final dot is the accent, like the learner in the mark).
export default function Logo({ size }) {
  return (
    <>
      <span className="logo__mark">
        <LogoMark size={size} />
      </span>
      <span className="logo__text">
        {BRAND}
        <span className="logo__dot">.</span>
      </span>
    </>
  );
}
