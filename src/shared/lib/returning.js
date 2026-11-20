// Remembers that someone has already had an account on this device (they logged in or signed up here once).
// A first-time visitor is offered "Start free / Register"; a returning one gets "Log in" first,
// so nobody is pushed to register a second account.
import { useSyncExternalStore } from 'react';

const KEY = 'zp_has_account';
const listeners = new Set();

function read() {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

let known = read();

export function markReturning() {
  if (known) return;
  known = true;
  try {
    localStorage.setItem(KEY, '1');
  } catch {
    /* storage blocked */
  }
  listeners.forEach((l) => l());
}

const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useReturning() {
  return useSyncExternalStore(subscribe, () => known, () => false);
}
