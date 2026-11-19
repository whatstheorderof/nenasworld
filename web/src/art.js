// Nena's drawings. Each one is painted from its title and a seed, in a wobbly
// crayon style, so the same drawing always looks the same wherever it is shown.

const PAL = ['#e8452c', '#ffd93b', '#2fc6b3', '#6a2fc4', '#ff7fa3', '#58b7e8', '#4fae52', '#f2792e', '#1d2545'];

function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

export function drawPicture(canvas, title, seed) {
  const W = canvas.width, H = canvas.height, g = canvas.getContext('2d'), r = rng(seed);
  const t = String(title || '').toLowerCase(), has = (...w) => w.some(x => x.length < 4 ? new RegExp(`\\b${x}\\b`).test(t) : t.includes(x));
  const pick = a => a[Math.floor(r() * a.length)];
  const u = W / 100;   // draw in a 100-wide space

  // crayon helpers: every line wobbles a little
  const wob = () => (r() - 0.5) * 1.6 * u;
  const stroke = (pts, col, wid = 1.6, close = false, fill = null) => {
    g.lineCap = g.lineJoin = 'round';
    for (let pass = 0; pass < 2; pass++) {
      g.beginPath(); pts.forEach(([x, y], i) => g[i ? 'lineTo' : 'moveTo'](x * u + wob() * 0.5, y * u + wob() * 0.5)); if (close) g.closePath();
      if (fill && pass === 0) { g.globalAlpha = 0.75; g.fillStyle = fill; g.fill(); g.globalAlpha = 1; }
      g.strokeStyle = col; g.lineWidth = wid * u * (pass ? 0.55 : 1); g.globalAlpha = pass ? 0.5 : 0.95; g.stroke(); g.globalAlpha = 1;
    }
  };
  const blob = (cx, cy, rx, ry, col, fill, n = 14) => stroke(Array.from({ length: n }, (_, i) => { const a = i / n * 6.283, k = 1 + (r() - 0.5) * 0.12; return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]; }), col, 1.4, true, fill);

  // paper
  g.fillStyle = '#fff8ea'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(120,90,60,${r() * 0.05})`; g.fillRect(r() * W, r() * H, 1.5, 1.5); }
  const night = has('night', 'star', 'sky', 'moon', 'dark', 'aurora');
  const top = 66 * (H / W);   // height of the picture in 100-units
  // sky wash and ground
  g.globalAlpha = 0.35; g.fillStyle = night ? '#2a3263' : pick(['#bfe8ff', '#cdf3ff', '#ffe3c2']); g.fillRect(4 * u, 4 * u, 92 * u, (top - 8) * u * 0.62); g.globalAlpha = 1;
  const groundY = top * 0.66;
  const water = has('pond', 'sea', 'river', 'water', 'boat', 'fish', 'whale', 'wave', 'lighthouse');
  const sand = has('volcano', 'hut', 'huts', 'sand', 'desert', 'oasis', 'cactus', 'dune'), ice = has('ice', 'ruin', 'snow', 'frozen'), wood = has('giant tree', 'fairy', 'forest', 'toadstool');
  const [gl, gf] = ice ? ['#7fb8d8', '#e6f6ff'] : sand ? ['#c98a3a', '#f4d48e'] : water && !wood ? ['#2f7f9a', '#9fd6f0'] : wood ? ['#3f8f4f', '#8fcf6a'] : ['#4fae52', '#b4dc5a'];
  stroke([[4, groundY], [30, groundY - 2], [60, groundY + 1], [96, groundY - 1], [96, top - 4], [4, top - 4]], gl, 1.2, true, gf);

  // something in the sky
  if (night) { for (let i = 0; i < 14; i++) { const x = 8 + r() * 84, y = 8 + r() * (groundY - 20); stroke([[x - 1.5, y], [x + 1.5, y]], '#ffd93b', 0.8); stroke([[x, y - 1.5], [x, y + 1.5]], '#ffd93b', 0.8); } blob(80, 14, 6, 6, '#ffd93b', '#fff3c4'); if (has('aurora', 'green')) stroke([[8, 22], [30, 14], [55, 24], [92, 12]], '#4fae52', 3); }
  else { const sx = 12 + r() * 76; blob(sx, 13, 6, 6, '#f2792e', '#ffd93b'); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; stroke([[sx + Math.cos(a) * 8, 13 + Math.sin(a) * 8], [sx + Math.cos(a) * 11, 13 + Math.sin(a) * 11]], '#f2792e', 0.9); } }

  const cx = 50 + (r() - 0.5) * 20, base = groundY + 4;
  let drew = false;
  // things she saw on the big islands
  if (has('volcano')) { drew = true; const vx = has('hut', 'huts') ? 32 : cx;
    stroke([[vx - 26, groundY + 1], [vx - 6, groundY - 19], [vx + 6, groundY - 19], [vx + 26, groundY + 1]], '#7a3b2c', 1.6, true, '#c8664a');
    stroke([[vx - 6, groundY - 19], [vx - 3, groundY - 17], [vx + 1, groundY - 19], [vx + 4, groundY - 17], [vx + 6, groundY - 19]], '#e8452c', 1.6, false);
    for (const d of [-1, 1]) stroke([[vx + d * 3, groundY - 18], [vx + d * 7, groundY - 11], [vx + d * 6, groundY - 5], [vx + d * 10, groundY]], '#ff7a2a', 1.8);
    for (let i = 0; i < 3; i++) blob(vx + 3 + i * 4, groundY - 22 - i * 3, 2.5 + i, 2 + i * 0.7, '#8a8a99', '#cfcfd8', 10); }
  if (has('hut', 'huts')) { drew = true; for (const [hx, k] of [[has('volcano') ? 70 : cx - 14, 1], [has('volcano') ? 86 : cx + 12, 0.8]]) {
    stroke(Array.from({ length: 10 }, (_, i) => { const a = Math.PI + i / 9 * Math.PI; return [hx + Math.cos(a) * 9 * k, base + Math.sin(a) * 10 * k]; }), '#a0683e', 1.4, true, '#e9b483');
    stroke([[hx - 2.5 * k, base], [hx - 2.5 * k, base - 5 * k], [hx + 2.5 * k, base - 5 * k], [hx + 2.5 * k, base]], '#1d2545', 1, true, '#8a5a3a'); stroke([[hx - 10 * k, base - 7 * k], [hx + 10 * k, base - 7 * k]], '#e8584a', 1.6); } }
  if (has('cactus', 'oasis') && !has('volcano')) { drew = true; const kx = cx + 18; stroke([[kx, base], [kx, base - 18]], '#3f8a46', 3.4); stroke([[kx, base - 9], [kx - 6, base - 9], [kx - 6, base - 15]], '#3f8a46', 2.6); stroke([[kx, base - 12], [kx + 5, base - 12], [kx + 5, base - 17]], '#3f8a46', 2.6); blob(kx, base - 19.5, 1.6, 1.4, '#e0487a', '#ff8fb1', 6);
    if (has('oasis')) blob(cx - 12, groundY + 8, 16, 4.5, '#2f7f9a', '#58b7e8'); }
  if (has('giant tree', 'door')) { drew = true; const tx = cx;
    stroke([[tx - 9, base], [tx - 6, base - 18], [tx + 6, base - 18], [tx + 9, base]], '#5e3f30', 1.6, true, '#8a5a3a');
    for (const d of [-1, 1]) stroke([[tx + d * 8, base], [tx + d * 15, base + 2]], '#5e3f30', 2.2);
    blob(tx, base - 24, 24, 9, '#2f7f4a', '#5fb35a', 18); blob(tx - 15, base - 21, 9, 6, '#2f7f4a', '#7cc47a', 12); blob(tx + 15, base - 22, 9, 6, '#2f7f4a', '#4fae63', 12);
    stroke(Array.from({ length: 9 }, (_, i) => { const a = Math.PI + i / 8 * Math.PI; return [tx + Math.cos(a) * 3.6, base - 6 + Math.sin(a) * 4]; }).concat([[tx + 3.6, base], [tx - 3.6, base]]), '#1d2545', 1.1, true, '#4f7fbf');
    blob(tx + 1.8, base - 4, 0.6, 0.6, '#d9b15c', '#d9b15c', 6); blob(tx - 3.5, base - 12, 1.8, 1.8, '#1d2545', night ? '#ffd93b' : '#fff1a8', 8); }
  if (has('fairy')) { drew = true; for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283, mx = cx + Math.cos(a) * 17, my = groundY + 6 + Math.sin(a) * 4;
      stroke([[mx, my + 3], [mx, my - 1]], '#c9b89a', 1.6); blob(mx, my - 2, 3.2, 2, '#7a2f2a', i % 2 ? '#e0564a' : '#fdf8ee', 8); }
    for (let i = 0; i < 7; i++) { const x = cx - 15 + r() * 30, y = groundY - 4 - r() * 16; blob(x, y, 0.9, 0.9, '#ffe066', '#fff1a8', 6); } }
  if (has('ruin')) { drew = true; for (const [x, h, broke] of [[cx - 20, 22, true], [cx - 8, 14, false], [cx + 14, 26, true]]) {
      stroke([[x - 3.5, groundY + 4], [x - 3.5, groundY + 4 - h], [x + 3.5, groundY + 4 - h + (broke ? 3 : 0)], [x + 3.5, groundY + 4]], '#8f8a80', 1.3, true, '#e8e4dc');
      stroke([[x - 1.2, groundY + 3], [x - 1.2, groundY + 6 - h]], '#c9c2b4', 0.7); stroke([[x + 1.2, groundY + 3], [x + 1.2, groundY + 6 - h]], '#c9c2b4', 0.7); }
    stroke([[cx - 26, groundY + 4], [cx + 26, groundY + 4]], '#7fb8d8', 1.4); for (let i = 0; i < 3; i++) stroke([[cx - 20 + i * 15, groundY + 12], [cx - 14 + i * 15, groundY + 10]], '#3fa56a', 1.1); }
  if (has('under the ice', 'light under')) { drew = true; blob(cx, groundY + 9, 18, 5, '#1f4f8a', '#2f6fb0'); blob(cx, groundY + 9, 9, 2.6, '#7fe6ff', '#bff6ff');
    for (let i = -2; i <= 2; i++) stroke([[cx + i * 3, groundY + 7], [cx + i * 7, groundY - 20]], '#9cf6ff', 1.2);
    for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; stroke([[cx + Math.cos(a) * 21, groundY + 9 + Math.sin(a) * 6], [cx + Math.cos(a) * 25, groundY + 9 + Math.sin(a) * 7]], '#7fb8d8', 2.4); } }
  if (has('house', 'home', 'igloo')) { drew = true; const c = pick(PAL); stroke([[cx - 14, base], [cx - 14, base - 16], [cx + 14, base - 16], [cx + 14, base]], '#1d2545', 1.4, true, '#fff1d6'); stroke([[cx - 17, base - 16], [cx, base - 28], [cx + 17, base - 16]], c, 1.6, true, c); stroke([[cx - 4, base], [cx - 4, base - 9], [cx + 3, base - 9], [cx + 3, base]], '#1d2545', 1.2, true, '#c9531c'); stroke([[cx + 6, base - 12], [cx + 11, base - 12], [cx + 11, base - 7], [cx + 6, base - 7]], '#1d2545', 1, true, night ? '#ffd93b' : '#bfe8ff'); }
  if (has('fish', 'whale')) { drew = true; const big = has('whale') ? 1.8 : 1, fx = has('house') ? 22 : cx, fy = groundY + 9; const c = pick(PAL); blob(fx, fy, 11 * big, 5.5 * big, '#1d2545', c); stroke([[fx + 10 * big, fy], [fx + 17 * big, fy - 6 * big], [fx + 17 * big, fy + 6 * big]], '#1d2545', 1.3, true, c); blob(fx - 6 * big, fy - 1.5 * big, 1.2, 1.2, '#1d2545', '#1d2545');
    if (has('whisker')) for (const d of [-1, 0, 1]) stroke([[fx - 10, fy + 1], [fx - 22, fy + d * 5]], '#1d2545', 0.7); }
  if (has('boat', 'lighthouse')) { drew = true; const bx = has('fish') ? 72 : cx; if (has('lighthouse')) { stroke([[bx - 5, groundY], [bx - 3, groundY - 26], [bx + 3, groundY - 26], [bx + 5, groundY]], '#1d2545', 1.3, true, '#fffaf0'); stroke([[bx - 4, groundY - 12], [bx + 4, groundY - 12]], '#e8452c', 2.2); blob(bx, groundY - 29, 3.5, 3, '#1d2545', '#ffd93b'); }
    else { stroke([[bx - 14, groundY - 2], [bx + 14, groundY - 2], [bx + 9, groundY + 5], [bx - 9, groundY + 5]], '#1d2545', 1.4, true, pick(PAL)); stroke([[bx, groundY - 2], [bx, groundY - 22]], '#1d2545', 1.2); stroke([[bx + 1, groundY - 21], [bx + 12, groundY - 6], [bx + 1, groundY - 6]], '#1d2545', 1.1, true, '#fffaf0'); } }
  if (has('lamp', 'light', 'mailbox') && !has('under the ice')) { drew = true; const lx = has('house') ? 80 : cx; stroke([[lx, base], [lx, base - 24]], '#1d2545', 1.5); blob(lx, base - 27, 3.5, 3.5, '#1d2545', '#ffd93b'); g.globalAlpha = 0.25; g.fillStyle = '#ffd93b'; g.beginPath(); g.arc(lx * u, (base - 27) * u, 10 * u, 0, 6.283); g.fill(); g.globalAlpha = 1; }
  if (has('someone', 'waving', 'bo', 'pip', 'suvi', 'friend', 'me', 'penguin', 'asleep')) { drew = true; const px = has('house', 'lamp', 'boat') ? 22 : cx, col = has('bo', 'seal') ? '#9aa7b8' : has('suvi', 'fox') ? '#f4f1ea' : '#1d2545';
    if (has('asleep', 'sleep')) { blob(px, base - 5, 12, 5, '#1d2545', col); stroke([[px + 14, base - 14], [px + 18, base - 14], [px + 14, base - 18], [px + 18, base - 18]], '#6a2fc4', 0.9); }
    else { blob(px, base - 10, 7, 10, '#1d2545', col); blob(px, base - 8, 4, 6, '#1d2545', '#fffaf0'); blob(px - 2.5, base - 15, 1, 1, '#1d2545', '#1d2545'); blob(px + 2.5, base - 15, 1, 1, '#1d2545', '#1d2545'); stroke([[px - 1.5, base - 12.5], [px, base - 11], [px + 1.5, base - 12.5]], '#f2792e', 1.1, true, '#ffa62b');
      if (has('waving', 'someone', 'friend')) stroke([[px + 6, base - 12], [px + 13, base - 22]], '#1d2545', 1.6); } }
  if (has('pond', 'river') && !has('fish')) { drew = true; blob(cx, groundY + 8, 22, 6, '#2f7f9a', '#58b7e8'); for (let i = 0; i < 3; i++) blob(cx - 12 + i * 11, groundY + 7 + (r() - 0.5) * 3, 3, 1.4, '#fffaf0', '#fffaf0', 6); }
  if ((has('flower', 'garden', 'tree') && !has('giant tree')) || !drew) { const n = drew ? 4 : 7; for (let i = 0; i < n; i++) { const fx = 10 + r() * 80, fy = groundY + 2 + r() * (top - groundY - 10), c = pick(PAL); stroke([[fx, fy + 6], [fx, fy]], '#4fae52', 0.9); for (let k = 0; k < 5; k++) { const a = k / 5 * 6.283; blob(fx + Math.cos(a) * 2, fy + Math.sin(a) * 2, 1.6, 1.6, c, c, 6); } blob(fx, fy, 1, 1, '#1d2545', '#ffd93b', 6); } }
  if (!drew && !has('flower', 'garden')) { const c = pick(PAL); stroke(Array.from({ length: 9 }, (_, i) => [20 + i * 8 + (r() - 0.5) * 6, groundY - 6 - r() * 18]), c, 2.2); }

  // her signature: a tiny penguin foot
  g.save(); g.translate(92 * u, (top - 7) * u); g.rotate(-0.3); g.fillStyle = '#f2792e';
  for (const k of [-1, 0, 1]) { g.beginPath(); g.ellipse(k * 1.4 * u, -1.8 * u, 0.7 * u, 1.6 * u, k * 0.4, 0, 6.283); g.fill(); }
  g.beginPath(); g.ellipse(0, 0, 1.6 * u, 1.1 * u, 0, 0, 6.283); g.fill(); g.restore();
  // frame line
  g.strokeStyle = 'rgba(29,37,69,0.25)'; g.lineWidth = 0.6 * u; g.strokeRect(4 * u, 4 * u, 92 * u, (top - 8) * u);
}

// A tune is a string of syllables. Play it on a soft bell.
const NOTE = { do: 0, re: 2, mi: 4, fa: 5, so: 7, la: 9, ti: 11, pip: 12, bo: -5, su: 7, na: 4, ne: 2, lo: -3 };
import { sound } from './sound.js';
export function playTune(tune) {
  if (!tune) return;
  const sc = sound.context(); if (!sc) return false;
  const audio = sc.ctx; if (audio.state === 'suspended') audio.resume();
  const t0 = audio.currentTime + 0.05;
  tune.split('-').forEach((syl, i) => {
    const semis = NOTE[syl] ?? 0, f = 523.25 * Math.pow(2, semis / 12), t = t0 + i * 0.32;
    const o = audio.createOscillator(), o2 = audio.createOscillator(), gain = audio.createGain();
    o.type = 'triangle'; o.frequency.value = f; o2.type = 'sine'; o2.frequency.value = f * 2;
    gain.gain.setValueAtTime(0.0001, t); gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02); gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(gain); o2.connect(gain); gain.connect(sc.out); o.start(t); o2.start(t); o.stop(t + 0.55); o2.stop(t + 0.55);
  });
  return true;
}
