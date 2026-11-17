// The area a visitor picked before having an account (or before Google sign-in, which leaves
// the page). It waits in this browser and is saved on the account right after login (state.jsx).
import { isArea } from '../data/areas.js';

const KEY = 'zp_pending_area';

export function setPendingArea(id) {
  try {
    if (isArea(id)) localStorage.setItem(KEY, id);
    else localStorage.removeItem(KEY);
  } catch {
    /* storage blocked */
  }
}

export function takePendingArea() {
  try {
    const id = localStorage.getItem(KEY);
    localStorage.removeItem(KEY);
    return isArea(id) ? id : null;
  } catch {
    return null;
  }
}

export function peekPendingArea() {
  try {
    const id = localStorage.getItem(KEY);
    return isArea(id) ? id : null;
  } catch {
    return null;
  }
}

// Where to go after logging in (Google and email confirmation leave the site, so it waits here).
// Only paths inside this site are accepted.
const NEXT_KEY = 'zp_next';
export const safePath = (p) => (typeof p === 'string' && p.startsWith('/') && !p.startsWith('//') ? p : null);

export function setNextPath(path) {
  try {
    if (safePath(path)) localStorage.setItem(NEXT_KEY, path);
    else localStorage.removeItem(NEXT_KEY);
  } catch {
    /* storage blocked */
  }
}

export function takeNextPath() {
  try {
    const p = localStorage.getItem(NEXT_KEY);
    localStorage.removeItem(NEXT_KEY);
    return safePath(p);
  } catch {
    return null;
  }
}
