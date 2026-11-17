import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { PLACES, NEEDS, ISLETS, WORLD, isletPos, site } from '../../shared/world.js';
import { SCARVES, CATS, SPECIES, STAMPS, BLOOMS, todaysEvent } from '../../shared/data.js';
import { buildNena, buildRobot } from './nena.js';
import { buildTown } from './town.js';
import { buildDynamic } from './dynamic.js';
import { startLocalMind } from './localmind.js';

const MIND = (import.meta.env.VITE_MIND_URL || 'http://localhost:8787').replace(/\/$/, '');
const qs = new URLSearchParams(location.search);   // ?hour=23&weather=aurora&season=winter&show=fireworks to preview a look
const $ = id => document.getElementById(id);

// ---- scene ---------------------------------------------------------------
const canvas = $('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x7fe9ff, 100, 240);
const camera = new THREE.PerspectiveCamera(42, 1, 0.5, 600);
camera.position.set(PLACES.home.x + 10, 9, PLACES.home.z + 15);
const controls = new OrbitControls(camera, canvas);
controls.target.set(PLACES.home.x, 1, PLACES.home.z);
controls.enableDamping = true; controls.enablePan = false;
controls.minDistance = 8; controls.maxDistance = 110; controls.maxPolarAngle = 1.45;

const hemi = new THREE.HemisphereLight(0xffffff, 0x9fd27a, 1.5); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2d8, 2.0); sun.position.set(20, 30, 12); scene.add(sun);

const town = buildTown(); scene.add(town.town);
const dyn = buildDynamic(scene);
const nena = buildNena(); nena.root.scale.setScalar(1.45); scene.add(nena.root);
nena.root.position.set(PLACES.home.x, 0, PLACES.home.z);
const parked = buildRobot(); parked.scale.setScalar(1.45); parked.position.set(PLACES.home.x + 3.2, 0, PLACES.home.z - 1.2); parked.rotation.y = 0.6; scene.add(parked);   // her robot waits by the house

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

// snow, and sparks used for both shooting stars and fireworks
const points = (n, size, color) => { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); const p = new THREE.Points(geo, new THREE.PointsMaterial({ color: color ?? 0xffffff, size, transparent: true, opacity: 0, fog: false, vertexColors: color === null })); if (color === null) geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); scene.add(p); return p; };
const SNOW = 900, snow = points(SNOW, 0.22, 0xffffff);
{ const v = snow.geometry.attributes.position; for (let i = 0; i < SNOW; i++) v.setXYZ(i, (Math.random() - 0.5) * 80, Math.random() * 30, (Math.random() - 0.5) * 80); }
const METEORS = 5, meteors = points(METEORS * 8, 2.2, 0xffffff); meteors.material.sizeAttenuation = false;
const meteorState = Array.from({ length: METEORS }, () => ({ t: Math.random() * 6 }));
const FW = 420, fireworks = points(FW, 0.5, null), fw = Array.from({ length: FW }, () => ({ life: 0, v: new THREE.Vector3() }));
let fwTimer = 0;
function burst() {
  const c = new THREE.Color().setHSL(Math.random(), 0.9, 0.62), o = new THREE.Vector3((Math.random() - 0.5) * 34, 18 + Math.random() * 12, (Math.random() - 0.5) * 34);
  const pos = fireworks.geometry.attributes.position, col = fireworks.geometry.attributes.color; let n = 0;
  for (let i = 0; i < FW && n < 70; i++) if (fw[i].life <= 0) { fw[i].life = 1.6 + Math.random() * 0.6; fw[i].v.randomDirection().multiplyScalar(4 + Math.random() * 3); pos.setXYZ(i, o.x, o.y, o.z); col.setXYZ(i, c.r, c.g, c.b); n++; }
}

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0, 0.5, 0.82); composer.addPass(bloom);
// A dot-screen "print" look: darker areas get bigger ink dots, lighter areas show warm paper.
const dots = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, cell: { value: 5 }, amount: { value: 1 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float cell; uniform float amount; varying vec2 vUv;
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      float lum = sqrt(clamp(dot(c.rgb, vec3(0.299, 0.587, 0.114)), 0.0, 1.0));
      mat2 rot = mat2(0.966, -0.259, 0.259, 0.966);
      vec2 f = fract(rot * gl_FragCoord.xy / cell) - 0.5;
      float radius = 0.66 * sqrt(1.0 - lum);
      float ink = 1.0 - smoothstep(radius - 0.09, radius + 0.09, length(f));
      vec3 inked = c.rgb * 0.5 + vec3(0.03, 0.02, 0.12);
      vec3 paper = mix(c.rgb, vec3(1.0, 0.95, 0.86), 0.16) * 1.06;
      gl_FragColor = vec4(mix(c.rgb, mix(paper, inked, ink), amount), c.a);
    }`,
});
dots.uniforms.cell.value = 5 * renderer.getPixelRatio();
dots.enabled = localStorage.getItem('nena-dots') !== 'off';
composer.addPass(dots);
composer.addPass(new OutputPass());
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); composer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

// ---- sky by the hour -------------------------------------------------------
const SKY = { day: new THREE.Color(0x7fe9ff), night: new THREE.Color(0x0b1030), dusk: new THREE.Color(0xff9e7a) };
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const sky = new THREE.Color();
const wx = { snow: 0, aurora: 0, mist: 0, meteors: 0 };
let nightness = 0;
function setSky(hour, weather, dt, show) {
  const d = smooth(5, 7.5, hour) * (1 - smooth(18.5, 21, hour)), n = 1 - d; nightness = n;
  sky.copy(SKY.night).lerp(SKY.day, d).lerp(SKY.dusk, 4 * d * (1 - d) * 0.55);
  const k = 1 - Math.exp(-dt * 1.5);
  for (const key of Object.keys(wx)) wx[key] += ((weather === key ? 1 : 0) - wx[key]) * k;
  if (wx.mist > 0.01) sky.lerp(new THREE.Color(d > 0.5 ? 0xd8eef5 : 0x232a45), wx.mist * 0.6);
  scene.background = sky; scene.fog.color.copy(sky);
  scene.fog.near = 100 - wx.mist * 90; scene.fog.far = 240 - wx.mist * 170;
  hemi.intensity = 0.28 + d * 1.25; hemi.color.set(d > 0.5 ? 0xffffff : 0x8fa8ff); hemi.groundColor.set(d > 0.5 ? 0x9fd27a : 0x1d2545);
  sun.intensity = d * 2.0 + n * 0.25; sun.color.set(d > 0.5 ? 0xfff2d8 : 0x9bb4ff);
  stars.material.opacity = n * (1 - wx.mist) * 0.95;
  aurora.children.forEach((m, i) => { m.material.opacity = n * wx.aurora * (0.55 + 0.2 * Math.sin(performance.now() / 1700 + i * 2)); });
  snow.material.opacity = wx.snow * 0.9;
  bloom.strength = n * 0.45;
  document.body.style.background = `#${sky.getHexString()}`;

  // shooting stars
  meteors.material.opacity = n * wx.meteors;
  if (wx.meteors > 0.02) { const p = meteors.geometry.attributes.position;
    meteorState.forEach((m, i) => { m.t += dt; if (m.t > 5) { m.t = Math.random() * -4; m.a = Math.random() * 6.28; m.e = 0.5 + Math.random() * 0.6; }
      for (let j = 0; j < 8; j++) { const tt = Math.max(0, m.t) * 0.35 - j * 0.012, a = (m.a || 0) + tt, e = (m.e || 0.8) - tt * 0.8, r = 250; p.setXYZ(i * 8 + j, Math.cos(a) * Math.cos(e) * r, m.t > 0 && m.t < 1.2 ? Math.sin(e) * r : -500, Math.sin(a) * Math.cos(e) * r); } });
    p.needsUpdate = true; }
  // fireworks
  const on = show === 'fireworks' && n > 0.5;
  fireworks.material.opacity = 1;
  if (on) { fwTimer -= dt; if (fwTimer <= 0) { burst(); fwTimer = 0.5 + Math.random() * 1.2; } }
  { const p = fireworks.geometry.attributes.position, c = fireworks.geometry.attributes.color;
    for (let i = 0; i < FW; i++) { const f = fw[i]; if (f.life <= 0) { p.setY(i, -500); continue; } f.life -= dt; f.v.y -= 2.2 * dt; p.setXYZ(i, p.getX(i) + f.v.x * dt, p.getY(i) + f.v.y * dt, p.getZ(i) + f.v.z * dt); if (f.life < 0.5) c.setXYZ(i, c.getX(i) * 0.95, c.getY(i) * 0.95, c.getZ(i) * 0.95); }
    p.needsUpdate = true; c.needsUpdate = true; }
}

// ---- live state: the real mind over WebSocket, or a stand-in in this browser ----------
let now = null, local = null, fails = 0, lifeVersion = -1, lifeData = null, socket = null, myId = null;
const sendMind = m => { if (socket?.readyState === 1) socket.send(JSON.stringify(m)); };
const feed = [];
const target = new THREE.Vector3(PLACES.home.x, 0, PLACES.home.z);
const api = (path, opts) => fetch(MIND + path, opts).then(r => r.json());
function connect() {
  let opened = false;
  const ws = new WebSocket(MIND.replace(/^http/, 'ws'));
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.type === 'hello') { myId = m.you; feed.length = 0; feed.push(...m.feed); apply(m.now, true); }
    if (m.type === 'now') apply(m.now);
    if (m.type === 'feed') { feed.push(m.item); if (openPanel === 'feed') show('feed'); }
  };
  ws.onopen = () => { opened = true; fails = 0; socket = ws; ws.send(JSON.stringify({ type: 'hello', name: myName() })); if (local) { local.stop(); local = null; } $('offline').hidden = true; };
  ws.onclose = () => {
    socket = null; if (!opened) fails++;
    if (!local && (fails >= 2 || opened)) {
      local = startLocalMind(item => { feed.push(item); if (openPanel === 'feed') show('feed'); });
      feed.length = 0; feed.push(...local.feed); apply(local.now(), true);
      $('offline').textContent = "Nena's own mind isn't online yet. This is a stand-in running in your browser, just for you."; $('offline').hidden = false;
    }
    setTimeout(connect, local ? 30000 : 2500);
  };
  ws.onerror = () => ws.close();
}
connect();
setInterval(() => { if (local) apply(local.now()); }, 200);

const NEED_COLORS = { fullness: '#f2792e', energy: '#ffd93b', wonder: '#6a2fc4', joy: '#ff7fa3', calm: '#2fc6b3' };
$('needs').innerHTML = NEEDS.map(k => `<div class="need"><span>${k[0].toUpperCase() + k.slice(1)}</span><div class="bar"><i id="need-${k}" style="background:${NEED_COLORS[k]}"></i></div></div>`).join('');
const clockText = h => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.floor((h % 1) * 60)).padStart(2, '0')}`;
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

async function refreshLife() {
  try { lifeData = local ? local.life() : await api('/api/life'); dyn.setDecor(lifeData.decorList || [], now?.day || 1); if (openPanel === 'things') show('things'); } catch {}
}
function apply(n, snap) {
  now = n;
  target.set(n.pos.x, 0, n.pos.z);
  if (snap) nena.root.position.copy(target);
  const upcoming = n.event ? `${n.event.name} is on!` : (todaysEvent(n.day) ? `${todaysEvent(n.day).name} today` : '');
  $('clock').textContent = `Day ${n.day} · ${cap(n.season)} ${n.dayOfSeason}/7 · ${clockText(n.hour)} · ${n.weather}`;
  $('event').textContent = upcoming; $('event').hidden = !upcoming;
  $('doing').textContent = n.activity.label + (n.activity.detail && n.activity.phase === 'doing' ? `: ${n.activity.detail}` : '');
  $('thought').textContent = n.thought ? `"${n.thought}"` : '';
  $('coins').textContent = `${n.coins} coins · feeling ${n.mood}`;
  $('mind').textContent = n.mind.local ? 'mind: stand-in in your browser' : n.mind.model ? `mind: ${n.mind.model} (last choice: ${n.mind.source})` : 'mind: scripted fallback (no model connected yet)';
  for (const k of NEEDS) $(`need-${k}`).style.width = `${Math.round(n.needs[k] * 100)}%`;
  town.flag.rotation.z = n.mail ? 0 : -1.4; town.flag.position.y = n.mail ? 1.5 : 1.25;
  nena.setScarf(SCARVES[n.look.scarf] ?? SCARVES[0]);
  town.setHouse(n.look.house, n.look.level);
  town.setIsland(n.look.flag, n.painter, n.crops);
  parked.visible = !n.activity.ride;
  dyn.setCamper(n.camper);
  const vs = n.visitors || []; $('wave').hidden = !!local; $('visitors').textContent = vs.length ? `${vs.length} visitor${vs.length > 1 ? 's' : ''} here${vs.length < 5 ? ': ' + vs.map(v => v.name).join(', ') : ''}. Double-click the ground to fly your gull there.` : ''; $('visitors').hidden = !vs.length;
  town.setAway(n.activity.phase === 'doing' && n.activity.anim === 'sail' ? n.activity.islet ?? 0 : null);
  dyn.setSpots(n.spots || []);
  if (n.lifeVersion !== lifeVersion) { lifeVersion = n.lifeVersion; refreshLife(); }
}

// ---- panels ------------------------------------------------------------------
let openPanel = null;
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const myName = () => { let n = localStorage.getItem('nena-name'); if (!n) { const a = ['soft', 'quiet', 'brave', 'tiny', 'sunny', 'frosty'], b = ['Snow', 'Pebble', 'Fish', 'Star', 'Mitten', 'Wave']; n = a[Math.random() * 6 | 0] + b[Math.random() * 6 | 0] + (10 + Math.random() * 90 | 0); localStorage.setItem('nena-name', n); } return n; };
const md = t => esc(t).replace(/^#+ (.*)$/gm, '<h3>$1</h3>').replace(/^- (.*)$/gm, '<div class="entry">$1</div>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
const feedHtml = () => [...feed].reverse().map(i => i.result
  ? `<div class="entry result">${esc(cap(i.label))}.<div class="dim">day ${i.day}, ${clockText(i.hour)}</div></div>`
  : `<div class="entry"><b>${esc(cap(i.label))}${i.detail ? `: ${esc(i.detail)}` : ''}</b>${esc(i.reason)}<div class="dim">day ${i.day}, ${clockText(i.hour)} · ${esc(i.source)}</div></div>`).join('') || '<p>Nothing yet.</p>';
const standIn = '<p class="dim">This needs her real mind, which is not online yet.</p>';

async function show(name) {
  openPanel = name; $('panel').hidden = false;
  const body = $('panel-body');
  try {
    if (name === 'diary') {
      if (local) { body.innerHTML = `<h2>Her diary</h2>${standIn}${feedHtml()}`; return; }
      const days = await api('/api/diary');
      body.innerHTML = `<h2>Her diary</h2>` + (days.length ? days.map(d => md(d.text)).join('') : '<p>Nothing written yet.</p>');
    } else if (name === 'feed') {
      body.innerHTML = `<h2>Lately</h2><p class="dim">Every choice she makes, with her reason, and what came of it.</p>${feedHtml()}`;
    } else if (name === 'things') {
      const l = lifeData; if (!l) { body.innerHTML = '<h2>Her things</h2><p>Nothing yet.</p>'; return; }
      const got = Object.values(l.museum).reduce((t, a) => t + a.length, 0);
      const cats = Object.entries(CATS).map(([cat, label]) => { const all = Object.keys(SPECIES).filter(k => SPECIES[k].cat === cat); return `<h3>${label} ${l.museum[cat].length}/${all.length}</h3><p>${all.map(k => l.museum[cat].includes(k) ? esc(k) : '<span class="dim">?</span>').join(' · ')}</p>`; }).join('');
      const pockets = Object.entries(l.items).map(([k, v]) => `${v} ${esc(k)}`).join(', ') || 'empty';
      body.innerHTML = `<h2>Her things</h2>
        <p><b>${l.coins} coins.</b> House level ${l.house.level} of 3${l.loan ? ` (${l.house.paid} of ${l.loan} coins paid toward the next)` : ''}. ${l.decor} things placed around the island. ${l.photos} photos taken.${l.turnips.n ? ` Holding ${l.turnips.n} turnips bought at ${l.turnips.paid}; today's price is ${l.turnipPrice}.` : ''}</p>
        <h3>In her pockets</h3><p>${pockets}</p>
        <p>Cosiness of her house: ${l.cosy}. ${l.tune ? `Island tune: ${esc(l.tune)}. ` : ''}The shop pays double for ${esc(l.hot)} today. Robot rides: ${l.rides}.</p>
        <h3>Stamps ${l.stamps.length}/${STAMPS.length}</h3><p>${STAMPS.map(st => l.stamps.includes(st.id) ? esc(st.name) : '<span class="dim">?</span>').join(' · ')}</p>
        ${l.songs.length ? `<h3>Records</h3><p>${l.songs.map(esc).join(' · ')}</p>` : ''}
        <h3>Flower colours ${l.blooms.length}/${Object.keys(BLOOMS).length}</h3><p>${Object.keys(BLOOMS).map(k => l.blooms.includes(k) ? `<span style="display:inline-block;width:12px;height:12px;border-radius:6px;border:2px solid #1d2545;background:#${BLOOMS[k].toString(16).padStart(6, '0')}"></span> ${k}` : '<span class="dim">?</span>').join(' · ')}</p>
        <h3>Travels and travellers</h3><p>Islets rowed to: ${l.islets.map(esc).join(', ') || 'none yet'} (${l.islets.length}/${ISLETS.length}). Campers met: ${l.metCampers.map(esc).join(', ') || 'none yet'}.${l.camper ? ` ${esc(l.camper.name)} the ${esc(l.camper.kind)} is at the campsite today.` : ''}</p>
        <h3>Neighbours</h3>${Object.entries(l.friends).map(([k, v]) => `<div class="entry">${esc(k)}<div class="meter"><i style="width:${v * 10}%"></i></div></div>`).join('')}
        <h3>Museum ${got}/${l.total}</h3><div class="meter"><i style="width:${got / l.total * 100}%"></i></div>${cats}`;
    } else if (name === 'memory') {
      if (local) { body.innerHTML = `<h2>What she is carrying</h2>${standIn}`; return; }
      const m = await api('/api/memory');
      body.innerHTML = `<h2>What she is carrying</h2><p class="dim">${m.memories.length} of ${m.slots} slots. Each one fades a little every day; the weakest are forgotten.</p>` +
        (m.memories.map(x => `<div class="entry">${esc(x.text)}<div class="meter"><i style="width:${Math.round(x.strength * 100)}%"></i></div></div>`).join('') || '<p>Nothing yet. Leave her something.</p>') +
        `<h3>Lately interested in</h3><p>${Object.keys(m.interests).map(esc).join(', ') || 'nothing in particular'}</p>`;
    } else if (name === 'leave') {
      if (local) { body.innerHTML = `<h2>Leave her something</h2>${standIn}`; return; }
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
document.querySelectorAll('#nav button[data-panel]').forEach(b => b.onclick = () => (openPanel === b.dataset.panel ? close() : show(b.dataset.panel)));
const close = () => { openPanel = null; $('panel').hidden = true; };
$('close').onclick = close;

// ---- camera: follow her, or roam free ----------------------------------------------
let freeCam = false;
const keys = new Set();
addEventListener('keydown', e => { if (!/INPUT|TEXTAREA/.test(document.activeElement?.tagName)) keys.add(e.key.toLowerCase()); });
addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => keys.clear());
$('cam').onclick = () => {
  freeCam = !freeCam;
  controls.enablePan = freeCam; controls.maxDistance = freeCam ? 240 : 110; controls.maxPolarAngle = freeCam ? 1.55 : 1.45;
  $('cam').textContent = freeCam ? 'Follow Nena' : 'Free camera';
  $('camhelp').hidden = !freeCam;
  if (!freeCam) { const p = nena.root.position; const off = camera.position.clone().sub(controls.target).setLength(22); controls.target.set(p.x, 1, p.z); camera.position.copy(controls.target).add(off); if (camera.position.y < 6) camera.position.y = 6; }
};

// ---- visitors: your gull ----------------------------------------------------------------
const ray = new THREE.Raycaster(), groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
canvas.addEventListener('dblclick', e => {
  ray.setFromCamera(new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), camera);
  const hit = new THREE.Vector3(); if (ray.ray.intersectPlane(groundPlane, hit)) sendMind({ type: 'move', x: hit.x, z: hit.z });
});
$('wave').onclick = () => sendMind({ type: 'wave' });
const dotsLabel = () => { $('dots').textContent = dots.enabled ? 'Dots: on' : 'Dots: off'; }; dotsLabel();
$('dots').onclick = () => { dots.enabled = !dots.enabled; try { localStorage.setItem('nena-dots', dots.enabled ? 'on' : 'off'); } catch {} dotsLabel(); };

// ---- frame loop ----------------------------------------------------------------
const clock = new THREE.Clock(), bubble = $('bubble'), head = new THREE.Vector3();
let swimT = 0, heading = 0, elapsed = 0;
function frame() {
  const dt = Math.min(0.1, clock.getDelta()); elapsed += dt;
  const act = now?.activity || { phase: 'idle', action: 'idle', anim: 'stand' };
  if (qs.has('ride')) { act.phase = 'walking'; act.ride = true; }   // preview her on the robot
  const pos = nena.root.position, k = 1 - Math.exp(-dt * 6), doing = act.phase === 'doing';

  const goal = target.clone();
  if (doing && act.anim === 'swim') { swimT += dt * 0.9; goal.set(town.pond.x + Math.cos(swimT) * 3, 0.12, town.pond.z + Math.sin(swimT) * 3); heading = -swimT; }            // circles on the pond
  else if (doing && act.anim === 'dive') { swimT += dt * 0.5; const l = Math.hypot(target.x, target.z); goal.set(target.x / l * (WORLD.radius + 3.5) + Math.cos(swimT) * 2, 0, target.z / l * (WORLD.radius + 3.5) + Math.sin(swimT) * 2); heading = -swimT; }   // out in the sea
  else if (doing && act.anim === 'sail') { swimT += dt * 0.5; const ip = isletPos(act.islet ?? 0); goal.set(ip.x + Math.cos(swimT) * 1.6, 0.35, ip.z + Math.sin(swimT) * 1.6); heading = -swimT; if (pos.distanceTo(goal) > 12) pos.copy(goal); }   // ashore on a little island
  else if (doing && act.anim === 'inside' && act.place) { const s = site(act.place); goal.set(s.x, 0, s.z); heading = 0; }                                           // indoors
  else if (doing && ['read', 'sit', 'lie'].includes(act.anim) || (doing && act.place === 'beach' && act.anim !== 'fish')) heading = Math.atan2(-target.x, -target.z);   // back to the wall / the sea
  else if (doing && act.anim === 'fish') heading = act.place === 'river' ? 0 : Math.atan2(target.x, target.z);                                                       // facing the water
  else if (now) heading = now.heading;
  pos.lerp(goal, k);
  let dh = heading - nena.root.rotation.y; dh = Math.atan2(Math.sin(dh), Math.cos(dh));
  nena.root.rotation.y += dh * k;
  nena.animate(dt, act);

  const hour = qs.has('hour') ? Number(qs.get('hour')) : now ? now.hour : 12;
  const showEv = qs.get('show') || now?.event?.show || null;
  setSky(hour, qs.get('weather') || now?.weather || 'clear', dt, showEv);
  town.setNight(nightness, doing && act.action === 'watch_film', elapsed);
  town.setSeason(qs.get('season') || now?.season || 'summer', !lifeData || lifeData.shaken !== now?.day);
  town.setEvent(showEv);
  town.setClock(hour);
  dots.uniforms.amount.value = 1 - nightness * 0.5;   // lighter touch at night so the glow reads
  dyn.update(dt, elapsed, now?.npcs, nightness);
  dyn.setVisitors(now?.visitors || [], elapsed, dt);
  const sp = snow.geometry.attributes.position;
  if (wx.snow > 0.02) { for (let i = 0; i < SNOW; i++) { let y = sp.getY(i) - dt * (1.5 + (i % 5) * 0.3); if (y < 0) y = 30; sp.setY(i, y); } sp.needsUpdate = true; }

  if (freeCam) {
    const sp = (keys.has('shift') ? 40 : 16) * dt, f = new THREE.Vector3(); camera.getWorldDirection(f); f.y = 0; f.normalize(); const r = new THREE.Vector3(-f.z, 0, f.x), mv = new THREE.Vector3();
    if (keys.has('w') || keys.has('arrowup')) mv.add(f); if (keys.has('s') || keys.has('arrowdown')) mv.sub(f); if (keys.has('d') || keys.has('arrowright')) mv.add(r); if (keys.has('a') || keys.has('arrowleft')) mv.sub(r);
    if (keys.has('e')) mv.y += 1; if (keys.has('q')) mv.y -= 1;
    mv.multiplyScalar(sp); camera.position.add(mv); controls.target.add(mv);
    if (camera.position.y < 1.5) { controls.target.y += 1.5 - camera.position.y; camera.position.y = 1.5; }
  } else if (!window.__world?.freeze) {
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
