// Nena's drawings. Each one is painted from its title and a seed, in a wobbly
// crayon style, so the same drawing always looks the same wherever it is shown.

const PAL = ['#e8452c', '#ffd93b', '#2fc6b3', '#6a2fc4', '#ff7fa3', '#58b7e8', '#4fae52', '#f2792e', '#1d2545'];

function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

export function drawPicture(canvas, title, seed) {
  const W = canvas.width, H = canvas.height, g = canvas.getContext('2d'), r = rng(seed);
  const t = String(title || '').toLowerCase(), has = (...w) => w.some(x => t.includes(x));
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
  stroke([[4, groundY], [30, groundY - 2], [60, groundY + 1], [96, groundY - 1], [96, top - 4], [4, top - 4]], water ? '#2f7f9a' : '#4fae52', 1.2, true, water ? '#9fd6f0' : '#b4dc5a');

  // something in the sky
  if (night) { for (let i = 0; i < 14; i++) { const x = 8 + r() * 84, y = 8 + r() * (groundY - 20); stroke([[x - 1.5, y], [x + 1.5, y]], '#ffd93b', 0.8); stroke([[x, y - 1.5], [x, y + 1.5]], '#ffd93b', 0.8); } blob(80, 14, 6, 6, '#ffd93b', '#fff3c4'); if (has('aurora', 'green')) stroke([[8, 22], [30, 14], [55, 24], [92, 12]], '#4fae52', 3); }
  else { const sx = 12 + r() * 76; blob(sx, 13, 6, 6, '#f2792e', '#ffd93b'); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; stroke([[sx + Math.cos(a) * 8, 13 + Math.sin(a) * 8], [sx + Math.cos(a) * 11, 13 + Math.sin(a) * 11]], '#f2792e', 0.9); } }

  const cx = 50 + (r() - 0.5) * 20, base = groundY + 4;
  let drew = false;
  if (has('house', 'home', 'igloo')) { drew = true; const c = pick(PAL); stroke([[cx - 14, base], [cx - 14, base - 16], [cx + 14, base - 16], [cx + 14, base]], '#1d2545', 1.4, true, '#fff1d6'); stroke([[cx - 17, base - 16], [cx, base - 28], [cx + 17, base - 16]], c, 1.6, true, c); stroke([[cx - 4, base], [cx - 4, base - 9], [cx + 3, base - 9], [cx + 3, base]], '#1d2545', 1.2, true, '#c9531c'); stroke([[cx + 6, base - 12], [cx + 11, base - 12], [cx + 11, base - 7], [cx + 6, base - 7]], '#1d2545', 1, true, night ? '#ffd93b' : '#bfe8ff'); }
  if (has('fish', 'whale')) { drew = true; const big = has('whale') ? 1.8 : 1, fx = has('house') ? 22 : cx, fy = groundY + 9; const c = pick(PAL); blob(fx, fy, 11 * big, 5.5 * big, '#1d2545', c); stroke([[fx + 10 * big, fy], [fx + 17 * big, fy - 6 * big], [fx + 17 * big, fy + 6 * big]], '#1d2545', 1.3, true, c); blob(fx - 6 * big, fy - 1.5 * big, 1.2, 1.2, '#1d2545', '#1d2545');
    if (has('whisker')) for (const d of [-1, 0, 1]) stroke([[fx - 10, fy + 1], [fx - 22, fy + d * 5]], '#1d2545', 0.7); }
  if (has('boat', 'lighthouse')) { drew = true; const bx = has('fish') ? 72 : cx; if (has('lighthouse')) { stroke([[bx - 5, groundY], [bx - 3, groundY - 26], [bx + 3, groundY - 26], [bx + 5, groundY]], '#1d2545', 1.3, true, '#fffaf0'); stroke([[bx - 4, groundY - 12], [bx + 4, groundY - 12]], '#e8452c', 2.2); blob(bx, groundY - 29, 3.5, 3, '#1d2545', '#ffd93b'); }
    else { stroke([[bx - 14, groundY - 2], [bx + 14, groundY - 2], [bx + 9, groundY + 5], [bx - 9, groundY + 5]], '#1d2545', 1.4, true, pick(PAL)); stroke([[bx, groundY - 2], [bx, groundY - 22]], '#1d2545', 1.2); stroke([[bx + 1, groundY - 21], [bx + 12, groundY - 6], [bx + 1, groundY - 6]], '#1d2545', 1.1, true, '#fffaf0'); } }
  if (has('lamp', 'light', 'mailbox')) { drew = true; const lx = has('house') ? 80 : cx; stroke([[lx, base], [lx, base - 24]], '#1d2545', 1.5); blob(lx, base - 27, 3.5, 3.5, '#1d2545', '#ffd93b'); g.globalAlpha = 0.25; g.fillStyle = '#ffd93b'; g.beginPath(); g.arc(lx * u, (base - 27) * u, 10 * u, 0, 6.283); g.fill(); g.globalAlpha = 1; }
  if (has('someone', 'waving', 'bo', 'pip', 'suvi', 'friend', 'me', 'penguin', 'asleep')) { drew = true; const px = has('house', 'lamp', 'boat') ? 22 : cx, col = has('bo', 'seal') ? '#9aa7b8' : has('suvi', 'fox') ? '#f4f1ea' : '#1d2545';
    if (has('asleep', 'sleep')) { blob(px, base - 5, 12, 5, '#1d2545', col); stroke([[px + 14, base - 14], [px + 18, base - 14], [px + 14, base - 18], [px + 18, base - 18]], '#6a2fc4', 0.9); }
    else { blob(px, base - 10, 7, 10, '#1d2545', col); blob(px, base - 8, 4, 6, '#1d2545', '#fffaf0'); blob(px - 2.5, base - 15, 1, 1, '#1d2545', '#1d2545'); blob(px + 2.5, base - 15, 1, 1, '#1d2545', '#1d2545'); stroke([[px - 1.5, base - 12.5], [px, base - 11], [px + 1.5, base - 12.5]], '#f2792e', 1.1, true, '#ffa62b');
      if (has('waving', 'someone', 'friend')) stroke([[px + 6, base - 12], [px + 13, base - 22]], '#1d2545', 1.6); } }
  if (has('pond', 'river') && !has('fish')) { drew = true; blob(cx, groundY + 8, 22, 6, '#2f7f9a', '#58b7e8'); for (let i = 0; i < 3; i++) blob(cx - 12 + i * 11, groundY + 7 + (r() - 0.5) * 3, 3, 1.4, '#fffaf0', '#fffaf0', 6); }
  if (has('flower', 'garden', 'tree') || !drew) { const n = drew ? 4 : 7; for (let i = 0; i < n; i++) { const fx = 10 + r() * 80, fy = groundY + 2 + r() * (top - groundY - 10), c = pick(PAL); stroke([[fx, fy + 6], [fx, fy]], '#4fae52', 0.9); for (let k = 0; k < 5; k++) { const a = k / 5 * 6.283; blob(fx + Math.cos(a) * 2, fy + Math.sin(a) * 2, 1.6, 1.6, c, c, 6); } blob(fx, fy, 1, 1, '#1d2545', '#ffd93b', 6); } }
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
let audio = null;
export function playTune(tune) {
  if (!tune) return;
  audio ||= new (window.AudioContext || window.webkitAudioContext)();
  const t0 = audio.currentTime + 0.05;
  tune.split('-').forEach((syl, i) => {
    const semis = NOTE[syl] ?? 0, f = 523.25 * Math.pow(2, semis / 12), t = t0 + i * 0.32;
    const o = audio.createOscillator(), o2 = audio.createOscillator(), gain = audio.createGain();
    o.type = 'triangle'; o.frequency.value = f; o2.type = 'sine'; o2.frequency.value = f * 2;
    gain.gain.setValueAtTime(0.0001, t); gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02); gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(gain); o2.connect(gain); gain.connect(audio.destination); o.start(t); o2.start(t); o.stop(t + 0.55); o2.stop(t + 0.55);
  });
}
