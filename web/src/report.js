// Tell us when something breaks in a visitor's browser: uncaught errors go to /api/report (see api/report.js),
// at most a few per visit, never the same one twice, and never from a local copy of the site.
const sent = new Set(); let count = 0;
const local = /^(localhost|127\.|\[::1\])/.test(location.hostname);
let gpu = '';
export function setGpu(name) { gpu = name || ''; }
export function report(msg, stack = '', where = '') {
  const key = `${msg}|${where}`; if (local || sent.has(key) || count >= 5) return; sent.add(key); count++;
  const body = JSON.stringify({ msg: String(msg).slice(0, 300), stack: String(stack).slice(0, 1500), where, page: location.pathname + location.search, build: import.meta.env.MODE, gpu });
  try { if (!navigator.sendBeacon?.('/api/report', new Blob([body], { type: 'application/json' }))) fetch('/api/report', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {}); } catch {}
}
addEventListener('error', e => { if (e.error || e.message) report(e.message || 'error', e.error?.stack, `${(e.filename || '').split('/').pop()}:${e.lineno}:${e.colno}`); });
addEventListener('unhandledrejection', e => { const r = e.reason; report(r?.message || String(r), r?.stack, 'promise'); });
