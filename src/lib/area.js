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
