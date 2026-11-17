// A stand-in mind that runs in the visitor's browser when Nena's real mind server
// cannot be reached. Same world rules and the same scripted chooser; state is kept
// in this browser only, so every visitor gets their own copy and nobody shares her.
import { World } from '../../mind/src/world.js';
import { Life } from '../../shared/life.js';
import { chooseFallback } from '../../shared/choose.js';

const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export function startLocalMind(onFeed) {
  const life = new Life({ load: () => load('nena-life', null), save: v => save('nena-life', v) });
  const world = new World(load('nena-world', null), 3600, life);
  const recent = [], feed = load('nena-feed', []);
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

  return {
    feed,
    now: () => ({ name: 'Nena', ...world.view(), thought, say: Date.now() < sayUntil ? say : null, mail: 0, mind: { source: 'stand-in', model: null, local: true } }),
    life: () => ({ ...life.summary(), decorList: life.s.decor }),
    stop: () => { clearInterval(tick); clearInterval(beat); clearInterval(keep); },
  };
}
