// The world: Nena's body, her needs, the clock, the weather, her neighbours and the
// things that turn up on the island. Pure code, no model. It ticks 20 times a second
// and decides what is possible; the brain only chooses among what the world offers.
// (No Node imports here, so the browser can run it too.)
import { PLACES, NEEDS, NEIGHBOURS, BEACH, ISLETS, SKY_ISLANDS, TRIP_ISLES, WORLD, route, blocked, freeSpot } from '../../shared/world.js';
import { ACTIONS, calendar, currentEvent, painterIn, SEASON_WEATHER, STORM_SAFE } from '../../shared/data.js';

const clamp01 = v => Math.max(0, Math.min(1, v));
const SPEED = 1.9;        // metres per second, a waddle
const RIDE_SPEED = 4.6;   // on her little robot
const RIDE_OVER = 15;     // she fetches the robot for trips longer than this
const DRAIN = { fullness: 1 / 1000, energy: 1 / 2000, wonder: 1 / 800, joy: 1 / 1200, calm: 1 / 1600 };
const uid = () => Math.random().toString(36).slice(2, 8);

export class World {
  constructor(saved, daySeconds, life) {
    this.daySeconds = daySeconds; this.life = life;
    this.bornAt = saved?.bornAt || Date.now();
    if (saved && saved.layout !== WORLD.layout) saved = { bornAt: saved.bornAt, needs: saved.needs };   // the island changed shape: start her at home
    this.pos = saved?.pos || { x: PLACES.home.x, z: PLACES.home.z };
    this.heading = saved?.heading || 0;
    this.needs = saved?.needs || { fullness: 0.7, energy: 0.8, wonder: 0.5, joy: 0.6, calm: 0.7 };
    this.lift = saved?.lift || 0;          // short-lived mood push from events, -1..1
    this.weather = saved?.weather || 'clear';
    this.weatherUntil = 0;
    this.spots = saved?.spots || [];       // fossils, weeds, bottles, balloons: { id, kind, x, z }
    this.spotDay = saved?.spotDay || 0;
    this.npcs = NEIGHBOURS.map(n => ({ name: n.name, kind: n.kind, home: n.home, x: n.home.x, z: n.home.z + 2.6, heading: 0, path: [], wait: 0, hold: 0, out: true }));
    this.visitors = [];                    // people watching right now (set by the server)
    this.activity = null;                  // { action, phase:'walking'|'doing', path:[{x,z}], left, detail, ref, at }
    this.finished = [];                    // completed activities waiting for the brain to notice
  }

  // ---- clock -----------------------------------------------------------
  get age() { return (Date.now() - this.bornAt) / 1000; }
  get day() { return Math.floor(this.age / this.daySeconds) + 1; }
  get hour() { return ((this.age % this.daySeconds) / this.daySeconds) * 24; }
  get isNight() { const h = this.hour; return h >= 21 || h < 6; }
  get cal() { return calendar(this.day); }
  get event() { return currentEvent(this.day, this.hour); }

  // ---- things that turn up -----------------------------------------------
  spawn(kind) {
    let at;
    if (kind === 'bottle') { const a = BEACH.from + 0.1 + Math.random() * (BEACH.to - BEACH.from - 0.2), r = WORLD.radius - 4 + Math.random() * 2.5; at = { x: Math.cos(a) * r, z: Math.sin(a) * r }; if (blocked(at.x, at.z, 2)) at = null; }
    else at = freeSpot([...this.spots, ...this.life.s.decor], 2.2);
    if (at) this.spots.push({ id: uid(), kind, x: at.x, z: at.z });
  }
  dailySpots() {
    if (this.spotDay === this.day) return;
    this.spotDay = this.day;
    const n = k => this.spots.filter(s => s.kind === k).length;
    while (n('fossil') < 4) this.spawn('fossil');
    if (!n('glow')) this.spawn('glow');
    for (let i = n('weed'); i < 4; i++) this.spawn('weed');
    if (!n('bottle')) this.spawn('bottle');
    this.spots = this.spots.filter(s => s.kind !== 'balloon');
    this.life.newDay(this.day);
  }
  takeSpot(id) { this.spots = this.spots.filter(s => s.id !== id); }
  nearest(list) { let best = null, d = 1e9; for (const s of list) { const dd = Math.hypot(s.x - this.pos.x, s.z - this.pos.z); if (dd < d) { d = dd; best = s; } } return best; }

  // ---- what the brain may choose from ----------------------------------
  ctx(mail = 0) {
    const out = this.npcs.filter(n => n.out);
    return { n: this.needs, day: !this.isNight, night: this.isNight, hour: this.hour, dayN: this.day, weather: this.weather, cal: this.cal, event: this.event, life: this.life, mail,
      has: kind => this.spots.some(s => s.kind === kind), npc: this.nearest(out), out: name => out.some(n => n.name === name), visitors: this.visitors, painter: painterIn(this.cal, this.hour) };
  }
  options(mail) {
    const c = this.ctx(mail), out = [];
    for (const [action, def] of Object.entries(ACTIONS)) {
      let ok = false; try { ok = def.ok(c); } catch { ok = false; }
      if (!ok) continue;
      if (c.weather === 'storm' && !(STORM_SAFE.includes(def.place) || def.anim === 'inside')) continue;   // nobody goes far in a storm
      const e = action === 'event' ? c.event : null;
      const where = e ? PLACES[e.place].label : def.place ? PLACES[def.place].label : def.target === 'npc' ? `wherever ${c.npc.name} is` : 'around the island';
      out.push({ action, where, why: e ? `${e.name} is on right now` : def.offer });
    }
    return out;
  }

  start(action, detail = null) {
    const def = ACTIONS[action];
    if (!def) return false;
    const a = { action, label: def.label, place: def.place, anim: def.anim, phase: 'walking', left: def.dur, dur: def.dur, detail };
    let target;
    if (action === 'event') { const e = this.event; if (!e) return false; a.event = e; a.label = e.label; a.place = e.place; target = PLACES[e.place]; }
    else if (def.place) target = PLACES[def.place];
    else if (def.target === 'npc') { const n = def.who ? this.npcs.find(x => x.name === def.who && x.out) : this.ctx().npc; if (!n) return false; a.ref = n.name; n.hold = Date.now() + 90000; n.path = []; const dx = this.pos.x - n.x, dz = this.pos.z - n.z, l = Math.hypot(dx, dz) || 1; target = { x: n.x + (dx / l) * 1.7, z: n.z + (dz / l) * 1.7 }; for (let i = 1; i < 8 && blocked(target.x, target.z, 0.4); i++) { const ang = Math.atan2(dz, dx) + i * 0.8; target = { x: n.x + Math.cos(ang) * 1.7, z: n.z + Math.sin(ang) * 1.7 }; } a.hobby = n.doing; if (!def.who) a.label = action === 'chat' ? `chatting with ${n.name}` : action === 'join_hobby' ? `joining ${n.name} (${n.doing})` : `giving ${n.name} a present`; }
    else if (def.target === 'patch') { const d = this.nearest(this.life.patches()); if (!d) return false; target = { x: d.x + 0.9, z: d.z + 0.3 }; }
    else if (def.target === 'ripe') { const d = this.life.ripe(this.day); if (!d) return false; target = { x: d.x + 1.0, z: d.z + 0.4 }; }
    else if (def.target === 'free') { target = this.life.freeSpot(); if (!target) return false; a.at = target; target = { x: target.x + 1.1, z: target.z + 0.4 }; }
    else if (def.target) { const s = this.nearest(this.spots.filter(x => x.kind === def.target)); if (!s) return false; a.ref = s.id; a.at = def.target === 'glow' ? { x: s.x, z: s.z } : undefined; target = { x: s.x + 0.9, z: s.z + 0.3 }; }
    else { for (let i = 0; i < 20; i++) { const ang = Math.random() * Math.PI * 2, r = 4 + Math.random() * (WORLD.radius - 14); target = { x: Math.cos(ang) * r, z: Math.sin(ang) * r }; if (!blocked(target.x, target.z, 1.5)) break; } }
    if (action === 'boat_trip') a.islet = Math.floor(Math.random() * ISLETS.length);
    if (action === 'voyage') {   // which big island, and the spots she will visit there (one at least for food)
      const seen = this.life?.s?.farVisited || {}, isl = [...TRIP_ISLES].sort((x, y) => (seen[x.id] || 0) - (seen[y.id] || 0) + (Math.random() - 0.5) * 0.8)[0];
      const keys = Object.keys(isl.spots).filter(k => k !== 'pad'), food = keys.filter(k => isl.spots[k][2]?.food), rest = keys.filter(k => !food.includes(k)).sort(() => Math.random() - 0.5);
      const first = food[Math.floor(Math.random() * food.length)]; a.isle = isl.id; a.route = [first, ...rest.slice(0, 3)].sort(() => Math.random() - 0.5);
      a.label = `flying the balloon to ${isl.name}`; }
    a.path = route(this.pos, target);
    let len = 0, prev = this.pos; for (const p of a.path) { len += Math.hypot(p.x - prev.x, p.z - prev.z); prev = p; }
    a.ride = len > RIDE_OVER;
    this.activity = a;
    return true;
  }

  bump(amount) { this.lift = Math.max(-1, Math.min(1, this.lift + amount)); }

  // ---- 20Hz tick -------------------------------------------------------
  tick(dt) {
    const asleep = this.activity?.action === 'sleep' && this.activity.phase === 'doing';
    for (const k of NEEDS) this.needs[k] = clamp01(this.needs[k] - DRAIN[k] * dt * (asleep ? 0.3 : 1));
    this.lift *= Math.exp(-dt / 120);
    this.dailySpots();

    this.tickWeather(dt);
    if (!this.isNight && !this.spots.some(s => s.kind === 'balloon') && Math.random() < dt / 2400) this.spawn('balloon');

    this.tickNeighbours(dt);

    const a = this.activity;
    if (!a) return;
    if (a.phase === 'walking') {
      const next = a.path[0];
      if (!next) { a.phase = 'doing'; return; }
      const dx = next.x - this.pos.x, dz = next.z - this.pos.z, dist = Math.hypot(dx, dz);
      if (dist < 0.15) { a.path.shift(); return; }
      const step = Math.min(dist, (a.ride ? RIDE_SPEED : SPEED) * dt);
      this.pos.x += (dx / dist) * step; this.pos.z += (dz / dist) * step;
      this.heading = Math.atan2(dx, dz);
    } else {
      const def = ACTIONS[a.action];
      if (a.ref && def.target === 'npc') { const n = this.npcs.find(x => x.name === a.ref); if (n) { this.heading = Math.atan2(n.x - this.pos.x, n.z - this.pos.z); n.heading = this.heading + Math.PI; } }
      for (const [k, total] of Object.entries(def.effects)) this.needs[k] = clamp01(this.needs[k] + (total / def.dur) * dt);
      a.left -= dt;
      const sleptEnough = a.action === 'sleep' && this.needs.energy > 0.97;
      if (a.left <= 0 || sleptEnough) { if (a.ref) { const n = this.npcs.find(x => x.name === a.ref); if (n) n.hold = 0; } this.finished.push(a); this.activity = null; }
    }
  }

  // Weather comes from the season. Rain sometimes leaves a rainbow; aurora and shooting stars only at night.
  tickWeather(dt) {
    const night = this.isNight, season = this.cal.season;
    if (Date.now() > this.weatherUntil) {
      const was = this.weather, pool = [...SEASON_WEATHER[season], ...(night ? ['aurora', 'meteors'] : [])];
      let next = pool[Math.floor(Math.random() * pool.length)];
      if ((was === 'rain' || was === 'storm') && !night && Math.random() < 0.45) next = 'rainbow';
      this.weather = next;
      this.weatherUntil = Date.now() + (next === 'rainbow' ? 120 + Math.random() * 120 : 300 + Math.random() * 600) * 1000;
    }
    if (!night && (this.weather === 'aurora' || this.weather === 'meteors')) this.weather = 'clear';
    if (night && (this.weather === 'rainbow' || this.weather === 'heat')) this.weather = 'clear';
    const outside = !(this.activity?.phase === 'doing' && ACTIONS[this.activity.action]?.anim === 'inside');
    const w = this.weather, add = (k, v) => { this.needs[k] = clamp01(this.needs[k] + v * dt); };
    if (w === 'aurora') add('wonder', 1 / 3000);
    if (w === 'snow') add('calm', 1 / 4000);
    if (w === 'storm' && outside) add('calm', -1 / 900);
    if (w === 'heat' && outside) add('energy', -1 / 2500);
    if (w === 'wind') add('wonder', 1 / 5000);
    if (w === 'rainbow') add('joy', 1 / 2500);
  }

  // Neighbours potter between places by day and go back to their tents at night.
  tickNeighbours(dt) {
    const night = this.isNight || this.weather === 'storm', e = this.event;
    for (const n of this.npcs) {
      if (Date.now() < n.hold) continue;
      if (n.path.length) {
        const p = n.path[0], dx = p.x - n.x, dz = p.z - n.z, dist = Math.hypot(dx, dz);
        if (dist < 0.15) { n.path.shift(); if (!n.path.length) { n.wait = 15 + Math.random() * 40; if (n.next) { n.doing = n.next.doing; n.anim = n.next.anim; n.wait = 50 + Math.random() * 50; n.next = null; } else if (n.anim === 'jog') { n.doing = null; n.anim = null; } if (night) { n.out = false; n.doing = null; n.anim = null; } } continue; }
        const step = Math.min(dist, (n.anim === 'jog' ? 2.6 : 1.2) * dt); n.x += (dx / dist) * step; n.z += (dz / dist) * step; n.heading = Math.atan2(dx, dz);
        continue;
      }
      if (night) { if (n.out && Math.hypot(n.x - n.home.x, n.z - (n.home.z + 2.6)) > 1) n.path = route(n, { x: n.home.x, z: n.home.z + 2.6 }); else n.out = false; continue; }
      n.out = true; n.wait -= dt;
      if (n.wait > 0) continue;
      const def = NEIGHBOURS.find(x => x.name === n.name);
      n.doing = null; n.anim = null;
      let t;
      if (e && Math.random() < 0.8) { const p = PLACES[e.place]; t = { x: p.x + (Math.random() - 0.5) * 5, z: p.z + (Math.random() - 0.5) * 5 }; }
      else if (Math.random() < 0.7) {                                    // off to do a hobby
        const h = def.hobbies[Math.floor(Math.random() * def.hobbies.length)];
        n.next = h;
        if (h.loop) { const pts = []; for (let lap = 0; lap < 3; lap++) for (let i = 0; i < 8; i++) pts.push({ x: Math.cos(i / 8 * 6.283) * h.loop, z: Math.sin(i / 8 * 6.283) * h.loop }); n.path = [...route(n, pts[0]), ...pts.slice(1)]; n.doing = h.doing; n.anim = h.anim; n.next = null; continue; }
        t = h.at;
      }
      else { const keys = Object.keys(PLACES), p = PLACES[keys[Math.floor(Math.random() * keys.length)]]; t = { x: p.x + (Math.random() - 0.5) * 4, z: p.z + (Math.random() - 0.5) * 4 }; }
      if (!blocked(t.x, t.z, 0.9) && Math.hypot(t.x, t.z) < WORLD.radius - 2.5) n.path = route(n, t); else { n.wait = 2; n.next = null; }
    }
  }

  // ---- feelings, computed not chosen -----------------------------------
  mood() {
    const n = this.needs;
    const lowest = NEEDS.reduce((a, b) => (n[a] < n[b] ? a : b));
    const avg = NEEDS.reduce((s, k) => s + n[k], 0) / NEEDS.length;
    const valence = clamp01(avg + this.lift * 0.3);
    let label = 'content';
    if (this.activity?.action === 'sleep' && this.activity.phase === 'doing') label = 'asleep';
    else if (n.energy < 0.25) label = 'sleepy';
    else if (n.fullness < 0.25) label = 'hungry';
    else if (this.lift > 0.35) label = 'delighted';
    else if (this.lift < -0.25) label = 'put out';
    else if (n.wonder < 0.3) label = 'restless';
    else if (n.joy < 0.3) label = 'a little flat';
    else if (n.calm < 0.3) label = 'unsettled';
    else if (n.wonder > 0.75) label = 'curious';
    else if (valence > 0.72) label = 'happy';
    // arousal sets the heartbeat: stirred up thinks every 4s, bored every 15s
    const arousal = clamp01(Math.abs(this.lift) + (1 - n[lowest]) * 0.6);
    return { label, valence, lowest, heartbeat: 15 - 11 * arousal };
  }

  // What the page needs to draw her and her island right now.
  view() {
    const a = this.activity, e = this.event, c = this.cal, s = this.life.s;
    return {
      day: this.day, hour: this.hour, night: this.isNight, weather: this.weather, season: c.seasonName, dayOfSeason: c.dayOfSeason,
      event: e ? { id: e.id, name: e.name, show: e.show, place: e.place } : null,
      pos: this.pos, heading: this.heading,
      activity: a ? { action: a.action, anim: a.anim, ride: a.phase === 'walking' && a.ride, label: a.phase === 'walking' ? (a.place ? `${a.ride ? 'riding her robot' : 'walking'} to the ${PLACES[a.place].label.toLowerCase()}` : a.ref && ACTIONS[a.action].target === 'npc' ? `going to find ${a.ref}` : a.action === 'wander' ? 'wandering' : `on her way (${a.label})`) : a.label, place: a.place, phase: a.phase, detail: a.detail, islet: a.islet, isle: a.isle, route: a.route, progress: a.phase === 'doing' ? 1 - a.left / a.dur : 0 } : { action: 'idle', label: 'thinking', phase: 'idle', anim: 'stand' },
      needs: this.needs, mood: this.mood().label,
      npcs: this.npcs.map(n => ({ name: n.name, kind: n.kind, x: n.x, z: n.z, heading: n.heading, out: n.out, moving: n.path.length > 0 && Date.now() >= n.hold, doing: n.doing || null, anim: n.anim || null })),
      camper: s.camper && !this.isNight ? { name: s.camper.name, kind: s.camper.kind } : null, visitors: this.visitors,
      spots: this.spots, coins: s.coins, look: { scarf: s.look.scarf, hat: s.look.hat || 0, glasses: s.look.glasses || 0, house: s.look.house, level: s.house.level, flag: s.look.flag || 0 }, lifeVersion: s.version,
      painter: painterIn(c, this.hour), crops: s.crops ? Math.min(2, this.day - s.crops) + 1 : 0,
    };
  }

  snapshot() {
    return { layout: WORLD.layout, bornAt: this.bornAt, pos: this.pos, heading: this.heading, needs: this.needs, lift: this.lift, weather: this.weather, spots: this.spots, spotDay: this.spotDay };
  }
}
