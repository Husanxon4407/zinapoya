import { useId } from 'react';
import { BRAND } from '../data/site.js';

// The Zinapoya mark: a "Z" whose diagonal is a staircase (zinapoya = "staircase" in Uzbek),
// climbing from the bottom bar to the top one, where the learner (the warm dot) stands.
// Same drawing as public/favicon.svg and the app icons.
const Z = 'M13 21H51V27H45V33H39V39H33V45H51V51H13V45H19V39H25V33H31V27H13Z';

export function LogoMark({ size = 38, plain = false }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className="logo__svg" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`g${id}`} x1="12" y1="54" x2="52" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset=".55" stopColor="#3b9cf5" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient id={`d${id}`} x1="12" y1="54" x2="52" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2a2580" />
          <stop offset="1" stopColor="#0b5f7a" />
        </linearGradient>
        <radialGradient id={`b${id}`} cx="0.72" cy="0.25" r="1">
          <stop offset="0" stopColor="#173a66" />
          <stop offset="0.55" stopColor="#081530" />
          <stop offset="1" stopColor="#030a18" />
        </radialGradient>
      </defs>
      {!plain && <rect width="64" height="64" rx="15" fill={`url(#b${id})`} />}
      <path transform="translate(1.6 2.2)" d={Z} fill={`url(#d${id})`} stroke={`url(#d${id})`} strokeWidth="2.2" strokeLinejoin="round" />
      <path d={Z} fill={`url(#g${id})`} stroke={`url(#g${id})`} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M13.5 45H19M19.5 39H25M25.5 33H31M31.5 27H38M13.5 21H50.5" stroke="#fff" strokeOpacity=".65" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="44" cy="13.5" r="5.8" fill="#fbbf24" opacity=".28" />
      <circle cx="44" cy="13.5" r="3.8" fill="#fcd34d" />
    </svg>
  );
}

// Mark + wordmark "Zinapoya." (the final dot is the learner's colour).
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
