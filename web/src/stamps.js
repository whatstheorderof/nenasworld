// Nena's stamps, drawn as little postage stamps: perforated edge, a coloured
// picture, the name along the bottom, and a postmark with the day she earned it.

const INK = '#1d2545';
// [background, accent] per stamp, and what to draw on it
const LOOK = {
  first: ['#bfe8ff', '#e8452c', 'fish'], angler: ['#58b7e8', '#ffd93b', 'rod'], bugs: ['#cdeeb0', '#e8452c', 'ladybird'], diver: ['#2f7f9a', '#ffd93b', 'bubbles'],
  curator: ['#f4efe2', '#5f82ad', 'columns'], fullmuseum: ['#ffd93b', '#5f82ad', 'trophy'], maker: ['#ffd9b0', '#c9531c', 'hammer'], designer: ['#e2f5e0', '#c9531c', 'bench'],
  green: ['#cdeeb0', '#4fae52', 'sprout'], neighbour: ['#ffd9de', '#e8452c', 'hearts'], best: ['#ff7fa3', '#fffaf0', 'heart'], home: ['#fff1d6', '#e8452c', 'house'],
  cocoa: ['#e9c9a8', '#8a5a3a', 'cup'], sailor: ['#9fd6f0', '#e8452c', 'boat'], songs: ['#3c2a86', '#ffd93b', 'record'], party: ['#ffd93b', '#6a2fc4', 'partyhat'],
  breeder: ['#ffeef1', '#6a2fc4', 'flowers'], goldbloom: ['#3c2a86', '#ffc400', 'goldflower'], host: ['#cdeeb0', '#2fc6b3', 'tent'], traveller: ['#9fd6f0', '#4fae52', 'islets'],
  joiner: ['#fff3c4', '#f2792e', 'hands'], wardrobe: ['#ffd9de', '#2f7f9a', 'hat'], shades: ['#ffd93b', '#1d2545', 'shades'], starchart: ['#1d2545', '#ffd93b', 'constellation'],
  comet: ['#1d2545', '#9fe0c8', 'comet'], rider: ['#dff3ff', '#2fc6b3', 'robot'], puddles: ['#b4c8dc', '#ffd93b', 'boots'], rainbow: ['#bfe8ff', '#e8452c', 'rainbow'],
  kite: ['#9fd6f0', '#e8452c', 'kite'], storm: ['#3b4252', '#ffd93b', 'lightning'], keeper: ['#1d2545', '#fff3c4', 'lighthouse'], farsight: ['#ffe3c2', '#5f82ad', 'telescope'],
  chatter: ['#fff1d6', '#2fc6b3', 'speech'], regulars: ['#e2f5e0', '#6a2fc4', 'gulls'],
};

// ---- tiny drawing kit: chunky shapes with a dark outline, in a 100x100 box ----
function kit(g, ox, oy, s) {
  const P = (x, y) => [ox + x * s, oy + y * s];
  const go = (fill, w = 3) => { if (fill) { g.fillStyle = fill; g.fill(); } g.strokeStyle = INK; g.lineWidth = w * s; g.lineJoin = g.lineCap = 'round'; g.stroke(); };
  return {
    circle: (x, y, r, fill, w) => { g.beginPath(); g.arc(...P(x, y), r * s, 0, 6.283); go(fill, w); },
    ellipse: (x, y, rx, ry, fill, rot = 0, w) => { g.beginPath(); g.ellipse(...P(x, y), rx * s, ry * s, rot, 0, 6.283); go(fill, w); },
    rect: (x, y, w_, h, fill, r = 3, w) => { g.beginPath(); g.roundRect(...P(x, y), w_ * s, h * s, r * s); go(fill, w); },
    poly: (pts, fill, w, close = true) => { g.beginPath(); pts.forEach(([x, y], i) => g[i ? 'lineTo' : 'moveTo'](...P(x, y))); if (close) g.closePath(); go(fill, w); },
    line: (pts, w = 3, col = INK) => { g.beginPath(); pts.forEach(([x, y], i) => g[i ? 'lineTo' : 'moveTo'](...P(x, y))); g.strokeStyle = col; g.lineWidth = w * s; g.lineCap = g.lineJoin = 'round'; g.stroke(); },
    arc: (x, y, r, a0, a1, w = 3, col = INK) => { g.beginPath(); g.arc(...P(x, y), r * s, a0, a1); g.strokeStyle = col; g.lineWidth = w * s; g.lineCap = 'round'; g.stroke(); },
    star: (x, y, r, fill, w = 2) => { const pts = []; for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); } g.beginPath(); pts.forEach(([px, py], i) => g[i ? 'lineTo' : 'moveTo'](...P(px, py))); g.closePath(); go(fill, w); },
  };
}

const ICON = {
  fish: (k, a) => { k.poly([[70, 50], [88, 36], [88, 64]], a); k.ellipse(46, 50, 28, 16, a); k.circle(32, 46, 3.5, INK, 1); k.line([[50, 40], [54, 50], [50, 60]], 2.5); },
  rod: (k, a) => { k.line([[22, 82], [72, 18]], 5, '#8a5a3a'); k.line([[72, 18], [74, 56]], 1.5); k.ellipse(74, 64, 12, 7, a, 0.3); k.poly([[84, 61], [92, 55], [92, 68]], a); k.circle(30, 72, 5, '#fffaf0'); },
  ladybird: (k, a) => { k.circle(50, 24, 9, INK); k.ellipse(50, 56, 26, 28, a); k.line([[50, 30], [50, 84]], 2.5); for (const [x, y] of [[38, 48], [62, 48], [36, 66], [64, 66], [50, 76]]) k.circle(x, y, 4, INK, 0.5); },
  bubbles: (k, a) => { k.circle(36, 64, 16, '#9fe0c8'); k.circle(64, 42, 11, '#9fe0c8'); k.circle(52, 18, 7, '#9fe0c8'); k.ellipse(36, 64, 9, 6, a, 0, 1.5); k.circle(66, 72, 5, '#9fe0c8'); },
  columns: (k, a) => { k.poly([[16, 34], [50, 14], [84, 34]], a); for (const x of [24, 42, 58, 76]) k.rect(x - 5, 36, 10, 40, '#fffaf0', 1); k.rect(12, 76, 76, 9, a, 2); },
  trophy: (k, a) => { k.poly([[30, 16], [70, 16], [64, 50], [36, 50]], '#fffaf0'); k.arc(28, 30, 9, 1.6, 4.7, 4); k.arc(72, 30, 9, -1.6, 1.6, 4); k.rect(44, 50, 12, 16, '#fffaf0', 1); k.rect(30, 66, 40, 12, a, 2); k.star(50, 32, 9, a); },
  hammer: (k, a) => { k.line([[30, 84], [64, 36]], 8, '#8a5a3a'); k.rect(48, 14, 36, 18, a, 3); k.poly([[48, 23], [40, 18], [40, 28]], a); },
  bench: (k, a) => { k.rect(14, 30, 72, 14, a, 3); k.rect(14, 52, 72, 10, a, 3); for (const x of [22, 72]) k.rect(x, 62, 6, 20, '#8a5a3a', 1); },
  sprout: (k, a) => { k.rect(30, 66, 40, 18, '#c9744a', 3); k.line([[50, 66], [50, 34]], 4, '#2f8f4a'); k.ellipse(36, 36, 14, 8, a, -0.5); k.ellipse(64, 28, 14, 8, a, 0.5); },
  hearts: (k, a) => { const h = (x, y, r, f) => k.poly([[x, y + r], [x - r, y], [x - r * 0.5, y - r * 0.7], [x, y - r * 0.3], [x + r * 0.5, y - r * 0.7], [x + r, y]], f); h(36, 46, 18, a); h(66, 56, 16, '#ffd93b'); h(50, 26, 10, '#ff7fa3'); },
  heart: (k, a) => { k.poly([[50, 84], [16, 46], [24, 22], [42, 18], [50, 32], [58, 18], [76, 22], [84, 46]], '#e8452c'); k.ellipse(34, 32, 6, 4, a, -0.6, 0); },
  house: (k, a) => { k.rect(22, 44, 56, 40, '#fffaf0', 2); k.poly([[14, 46], [50, 16], [86, 46]], a); k.rect(42, 60, 16, 24, '#c9531c', 2); k.rect(60, 52, 12, 10, '#ffd93b', 1); },
  cup: (k, a) => { k.poly([[24, 34], [70, 34], [64, 80], [30, 80]], '#fffaf0'); k.arc(72, 52, 10, -1.4, 1.4, 4); k.ellipse(47, 34, 23, 6, a); for (const x of [38, 50, 62]) k.line([[x, 24], [x + 3, 16], [x, 8]], 2, '#8a5a3a'); },
  boat: (k, a) => { k.poly([[14, 62], [86, 62], [74, 80], [26, 80]], a); k.line([[50, 62], [50, 16]], 3); k.poly([[52, 18], [80, 56], [52, 56]], '#fffaf0'); k.line([[8, 88], [24, 84], [40, 88], [56, 84], [72, 88], [92, 84]], 2.5, '#2f7f9a'); },
  record: (k, a) => { k.circle(50, 50, 36, INK); k.circle(50, 50, 26, null, 1); k.arc(50, 50, 30, 3.6, 4.6, 1.5, '#fffaf0'); k.circle(50, 50, 12, a); k.circle(50, 50, 2.5, INK, 0.5); },
  partyhat: (k, a) => { k.poly([[50, 12], [76, 80], [24, 80]], a); k.line([[38, 50], [62, 50]], 4, '#ff7fa3'); k.line([[31, 68], [69, 68]], 4, '#2fc6b3'); k.circle(50, 12, 7, '#ff7fa3'); for (const [x, y, c] of [[16, 30, '#2fc6b3'], [84, 26, '#ff7fa3'], [86, 56, '#ffd93b'], [12, 60, '#e8452c']]) k.rect(x - 3, y - 3, 6, 6, c, 1, 1); },
  flowers: (k, a) => { const fl = (x, y, c) => { k.line([[x, y + 6], [x, 86]], 3, '#2f8f4a'); for (let i = 0; i < 5; i++) { const t = i / 5 * 6.283; k.circle(x + Math.cos(t) * 8, y + Math.sin(t) * 8, 6, c, 1.5); } k.circle(x, y, 5, '#ffd93b', 1.5); }; fl(28, 42, '#e8452c'); fl(52, 28, a); fl(74, 46, '#58b7e8'); },
  goldflower: (k, a) => { k.line([[50, 52], [50, 88]], 4, '#2f8f4a'); for (let i = 0; i < 6; i++) { const t = i / 6 * 6.283; k.ellipse(50 + Math.cos(t) * 16, 38 + Math.sin(t) * 16, 12, 8, a, t); } k.circle(50, 38, 9, '#fff3c4'); for (const [x, y] of [[16, 18], [84, 24], [80, 70]]) k.star(x, y, 5, '#fff3c4', 1); },
  tent: (k, a) => { k.poly([[50, 16], [88, 80], [12, 80]], '#fffaf0'); k.poly([[50, 16], [62, 80], [38, 80]], a); k.poly([[50, 46], [58, 80], [42, 80]], INK); k.line([[50, 16], [50, 8]], 2); k.poly([[50, 8], [62, 12], [50, 16]], '#e8452c', 1.5); },
  islets: (k, a) => { k.line([[6, 70], [94, 70]], 2.5, '#2f7f9a'); for (const [x, w, h] of [[24, 18, 16], [56, 14, 22], [82, 10, 12]]) { k.ellipse(x, 70, w, 5, '#f7dc8f', 0, 2); k.poly([[x - w * 0.6, 68], [x, 68 - h], [x + w * 0.6, 68]], a, 2); } },
  hands: (k, a) => { k.circle(32, 34, 13, '#fffaf0'); k.circle(68, 34, 13, '#fffaf0'); k.poly([[18, 84], [24, 52], [42, 52], [48, 68]], a); k.poly([[82, 84], [76, 52], [58, 52], [52, 68]], '#ffd93b'); k.circle(50, 68, 7, '#fff1d6'); },
  hat: (k, a) => { k.ellipse(50, 66, 38, 10, a); k.poly([[28, 64], [32, 30], [68, 30], [72, 64]], a); k.rect(30, 52, 40, 8, '#e8452c', 2, 2); k.ellipse(50, 30, 18, 5, a); },
  shades: (k, a) => { k.line([[10, 40], [24, 44]], 4); k.line([[90, 40], [76, 44]], 4); k.rect(20, 40, 26, 22, a, 8); k.rect(54, 40, 26, 22, a, 8); k.line([[46, 46], [54, 46]], 4); k.line([[26, 46], [34, 46]], 2, '#fffaf0'); },
  constellation: (k, a) => { const pts = [[18, 70], [34, 46], [52, 54], [66, 28], [84, 36]]; k.line(pts, 1.5, '#fff3c4'); pts.forEach(([x, y], i) => k.star(x, y, i === 3 ? 9 : 6, a, 1)); k.circle(80, 76, 7, '#fff3c4', 1); },
  comet: (k, a) => { k.poly([[24, 76], [70, 20], [80, 32]], a, 0); k.poly([[30, 82], [60, 40], [74, 46]], '#fffaf0', 0); k.circle(74, 26, 10, '#fff3c4', 2); for (const [x, y] of [[20, 20], [40, 30], [86, 70]]) k.star(x, y, 4, '#fff3c4', 1); },
  robot: (k, a) => { k.ellipse(50, 64, 34, 12, '#5b657a'); k.rect(16, 56, 68, 8, '#3b4252', 3, 2); k.rect(40, 50, 20, 4, a, 2, 1); k.ellipse(50, 40, 12, 14, INK, 0, 2); k.ellipse(50, 44, 7, 8, '#fffaf0', 0, 1); k.poly([[47, 36], [53, 36], [50, 40]], '#ffa62b', 1); },
  boots: (k, a) => { k.poly([[22, 24], [42, 24], [42, 66], [52, 66], [52, 80], [22, 80]], a); k.poly([[56, 30], [76, 30], [76, 70], [86, 70], [86, 84], [56, 84]], a); k.ellipse(52, 88, 40, 5, '#58b7e8', 0, 2); for (const x of [10, 90]) k.circle(x, 76, 4, '#58b7e8', 1.5); },
  rainbow: (k, a) => { ['#e8452c', '#f2792e', '#ffd93b', '#4fae52', '#58b7e8', '#6a2fc4'].forEach((c, i) => k.arc(50, 78, 38 - i * 5, Math.PI, 0, 5, c)); k.ellipse(16, 78, 12, 7, '#fffaf0', 0, 2); k.ellipse(84, 78, 12, 7, '#fffaf0', 0, 2); },
  kite: (k, a) => { k.poly([[56, 10], [80, 34], [56, 66], [32, 34]], a); k.line([[56, 10], [56, 66]], 2); k.line([[32, 34], [80, 34]], 2); k.line([[56, 66], [48, 76], [56, 84], [44, 92]], 2); k.line([[56, 66], [22, 90]], 1); },
  lightning: (k, a) => { k.ellipse(36, 30, 22, 13, '#9aa3ad'); k.ellipse(62, 26, 24, 15, '#9aa3ad'); k.poly([[56, 38], [40, 64], [52, 64], [44, 90], [70, 56], [56, 56], [64, 38]], a); },
  lighthouse: (k, a) => { k.poly([[38, 84], [42, 34], [58, 34], [62, 84]], '#fffaf0'); k.poly([[40, 70], [60, 70], [61, 58], [39, 58]], '#e8452c', 2); k.rect(40, 24, 20, 10, a, 2); k.poly([[38, 24], [50, 12], [62, 24]], '#e8452c'); k.poly([[60, 26], [96, 14], [96, 40]], 'rgba(255,243,196,0.6)', 0); k.poly([[40, 26], [4, 14], [4, 40]], 'rgba(255,243,196,0.6)', 0); },
  telescope: (k, a) => { k.poly([[18, 60], [70, 24], [78, 36], [26, 72]], a); k.line([[46, 54], [34, 86]], 3); k.line([[46, 54], [60, 86]], 3); k.circle(74, 30, 8, '#fff3c4', 2); k.poly([[86, 76], [92, 66], [98, 76]], '#4fae52', 1.5); },
  speech: (k, a) => { k.poly([[10, 18], [62, 18], [62, 52], [30, 52], [20, 64], [22, 52], [10, 52]], '#fffaf0'); k.poly([[42, 44], [90, 44], [90, 76], [80, 76], [82, 88], [70, 76], [42, 76]], a); for (const x of [56, 66, 76]) k.circle(x, 60, 3, INK, 0.5); },
  gulls: (k, a) => { const gull = (x, y, sc) => k.line([[x - 14 * sc, y], [x - 6 * sc, y - 7 * sc], [x, y], [x + 6 * sc, y - 7 * sc], [x + 14 * sc, y]], 3); gull(30, 36, 1.1); gull(66, 26, 0.8); gull(70, 60, 1.3); gull(26, 70, 0.7); k.circle(84, 18, 7, '#ffd93b', 1.5); },
};

// Draw one stamp. earned: day number or null. w,h in pixels.
export function drawStamp(canvas, st, earnedDay, { w = canvas.width, h = canvas.height } = {}) {
  const g = canvas.getContext('2d'), [bg, accent, icon] = LOOK[st.id] || ['#fff1d6', '#e8452c', 'heart'];
  const got = earnedDay != null, R = w * 0.045, margin = R * 1.6;
  g.clearRect(0, 0, w, h);
  // perforated paper
  g.save(); g.fillStyle = got ? '#fffaf0' : '#e8e4dc'; g.shadowColor = 'rgba(29,37,69,0.25)'; g.shadowBlur = 6; g.shadowOffsetY = 2;
  g.beginPath(); g.rect(R, R, w - 2 * R, h - 2 * R); g.fill(); g.restore();
  g.globalCompositeOperation = 'destination-out';
  const holes = (len, n) => Array.from({ length: n }, (_, i) => (i + 0.5) * len / n);
  for (const x of holes(w, Math.round(w / (R * 3)))) { g.beginPath(); g.arc(x, R, R * 0.8, 0, 6.283); g.arc(x, h - R, R * 0.8, 0, 6.283); g.fill(); }
  for (const y of holes(h, Math.round(h / (R * 3)))) { g.beginPath(); g.arc(R, y, R * 0.8, 0, 6.283); g.arc(w - R, y, R * 0.8, 0, 6.283); g.fill(); }
  g.globalCompositeOperation = 'source-over';
  // picture panel
  const px = margin, py = margin, pw = w - margin * 2, ph = h * 0.68;
  g.fillStyle = got ? bg : '#cfcac2'; g.beginPath(); g.roundRect(px, py, pw, ph, R * 0.6); g.fill();
  g.strokeStyle = got ? INK : '#9a958d'; g.lineWidth = Math.max(1.5, w * 0.012); g.stroke();
  // icon
  g.save(); g.beginPath(); g.roundRect(px, py, pw, ph, R * 0.6); g.clip();
  const size = Math.min(pw, ph) * 0.86, s = size / 100;
  if (got) ICON[icon]?.(kit(g, px + (pw - size) / 2, py + (ph - size) / 2, s), accent);
  else { g.globalAlpha = 0.55; ICON[icon]?.(kit(g, px + (pw - size) / 2, py + (ph - size) / 2, s), '#b8b2a8'); g.globalAlpha = 1;
    g.fillStyle = 'rgba(230,226,218,0.72)'; g.fillRect(px, py, pw, ph);
    g.fillStyle = '#7d786f'; g.font = `900 ${ph * 0.42}px Nunito, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', px + pw / 2, py + ph / 2 + ph * 0.03); }
  g.restore();
  // value in the corner, like a real stamp
  if (got) { g.font = `900 ${h * 0.065}px Nunito, sans-serif`; g.textAlign = 'right'; g.textBaseline = 'top'; g.lineWidth = h * 0.016; g.strokeStyle = '#fffaf0'; g.strokeText(st.coins, px + pw - R * 0.4, py + R * 0.3); g.fillStyle = INK; g.fillText(st.coins, px + pw - R * 0.4, py + R * 0.3); }
  // name
  const ty = py + ph + (h - margin - py - ph) / 2;
  g.fillStyle = got ? INK : '#8a857c'; g.textAlign = 'center'; g.textBaseline = 'middle';
  let fs = h * 0.082; g.font = `900 ${fs}px Nunito, sans-serif`;
  const name = got ? st.name : 'not yet';
  while (g.measureText(name).width > pw && fs > 8) { fs -= 1; g.font = `900 ${fs}px Nunito, sans-serif`; }
  g.fillText(name, w / 2, ty);
  // postmark
  if (got) {
    const cx = w * 0.7, cy = h * 0.6, r = w * 0.19; g.save(); g.translate(cx, cy); g.rotate(-0.35); g.globalAlpha = 0.55; g.strokeStyle = '#3c2a86'; g.lineWidth = Math.max(1.2, w * 0.012);
    g.beginPath(); g.arc(0, 0, r, 0, 6.283); g.stroke(); g.beginPath(); g.arc(0, 0, r * 0.78, 0, 6.283); g.stroke();
    g.fillStyle = '#3c2a86'; g.font = `900 ${r * 0.34}px Nunito, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(`DAY ${earnedDay}`, 0, 0);
    g.font = `800 ${r * 0.2}px Nunito, sans-serif`; g.fillText('NENA ISLAND', 0, -r * 0.48); g.fillText('POST', 0, r * 0.5);
    for (let i = 0; i < 4; i++) { g.beginPath(); const y = -r * 0.35 + i * r * 0.24; g.moveTo(r * 1.1, y); for (let x = 0; x < 5; x++) g.quadraticCurveTo(r * 1.25 + x * r * 0.3, y - r * 0.1, r * 1.4 + x * r * 0.3, y); g.stroke(); }
    g.restore();
  }
}
