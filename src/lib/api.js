// Data layer. Uses Supabase when it is configured (.env), otherwise a
// "local demo mode" that keeps everything in this browser so the site still works.
import { createClient } from '@supabase/supabase-js';
import { blobToDataUrl } from './image.js';
import { weeklyPoints } from './progress.js';

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const isLocalMode = !URL || !KEY;
// Set VITE_AI_ENABLED=true once the ANTHROPIC_API_KEY secret is added in Supabase.
export const aiEnabled = !isLocalMode && import.meta.env.VITE_AI_ENABLED === 'true';
const supabase = isLocalMode ? null : createClient(URL, KEY);

const MAX_RECORDINGS = 30;
const uuid = () => crypto.randomUUID();

/* ------------------------------------------------------------------ */
/* Supabase implementation                                             */
/* ------------------------------------------------------------------ */
// `area` = the learning area the student chose (cefr, ielts, …); saved on the account itself.
const toUser = (u) =>
  u && { id: u.id, email: u.email, name: u.user_metadata?.full_name || u.email.split('@')[0], area: u.user_metadata?.area || null };

const remote = {
  async getUser() {
    const { data } = await supabase.auth.getSession();
    return toUser(data.session?.user);
  },
  onAuthChange(cb) {
    const { data } = supabase.auth.onAuthStateChange((event, session) => cb(toUser(session?.user), event));
    return () => data.subscription.unsubscribe();
  },
  async signUp({ name, email, password, area }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, ...(area ? { area } : {}) }, emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
    return { user: toUser(data.user), needsConfirmation: !data.session };
  },
  async signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return toUser(data.user);
  },
  async signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
    if (error) throw error;
  },
  async signOut() {
    await supabase.auth.signOut();
  },
  // Choose (or switch) the learning area. The auth listener then delivers the updated user.
  async setArea(area) {
    const { data, error } = await supabase.auth.updateUser({ data: { area } });
    if (error) throw error;
    return toUser(data.user);
  },
  async resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) throw error;
  },
  async updatePassword(password) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  },

  async saveAttempt(attempt, blob, id = uuid()) {
    // Local session check (no network round trip): saving starts at once.
    const uid = await currentUid();
    if (!uid) throw new Error('Please log in again.');
    let recording_path = null;
    if (blob) {
      const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
      recording_path = `${uid}/${id}.${ext}`;
      const { error } = await supabase.storage.from('recordings').upload(recording_path, blob, { contentType: blob.type });
      if (error) {
        console.warn('Recording upload failed', error);
        recording_path = null;
      }
    }
    const { data, error } = await supabase
      .from('attempts')
      .insert({ ...attempt, id, user_id: uid, recording_path })
      .select()
      .single();
    if (error) throw error;
    if (recording_path) pruneRecordings(uid).catch(console.warn);
    return data;
  },
  async listAttempts() {
    // Filter by user: the teacher can read everyone's rows, but "my history" must stay mine.
    const uid = await currentUid();
    const { data, error } = await supabase.from('attempts').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(1000);
    if (error) throw error;
    return data;
  },
  async getRecordingUrl(attempt) {
    if (!attempt.recording_path) return null;
    const { data } = await supabase.storage.from('recordings').createSignedUrl(attempt.recording_path, 3600);
    return data?.signedUrl || null;
  },
  async requestFeedback(attemptId, transcript) {
    const { data, error } = await invokeCoach({ body: { mode: 'feedback', attempt_id: attemptId, transcript } });
    if (error) throw new Error(await readFunctionError(error));
    return data;
  },
  // Without `audio` the server reads the saved recording from storage (no second upload from the phone).
  // If it needs the sound from the browser, the error has code 'need_audio'.
  async transcribe(attemptId, audio, mime = 'audio/wav') {
    const body = { mode: 'transcribe', attempt_id: attemptId };
    if (audio) Object.assign(body, { audio, mime });
    const { data, error } = await invokeCoach({ body }, 60000);
    if (error) {
      const info = await readFunctionInfo(error);
      const e = new Error(info.error);
      e.code = info.code;
      throw e;
    }
    return data;
  },
  // The coach answer arrives word by word: onText(fullTextSoFar) is called as it grows.
  async chat(messages, onText) {
    const { data: auth } = await supabase.auth.getSession();
    const token = auth.session?.access_token;
    if (!token) throw new Error('Please log in again.');
    const controller = new AbortController();
    let timer = setTimeout(() => controller.abort(), 30000);
    let res;
    try {
      res = await fetch(`${URL}/functions/v1/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, apikey: KEY },
        body: JSON.stringify({ mode: 'chat', messages, stream: true }),
        signal: controller.signal,
      });
    } catch {
      clearTimeout(timer);
      throw new Error(navigator.onLine === false ? 'You are offline. Connect to the internet to talk to the coach.' : 'The coach could not be reached. Please try again.');
    }
    if (!res.ok || !res.body) {
      clearTimeout(timer);
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'The coach could not answer. Please try again.');
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let text = '';
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        clearTimeout(timer);
        timer = setTimeout(() => controller.abort(), 20000); // stalled stream
        buffer += decoder.decode(value, { stream: true });
        let nl;
        while ((nl = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (!line) continue;
          const msg = JSON.parse(line);
          if (msg.error) throw new Error(msg.error);
          if (msg.t) {
            text += msg.t;
            onText?.(text);
          }
        }
      }
    } catch (e) {
      if (!text) throw e.name === 'AbortError' ? new Error('The coach is taking too long. Please try again.') : e;
    } finally {
      clearTimeout(timer);
    }
    if (!text.trim()) throw new Error('The coach could not answer that. Try asking in a different way.');
    return text;
  },
  async getModelAnswer({ question_id, part, question_text }) {
    const { data: cached } = await supabase.from('model_answers').select('answer').eq('question_id', question_id).maybeSingle();
    if (cached) return cached.answer;
    const { data, error } = await invokeCoach({ body: { mode: 'model', question_id, part, question_text } });
    if (error) throw new Error(await readFunctionError(error));
    return data.answer;
  },
  async listBookmarks() {
    const { data, error } = await supabase.from('bookmarks').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async addBookmark(b) {
    const { data, error } = await supabase.from('bookmarks').insert(b).select().single();
    if (error) throw error;
    return data;
  },
  async removeBookmark(id) {
    const { error } = await supabase.from('bookmarks').delete().eq('id', id);
    if (error) throw error;
  },
  // Profile (name, photo, role). Falls back to the account data if the profiles table is not set up yet.
  async getProfile(user) {
    const { data } = await supabase.from('profiles').select('id, name, avatar_url, role').eq('id', user.id).maybeSingle();
    return data || { id: user.id, name: user.name, avatar_url: null, role: 'student' };
  },
  async updateProfile(patch) {
    const { data: auth } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('profiles').update(patch).eq('id', auth.user.id).select('id, name, avatar_url, role').single();
    if (error) throw error;
    if (patch.name) await supabase.auth.updateUser({ data: { full_name: patch.name } });
    return data;
  },
  async uploadAvatar(blob) {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user.id;
    const path = `${uid}/avatar-${Date.now()}.jpg`;
    const { error } = await supabase.storage.from('avatars').upload(path, blob, { contentType: 'image/jpeg' });
    if (error) throw error;
    const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
    const profile = await remote.updateProfile({ avatar_url: pub.publicUrl });
    removeOldAvatars(uid, path).catch(console.warn);
    return profile;
  },
  async removeAvatar() {
    const { data: auth } = await supabase.auth.getUser();
    const profile = await remote.updateProfile({ avatar_url: null });
    removeOldAvatars(auth.user.id, null).catch(console.warn);
    return profile;
  },

  async saveGameScore(row) {
    const { data, error } = await supabase.from('game_scores').insert(row).select().single();
    if (error) throw error;
    return data;
  },
  async listGameScores() {
    const uid = await currentUid();
    const { data, error } = await supabase.from('game_scores').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(500);
    if (error) throw error;
    return data;
  },
};

remote.weeklyLeaderboard = async () => {
  const { data, error } = await supabase.rpc('weekly_leaderboard');
  if (error) throw error;
  return data;
};

// Public usage numbers for the main page (works logged-out). Returns zeros if not set up yet.
remote.publicStats = async () => {
  const { data, error } = await supabase.rpc('public_stats');
  if (error) {
    console.warn('public_stats unavailable', error.message);
    return { students: 0, answers: 0, active_week: 0 };
  }
  return data || { students: 0, answers: 0, active_week: 0 };
};

// A question asked from the main page → saved + Telegram alert (via the "contact" function).
// `website` (hidden trap field) and `elapsed` (ms the form was open) help the server spot bots.
remote.submitQuestion = async ({ name, contact, message, website = '', elapsed }) => {
  const { data, error } = await supabase.functions.invoke('contact', { body: { name, contact, message, website, elapsed } });
  if (error) throw new Error(await readFunctionError(error));
  if (data?.error) throw new Error(data.error);
};

// Daily reminder notifications.
remote.savePushSubscription = async (sub) => {
  // A shared phone moves the reminder to whoever turned it on last.
  const { error } = await supabase.rpc('save_push_subscription', { p_endpoint: sub.endpoint, p_p256dh: sub.keys.p256dh, p_auth: sub.keys.auth });
  if (error) throw new Error(notSetUp(error) ? 'Reminders are not switched on for this website yet. Please try again later.' : error.message);
};
// The public push key comes from the "reminders" function (it creates the keys on its first run).
let vapidKey = null;
remote.vapidPublicKey = async () => {
  if (vapidKey) return vapidKey;
  const { data, error } = await supabase.functions.invoke('reminders', { body: { action: 'public-key' } });
  if (error || !data?.publicKey) throw new Error('Reminders are not switched on for this website yet. Please try again later.');
  vapidKey = data.publicKey;
  return vapidKey;
};
remote.deletePushSubscription = async (endpoint) => {
  const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
  if (error) throw error;
};

// Teacher dashboard (row-level security only lets the teacher account read these).
const OVERVIEW_COLS = 'id, user_id, part, question_id, mode, duration_sec, word_count, wpm, scores, created_at';
remote.teacher = {
  async listStudents() {
    const { data, error } = await supabase.from('profiles').select('id, name, avatar_url, role, created_at').eq('role', 'student').order('name');
    if (error) throw error;
    return data;
  },
  async listAttempts(days = 60) {
    const since = new Date(Date.now() - days * 864e5).toISOString();
    const { data, error } = await supabase.from('attempts').select(OVERVIEW_COLS).gte('created_at', since).order('created_at', { ascending: false }).limit(5000);
    if (error) throw error;
    return data;
  },
  async listStudentAttempts(id) {
    const { data, error } = await supabase.from('attempts').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(300);
    if (error) throw error;
    return data;
  },
  async listQuestions() {
    const { data, error } = await supabase.from('site_questions').select('*').order('created_at', { ascending: false }).limit(500);
    if (error) throw notSetUp(error) ? new Error('Questions are not set up yet. Run the latest database update.') : error;
    return data;
  },
  async answerQuestion(id, answer) {
    const { error } = await supabase.from('site_questions').update({ answered: true, answer: answer || null }).eq('id', id);
    if (error) throw error;
  },
  // [{ id, area, joined_at }] for every student (area comes from their login data).
  async studentAreas() {
    const { data, error } = await supabase.rpc('teacher_student_areas');
    if (error) throw notSetUp(error) ? new Error('Area numbers are not set up yet. Run the latest database update (08_student_areas.sql).') : error;
    return data;
  },
};

// The database is missing a table or function (a supabase/migrations file has not been run yet).
const notSetUp = (error) => /schema cache|does not exist|Could not find/i.test(error?.message || '');

async function currentUid() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id;
}

// Call the AI coach, but never wait forever.
async function invokeCoach(options, ms = 60000) {
  const timeout = new Promise((resolve) =>
    setTimeout(() => resolve({ data: null, error: { message: 'The coach is taking too long to answer. Please try again in a minute.' } }), ms),
  );
  return Promise.race([supabase.functions.invoke('feedback', options), timeout]);
}

async function readFunctionInfo(error) {
  try {
    const body = await error.context?.json();
    if (body?.error) return { error: body.error, code: body.code };
  } catch {
    /* fall through */
  }
  return { error: error.message || 'Something went wrong', code: '' };
}

async function readFunctionError(error) {
  try {
    const body = await error.context?.json();
    if (body?.error) return body.error;
  } catch {
    /* fall through */
  }
  return error.message || 'Something went wrong';
}

// Delete every old profile photo except the one in use.
async function removeOldAvatars(uid, keep) {
  const { data } = await supabase.storage.from('avatars').list(uid);
  const old = (data || []).map((f) => `${uid}/${f.name}`).filter((p) => p !== keep);
  if (old.length) await supabase.storage.from('avatars').remove(old);
}

// Keep only the newest MAX_RECORDINGS recordings so storage stays small.
async function pruneRecordings(uid) {
  const { data } = await supabase
    .from('attempts')
    .select('id, recording_path')
    .eq('user_id', uid)
    .not('recording_path', 'is', null)
    .order('created_at', { ascending: false });
  const old = (data || []).slice(MAX_RECORDINGS);
  if (!old.length) return;
  await supabase.storage.from('recordings').remove(old.map((a) => a.recording_path));
  await supabase.from('attempts').update({ recording_path: null }).in('id', old.map((a) => a.id));
}

/* ------------------------------------------------------------------ */
/* Local demo implementation (localStorage + IndexedDB)                */
/* ------------------------------------------------------------------ */
const ls = {
  get(k, d) {
    try {
      return JSON.parse(localStorage.getItem(k)) ?? d;
    } catch {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {
      /* storage full or blocked */
    }
  },
};

function idb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('speakup', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('recordings');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbDo(mode, fn) {
  const db = await idb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('recordings', mode);
    const req = fn(tx.objectStore('recordings'));
    tx.oncomplete = () => resolve(req?.result);
    tx.onerror = () => reject(tx.error);
  });
}

async function hash(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const listeners = new Set();
const currentLocalUser = () => {
  const id = ls.get('su_session', null);
  const users = ls.get('su_users', {});
  const u = Object.values(users).find((x) => x.id === id);
  return u ? { id: u.id, email: u.email, name: u.name, area: u.area || null } : null;
};
const emit = () => listeners.forEach((cb) => cb(currentLocalUser()));
const attemptsKey = () => `su_attempts_${ls.get('su_session', '')}`;

const local = {
  async getUser() {
    return currentLocalUser();
  },
  onAuthChange(cb) {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  },
  async signUp({ name, email, password, area }) {
    const users = ls.get('su_users', {});
    const key = email.trim().toLowerCase();
    if (users[key]) throw new Error('An account with this email already exists on this device.');
    users[key] = { id: uuid(), email: key, name, password: await hash(password), area: area || null };
    ls.set('su_users', users);
    ls.set('su_session', users[key].id);
    emit();
    return { user: currentLocalUser(), needsConfirmation: false };
  },
  async signIn({ email, password }) {
    const u = ls.get('su_users', {})[email.trim().toLowerCase()];
    if (!u || u.password !== (await hash(password))) throw new Error('Invalid email or password.');
    ls.set('su_session', u.id);
    emit();
    return currentLocalUser();
  },
  async signInWithGoogle() {
    throw new Error('Google sign-in works after the site is connected to Supabase.');
  },
  async signOut() {
    ls.set('su_session', null);
    emit();
  },
  async setArea(area) {
    const users = ls.get('su_users', {});
    const u = Object.values(users).find((x) => x.id === ls.get('su_session', null));
    if (!u) throw new Error('Please log in again.');
    u.area = area;
    ls.set('su_users', users);
    emit();
    return currentLocalUser();
  },
  async resetPassword() {
    throw new Error('Password reset emails work after the site is connected to Supabase.');
  },
  async updatePassword() {
    throw new Error('Not available in local demo mode.');
  },

  async saveAttempt(attempt, blob, id = uuid()) {
    const row = { ...attempt, id, user_id: ls.get('su_session'), created_at: new Date().toISOString(), recording_path: null, feedback: null, scores: null };
    if (blob) {
      await idbDo('readwrite', (s) => s.put(blob, row.id));
      row.recording_path = row.id;
    }
    const all = [row, ...ls.get(attemptsKey(), [])];
    const withRec = all.filter((a) => a.recording_path);
    for (const a of withRec.slice(MAX_RECORDINGS)) {
      await idbDo('readwrite', (s) => s.delete(a.recording_path));
      a.recording_path = null;
    }
    ls.set(attemptsKey(), all);
    return row;
  },
  async listAttempts() {
    return ls.get(attemptsKey(), []);
  },
  async getRecordingUrl(attempt) {
    if (!attempt.recording_path) return null;
    const blob = await idbDo('readonly', (s) => s.get(attempt.recording_path));
    return blob ? window.URL.createObjectURL(blob) : null;
  },
  async requestFeedback() {
    throw new Error('AI feedback needs the online server. Your teacher can switch it on (see README).');
  },
  async getModelAnswer() {
    throw new Error('Model answers need the online server. Your teacher can switch it on (see README).');
  },
  async chat() {
    throw new Error('The coach chat needs the online server. Your teacher can switch it on (see README).');
  },
  async transcribe() {
    throw new Error('Automatic transcripts need the online server. You can type what you said instead.');
  },
  async listBookmarks() {
    return ls.get(`su_bm_${ls.get('su_session', '')}`, []);
  },
  async addBookmark(b) {
    const k = `su_bm_${ls.get('su_session', '')}`;
    const row = { ...b, id: uuid(), created_at: new Date().toISOString() };
    ls.set(k, [row, ...ls.get(k, [])]);
    return row;
  },
  async removeBookmark(id) {
    const k = `su_bm_${ls.get('su_session', '')}`;
    ls.set(k, ls.get(k, []).filter((b) => b.id !== id));
  },
  async getProfile(user) {
    const p = ls.get(`su_profile_${user.id}`, {});
    return { id: user.id, name: p.name || user.name, avatar_url: p.avatar_url || null, role: p.role || 'student' };
  },
  async updateProfile(patch) {
    const u = currentLocalUser();
    const k = `su_profile_${u.id}`;
    ls.set(k, { ...ls.get(k, {}), ...patch });
    if (patch.name) {
      const users = ls.get('su_users', {});
      users[u.email].name = patch.name;
      ls.set('su_users', users);
    }
    return local.getProfile(currentLocalUser());
  },
  async uploadAvatar(blob) {
    return local.updateProfile({ avatar_url: await blobToDataUrl(blob) });
  },
  async removeAvatar() {
    return local.updateProfile({ avatar_url: null });
  },
  async saveGameScore(row) {
    const k = `su_games_${ls.get('su_session', '')}`;
    const saved = { ...row, id: uuid(), created_at: new Date().toISOString() };
    ls.set(k, [saved, ...ls.get(k, [])].slice(0, 500));
    return saved;
  },
  async listGameScores() {
    return ls.get(`su_games_${ls.get('su_session', '')}`, []);
  },
};

// Local demo mode: the "class" is every account created in this browser.
const localStudents = () =>
  Object.values(ls.get('su_users', {}))
    .map((u) => ({ ...u, ...ls.get(`su_profile_${u.id}`, {}) }))
    .filter((u) => u.role !== 'teacher')
    .map((u) => ({ id: u.id, name: u.name, avatar_url: u.avatar_url || null, role: 'student', created_at: null }));
local.teacher = {
  listStudents: async () => localStudents(),
  listAttempts: async () => localStudents().flatMap((u) => ls.get(`su_attempts_${u.id}`, [])).sort((x, y) => (x.created_at < y.created_at ? 1 : -1)),
  listStudentAttempts: async (id) => ls.get(`su_attempts_${id}`, []),
  listQuestions: async () => ls.get('su_questions', []),
  answerQuestion: async (id, answer) => ls.set('su_questions', ls.get('su_questions', []).map((q) => (q.id === id ? { ...q, answered: true, answer } : q))),
  studentAreas: async () => {
    const byId = Object.fromEntries(Object.values(ls.get('su_users', {})).map((u) => [u.id, u]));
    return localStudents().map((u) => ({ id: u.id, area: byId[u.id]?.area || 'cefr', joined_at: null }));
  },
};

local.publicStats = async () => {
  const students = localStudents();
  const answers = students.reduce((n, u) => n + ls.get(`su_attempts_${u.id}`, []).length, 0);
  const weekAgo = Date.now() - 7 * 864e5;
  const active = students.filter((u) => ls.get(`su_attempts_${u.id}`, []).some((a) => new Date(a.created_at).getTime() > weekAgo)).length;
  return { students: students.length, answers, active_week: active };
};

local.submitQuestion = async ({ name, contact, message }) => {
  const row = { id: uuid(), name, contact, message, answered: false, answer: null, created_at: new Date().toISOString() };
  ls.set('su_questions', [row, ...ls.get('su_questions', [])].slice(0, 200));
};

// Local demo mode: a leaderboard of the accounts in this browser.
local.weeklyLeaderboard = async () => {
  const me = ls.get('su_session', '');
  const rows = localStudents()
    .map((u) => ({ user_id: u.id, name: u.name, avatar_url: u.avatar_url, points: weeklyPoints(ls.get(`su_attempts_${u.id}`, []), ls.get(`su_games_${u.id}`, [])) }))
    .filter((r) => r.points > 0 || r.user_id === me)
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
  return rows
    .map((r, i) => ({ ...r, rank: rows.findIndex((x) => x.points === r.points) + 1, pos: i + 1, is_me: r.user_id === me }))
    .filter((r) => (r.pos <= 10 && r.points > 0) || r.is_me);
};

local.savePushSubscription = async () => {
  throw new Error('Reminders work after the site is connected to Supabase.');
};
local.deletePushSubscription = async () => {};

export const api = isLocalMode ? local : remote;
