// Which writing tasks this student has already done, remembered on the device so "Random task"
// can prefer new ones without asking the server. Refreshed from the server on the Writing home page.
const KEY = 'zp_wdone';

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') || {};
  } catch {
    return {};
  }
}

/** Set of task ids done for a part ('1.1' | '1.2' | '2'). */
export const readDone = (part) => new Set(readAll()[part] || []);

/** Replace the whole record from a list of attempts ({ part, task_id }). */
export function saveDoneFrom(attempts) {
  const all = {};
  for (const a of attempts) {
    const list = (all[a.part] ||= []);
    if (!list.includes(a.task_id)) list.push(a.task_id);
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* storage blocked */
  }
}

/** Add one finished task. */
export function markDone(part, taskId) {
  const all = readAll();
  const list = all[part] || [];
  if (!list.includes(taskId)) all[part] = [...list, taskId];
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* storage blocked */
  }
}
