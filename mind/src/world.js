// The world: Nena's body, her needs, the clock and the weather.
// Pure code, no model. It ticks 20 times a second and decides what is possible;
// the brain only chooses among what the world offers.
import { PLACES, ACTIONS, NEEDS, WORLD } from '../../shared/world.js';

const clamp01 = v => Math.max(0, Math.min(1, v));
const SPEED = 1.9; // metres per second, a waddle
const DRAIN = { fullness: 1 / 1000, energy: 1 / 2000, wonder: 1 / 800, joy: 1 / 1200, calm: 1 / 1600 };
const WEATHERS = ['clear', 'clear', 'snow', 'aurora', 'mist'];

export class World {
  constructor(saved, daySeconds) {
    this.daySeconds = daySeconds;
    this.bornAt = saved?.bornAt || Date.now();
    this.pos = saved?.pos || { x: PLACES.home.x, z: PLACES.home.z };
    this.heading = saved?.heading || 0;
    this.needs = saved?.needs || { fullness: 0.7, energy: 0.8, wonder: 0.5, joy: 0.6, calm: 0.7 };
    this.lift = saved?.lift || 0;          // short-lived mood push from events, -1..1
    this.weather = saved?.weather || 'clear';
    this.weatherUntil = 0;
    this.activity = null;                  // { action, phase:'walking'|'doing', target:{x,z}, left, detail }
    this.finished = [];                    // completed activities waiting for the brain to notice
  }

  // ---- clock -----------------------------------------------------------
  get age() { return (Date.now() - this.bornAt) / 1000; }
  get day() { return Math.floor(this.age / this.daySeconds) + 1; }
  get hour() { return ((this.age % this.daySeconds) / this.daySeconds) * 24; }
  get isNight() { const h = this.hour; return h >= 21 || h < 6; }

  // ---- what the brain may choose from ----------------------------------
  options(unreadMail) {
    const n = this.needs, out = [];
    const add = (action, why) => out.push({ action, where: ACTIONS[action].place ? PLACES[ACTIONS[action].place].label : 'around town', why });
    if (n.energy < 0.3 || (this.isNight && n.energy < 0.75)) add('sleep', 'tired');
    if (n.energy < 0.6 || n.calm < 0.4) add('rest', 'a quiet sit at home');
    if (n.fullness < 0.75) add('eat', n.fullness < 0.3 ? 'very hungry' : 'could eat');
    if (n.energy > 0.25) add('swim', 'the pond is good for sliding');
    if (n.energy > 0.2) add('read', 'something new to learn');
    if (n.energy > 0.2) add('draw', 'make something');
    add('stargaze', this.weather === 'aurora' ? 'the sky is lit up tonight' : 'look at the sky');
    if (unreadMail > 0) add('read_mail', `${unreadMail} thing${unreadMail > 1 ? 's' : ''} waiting in the mailbox`);
    add('wander', 'no plan');
    return out;
  }

  start(action, detail = null) {
    const def = ACTIONS[action];
    if (!def) return false;
    let target;
    if (def.place) target = { x: PLACES[def.place].x, z: PLACES[def.place].z };
    else {
      const a = Math.random() * Math.PI * 2, r = 4 + Math.random() * 10;
      target = { x: Math.cos(a) * r, z: Math.sin(a) * r };
    }
    this.activity = { action, label: def.label, place: def.place, phase: 'walking', target, left: def.dur, dur: def.dur, detail };
    return true;
  }

  bump(amount) { this.lift = Math.max(-1, Math.min(1, this.lift + amount)); }

  // ---- 20Hz tick -------------------------------------------------------
  tick(dt) {
    for (const k of NEEDS) this.needs[k] = clamp01(this.needs[k] - DRAIN[k] * dt * (this.activity?.action === 'sleep' && this.activity.phase === 'doing' ? 0.3 : 1));
    this.lift *= Math.exp(-dt / 120);

    if (Date.now() > this.weatherUntil) {
      this.weather = WEATHERS[Math.floor(Math.random() * WEATHERS.length)];
      this.weatherUntil = Date.now() + (300 + Math.random() * 600) * 1000;
    }
    if (this.weather === 'aurora') this.needs.wonder = clamp01(this.needs.wonder + dt / 3000);
    if (this.weather === 'snow') this.needs.calm = clamp01(this.needs.calm + dt / 4000);

    const a = this.activity;
    if (!a) return;
    if (a.phase === 'walking') {
      const dx = a.target.x - this.pos.x, dz = a.target.z - this.pos.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.15) { a.phase = 'doing'; return; }
      const step = Math.min(dist, SPEED * dt);
      this.pos.x += (dx / dist) * step; this.pos.z += (dz / dist) * step;
      this.heading = Math.atan2(dx, dz);
      const half = WORLD.size / 2 - 2;
      this.pos.x = Math.max(-half, Math.min(half, this.pos.x));
      this.pos.z = Math.max(-half, Math.min(half, this.pos.z));
    } else {
      const def = ACTIONS[a.action];
      for (const [k, total] of Object.entries(def.effects)) this.needs[k] = clamp01(this.needs[k] + (total / def.dur) * dt);
      a.left -= dt;
      const sleptEnough = a.action === 'sleep' && this.needs.energy > 0.97;
      if (a.left <= 0 || sleptEnough) { this.finished.push(a); this.activity = null; }
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
    else if (n.wonder < 0.3) label = 'restless';
    else if (n.joy < 0.3) label = 'a little flat';
    else if (n.calm < 0.3) label = 'unsettled';
    else if (n.wonder > 0.75) label = 'curious';
    else if (valence > 0.72) label = 'happy';
    // arousal sets the heartbeat: stirred up thinks every 4s, bored every 15s
    const arousal = clamp01(Math.abs(this.lift) + (1 - n[lowest]) * 0.6);
    return { label, valence, lowest, heartbeat: 15 - 11 * arousal };
  }

  snapshot() {
    return { bornAt: this.bornAt, pos: this.pos, heading: this.heading, needs: this.needs, lift: this.lift, weather: this.weather };
  }
}
