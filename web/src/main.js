import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { PLACES, NEEDS, site } from '../../shared/world.js';
import { buildNena } from './nena.js';
import { buildTown } from './town.js';

const MIND = (import.meta.env.VITE_MIND_URL || 'http://localhost:8787').replace(/\/$/, '');
const qs = new URLSearchParams(location.search);   // ?hour=23&weather=aurora to preview a look
const $ = id => document.getElementById(id);

// ---- scene ---------------------------------------------------------------
const canvas = $('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x7fe9ff, 70, 170);
const camera = new THREE.PerspectiveCamera(42, 1, 0.5, 400);
camera.position.set(PLACES.home.x + 10, 9, PLACES.home.z + 15);
const controls = new OrbitControls(camera, canvas);
controls.target.set(PLACES.home.x, 1, PLACES.home.z);
controls.enableDamping = true; controls.enablePan = false;
controls.minDistance = 8; controls.maxDistance = 75; controls.maxPolarAngle = 1.45;

const hemi = new THREE.HemisphereLight(0xffffff, 0x9fd27a, 1.5); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2d8, 2.0); sun.position.set(20, 30, 12); scene.add(sun);

const { town, setNight, pond, flag } = buildTown(); scene.add(town);
const nena = buildNena(); nena.root.scale.setScalar(1.45); scene.add(nena.root);
nena.root.position.set(PLACES.home.x, 0, PLACES.home.z);

// stars
const starGeo = new THREE.BufferGeometry();
{ const v = []; for (let i = 0; i < 700; i++) { const a = Math.random() * 6.28, e = Math.random() * 1.3 + 0.08, r = 260; v.push(Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r); } starGeo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); }
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false })); scene.add(stars);

// aurora: a few soft green ribbons
const aurora = new THREE.Group(); scene.add(aurora);
{ const c = document.createElement('canvas'); c.width = 8; c.height = 128; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 128);
  gr.addColorStop(0, 'rgba(120,255,200,0)'); gr.addColorStop(0.55, 'rgba(90,255,170,0.9)'); gr.addColorStop(0.85, 'rgba(150,120,255,0.5)'); gr.addColorStop(1, 'rgba(120,255,200,0)'); g.fillStyle = gr; g.fillRect(0, 0, 8, 128);
  const tex = new THREE.CanvasTexture(c);
  for (let i = 0; i < 3; i++) { const geo = new THREE.PlaneGeometry(190, 42, 40, 1); const p = geo.attributes.position; for (let j = 0; j < p.count; j++) p.setZ(j, Math.sin(p.getX(j) * 0.05 + i * 2) * 14);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    m.position.set(-10 + i * 12, 62 + i * 9, -120 - i * 22); aurora.add(m); } }

// snow
const SNOW = 900, snowGeo = new THREE.BufferGeometry();
{ const v = new Float32Array(SNOW * 3); for (let i = 0; i < SNOW; i++) { v[i * 3] = (Math.random() - 0.5) * 80; v[i * 3 + 1] = Math.random() * 30; v[i * 3 + 2] = (Math.random() - 0.5) * 80; } snowGeo.setAttribute('position', new THREE.BufferAttribute(v, 3)); }
const snow = new THREE.Points(snowGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.22, transparent: true, opacity: 0 })); scene.add(snow);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0, 0.5, 0.82); composer.addPass(bloom);
composer.addPass(new OutputPass());
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); composer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

// ---- sky by the hour -------------------------------------------------------
const SKY = { day: new THREE.Color(0x7fe9ff), night: new THREE.Color(0x0b1030), dusk: new THREE.Color(0xff9e7a) };
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const sky = new THREE.Color();
let wx = { snow: 0, aurora: 0, mist: 0 };
function setSky(hour, weather, dt) {
  const d = smooth(5, 7.5, hour) * (1 - smooth(18.5, 21, hour)), n = 1 - d;
  sky.copy(SKY.night).lerp(SKY.day, d).lerp(SKY.dusk, 4 * d * (1 - d) * 0.55);
  const k = 1 - Math.exp(-dt * 1.5);
  for (const key of Object.keys(wx)) wx[key] += ((weather === key ? 1 : 0) - wx[key]) * k;
  if (wx.mist > 0.01) sky.lerp(new THREE.Color(d > 0.5 ? 0xd8eef5 : 0x232a45), wx.mist * 0.6);
  scene.background = sky; scene.fog.color.copy(sky);
  scene.fog.near = 70 - wx.mist * 62; scene.fog.far = 170 - wx.mist * 110;
  hemi.intensity = 0.28 + d * 1.25; hemi.color.set(d > 0.5 ? 0xffffff : 0x8fa8ff); hemi.groundColor.set(d > 0.5 ? 0x9fd27a : 0x1d2545);
  sun.intensity = d * 2.0 + n * 0.25; sun.color.set(d > 0.5 ? 0xfff2d8 : 0x9bb4ff);
  stars.material.opacity = n * (1 - wx.mist) * 0.95;
  aurora.children.forEach((m, i) => { m.material.opacity = n * wx.aurora * (0.55 + 0.2 * Math.sin(performance.now() / 1700 + i * 2)); });
  snow.material.opacity = wx.snow * 0.9;
  bloom.strength = n * 0.45;
  setNight(n, now?.activity?.phase === 'doing' && now.activity.action === 'watch_film', performance.now() / 1000);
  document.body.style.background = `#${sky.getHexString()}`;
}

// ---- live state --------------------------------------------------------------
let now = null, online = false;
const feed = [];
const target = new THREE.Vector3(PLACES.home.x, 0, PLACES.home.z);
function connect() {
  const ws = new WebSocket(MIND.replace(/^http/, 'ws'));
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.type === 'hello') { feed.length = 0; feed.push(...m.feed); apply(m.now, true); }
    if (m.type === 'now') apply(m.now);
    if (m.type === 'feed') { feed.push(m.item); if (openPanel === 'feed') show('feed'); }
  };
  ws.onopen = () => { online = true; $('offline').hidden = true; };
  ws.onclose = () => { online = false; $('offline').hidden = false; setTimeout(connect, 4000); };
  ws.onerror = () => ws.close();
}
connect();

const NEED_COLORS = { fullness: '#f2792e', energy: '#ffd93b', wonder: '#6a2fc4', joy: '#ff7fa3', calm: '#2fc6b3' };
$('needs').innerHTML = NEEDS.map(k => `<div class="need"><span>${k[0].toUpperCase() + k.slice(1)}</span><div class="bar"><i id="need-${k}" style="background:${NEED_COLORS[k]}"></i></div></div>`).join('');
const clockText = h => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.floor((h % 1) * 60)).padStart(2, '0')}`;

function apply(n, snap) {
  now = n;
  target.set(n.pos.x, 0, n.pos.z);
  if (snap) nena.root.position.copy(target);
  $('clock').textContent = `Day ${n.day} · ${clockText(n.hour)} · ${n.weather} · feeling ${n.mood}`;
  $('doing').textContent = n.activity.label + (n.activity.detail && n.activity.phase === 'doing' ? `: ${n.activity.detail}` : '');
  $('thought').textContent = n.thought ? `"${n.thought}"` : '';
  $('mind').textContent = n.mind.model ? `mind: ${n.mind.model} (last choice: ${n.mind.source})` : 'mind: scripted fallback (no model connected yet)';
  for (const k of NEEDS) $(`need-${k}`).style.width = `${Math.round(n.needs[k] * 100)}%`;
  flag.rotation.z = n.mail ? 0 : -1.4; flag.position.y = n.mail ? 1.5 : 1.25;
}

// ---- panels ------------------------------------------------------------------
let openPanel = null;
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const api = (path, opts) => fetch(MIND + path, opts).then(r => r.json());
const myName = () => { let n = localStorage.getItem('nena-name'); if (!n) { const a = ['soft', 'quiet', 'brave', 'tiny', 'sunny', 'frosty'], b = ['Snow', 'Pebble', 'Fish', 'Star', 'Mitten', 'Wave']; n = a[Math.random() * 6 | 0] + b[Math.random() * 6 | 0] + (10 + Math.random() * 90 | 0); localStorage.setItem('nena-name', n); } return n; };
const md = t => esc(t).replace(/^# (.*)$/gm, '<h3>$1</h3>').replace(/^## (.*)$/gm, '<h3>$1</h3>').replace(/^- (.*)$/gm, '<div class="entry">$1</div>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

async function show(name) {
  openPanel = name; $('panel').hidden = false;
  const body = $('panel-body');
  try {
    if (name === 'diary') {
      const days = await api('/api/diary');
      body.innerHTML = `<h2>Her diary</h2>` + (days.length ? days.map(d => md(d.text)).join('') : '<p>Nothing written yet.</p>');
    } else if (name === 'feed') {
      body.innerHTML = `<h2>Lately</h2><p class="dim">Every choice she makes, with her reason.</p>` + ([...feed].reverse().map(i => `<div class="entry"><b>${esc(i.label)}${i.detail ? `: ${esc(i.detail)}` : ''}</b>${esc(i.reason)}<div class="dim">day ${i.day}, ${clockText(i.hour)} · ${esc(i.source)}</div></div>`).join('') || '<p>Nothing yet.</p>');
    } else if (name === 'memory') {
      const m = await api('/api/memory');
      body.innerHTML = `<h2>What she is carrying</h2><p class="dim">${m.memories.length} of ${m.slots} slots. Each one fades a little every day; the weakest are forgotten.</p>` +
        (m.memories.map(x => `<div class="entry">${esc(x.text)}<div class="meter"><i style="width:${Math.round(x.strength * 100)}%"></i></div></div>`).join('') || '<p>Nothing yet. Leave her something.</p>') +
        `<h3>Lately interested in</h3><p>${Object.keys(m.interests).map(esc).join(', ') || 'nothing in particular'}</p>`;
    } else if (name === 'leave') {
      const mine = await api(`/api/notes?name=${encodeURIComponent(myName())}`).catch(() => []);
      body.innerHTML = `<h2>Leave her something</h2><p>It goes in her mailbox. She reads it in her own time and remembers who left it.</p>
        <form id="note"><input name="name" maxlength="24" value="${esc(myName())}" aria-label="Your name" /><textarea name="text" maxlength="240" placeholder="A message for Nena" required></textarea><button>Put it in the mailbox</button><p id="note-msg" class="dim"></p></form>
        ${mine.length ? '<h3>What you have left</h3>' + mine.map(n => `<div class="entry">${esc(n.text)}<div class="dim">${n.read ? `She said: "${esc(n.reply)}"` : 'Still in the mailbox.'}</div></div>`).join('') : ''}`;
      $('note').onsubmit = async e => {
        e.preventDefault(); const f = new FormData(e.target); localStorage.setItem('nena-name', f.get('name'));
        const r = await api('/api/notes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: f.get('name'), text: f.get('text') }) }).catch(() => ({ error: "Couldn't reach her." }));
        if (r.ok) show('leave'); else $('note-msg').textContent = r.error;
      };
    }
  } catch { body.innerHTML = `<h2>Hm.</h2><p>Couldn't reach Nena's mind right now.</p>`; }
}
document.querySelectorAll('#nav button').forEach(b => b.onclick = () => (openPanel === b.dataset.panel ? close() : show(b.dataset.panel)));
const close = () => { openPanel = null; $('panel').hidden = true; };
$('close').onclick = close;

// ---- frame loop ----------------------------------------------------------------
const clock = new THREE.Clock(), bubble = $('bubble'), head = new THREE.Vector3();
let swimT = 0, heading = 0;
function frame() {
  const dt = Math.min(0.1, clock.getDelta());
  const act = now?.activity || { phase: 'idle', action: 'idle' };
  const pos = nena.root.position, k = 1 - Math.exp(-dt * 6);

  // on the pond she slides in circles; asleep she is tucked by the igloo door
  const goal = target.clone();
  if (act.phase === 'doing' && act.action === 'swim') { swimT += dt * 0.9; goal.set(pond.x + Math.cos(swimT) * 3, 0.12, pond.z + Math.sin(swimT) * 3); heading = -swimT; }
  else if (act.phase === 'doing' && (act.action === 'sleep' || act.action === 'watch_film')) { const s = site(act.action === 'sleep' ? 'home' : 'cinema'); goal.set(s.x, 0, s.z); heading = 0; }   // indoors
  else if (act.phase === 'doing' && ['read', 'rest', 'sunbathe', 'beachcomb'].includes(act.action)) heading = Math.atan2(-target.x, -target.z);   // back to the wall / the sea
  else if (act.phase === 'doing' && act.action === 'go_fishing') heading = 0;   // facing the river
  else if (now) heading = now.heading;
  pos.lerp(goal, k);
  let dh = heading - nena.root.rotation.y; dh = Math.atan2(Math.sin(dh), Math.cos(dh));
  nena.root.rotation.y += dh * k;
  nena.animate(dt, act);

  const hour = qs.has('hour') ? Number(qs.get('hour')) : now ? now.hour : 12;
  setSky(hour, qs.get('weather') || now?.weather || 'clear', dt);
  const sp = snowGeo.attributes.position;
  if (wx.snow > 0.02) { for (let i = 0; i < SNOW; i++) { let y = sp.getY(i) - dt * (1.5 + (i % 5) * 0.3); if (y < 0) y = 30; sp.setY(i, y); } sp.needsUpdate = true; }

  if (!window.__world?.freeze) {
    const before = controls.target.clone();
    controls.target.lerp(new THREE.Vector3(pos.x, 1, pos.z), 1 - Math.exp(-dt * 2.5));
    camera.position.add(controls.target.clone().sub(before));   // camera travels with her
  }
  controls.update();
  composer.render();

  if (now?.say) {
    head.set(pos.x, pos.y + 2.6, pos.z).project(camera);
    bubble.hidden = head.z > 1; bubble.textContent = now.say;
    bubble.style.left = `${(head.x * 0.5 + 0.5) * innerWidth}px`; bubble.style.top = `${(-head.y * 0.5 + 0.5) * innerHeight}px`;
  } else bubble.hidden = true;
  requestAnimationFrame(frame);
}
frame();
window.__world = { camera, controls, nena };   // handy in the console
