// Nena's mind server. Runs her world at 20Hz, her brain on a heartbeat,
// and serves her live state over WebSocket plus a small read-only REST API.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';

const here = path.dirname(fileURLToPath(import.meta.url));
// tiny .env loader (no dependency)
try {
  for (const line of fs.readFileSync(path.join(here, '..', '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !line.trim().startsWith('#') && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
} catch {}

const { PLACES } = await import('../../shared/world.js');
const { World } = await import('./world.js');
const { Life } = await import('../../shared/life.js');
const { WorldLog, FEEDBACK_TAGS } = await import('../../shared/worldlog.js');
const { Memory } = await import('./memory.js');
const { Outbox } = await import('../../shared/outbox.js');
const { HANDS, connected } = await import('./hands.js');
const { Brain } = await import('./brain.js');
const { provider, usage } = await import('./models.js');

const PORT = Number(process.env.PORT || 8787);
const DAY_SECONDS = Number(process.env.DAY_SECONDS || 3600);
const DATA_DIR = path.resolve(here, '..', process.env.DATA_DIR || './data');

// first boot on a fresh volume: copy in her starting character sheet
fs.mkdirSync(DATA_DIR, { recursive: true });
const seed = path.join(here, '..', 'data', 'character.md');
if (!fs.existsSync(path.join(DATA_DIR, 'character.md')) && fs.existsSync(seed)) fs.copyFileSync(seed, path.join(DATA_DIR, 'character.md'));
const memory = new Memory(DATA_DIR);
const life = new Life({ load: () => memory.readJson('life.json', null), save: v => memory.writeJson('life.json', v) });
const world = new World(memory.readJson('state.json', null), DAY_SECONDS, life);
const feed = memory.readJson('feed.json', []);
const sockets = new Set();
const broadcast = msg => { const s = JSON.stringify(msg); for (const ws of sockets) if (ws.readyState === 1) ws.send(s); };

const chat = memory.readJson('chat.json', []);
const log = new WorldLog({ load: () => memory.readJson('world-log.json', null), save: v => memory.writeJson('world-log.json', v) });   // the world diary
const brain = new Brain(world, memory, life, item => {
  feed.push(item); if (feed.length > 200) feed.shift(); log.feed(item, world.view());
  broadcast({ type: 'feed', item });
});

function now() {
  return { name: 'Nena', ...world.view(), heartbeat: world.mood().heartbeat,
    thought: brain.thought, say: Date.now() < brain.sayUntil ? brain.say : null,
    mail: memory.unread().length, mind: { source: brain.lastSource, model: provider().model } };
}

function addChat(item) {
  item = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), at: Date.now(), day: world.day, hour: world.hour, ...item };
  chat.push(item); if (chat.length > 300) chat.shift(); log.chat(item, world.view());
  broadcast({ type: 'chat', item });
}
brain.onChat = addChat;

// ---- the outbox: anything she would do outside the island waits here for the rules, and for you ----
const outbox = new Outbox({ load: () => memory.readJson('outbox.json', null), save: v => memory.writeJson('outbox.json', v),
  onResult: it => brain.outsideResult(it) });
brain.outbox = outbox;
brain.onOutside = (it, view) => log.outside(it, view);
setInterval(() => { outbox.expire(); outbox.dispatch(HANDS).catch(e => console.error('[outbox]', e)); }, 5000);
const creator = req => { const key = process.env.CREATOR_KEY; return !!key && req.headers['x-creator-key'] === key; };
async function body(req, max = 6000) { let b = ''; for await (const c of req) { b += c; if (b.length > max) throw new Error('Too long.'); } return JSON.parse(b || '{}'); }

// ---- loops ---------------------------------------------------------------
let last = Date.now();
setInterval(() => { const t = Date.now(); world.tick(Math.min(0.25, (t - last) / 1000)); last = t; }, 50);
setInterval(() => brain.beat().catch(e => console.error('[brain]', e)), 1000);
setInterval(() => broadcast({ type: 'now', now: now() }), 200);
setInterval(() => log.sample(world.view(), world.activity?.place), 2000);   // the world diary notes each hour
const save = () => { memory.writeJson('state.json', world.snapshot()); memory.writeJson('feed.json', feed); memory.writeJson('chat.json', chat); life.store.save(life.s); log.flush(); };
setInterval(save, 30000);
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { save(); process.exit(0); });

// ---- http ----------------------------------------------------------------
const lastPost = new Map();
const json = (res, code, body) => {
  res.writeHead(code, { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type, x-creator-key', 'access-control-allow-methods': 'GET,POST,OPTIONS' });
  res.end(JSON.stringify(body));
};
const tidy = (s, n) => String(s ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method === 'OPTIONS') return json(res, 204, {});
  if (req.method === 'GET') {
    if (url.pathname === '/api/now') return json(res, 200, now());
    if (url.pathname === '/api/feed') return json(res, 200, feed.slice(-Math.min(200, Number(url.searchParams.get('limit')) || 40)).reverse());
    if (url.pathname === '/api/diary') return json(res, 200, memory.diaryDays(7));
    if (url.pathname === '/api/memory') return json(res, 200, { memories: memory.memories, interests: memory.interests, slots: 24 });
    if (url.pathname === '/api/notes') {
      const name = tidy(url.searchParams.get('name'), 24);
      return json(res, 200, memory.notes.filter(n => n.name === name).slice(-20).reverse().map(({ text, at, read, reply }) => ({ text, at, read, reply })));
    }
    // the noticeboard: every note left for her, and what she said back. Public, newest first.
    if (url.pathname === '/api/chat') return json(res, 200, chat.slice(-120));
    if (url.pathname === '/api/world') {   // the world diary, newest day first, with her own diary and any feedback
      const fb = memory.readJson('world-feedback.json', {});
      return json(res, 200, { days: log.list(Math.min(120, Number(url.searchParams.get('limit')) || 30)).map(d => ({ ...d, diary: memory.today(d.day).slice(0, 2400), feedback: fb[d.day] || null })), tags: FEEDBACK_TAGS, canWrite: !!process.env.CREATOR_KEY });
    }
    if (url.pathname === '/api/board') return json(res, 200, memory.notes.slice(-60).reverse().map(({ name, text, at, read, reply }) => ({ name, text, at, read, reply })));
    if (url.pathname === '/api/life') return json(res, 200, { ...life.summary(), decorList: life.s.decor });
    if (url.pathname === '/api/facts') return json(res, 200, { model: provider(), usage, daySeconds: DAY_SECONDS, bornAt: world.bornAt, visitors: Object.keys(memory.visitors).length });
    if (url.pathname === '/') return json(res, 200, { ok: true, who: 'Nena', see: ['/api/now', '/api/feed', '/api/chat', '/api/board', '/api/diary', '/api/memory', '/api/life', '/api/facts', '/api/world'] });
  }
  // the outbox, for her creator only: what she has asked to do, your answers, and the switches
  if (url.pathname.startsWith('/api/outbox')) {
    if (!creator(req)) return json(res, 403, { error: process.env.CREATOR_KEY ? 'Only her creator can see the outbox.' : 'Set CREATOR_KEY on her mind server to use the outbox.' });
    if (req.method === 'GET' && url.pathname === '/api/outbox') return json(res, 200, { ...outbox.view(120), connected: connected() });
    let d; try { d = await body(req); } catch (e) { return json(res, 400, { error: e.message || 'Bad JSON.' }); }
    if (req.method === 'POST' && url.pathname === '/api/outbox/decide') { const r = outbox.decide(String(d.id || ''), !!d.approve, d.note); if (r.item) log.outside(r.item, world.view()); return json(res, r.error ? 400 : 200, r); }
    if (req.method === 'POST' && url.pathname === '/api/outbox/settings') return json(res, 200, { settings: outbox.setSettings(d) });
    return json(res, 404, { error: 'Not found.' });
  }
  // feedback on a day of the world diary: only Nena's creator, with CREATOR_KEY
  if (req.method === 'POST' && url.pathname === '/api/world/feedback') {
    const key = process.env.CREATOR_KEY;
    if (!key || req.headers['x-creator-key'] !== key) return json(res, 403, { error: 'Only her creator can leave feedback here.' });
    let body = ''; for await (const chunk of req) { body += chunk; if (body.length > 6000) return json(res, 413, { error: 'Too long.' }); }
    let d; try { d = JSON.parse(body); } catch { return json(res, 400, { error: 'Bad JSON.' }); }
    const day = Math.floor(Number(d.day)); if (!day) return json(res, 400, { error: 'Which day?' });
    const fb = memory.readJson('world-feedback.json', {});
    fb[day] = { rating: Math.max(0, Math.min(5, Math.floor(Number(d.rating) || 0))), tags: (Array.isArray(d.tags) ? d.tags : []).filter(t => FEEDBACK_TAGS.includes(t)), note: tidy(d.note, 2000), at: Date.now() };
    memory.writeJson('world-feedback.json', fb);
    return json(res, 200, { ok: true, feedback: fb[day] });
  }
  if (req.method === 'POST' && url.pathname === '/api/notes') {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    if (Date.now() - (lastPost.get(ip) || 0) < 15000) return json(res, 429, { error: 'She is still reading the last one. Try again in a moment.' });
    let body = '';
    for await (const chunk of req) { body += chunk; if (body.length > 4000) return json(res, 413, { error: 'Too long.' }); }
    let data; try { data = JSON.parse(body); } catch { return json(res, 400, { error: 'Bad JSON.' }); }
    const name = tidy(data.name, 24), text = tidy(data.text, 240);
    if (!name || !text) return json(res, 400, { error: 'A name and a message, please.' });
    lastPost.set(ip, Date.now());
    memory.addNote(name, text);
    world.bump(0.15); brain.nudge();
    broadcast({ type: 'mail', count: memory.unread().length });
    return json(res, 200, { ok: true });
  }
  json(res, 404, { error: 'Not found.' });
});

// Visitors: everyone with the page open is a little gull on the island. They can fly
// about (double-click) and wave. Nena notices them; they cannot steer her.
const wss = new WebSocketServer({ server, maxPayload: 2000 });
const visitors = new Map();
let nextId = 1, lastHello = 0;
const publish = () => { world.visitors = [...visitors.values()].slice(0, 24); };
wss.on('connection', ws => {
  sockets.add(ws);
  const id = nextId++, a = Math.random() * 6.283;
  let msgs = 0, windowStart = Date.now();
  ws.send(JSON.stringify({ type: 'hello', you: id, now: now(), feed: feed.slice(-30), chat: chat.slice(-60) }));
  let lastSay = 0;
  ws.on('message', raw => {
    if (Date.now() - windowStart > 1000) { windowStart = Date.now(); msgs = 0; }
    if (++msgs > 6) return;
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (m.type === 'hello' && !visitors.has(id) && visitors.size < 60) {
      const name = String(m.name || '').replace(/[^\p{L}\p{N}]/gu, '').slice(0, 16) || `gull${id}`;
      visitors.set(id, { id, name, x: Math.cos(a) * 5, z: Math.sin(a) * 5, wave: 0 }); publish();
    }
    const v = visitors.get(id); if (!v) return;
    if (m.type === 'move' && Number.isFinite(m.x) && Number.isFinite(m.z) && Math.hypot(m.x, m.z) < 85) { v.x = Math.round(m.x * 10) / 10; v.z = Math.round(m.z * 10) / 10; }
    if (m.type === 'say' && Date.now() - lastSay > 6000) {
      const text = String(m.text || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140);
      if (text) { lastSay = Date.now(); v.say = text; v.sayAt = Date.now(); addChat({ kind: 'visitor', name: v.name, text }); brain.hear(v.name, text); }
    }
    if (m.type === 'wave') { v.wave = Date.now(); world.bump(0.03); if (Date.now() - lastHello > 60000 && !world.isNight) { lastHello = Date.now(); brain.speak(`oh. hello ${v.name}.`, 6000); } }
  });
  const gone = () => { sockets.delete(ws); visitors.delete(id); publish(); };
  ws.on('close', gone); ws.on('error', gone);
});

server.listen(PORT, () => {
  const p = provider();
  console.log(`Nena is awake on http://localhost:${PORT}  (day ${world.day}, mind: ${p.kind === 'none' ? 'scripted fallback, no model key set' : `${p.kind} ${p.model}`})`);
});
