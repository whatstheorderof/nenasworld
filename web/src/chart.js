// The sea chart: an old parchment map of the sky around Nena's island, in a 7 × 7 grid.
// Tap a square to see what is there; zoom in on it; Nena's marker shows where she is.
import { GRID, CELL, EXTENT, COLS, features, squareAt, squareKey, squareName } from '../../shared/chart.js';

const INK = '#6b4a2b', INK_SOFT = 'rgba(107,74,43,.38)', RED = '#d9412b', PAPER = '#f1e0b0';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let root, cv, ctx, state = { sel: { col: 3, row: 3 }, hover: null, zoom: 1, info: {}, raf: 0, t: 0 };
const noise = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), d = g.createImageData(256, 256);
  for (let i = 0; i < d.data.length; i += 4) { const v = 200 + Math.random() * 55; d.data[i] = v; d.data[i + 1] = v * 0.9; d.data[i + 2] = v * 0.7; d.data[i + 3] = Math.random() * 26; } g.putImageData(d, 0, 0); return c; })();

function build() {
  root = document.createElement('div'); root.id = 'chart'; root.hidden = true;
  root.innerHTML = `
  <div class="chart-frame">
    <div class="chart-map"><canvas></canvas>
      <div class="chart-banner"><span id="chart-size">${EXTENT} × ${EXTENT} m</span><b id="chart-name"></b><span id="chart-key"></span></div>
    </div>
    <aside class="chart-side">
      <div class="chart-btns"><button id="chart-zoom" title="Zoom in on the square">Zoom ×1</button><button id="chart-close" title="Close the chart" aria-label="Close">✕</button></div>
      <div class="chart-card" id="chart-stats"></div>
      <div class="chart-card chart-detail" id="chart-detail"></div>
      <svg class="compass" viewBox="-60 -60 120 120" aria-hidden="true">
        <circle r="34" fill="none" stroke="${INK}" stroke-width="2"/><circle r="27" fill="none" stroke="${INK}" stroke-width="1" stroke-dasharray="2 3"/>
        <g fill="#e8c35a" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round">
          <path d="M0-50L9 0L0 50L-9 0Z"/><path d="M-50 0L0-9L50 0L0 9Z"/>
          <path d="M0-50L9 0L0 0Z" fill="#d9412b"/><path d="M-30-30L5-5L-5 5Z" fill="#f6e7b4"/><path d="M30-30L5 5L-5-5Z" fill="#f6e7b4"/><path d="M30 30L-5 5L5-5Z" fill="#f6e7b4"/><path d="M-30 30L-5-5L5 5Z" fill="#f6e7b4"/>
        </g><circle r="5" fill="#2f7f9a" stroke="${INK}" stroke-width="1.5"/>
        <g font-family="Nunito, sans-serif" font-weight="900" font-size="15" fill="${INK}" text-anchor="middle"><text y="-52">N</text><text y="62">S</text><text x="56" y="5">E</text><text x="-56" y="5">W</text></g>
      </svg>
    </aside>
  </div>`;
  document.body.appendChild(root);
  cv = root.querySelector('canvas'); ctx = cv.getContext('2d');
  root.querySelector('#chart-close').onclick = closeChart;
  root.querySelector('#chart-zoom').onclick = () => { state.zoom = state.zoom === 1 ? 3 : 1; root.querySelector('#chart-zoom').textContent = `Zoom ×${state.zoom}`; draw(); };
  root.addEventListener('click', e => { if (e.target === root) closeChart(); });
  cv.addEventListener('pointermove', e => { state.hover = cellAt(e); });
  cv.addEventListener('pointerleave', () => { state.hover = null; });
  cv.addEventListener('click', e => { const c = cellAt(e); if (c) { state.sel = c; detail(); } });
  addEventListener('keydown', e => {
    if (root.hidden) return;
    if (e.key === 'Escape') closeChart();
    const mv = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (mv) { e.preventDefault(); state.sel = { col: clamp(state.sel.col + mv[0], 0, GRID - 1), row: clamp(state.sel.row + mv[1], 0, GRID - 1) }; detail(); }
    if (e.key === 'z') root.querySelector('#chart-zoom').click();
  });
  addEventListener('resize', () => { if (!root.hidden) size(); });
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// the part of the world on show: the whole chart, or 3 × 3 squares round the chosen one
function view() {
  if (state.zoom === 1) return { x0: -EXTENT / 2, z0: -EXTENT / 2, w: EXTENT };
  const c = clamp(state.sel.col - 1, 0, GRID - 3), r = clamp(state.sel.row - 1, 0, GRID - 3);
  return { x0: c * CELL - EXTENT / 2, z0: r * CELL - EXTENT / 2, w: 3 * CELL };
}
let PAD = 26, S = 500;
function size() {
  const box = cv.parentElement.getBoundingClientRect(), px = Math.floor(Math.min(box.width, box.height - 40));
  const dpr = Math.min(devicePixelRatio || 1, 2); S = px; cv.style.width = cv.style.height = `${px}px`; cv.width = cv.height = Math.round(px * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); PAD = Math.max(18, px * 0.05); draw();
}
const toPx = (x, z, v) => { const k = (S - PAD * 2) / v.w; return [PAD + (x - v.x0) * k, PAD + (z - v.z0) * k]; };
function cellAt(e) {
  const r = cv.getBoundingClientRect(), v = view(), k = (S - PAD * 2) / v.w;
  const x = (e.clientX - r.left - PAD) / k + v.x0, z = (e.clientY - r.top - PAD) / k + v.z0; return squareAt(x, z);
}
// a wobbly hand-drawn blob
function blob(cx, cy, r, seed, n = 28) {
  ctx.beginPath();
  for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, w = 1 + 0.09 * Math.sin(a * 3 + seed) + 0.06 * Math.sin(a * 5 + seed * 2.3) + 0.04 * Math.sin(a * 9 + seed * 0.7);
    const x = cx + Math.cos(a) * r * w, y = cy + Math.sin(a) * r * w; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  ctx.closePath();
}
const hash = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };

function draw() {
  if (!ctx) return;
  const v = view(), k = (S - PAD * 2) / v.w, t = state.t;
  ctx.clearRect(0, 0, S, S);
  // parchment
  const g = ctx.createRadialGradient(S / 2, S / 2, S * 0.15, S / 2, S / 2, S * 0.75); g.addColorStop(0, '#f6e9c2'); g.addColorStop(1, '#e2c88e');
  ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
  ctx.globalAlpha = 0.8; ctx.fillStyle = ctx.createPattern(noise, 'repeat'); ctx.fillRect(0, 0, S, S); ctx.globalAlpha = 1;
  // faint sea swirls
  ctx.strokeStyle = 'rgba(107,74,43,.16)'; ctx.lineWidth = 1.2;
  for (let i = 0; i < 26; i++) { const x = hash(i, 1) * EXTENT - EXTENT / 2, z = hash(i, 2) * EXTENT - EXTENT / 2, [px, py] = toPx(x, z, v), w = 14 * Math.max(1, k * 60);
    ctx.beginPath(); for (let j = 0; j <= 3; j++) { const xx = px + j * w / 3; ctx.quadraticCurveTo(xx - w / 6, py - (j % 2 ? 4 : -4), xx, py); } ctx.stroke(); }

  // grid
  ctx.save(); ctx.beginPath(); ctx.rect(PAD, PAD, S - PAD * 2, S - PAD * 2); ctx.clip();
  ctx.strokeStyle = INK_SOFT; ctx.lineWidth = 1.4; ctx.setLineDash([5, 4]);
  for (let i = 0; i <= GRID; i++) { const [x] = toPx(i * CELL - EXTENT / 2, 0, v), [, y] = toPx(0, i * CELL - EXTENT / 2, v);
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, S); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(S, y); ctx.stroke(); }
  ctx.setLineDash([]);
  // little red rings: uncharted spots, as on old sea charts
  const fs = features();
  for (let c = 0; c < GRID; c++) for (let r = 0; r < GRID; r++) {
    if (hash(c + 3, r + 5) < 0.45) continue;
    const x = (c + 0.2 + hash(c, r) * 0.6) * CELL - EXTENT / 2, z = (r + 0.2 + hash(r, c) * 0.6) * CELL - EXTENT / 2;
    if (fs.some(f => Math.hypot(f.x - x, f.z - z) < f.r + 30)) continue;
    const [px, py] = toPx(x, z, v); ctx.strokeStyle = 'rgba(217,65,43,.6)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(px, py, 3 + k * 4, 0, 7); ctx.stroke();
  }
  // the chosen square
  { const [x, y] = toPx(state.sel.col * CELL - EXTENT / 2, state.sel.row * CELL - EXTENT / 2, v); ctx.fillStyle = 'rgba(232,69,44,.32)'; ctx.fillRect(x, y, CELL * k, CELL * k);
    ctx.strokeStyle = RED; ctx.lineWidth = 2.5; ctx.strokeRect(x + 1, y + 1, CELL * k - 2, CELL * k - 2); }

  // islands
  for (const f of fs) {
    const [px, py] = toPx(f.x, f.z, v), r = Math.max(f.kind === 'islet' ? 3.5 : 6, f.r * k), seed = f.x * 0.01 + f.z * 0.02;
    if (f.kind === 'home') {
      blob(px, py, r * 1.06, seed); ctx.fillStyle = '#e8cd8a'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.stroke();
      blob(px, py, r * 0.84, seed + 1); ctx.fillStyle = '#b9c486'; ctx.fill();
      ctx.fillStyle = '#8fb6c8'; ctx.beginPath(); ctx.ellipse(px, py + r * 0.42, r * 0.22, r * 0.15, 0, 0, 7); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.stroke();   // pond
      ctx.strokeStyle = '#6f97b0'; ctx.lineWidth = Math.max(1.5, r * 0.06); ctx.beginPath(); ctx.moveTo(px - r * 0.12, py + r * 0.5); ctx.quadraticCurveTo(px - r * 0.5, py + r * 0.45, px - r * 0.86, py + r * 0.55); ctx.stroke();   // river
      ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(px, py, r * 0.14, 0, 7); ctx.stroke();   // the square
      for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28 + 0.3, d = r * (0.35 + (i % 3) * 0.13); ctx.fillStyle = INK; ctx.fillRect(px + Math.cos(a) * d - 2, py + Math.sin(a) * d - 2, 4, 4); }   // little houses
    } else if (f.kind === 'islet') {
      const been = (state.info.islets || []).includes(f.name);
      blob(px, py, r, seed, 16); ctx.fillStyle = been ? '#d9c486' : 'rgba(0,0,0,0)'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.setLineDash(been ? [] : [3, 3]); ctx.stroke(); ctx.setLineDash([]);
    } else if (f.kind === 'town') {   // neighbouring towns: inked in, with little roofs
      const hole = f.id === 'hoop';
      blob(px, py, r, seed, 24); ctx.fillStyle = '#c9cf8f'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
      if (hole) { ctx.beginPath(); ctx.arc(px, py, r * 0.52, 0, 7); ctx.fillStyle = '#e7d3a0'; ctx.fill(); ctx.stroke(); }
      if (f.id === 'fountain') { ctx.beginPath(); ctx.arc(px, py, r * 0.5, 0, 7); ctx.fillStyle = '#ead7a6'; ctx.fill(); ctx.beginPath(); ctx.arc(px, py, r * 0.16, 0, 7); ctx.fillStyle = '#8fb6c8'; ctx.fill(); ctx.stroke(); }
      if (f.id === 'snowcap') { ctx.beginPath(); ctx.arc(px, py - r * 0.15, r * 0.32, 0, 7); ctx.fillStyle = '#fbf8ee'; ctx.fill(); ctx.stroke(); }
      const n = f.id === 'gable' ? 3 : hole ? 8 : 6, rr = hole ? r * 0.76 : f.id === 'fountain' ? r * 0.72 : r * 0.5;
      for (let i = 0; i < n; i++) { const a = i / n * 6.28 + 0.4, hx = px + Math.cos(a) * rr, hy = py + Math.sin(a) * rr, w = Math.max(3, r * 0.14);
        ctx.fillStyle = '#d9412b'; ctx.beginPath(); ctx.moveTo(hx - w, hy + w * 0.6); ctx.lineTo(hx, hy - w * 0.7); ctx.lineTo(hx + w, hy + w * 0.6); ctx.closePath(); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.stroke(); }
    } else {   // far sky islands: only sketched until she has been
      blob(px, py, r, seed, 22); ctx.fillStyle = 'rgba(107,74,43,.08)'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.setLineDash([6, 4]); ctx.stroke(); ctx.setLineDash([]);
      ctx.save(); blob(px, py, r, seed, 22); ctx.clip(); ctx.strokeStyle = 'rgba(107,74,43,.18)'; ctx.lineWidth = 1;
      for (let d = -r * 2; d < r * 2; d += 6) { ctx.beginPath(); ctx.moveTo(px + d, py - r); ctx.lineTo(px + d + r, py + r); ctx.stroke(); } ctx.restore();
      glyph(f.id, px, py, r);
    }
    if (k * f.r > 5 || f.kind !== 'islet') { ctx.font = `italic 800 ${Math.round(clamp(r * 0.32, 11, 17))}px Nunito, sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = INK;
      const label = f.kind === 'sky' ? cap(f.name) : f.name; ctx.fillText(label, px, py + r + 15); }
  }
  // Nena
  { const at = state.info.at || { x: 0, z: 0 }, [px, py] = toPx(at.x, at.z, v), pulse = 1 + 0.25 * Math.sin(t * 4);
    ctx.strokeStyle = 'rgba(217,65,43,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py, 9 * pulse, 0, 7); ctx.stroke();
    ctx.save(); ctx.translate(px, py); ctx.rotate(-(state.info.heading || 0) + Math.PI); ctx.fillStyle = '#ffd93b'; ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(6.5, 7); ctx.lineTo(0, 3.5); ctx.lineTo(-6.5, 7); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
  // corner brackets round the square under the pointer
  if (state.hover) { const [x, y] = toPx(state.hover.col * CELL - EXTENT / 2, state.hover.row * CELL - EXTENT / 2, v), w = CELL * k, b = Math.min(14, w * 0.25);
    ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    for (const [cx, cy, dx, dy] of [[x + 4, y + 4, 1, 1], [x + w - 4, y + 4, -1, 1], [x + 4, y + w - 4, 1, -1], [x + w - 4, y + w - 4, -1, -1]]) { ctx.beginPath(); ctx.moveTo(cx + dx * b, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + dy * b); ctx.stroke(); }
    ctx.lineCap = 'butt'; }
  ctx.restore();
  // frame and coordinates
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(PAD, PAD, S - PAD * 2, S - PAD * 2); ctx.lineWidth = 1; ctx.strokeRect(PAD - 5, PAD - 5, S - PAD * 2 + 10, S - PAD * 2 + 10);
  ctx.fillStyle = INK; ctx.font = `900 ${Math.round(PAD * 0.5)}px Nunito, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let i = 0; i < GRID; i++) { const [x] = toPx((i + 0.5) * CELL - EXTENT / 2, 0, v), [, y] = toPx(0, (i + 0.5) * CELL - EXTENT / 2, v);
    if (x > PAD && x < S - PAD) ctx.fillText(COLS[i], x, PAD * 0.45); if (y > PAD && y < S - PAD) ctx.fillText(String(i + 1), PAD * 0.45, y); }
  ctx.textBaseline = 'alphabetic';
}
// small pictures for the far islands' themes
function glyph(id, x, y, r) {
  ctx.strokeStyle = INK; ctx.fillStyle = INK; ctx.lineWidth = 1.8; const s = Math.max(6, r * 0.45);
  if (id === 'ember') { ctx.beginPath(); ctx.moveTo(x - s, y + s * 0.6); ctx.lineTo(x - s * 0.25, y - s * 0.5); ctx.lineTo(x + s * 0.25, y - s * 0.5); ctx.lineTo(x + s, y + s * 0.6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y - s * 0.7); ctx.quadraticCurveTo(x + s * 0.4, y - s * 1.1, x + s * 0.1, y - s * 1.5); ctx.stroke(); }
  else if (id === 'wood') for (const dx of [-0.5, 0.3]) { const cx = x + dx * s; ctx.beginPath(); ctx.moveTo(cx, y - s * 0.8); ctx.lineTo(cx + s * 0.4, y + s * 0.3); ctx.lineTo(cx - s * 0.4, y + s * 0.3); ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx, y + s * 0.3); ctx.lineTo(cx, y + s * 0.6); ctx.stroke(); }
  else { for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * s * 0.7, y - Math.sin(a) * s * 0.7); ctx.lineTo(x + Math.cos(a) * s * 0.7, y + Math.sin(a) * s * 0.7); ctx.stroke(); } }
  ctx.font = `900 ${Math.round(s * 0.9)}px Nunito, sans-serif`; ctx.textAlign = 'center'; ctx.fillText('?', x + r * 0.62, y - r * 0.45);
}
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

function detail() {
  const { col, row } = state.sel, key = squareKey(col, row), name = squareName(col, row);
  root.querySelector('#chart-name').textContent = name; root.querySelector('#chart-key').textContent = key;
  const cx = (col + 0.5) * CELL - EXTENT / 2, cz = (row + 0.5) * CELL - EXTENT / 2;
  const here = features().filter(f => Math.abs(f.x - cx) <= CELL / 2 && Math.abs(f.z - cz) <= CELL / 2);
  const at = state.info.at, nenaHere = at && squareAt(at.x, at.z)?.col === col && squareAt(at.x, at.z)?.row === row;
  root.querySelector('#chart-detail').innerHTML = `<small>Square ${key}</small><h3>${esc(name)}</h3>` + (here.length ? here.map(f => `<p><b>${esc(cap(f.name))}</b> ${esc(f.about)}</p>${f.resources ? `<p class="res">${f.resources.map(r => `<span>${esc(r)}</span>`).join('')}</p>` : ''}`).join('') : '<p>Open sky. Nothing charted here yet.</p>') + (nenaHere ? '<p class="here">◆ Nena is here</p>' : '');
  draw();
}
function stats() {
  const fs = features(), islets = fs.filter(f => f.kind === 'islet'), been = (state.info.islets || []).length, far = fs.filter(f => f.kind === 'sky');
  root.querySelector('#chart-stats').innerHTML = `<div><span>🏝️</span><b>${1 + been + fs.filter(f => f.kind === 'town').length}</b><small>of ${fs.length} islands charted</small></div>
    <div><span>⛵</span><b>${been}/${islets.length}</b><small>islets rowed to</small></div>
    <div><span>🏘️</span><b>${fs.filter(f => f.kind === 'town').length}</b><small>neighbouring towns</small></div>
    <div><span>☁️</span><b>${far.length}</b><small>far islands in the haze</small></div>`;
}
function loop() { state.t += 1 / 60; draw(); state.raf = requestAnimationFrame(loop); }

// info: { islets: [names she has rowed to], at: {x, z} where she is, heading }
export function openChart(info = {}) {
  if (!root) build();
  state.info = info; root.hidden = false; document.body.classList.add('charting');
  const sq = info.at && squareAt(info.at.x, info.at.z); if (sq) state.sel = sq;
  requestAnimationFrame(() => { size(); stats(); detail(); cancelAnimationFrame(state.raf); loop(); });
}
export function updateChart(info) { if (root && !root.hidden) { state.info = { ...state.info, ...info }; } }
export function closeChart() { if (!root) return; root.hidden = true; document.body.classList.remove('charting'); cancelAnimationFrame(state.raf); }
export const chartOpen = () => root && !root.hidden;
