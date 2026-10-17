// Installable app (PWA) and daily reminder notifications.
import { useEffect, useState } from 'react';
import { api, isLocalMode } from './api.js';


export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch((e) => console.warn('Service worker failed', e)));
}

/* ---------- Install ---------- */
let deferredPrompt = null;
const listeners = new Set();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // show our own button instead of the browser's mini bar
    deferredPrompt = e;
    listeners.forEach((l) => l());
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    listeners.forEach((l) => l());
  });
}

export const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// 'installed' | 'prompt' (we can show the browser's install dialog) | 'ios' (needs manual steps) | 'none'
export function useInstall() {
  const get = () => (isStandalone() ? 'installed' : deferredPrompt ? 'prompt' : isIOS() ? 'ios' : 'none');
  const [state, setState] = useState(get);
  useEffect(() => {
    const l = () => setState(get());
    listeners.add(l);
    return () => listeners.delete(l);
  }, []);
  async function install() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    setState(get());
  }
  return { state, install };
}

/* ---------- Daily reminder (web push) ---------- */
export const pushSupported = () =>
  !isLocalMode && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

async function registration() {
  return navigator.serviceWorker.getRegistration('/') || navigator.serviceWorker.register('/sw.js');
}

export async function currentSubscription() {
  if (!pushSupported()) return null;
  const reg = await registration();
  return reg ? reg.pushManager.getSubscription() : null;
}

function keyToBytes(base64) {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export async function enableReminders() {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notifications are blocked. Allow them in your browser settings for this site, then try again.');
  const reg = await registration();
  await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(await api.vapidPublicKey()) }));
  try {
    await api.savePushSubscription(sub.toJSON());
  } catch (e) {
    // Not saved on the server, so don't leave the switch looking "on".
    await sub.unsubscribe().catch(() => {});
    throw e;
  }
}

export async function disableReminders() {
  const sub = await currentSubscription();
  if (!sub) return;
  await api.deletePushSubscription(sub.endpoint).catch(() => {});
  await sub.unsubscribe();
}
