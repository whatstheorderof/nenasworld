// The island's sounds, all made in the browser (no audio files): rain, wind, the sea,
// birds by day, crickets on summer nights, thunder, and little chimes for stamps and chat.
// Browsers only allow sound after the visitor has touched the page, so it starts on the first tap.

let ctx = null, master = null, noise = null, layers = null;
let enabled = false, volume = 0.6, nextBird = 2, nextCricket = 0;

function noiseBuffer(c) {
  const b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = b.getChannelData(0);
  let last = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = w * 0.6 + last * 3; }
  return b;
}
function bed(type, freq, q) {   // a looping filtered-noise layer with its own volume
  const src = ctx.createBufferSource(); src.buffer = noise; src.loop = true; src.playbackRate.value = 0.6 + Math.random() * 0.8;
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain(); g.gain.value = 0;
  src.connect(f); f.connect(g); g.connect(master); src.start();
  return { g, f };
}
function start() {
  if (ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  ctx = new AC(); master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
  noise = noiseBuffer(ctx);
  layers = { rain: bed('bandpass', 2400, 0.5), patter: bed('highpass', 5000, 0.7), wind: bed('lowpass', 500, 1.5), sea: bed('lowpass', 380, 0.8) };
}
const set = (param, v, t = 0.6) => param.setTargetAtTime(v, ctx.currentTime, t);

function tone(freq, at, len, type = 'sine', vol = 0.15, slideTo = null) {
  const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(freq, at);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, at + len);
  g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, at + len);
  o.connect(g); g.connect(master); o.start(at); o.stop(at + len + 0.05);
}
function chirp() {   // a small bird: two or three quick rising whistles
  const t = ctx.currentTime, base = 2200 + Math.random() * 1600, n = 2 + (Math.random() * 3 | 0);
  for (let i = 0; i < n; i++) tone(base, t + i * 0.11, 0.08, 'sine', 0.035, base * (1.3 + Math.random() * 0.4));
}
function cricket() {
  const t = ctx.currentTime; for (let i = 0; i < 3; i++) tone(4300, t + i * 0.06, 0.035, 'triangle', 0.012);
}

export const sound = {
  get on() { return enabled; },
  setEnabled(v) { enabled = v; if (v) start(); if (ctx) { if (v && ctx.state === 'suspended') ctx.resume(); set(master.gain, v ? volume : 0, 0.3); } },
  setVolume(v) { volume = v; if (ctx && enabled) set(master.gain, v, 0.1); },
  // the first tap anywhere unlocks audio
  unlock() { if (enabled) { start(); if (ctx.state === 'suspended') ctx.resume(); set(master.gain, volume, 0.3); } },
  // called every frame with how much of each weather there is (0..1)
  update(dt, w) {
    if (!ctx || !enabled) return;
    const wet = Math.min(1, w.rain + w.storm);
    set(layers.rain.g.gain, wet * (0.32 + w.storm * 0.2), 1.2);
    set(layers.patter.g.gain, wet * 0.08, 1.2);
    const gust = 0.6 + 0.4 * Math.sin(ctx.currentTime * 0.4) * Math.sin(ctx.currentTime * 0.17);
    set(layers.wind.g.gain, (w.wind * 0.4 + w.storm * 0.2) * gust, 0.8); set(layers.wind.f.frequency, 350 + gust * 400, 0.8);
    const swell = 0.5 + 0.5 * Math.sin(ctx.currentTime * 0.5);
    set(layers.sea.g.gain, (0.05 + swell * 0.07) * w.seaNear, 0.6);
    if (w.day > 0.5 && wet < 0.2 && w.snow < 0.5) { nextBird -= dt; if (nextBird < 0) { chirp(); nextBird = 2 + Math.random() * 7; } }
    if (w.day < 0.3 && w.summer && wet < 0.2) { nextCricket -= dt; if (nextCricket < 0) { cricket(); nextCricket = 0.35 + Math.random() * 0.5; } }
  },
  thunder(distance = 0.5) {
    if (!ctx || !enabled) return;
    const at = ctx.currentTime + 0.4 + distance * 2.5, src = ctx.createBufferSource(); src.buffer = noise;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 160; const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.9 - distance * 0.4, at + 0.12); g.gain.exponentialRampToValueAtTime(0.0001, at + 3.2);
    src.connect(f); f.connect(g); g.connect(master); src.start(at); src.stop(at + 3.4);
  },
  stamp() { if (!ctx || !enabled) return; const t = ctx.currentTime; [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.09, 0.5, 'triangle', 0.12)); },
  blip() { if (!ctx || !enabled) return; const t = ctx.currentTime; tone(880, t, 0.12, 'sine', 0.08, 1320); },
  pop() { if (!ctx || !enabled) return; tone(520, ctx.currentTime, 0.09, 'sine', 0.06, 760); },
  // so the tune player can share the volume and on/off
  debug() { return ctx ? { state: ctx.state, gain: +master.gain.value.toFixed(2), rain: +layers.rain.g.gain.value.toFixed(3), sea: +layers.sea.g.gain.value.toFixed(3) } : null; },
  context() { start(); return enabled ? { ctx, out: master } : null; },
};
