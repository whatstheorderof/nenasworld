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
const { Memory } = await import('./memory.js');
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
const world = new World(memory.readJson('state.json', null), DAY_SECONDS);
const feed = memory.readJson('feed.json', []);
const sockets = new Set();
const broadcast = msg => { const s = JSON.stringify(msg); for (const ws of sockets) if (ws.readyState === 1) ws.send(s); };

const brain = new Brain(world, memory, item => {
  feed.push(item); if (feed.length > 200) feed.shift();
  broadcast({ type: 'feed', item });
});

function now() {
  const mood = world.mood(), a = world.activity;
  return {
    name: 'Nena', day: world.day, hour: world.hour, night: world.isNight, weather: world.weather,
    pos: world.pos, heading: world.heading,
    activity: a ? { action: a.action, label: a.phase === 'walking' && a.place ? `walking to the ${PLACES[a.place].label.toLowerCase()}` : a.label, place: a.place, phase: a.phase, detail: a.detail, progress: a.phase === 'doing' ? 1 - a.left / a.dur : 0 } : { action: 'idle', label: 'thinking', phase: 'idle' },
    needs: world.needs, mood: mood.label, heartbeat: mood.heartbeat,
    thought: brain.thought, say: Date.now() < brain.sayUntil ? brain.say : null,
    mail: memory.unread().length,
    mind: { source: brain.lastSource, model: provider().model },
  };
}

// ---- loops ---------------------------------------------------------------
let last = Date.now();
setInterval(() => { const t = Date.now(); world.tick(Math.min(0.25, (t - last) / 1000)); last = t; }, 50);
setInterval(() => brain.beat().catch(e => console.error('[brain]', e)), 1000);
setInterval(() => broadcast({ type: 'now', now: now() }), 200);
const save = () => { memory.writeJson('state.json', world.snapshot()); memory.writeJson('feed.json', feed); };
setInterval(save, 30000);
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { save(); process.exit(0); });

// ---- http ----------------------------------------------------------------
const lastPost = new Map();
const json = (res, code, body) => {
  res.writeHead(code, { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'GET,POST,OPTIONS' });
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
    if (url.pathname === '/api/facts') return json(res, 200, { model: provider(), usage, daySeconds: DAY_SECONDS, bornAt: world.bornAt, visitors: Object.keys(memory.visitors).length });
    if (url.pathname === '/') return json(res, 200, { ok: true, who: 'Nena', see: ['/api/now', '/api/feed', '/api/diary', '/api/memory', '/api/facts'] });
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

const wss = new WebSocketServer({ server });
wss.on('connection', ws => {
  sockets.add(ws);
  ws.send(JSON.stringify({ type: 'hello', now: now(), feed: feed.slice(-30) }));
  ws.on('close', () => sockets.delete(ws));
  ws.on('error', () => sockets.delete(ws));
});

server.listen(PORT, () => {
  const p = provider();
  console.log(`Nena is awake on http://localhost:${PORT}  (day ${world.day}, mind: ${p.kind === 'none' ? 'scripted fallback, no model key set' : `${p.kind} ${p.model}`})`);
});
