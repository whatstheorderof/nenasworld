// A stand-in mind that runs in the visitor's browser when Nena's real mind server
// cannot be reached. Same world rules and the same scripted chooser; state is kept
// in this browser only, so every visitor gets their own copy and nobody shares her.
import { World } from '../../mind/src/world.js';
import { Life } from '../../shared/life.js';
import { chooseFallback } from '../../shared/choose.js';
import { scriptedReply } from '../../shared/chat.js';

const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export function startLocalMind(onFeed, onChat = () => {}) {
  const life = new Life({ load: () => load('nena-life', null), save: v => save('nena-life', v) });
  const world = new World(load('nena-world', null), 3600, life);
  const recent = [], feed = load('nena-feed', []), chat = load('nena-chat', []);
  const addChat = item => { item = { id: Math.random().toString(36).slice(2, 9), at: Date.now(), day: world.day, hour: world.hour, ...item }; chat.push(item); if (chat.length > 120) chat.shift(); save('nena-chat', chat); onChat(item); };
  let thought = 'just woke up.', say = null, sayUntil = 0, nextThink = 0, last = Date.now();
  const push = item => { feed.push(item); if (feed.length > 80) feed.shift(); onFeed(item); };

  const tick = setInterval(() => { const t = Date.now(); world.tick(Math.min(0.25, (t - last) / 1000)); last = t; }, 50);
  const beat = setInterval(() => {
    while (world.finished.length) {
      const a = world.finished.shift(), r = life.finish(a.action, a, world);
      if (!r) continue;
      life.save(); if (r.lift) world.bump(r.lift); if (r.say) { say = r.say; sayUntil = Date.now() + 9000; }
      push({ at: Date.now(), day: world.day, hour: world.hour, action: a.action, label: r.text, reason: '', source: 'world', result: true });
    }
    if (world.activity || Date.now() < nextThink) return;
    const c = chooseFallback(world.options(0), world.needs, recent, []);
    if (!world.start(c.action, c.detail)) { nextThink = Date.now() + 3000; return; }
    recent.push(c.action); if (recent.length > 8) recent.shift();
    thought = c.reason; if (c.say) { say = c.say; sayUntil = Date.now() + 9000; }
    push({ at: Date.now(), day: world.day, hour: world.hour, action: c.action, label: world.activity.label, detail: c.detail || null, reason: c.reason, source: 'stand-in' });
    nextThink = Date.now() + world.mood().heartbeat * 1000;
  }, 1000);
  const keep = setInterval(() => { save('nena-world', world.snapshot()); save('nena-feed', feed); }, 10000);

  function talk(name, text) {
    addChat({ kind: 'visitor', name, text });
    setTimeout(() => {
      const a = world.activity, asleep = a?.action === 'sleep' && a.phase === 'doing';
      const reply = scriptedReply(text, name, { doing: a ? a.label : 'thinking', mood: world.mood().label, weather: world.weather, night: world.isNight, known: chat.filter(c => c.name === name).length - 1, asleep });
      addChat({ kind: 'nena', text: reply, to: [name] }); if (!asleep) { sayText = reply; sayUntil2 = Date.now() + 9000; const st = life.chatted(name, world.day); if (st.length) life.save(); }
    }, 1500 + Math.random() * 2000);
  }
  let sayText = null, sayUntil2 = 0;
  return {
    feed, chat, say: talk,
    now: () => ({ name: 'Nena', ...world.view(), thought, say: Date.now() < sayUntil2 ? sayText : Date.now() < sayUntil ? say : null, mail: 0, mind: { source: 'stand-in', model: null, local: true } }),
    life: () => ({ ...life.summary(), decorList: life.s.decor }),
    stop: () => { clearInterval(tick); clearInterval(beat); clearInterval(keep); },
  };
}
