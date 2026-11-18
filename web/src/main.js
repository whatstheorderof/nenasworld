import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { PLACES, NEEDS, ISLETS, WORLD, isletPos, site } from '../../shared/world.js';
import { WEATHER_WORDS, FLAGS, SCARVES, HATS, GLASSES, SKY as SKY_LIST, SKY_RARE, CATS, SPECIES, STAMPS, BLOOMS, todaysEvent } from '../../shared/data.js';
import { buildNena, buildRobot } from './nena.js';
import { buildTown } from './town.js';
import { buildDynamic, display } from './dynamic.js';
import { sound } from './sound.js';
import { startLocalMind } from './localmind.js';
import { drawPicture, playTune } from './art.js';
import { drawStamp } from './stamps.js';
import { buildFarIslands } from './far.js';
import { makeFeelings } from './feelings.js';
const feelings = makeFeelings();

const MIND = (import.meta.env.VITE_MIND_URL || 'http://localhost:8787').replace(/\/$/, '');
const qs = new URLSearchParams(location.search);   // ?hour=23&weather=aurora&season=winter&show=fireworks to preview a look
const $ = id => document.getElementById(id);

// ---- settings (kept in this browser) -----------------------------------------------------
const DEFAULTS = { sound: true, volume: 0.6, dots: localStorage.getItem('nena-dots') !== 'off', quality: matchMedia('(max-width: 700px)').matches ? 'low' : 'high', labels: true, bubbles: true, flashes: true, clock24: true, follow: true };
const settings = (() => { try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem('nena-settings') || '{}') }; } catch { return { ...DEFAULTS }; } })();
const saveSettings = () => { try { localStorage.setItem('nena-settings', JSON.stringify(settings)); } catch {} };

// ---- scene ---------------------------------------------------------------
const canvas = $('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(settings.quality === 'low' ? Math.min(devicePixelRatio, 1.25) : Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x7fe9ff, 130, 320);
const camera = new THREE.PerspectiveCamera(42, 1, 0.5, 800);
camera.position.set(PLACES.home.x + 10, 9, PLACES.home.z + 15);
const controls = new OrbitControls(camera, canvas);
controls.target.set(PLACES.home.x, 1, PLACES.home.z);
controls.enableDamping = true; controls.enablePan = false;
controls.minDistance = 8; controls.maxDistance = 140; controls.maxPolarAngle = 1.45;

const hemi = new THREE.HemisphereLight(0xffffff, 0x9fd27a, 1.5); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2d8, 2.0); sun.position.set(20, 30, 12); scene.add(sun);

const town = buildTown(); scene.add(town.town);
const dyn = buildDynamic(scene);
const far = buildFarIslands(scene);
const nena = buildNena(); nena.root.scale.setScalar(1.45 * (Number(qs.get('size')) || 1)); scene.add(nena.root);   // ?size= is for posing her in preview images
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

// clouds: it is a sky island, so a ring of slow clouds around and below it
const clouds = new THREE.Group(); scene.add(clouds);
const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.45, flatShading: true });
{ const puff = new THREE.IcosahedronGeometry(1, 1), N = 80, PER = 7;
  const inst = new THREE.InstancedMesh(puff, cloudMat, N * PER), m = new THREE.Object3D();
  let seed = 3; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let c = 0, k = 0; c < N; c++) {
    const below = c < 26, a = rnd() * 6.283, r = below ? 40 + rnd() * 130 : 130 + rnd() * 120, y = below ? -30 - rnd() * 26 : -18 + rnd() * 44, size = below ? 7 + rnd() * 6 : 6 + rnd() * 8;
    const cx = Math.cos(a) * r, cz = Math.sin(a) * r;
    const blocksView = !below && [3.75, 5.25, 2.55].some(fa => Math.abs(Math.atan2(Math.sin(a - fa), Math.cos(a - fa))) < 0.16) && y > -6;   // keep the far islands in view
    for (let i = 0; i < PER; i++, k++) {
      if (blocksView) { m.position.set(0, -9999, 0); m.scale.setScalar(0.001); m.updateMatrix(); inst.setMatrixAt(k, m.matrix); continue; }
      const s = size * (0.55 + rnd() * 0.5) * (i === 0 ? 1.3 : 1);
      m.position.set(cx + (rnd() - 0.5) * size * 2.4, y + rnd() * size * 0.35, cz + (rnd() - 0.5) * size * 1.4);
      m.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); m.scale.set(s, s * 0.62, s); m.updateMatrix(); inst.setMatrixAt(k, m.matrix);
    }
  }
  clouds.add(inst); }
const CLOUD = { day: new THREE.Color(0xffffff), dusk: new THREE.Color(0xffc2b0), night: new THREE.Color(0x2a3263) };

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
dots.enabled = settings.dots;
composer.addPass(dots);
composer.addPass(new OutputPass());
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); composer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

// ---- sky by the hour -------------------------------------------------------
const SKY = { day: new THREE.Color(0x7fe9ff), night: new THREE.Color(0x0b1030), dusk: new THREE.Color(0xff9e7a) };
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const sky = new THREE.Color();
const wx = { snow: 0, aurora: 0, mist: 0, meteors: 0, rain: 0, storm: 0, cloudy: 0, wind: 0, heat: 0, rainbow: 0 };
let nightness = 0;
function setSky(hour, weather, dt, show) {
  const d = smooth(5, 7.5, hour) * (1 - smooth(18.5, 21, hour)), n = 1 - d; nightness = n;
  sky.copy(SKY.night).lerp(SKY.day, d).lerp(SKY.dusk, 4 * d * (1 - d) * 0.55);
  const k = 1 - Math.exp(-dt * 1.5);
  for (const key of Object.keys(wx)) wx[key] += ((weather === key ? 1 : 0) - wx[key]) * k;
  if (wx.mist > 0.01) sky.lerp(new THREE.Color(d > 0.5 ? 0xd8eef5 : 0x232a45), wx.mist * 0.6);
  scene.background = sky; scene.fog.color.copy(sky);
  scene.fog.near = 130 - wx.mist * 118; scene.fog.far = 320 - wx.mist * 240;
  hemi.intensity = 0.28 + d * 1.25; hemi.color.set(d > 0.5 ? 0xffffff : 0x8fa8ff); hemi.groundColor.set(d > 0.5 ? 0x9fd27a : 0x1d2545);
  sun.intensity = d * 2.0 + n * 0.25; sun.color.set(d > 0.5 ? 0xfff2d8 : 0x9bb4ff);
  stars.material.opacity = n * (1 - wx.mist) * 0.95;
  aurora.children.forEach((m, i) => { m.material.opacity = n * wx.aurora * (0.55 + 0.2 * Math.sin(performance.now() / 1700 + i * 2)); });
  snow.material.opacity = wx.snow * 0.9;
  cloudMat.color.copy(CLOUD.night).lerp(CLOUD.day, d).lerp(CLOUD.dusk, 4 * d * (1 - d) * 0.6); if (wx.mist > 0.01) cloudMat.color.lerp(sky, wx.mist * 0.5); cloudMat.emissive.copy(cloudMat.color);
  clouds.rotation.y += dt * 0.004;
  bloom.strength = settings.quality === 'low' ? 0 : n * 0.45; bloom.enabled = settings.quality !== 'low';
  setWeatherFx(dt, d, n, performance.now() / 1000);

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

// ---- weather: rain, storms, wind, heat haze and rainbows ----------------------------------
const RAIN = 1800, rainGeo = new THREE.BufferGeometry(), rainPos = new Float32Array(RAIN * 6);
for (let i = 0; i < RAIN; i++) { const x = (Math.random() - 0.5) * 90, y = Math.random() * 40, z = (Math.random() - 0.5) * 90; rainPos.set([x, y, z, x, y - 0.7, z], i * 6); }
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0xcfe3f5, transparent: true, opacity: 0 })); scene.add(rain);
const LEAVES = 260, leaves = points(LEAVES, 0.35, null);
{ const p = leaves.geometry.attributes.position, c = leaves.geometry.attributes.color, cols = [0xf2792e, 0xffd93b, 0x4fae52, 0xe8452c, 0xffb7d0].map(h => new THREE.Color(h));
  for (let i = 0; i < LEAVES; i++) { p.setXYZ(i, (Math.random() - 0.5) * 100, 1 + Math.random() * 14, (Math.random() - 0.5) * 100); const k = cols[i % cols.length]; c.setXYZ(i, k.r, k.g, k.b); } }
leaves.material.sizeAttenuation = true;
const rainbow = new THREE.Group(); scene.add(rainbow);
['#e8452c', '#f2792e', '#ffd93b', '#4fae52', '#58b7e8', '#3c2a86', '#6a2fc4'].forEach((c, i) => {
  const m = new THREE.Mesh(new THREE.TorusGeometry(150 - i * 4.2, 2.1, 6, 64, Math.PI), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false, fog: false }));
  rainbow.add(m); });
{ const dir = new THREE.Vector3(-20, 0, -12).normalize(); rainbow.position.copy(dir.multiplyScalar(230)).setY(-40); rainbow.lookAt(0, -40, 0); }
// lightning: a jagged bolt and a flash
const boltGeo = new THREE.BufferGeometry(); boltGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(14 * 3), 3));
const bolt = new THREE.Line(boltGeo, new THREE.LineBasicMaterial({ color: 0xfffbe0, transparent: true, opacity: 0, fog: false })); scene.add(bolt);
let flash = 0, nextFlash = 3;
function strike() {
  const a = Math.random() * 6.283, r = 70 + Math.random() * 90, x = Math.cos(a) * r, z = Math.sin(a) * r, p = boltGeo.attributes.position;
  for (let i = 0; i < 14; i++) p.setXYZ(i, x + (Math.random() - 0.5) * (i ? 9 : 0), 90 - i * 9, z + (Math.random() - 0.5) * (i ? 9 : 0));
  p.needsUpdate = true; flash = 1; sound.thunder(Math.min(1, (r - 70) / 90));
}
const GREY_DAY = new THREE.Color(0x98a7b8), GREY_NIGHT = new THREE.Color(0x151a2c), HEAT = new THREE.Color(0xfff0c8), WHITE = new THREE.Color(0xffffff);
function setWeatherFx(dt, d, n, t) {
  const wet = Math.min(1, wx.rain + wx.storm), grey = Math.min(1, wx.rain * 0.55 + wx.storm * 0.85 + wx.cloudy * 0.45);
  if (grey > 0.01) sky.lerp(d > 0.5 ? GREY_DAY : GREY_NIGHT, grey * (d > 0.5 ? 0.7 : 0.5));
  if (wx.heat > 0.01) sky.lerp(HEAT, wx.heat * 0.28 * d);
  // lightning
  if (wx.storm > 0.5) { nextFlash -= dt; if (nextFlash <= 0) { strike(); nextFlash = 3 + Math.random() * 9; } }
  flash = Math.max(0, flash - dt * 3.2); bolt.material.opacity = flash > 0.4 ? 1 : 0;
  const fl = settings.flashes ? flash : 0;   // the bolt still shows when flashes are off; the screen does not light up
  if (fl > 0) sky.lerp(WHITE, fl * 0.45);
  scene.background = sky; scene.fog.color.copy(sky); document.body.style.background = `#${sky.getHexString()}`;
  scene.fog.near -= wet * 70; scene.fog.far -= wet * 150;
  hemi.intensity = hemi.intensity * (1 - grey * 0.45) + fl * 2.5 + wx.heat * 0.2 * d;
  sun.intensity = sun.intensity * (1 - grey * 0.75) + wx.heat * 0.6 * d;
  cloudMat.color.lerp(d > 0.5 ? new THREE.Color(0x7e8a99) : new THREE.Color(0x10142a), grey * 0.7); cloudMat.emissive.copy(cloudMat.color);
  clouds.rotation.y += dt * wx.wind * 0.03;
  // rain falls around wherever the camera is looking
  const wind = wx.wind * 6 + wx.storm * 4;
  rain.material.opacity = wet * (0.35 + wx.storm * 0.25) * (1 - n * 0.3);
  if (wet > 0.02) { const p = rainGeo.attributes.position, c = controls.target, fall = (24 + wx.storm * 14) * dt;
    for (let i = 0; i < RAIN; i++) { const j = i * 2; let x = p.getX(j) + wind * dt, y = p.getY(j) - fall, z = p.getZ(j);
      if (y < 0) { y = 30 + Math.random() * 10; x = c.x + (Math.random() - 0.5) * 90; z = c.z + (Math.random() - 0.5) * 90; }
      p.setXYZ(j, x, y, z); p.setXYZ(j + 1, x - wind * 0.06, y - 0.8 - wx.storm * 0.4, z); }
    p.needsUpdate = true; }
  // leaves blown about in the wind
  leaves.material.opacity = wx.wind * 0.95;
  if (wx.wind > 0.02) { const p = leaves.geometry.attributes.position;
    for (let i = 0; i < LEAVES; i++) { let x = p.getX(i) + dt * (9 + (i % 5)), y = p.getY(i) + Math.sin(t * 3 + i) * dt * 1.5, z = p.getZ(i) + Math.sin(t + i * 0.7) * dt * 2;
      if (x > 55) { x = -55; y = 1 + Math.random() * 14; z = (Math.random() - 0.5) * 100; } p.setXYZ(i, x, y, z); }
    p.needsUpdate = true; }
  // snow drifts sideways in the wind too
  if (wx.snow > 0.02 && wx.wind > 0.02) { const p = snow.geometry.attributes.position; for (let i = 0; i < SNOW; i++) p.setX(i, ((p.getX(i) + wx.wind * 5 * dt + 40) % 80) - 40); }
  rainbow.children.forEach(m => { m.material.opacity = wx.rainbow * d * 0.42; });
  town.setWind(wx.wind + wx.storm * 0.7, t);
}

// ---- live state: the real mind over WebSocket, or a stand-in in this browser ----------
let now = null, local = null, fails = 0, lifeVersion = -1, lifeData = null, socket = null, myId = null;
const chatLog = [];
const onChat = item => { if (item.kind === 'nena' && item.to?.includes(myName())) { sound.blip(); feelings.feel('happy', 3); } else if (item.kind !== 'nena') feelings.feel('surprised', 1.2); chatLog.push(item); if (chatLog.length > 200) chatLog.shift(); if (openPanel === 'chat') renderChat(); else if (item.kind === 'nena' && item.to?.includes(myName())) $('chat-dot').hidden = false; };
const sendMind = m => { if (socket?.readyState === 1) socket.send(JSON.stringify(m)); };
const feed = [];
const target = new THREE.Vector3(PLACES.home.x, 0, PLACES.home.z);
const api = (path, opts) => fetch(MIND + path, opts).then(r => r.json());
function startStandIn() {
  if (local) return;
  local = startLocalMind(item => { feed.push(item); feelings.fromFeed(item); if (openPanel === 'feed') show('feed'); }, onChat);
  chatLog.length = 0; chatLog.push(...local.chat);
  feed.length = 0; feed.push(...local.feed); apply(local.now(), true);
  $('offline').textContent = "Nena's own mind isn't online yet. This is a stand-in running in your browser, just for you."; $('offline').hidden = false;
  setTimeout(() => { $('offline').hidden = true; }, 9000);   // the status card keeps saying so after this
}
// A page served over https may not open an insecure ws:// connection (browsers refuse outright),
// so with no secure mind address configured the stand-in starts straight away.
const mindReachable = !(location.protocol === 'https:' && MIND.startsWith('http:'));
function connect() {
  if (!mindReachable) { startStandIn(); return; }
  let opened = false, ws;
  try { ws = new WebSocket(MIND.replace(/^http/, 'ws')); } catch { startStandIn(); setTimeout(connect, 30000); return; }
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.type === 'hello') { myId = m.you; feed.length = 0; feed.push(...m.feed); chatLog.length = 0; chatLog.push(...(m.chat || [])); apply(m.now, true); if (openPanel === 'chat') renderChat(); }
    if (m.type === 'chat') onChat(m.item);
    if (m.type === 'now') apply(m.now);
    if (m.type === 'feed') { feed.push(m.item); feelings.fromFeed(m.item); if (openPanel === 'feed') show('feed'); }
  };
  ws.onopen = () => { opened = true; fails = 0; socket = ws; ws.send(JSON.stringify({ type: 'hello', name: myName() })); if (local) { local.stop(); local = null; } $('offline').hidden = true; };
  ws.onclose = () => {
    socket = null; if (!opened) fails++;
    if (fails >= 2 || opened) startStandIn();
    setTimeout(connect, local ? 30000 : 2500);
  };
  ws.onerror = () => ws.close();
}
connect();
setInterval(() => { if (local) apply(local.now()); }, 200);
$('status').onclick = () => $('status').classList.toggle('open');
$('offline').onclick = () => { $('offline').hidden = true; };   // on phones the card starts small

const NEED_COLORS = { fullness: '#f2792e', energy: '#ffd93b', wonder: '#6a2fc4', joy: '#ff7fa3', calm: '#2fc6b3' };
$('needs').innerHTML = NEEDS.map(k => `<div class="need"><span>${k[0].toUpperCase() + k.slice(1)}</span><div class="bar"><i id="need-${k}" style="background:${NEED_COLORS[k]}"></i></div></div>`).join('');
const clockText = h => { const hh = Math.floor(h) % 24, mm = String(Math.floor((h % 1) * 60)).padStart(2, '0'); return settings.clock24 ? `${String(hh).padStart(2, '0')}:${mm}` : `${hh % 12 || 12}:${mm} ${hh < 12 ? 'am' : 'pm'}`; };
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

async function refreshLife() {
  try { lifeData = local ? local.life() : await api('/api/life'); noticeStamps(lifeData.stamps || []); dyn.setDecor(lifeData.decorList || [], now?.day || 1); if (openPanel === 'things' || openPanel === 'makes') show(openPanel); } catch {}
}
function apply(n, snap) {
  now = n;
  target.set(n.pos.x, 0, n.pos.z);
  if (snap) nena.root.position.copy(target);
  const upcoming = n.event ? `${n.event.name} is on!` : (todaysEvent(n.day) ? `${todaysEvent(n.day).name} today` : '');
  $('clock').textContent = `Day ${n.day} · ${cap(n.season)} ${n.dayOfSeason}/7 · ${clockText(n.hour)} · ${WEATHER_WORDS[qs.get('weather') || n.weather] || n.weather}`;
  $('event').textContent = upcoming; $('event').hidden = !upcoming;
  $('doing').textContent = n.activity.label + (n.activity.detail && n.activity.phase === 'doing' ? `: ${n.activity.detail}` : '');
  $('thought').textContent = n.thought ? `"${n.thought}"` : '';
  $('coins').textContent = `${n.coins} coins · feeling ${n.mood}`;
  $('mind').textContent = n.mind.local ? 'mind: stand-in in your browser' : n.mind.model ? `mind: ${n.mind.model} (last choice: ${n.mind.source})` : 'mind: scripted fallback (no model connected yet)';
  for (const k of NEEDS) $(`need-${k}`).style.width = `${Math.round(n.needs[k] * 100)}%`;
  town.flag.rotation.z = n.mail ? 0 : -1.4; town.flag.position.y = n.mail ? 1.5 : 1.25;
  nena.setScarf(SCARVES[n.look.scarf] ?? SCARVES[0]);
  // what she wears depends on the weather as well as her wardrobe
  const w = qs.get('weather') || n.weather, wet = w === 'rain' || w === 'storm', ownHat = HATS[n.look.hat || 0], ownGlasses = GLASSES[n.look.glasses || 0];
  const hat = qs.get('hat') || (wet ? 'umbrella hat' : w === 'snow' && ownHat === 'none' ? 'pom-pom hat' : w === 'heat' && ownHat === 'none' ? 'sun hat' : ownHat);
  const glasses = qs.get('glasses') || (n.night || wet ? 'none' : w === 'heat' && ownGlasses === 'none' ? 'round sunglasses' : ownGlasses);
  nena.setHat(hat); nena.setGlasses(glasses); nena.setWeather(w === 'wind' ? 1 : w === 'storm' ? 0.8 : 0, wet);
  town.setHouse(n.look.house, n.look.level);
  town.setIsland(n.look.flag, n.painter, n.crops);
  parked.visible = !n.activity.ride;
  dyn.setCamper(n.camper);
  const vs = n.visitors || []; $('visitors').textContent = vs.length ? `${vs.length} visitor${vs.length > 1 ? 's' : ''} here${vs.length < 5 ? ': ' + vs.map(v => v.name).join(', ') : ''}. Double-click the ground to fly your gull there, or say hello in Chat.` : ''; $('visitors').hidden = !vs.length;
  town.setAway(n.activity.phase === 'doing' && n.activity.anim === 'sail' ? n.activity.islet ?? 0 : null);
  dyn.setSpots(n.spots || []);
  if (n.lifeVersion !== lifeVersion) { lifeVersion = n.lifeVersion; refreshLife(); }
  if (lifeData?.drawings?.length) town.setEasel(lifeData.drawings[lifeData.drawings.length - 1]);
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
        <h3>Stamps ${l.stamps.length}/${STAMPS.length}</h3><p><button class="inline" id="to-stamps">Open her stamp book</button></p>
        ${l.songs.length ? `<h3>Records</h3><p>${l.songs.map(esc).join(' · ')}</p>` : ''}
        <h3>Flower colours ${l.blooms.length}/${Object.keys(BLOOMS).length}</h3><p>${Object.keys(BLOOMS).map(k => l.blooms.includes(k) ? `<span style="display:inline-block;width:12px;height:12px;border-radius:6px;border:2px solid #1d2545;background:#${BLOOMS[k].toString(16).padStart(6, '0')}"></span> ${k}` : '<span class="dim">?</span>').join(' · ')}</p>
        <h3>Wardrobe</h3><p>Hats: ${(l.hats || [0]).filter(i => i).map(i => esc(HATS[i])).join(', ') || 'none yet'}. Sunglasses: ${(l.glasses || [0]).filter(i => i).map(i => esc(GLASSES[i])).join(', ') || 'none yet'}.</p>
        <h3>Star chart ${(l.sky || []).length}/${SKY_LIST.length + SKY_RARE.length}</h3><p>${(l.sky || []).map(esc).join(' · ') || 'nothing yet'}</p>
        <h3>Travels and travellers</h3><p>Islets rowed to: ${l.islets.map(esc).join(', ') || 'none yet'} (${l.islets.length}/${ISLETS.length}). Campers met: ${l.metCampers.map(esc).join(', ') || 'none yet'}.${l.camper ? ` ${esc(l.camper.name)} the ${esc(l.camper.kind)} is at the campsite today.` : ''}</p>
        <h3>Neighbours</h3>${Object.entries(l.friends).map(([k, v]) => `<div class="entry">${esc(k)}<div class="meter"><i style="width:${v * 10}%"></i></div></div>`).join('')}
        <h3>Museum ${got}/${l.total}</h3><div class="meter"><i style="width:${got / l.total * 100}%"></i></div>${cats}`;
      $('to-stamps').onclick = () => show('stamps');
    } else if (name === 'chat') {
      $('chat-dot').hidden = true;
      body.innerHTML = `<h2>Chat</h2><p class="dim">Say something to Nena. She answers when she can, while she gets on with her day. Everyone on the island can see what is said.${local ? ' (Right now you are talking to the stand-in in your browser.)' : ''}</p>
        <div id="chat-log"></div>
        <form id="say"><input name="text" maxlength="140" autocomplete="off" placeholder="Say something to Nena" aria-label="Message" /><button>Say</button></form>
        <p class="row"><button class="inline" id="wave2" type="button">Wave</button><span class="dim">You are <b>${esc(myName())}</b>${local ? '' : ' (your gull on the island)'}</span></p>`;
      renderChat();
      const f = $('say'); f.onsubmit = e => { e.preventDefault(); const text = f.text.value.trim(); if (!text) return;
        if (local) local.say(myName(), text); else sendMind({ type: 'say', text });
        f.text.value = ''; const b = f.querySelector('button'); b.disabled = true; let left = 6; b.textContent = `${left}s`; const iv = setInterval(() => { left--; b.textContent = left ? `${left}s` : 'Say'; if (!left) { clearInterval(iv); b.disabled = false; } }, 1000); };
      $('wave2').onclick = () => sendMind({ type: 'wave' });
      f.text.focus();
    } else if (name === 'stamps') {
      const l = lifeData, got = new Set(l?.stamps || []), days = l?.stampDays || {};
      body.innerHTML = `<h2>Her stamp book</h2><p class="dim">She earns these just by living. Each one pays a few coins.</p>
        <div class="meter"><i style="width:${got.size / STAMPS.length * 100}%"></i></div><p><b>${got.size} of ${STAMPS.length}</b> collected</p>
        <div class="stampbook">${[...STAMPS].sort((a, b) => (got.has(b.id) - got.has(a.id)) || ((days[a.id] || 0) - (days[b.id] || 0))).map(st => `<figure title="${esc(got.has(st.id) ? st.name : 'Hint: ' + st.hint)}"><canvas width="240" height="300" data-stamp="${st.id}"></canvas><figcaption>${got.has(st.id) ? `day ${days[st.id] ?? '?'}` : esc(st.hint)}</figcaption></figure>`).join('')}</div>`;
      body.querySelectorAll('canvas[data-stamp]').forEach(c => { const st = STAMPS.find(x => x.id === c.dataset.stamp); drawStamp(c, st, got.has(st.id) ? (days[st.id] ?? '?') : null); });
    } else if (name === 'settings') {
      const row = (key, label, hint) => `<label class="set"><span><b>${label}</b>${hint ? `<small>${hint}</small>` : ''}</span><input type="checkbox" class="switch" data-set="${key}" ${settings[key] ? 'checked' : ''} /></label>`;
      body.innerHTML = `<h2>Settings</h2><p class="dim">Saved in this browser.</p>
        <h3>Sound</h3>
        ${row('sound', 'Sounds', 'Rain, wind, the sea, birds, thunder and little chimes')}
        <label class="set"><span><b>Volume</b></span><input type="range" min="0" max="1" step="0.05" value="${settings.volume}" data-set="volume" ${settings.sound ? '' : 'disabled'} /></label>
        <h3>Look</h3>
        ${row('dots', 'Dot filter', 'The printed dot-screen look over everything')}
        <label class="set"><span><b>Graphics</b><small>Lower is smoother on phones and older computers</small></span><select data-set="quality"><option value="high"${settings.quality === 'high' ? ' selected' : ''}>High</option><option value="low"${settings.quality === 'low' ? ' selected' : ''}>Low</option></select></label>
        ${row('flashes', 'Lightning flashes', 'Turn off if flashing light bothers you')}
        <h3>On the island</h3>
        ${row('labels', 'Name tags', 'Names over neighbours, campers and visitors')}
        ${row('bubbles', 'Speech bubbles', 'What Nena and visitors say, over their heads')}
        ${row('follow', 'Camera follows Nena', 'Off: the camera stays where you put it')}
        ${row('clock24', '24-hour clock', 'Off: 9:30 pm instead of 21:30')}
        <h3>You</h3>
        <label class="set"><span><b>Your name</b><small>Shown on your gull, in chat and on notes</small></span><input type="text" id="set-name" maxlength="16" value="${esc(myName())}" /></label>
        <p class="row"><button class="inline" id="set-reset" type="button">Reset to defaults</button></p>`;
      body.querySelectorAll('[data-set]').forEach(el => el.onchange = el.oninput = () => {
        const k = el.dataset.set; settings[k] = el.type === 'checkbox' ? el.checked : el.type === 'range' ? Number(el.value) : el.value; saveSettings(); applySettings(k);
        if (k === 'sound') body.querySelector('[data-set=volume]').disabled = !settings.sound;
      });
      $('set-name').onchange = () => { const v = $('set-name').value.replace(/[^\p{L}\p{N}]/gu, '').slice(0, 16); if (!v) return; localStorage.setItem('nena-name', v); $('set-name').value = v; if (socket) { socket.close(); } };
      $('set-reset').onclick = () => { Object.assign(settings, DEFAULTS); saveSettings(); for (const k of Object.keys(DEFAULTS)) applySettings(k); show('settings'); };
    } else if (name === 'board') {
      if (local) { body.innerHTML = `<h2>The noticeboard</h2>${standIn}`; return; }
      const notes = await api('/api/board');
      const ago = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} days ago`; };
      body.innerHTML = `<h2>The noticeboard</h2><p class="dim">Everything people have left for Nena, and what she said back.</p>` +
        (notes.map(n => `<div class="note"><div class="note-from"><b>${esc(n.name)}</b> <span class="dim">${ago(n.at)}</span></div><p>${esc(n.text)}</p>${n.read ? `<div class="reply"><b>Nena:</b> ${esc(n.reply)}</div>` : '<div class="dim">Still in her mailbox. She has not read it yet.</div>'}</div>`).join('') || '<p>Nothing pinned up yet. Be the first to leave her something.</p>') +
        `<p><button class="inline" id="board-leave">Leave her something</button></p>`;
      $('board-leave').onclick = () => show('leave');
    } else if (name === 'makes') {
      const l = lifeData; if (!l) { body.innerHTML = '<h2>What she has made</h2><p>Nothing yet.</p>'; return; }
      const built = {}; for (const d of l.decorList || []) (built[d.kind] ||= []).push(d);
      const names = { flowers: ['flower patch', 'flower patches'], 'stepping stones': ['set of stepping stones', 'sets of stepping stones'], 'stick fence': ['stick fence', 'stick fences'], 'wind chime': ['wind chime', 'wind chimes'] };
      const named = (k, n) => names[k] ? names[k][n > 1 ? 1 : 0] : n > 1 ? (k.endsWith('s') ? k : k.endsWith('h') ? k + 'es' : k + 's') : k;
      body.innerHTML = `<h2>What she has made</h2>
        <h3>Drawings ${l.drawings.length ? `(${l.drawings.length})` : ''}</h3>${l.drawings.length ? `<p class="dim">Her latest is on the easel outside the studio.</p><div class="gallery">${[...l.drawings].reverse().slice(0, 12).map((d, i) => `<figure><canvas width="240" height="160" data-draw="${i}"></canvas><figcaption>${esc(d.title)}<span class="dim"> · day ${d.day}</span></figcaption></figure>`).join('')}</div>` : '<p>No drawings yet. She draws at the studio.</p>'}
        <h3>Photos ${l.photoLog.length ? `(${l.photoLog.length})` : ''}</h3>${l.photoLog.length ? `<p class="dim">Taken from where she stood, shown in today's light.</p><div class="gallery">${[...l.photoLog].reverse().slice(0, 6).map((p, i) => `<figure><canvas width="240" height="160" data-photo="${i}"></canvas><figcaption>day ${p.day}, ${clockText(p.hour)}</figcaption></figure>`).join('')}</div>` : '<p>No photos yet.</p>'}
        <h3>Things she built and planted</h3>${Object.keys(built).length ? Object.entries(built).map(([k, list]) => `<div class="entry built"><span>${list.length} ${esc(named(k, list.length))}</span><button class="inline" data-fly="${esc(k)}">Show me</button></div>`).join('') : '<p>Nothing out on the island yet.</p>'}
        <h3>Her island tune</h3>${l.tune ? `<p>${esc(l.tune)} <button class="inline" id="play-tune">Play it</button></p>` : '<p>She has not made one up yet.</p>'}
        <h3>Her flag</h3><p><span class="swatch" style="background:#${(FLAGS[l.flag] ?? FLAGS[0]).toString(16).padStart(6, '0')}"></span> flying in the square</p>
        ${l.dishes.length ? `<h3>Things she has cooked</h3><p>${[...l.dishes].reverse().slice(0, 10).map(d => esc(d.name)).join(' · ')}</p>` : ''}`;
      const ds = [...l.drawings].reverse(), ps = [...l.photoLog].reverse();
      body.querySelectorAll('canvas[data-draw]').forEach(c => { const d = ds[+c.dataset.draw]; drawPicture(c, d.title, d.seed); });
      body.querySelectorAll('canvas[data-photo]').forEach(c => renderPhoto(c, ps[+c.dataset.photo]));
      body.querySelectorAll('[data-fly]').forEach(b => b.onclick = () => { const list = built[b.dataset.fly], p = nena.root.position; const d = list.reduce((a, x) => Math.hypot(x.x - p.x, x.z - p.z) < Math.hypot(a.x - p.x, a.z - p.z) ? x : a); flyTo(d.x, d.z); });
      if ($('play-tune')) $('play-tune').onclick = () => { if (!playTune(l.tune)) $('play-tune').textContent = 'Sound is off (see Settings)'; };
    } else if (name === 'memory') {
      if (local) { body.innerHTML = `<h2>What she is carrying</h2>${standIn}`; return; }
      const m = await api('/api/memory');
      body.innerHTML = `<h2>What she is carrying</h2><p class="dim">${m.memories.length} of ${m.slots} slots. Each one fades a little every day; the weakest are forgotten.</p>` +
        (m.memories.map(x => `<div class="entry">${esc(x.text)}<div class="meter"><i style="width:${Math.round(x.strength * 100)}%"></i></div></div>`).join('') || '<p>Nothing yet. Leave her something.</p>') +
        `<h3>Lately interested in</h3><p>${Object.keys(m.interests).map(esc).join(', ') || 'nothing in particular'}</p>`;
    } else if (name === 'leave') {
      if (local) { body.innerHTML = `<h2>Leave her something</h2>${standIn}`; return; }
      const mine = await api(`/api/notes?name=${encodeURIComponent(myName())}`).catch(() => []);
      body.innerHTML = `<h2>Leave her something</h2><p>It goes in her mailbox. She reads it in her own time and remembers who left it. Notes and her replies are pinned to the noticeboard in the square, where everyone can read them.</p>
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
document.querySelectorAll('#nav button[data-panel], #tools button[data-panel]').forEach(b => b.onclick = () => (openPanel === b.dataset.panel ? close() : show(b.dataset.panel)));
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
  controls.enablePan = freeCam; controls.maxDistance = freeCam ? 300 : 140; controls.maxPolarAngle = freeCam ? 1.55 : 1.45;
  $('cam').textContent = freeCam ? 'Follow Nena' : 'Free camera';
  $('camhelp').hidden = !freeCam; if (freeCam) $('offline').hidden = true;
  if (matchMedia('(pointer: coarse)').matches) $('camhelp').textContent = 'Drag to look · pinch to zoom · two fingers to move';
  if (!freeCam) { const p = nena.root.position; const off = camera.position.clone().sub(controls.target).setLength(22); controls.target.set(p.x, 1, p.z); camera.position.copy(controls.target).add(off); if (camera.position.y < 6) camera.position.y = 6; }
};

// ---- applying settings ----------------------------------------------------------------------
function applySettings(k) {
  if (k === 'dots') dots.enabled = settings.dots;
  if (k === 'sound') sound.setEnabled(settings.sound);
  if (k === 'volume') sound.setVolume(settings.volume);
  if (k === 'labels') display.labels = settings.labels;
  if (k === 'bubbles') display.bubbles = settings.bubbles;
  if (k === 'quality') { renderer.setPixelRatio(settings.quality === 'low' ? Math.min(devicePixelRatio, 1.25) : Math.min(devicePixelRatio, 2)); dots.uniforms.cell.value = 5 * renderer.getPixelRatio(); resize(); }
  if (k === 'clock24' && now) apply(now);
}
for (const k of ['labels', 'bubbles', 'volume']) applySettings(k);
sound.setVolume(settings.volume);
if (settings.sound) sound.setEnabled(true);
const unlock = () => { sound.unlock(); }; addEventListener('pointerdown', unlock); addEventListener('keydown', unlock);

// ---- chat log -------------------------------------------------------------------------------
function renderChat() {
  const box = $('chat-log'); if (!box) return;
  const me = myName(), stick = box.scrollHeight - box.scrollTop - box.clientHeight < 40;
  box.innerHTML = chatLog.length ? chatLog.map(c => c.kind === 'nena'
    ? `<div class="msg nena${c.asleep ? ' asleep' : ''}"><b>Nena</b>${c.to?.length ? `<span class="dim"> to ${c.to.map(esc).join(', ')}</span>` : ''}<p>${esc(c.text)}</p><span class="when">${clockText(c.hour)}</span></div>`
    : `<div class="msg visitor${c.name === me ? ' mine' : ''}"><b>${esc(c.name)}</b><p>${esc(c.text)}</p><span class="when">${clockText(c.hour)}</span></div>`).join('')
    : '<p class="dim">Nobody has said anything yet. Say hello.</p>';
  if (stick || box.dataset.first !== '1') { box.scrollTop = box.scrollHeight; box.dataset.first = '1'; }
}

// ---- stamps: a little pop-up when she earns one ----------------------------------------------
let knownStamps = null; const stampQueue = []; let stampShowing = false;
function noticeStamps(list) {
  if (knownStamps) for (const id of list) if (!knownStamps.has(id)) stampQueue.push(id);
  knownStamps = new Set(list); nextStamp();
}
function nextStamp() {
  if (stampShowing || !stampQueue.length) return;
  const st = STAMPS.find(x => x.id === stampQueue.shift()); if (!st) return nextStamp();
  stampShowing = true;
  const el = $('stamp-pop'); el.innerHTML = `<canvas width="240" height="300"></canvas><div><b>Nena earned a stamp!</b><span>${esc(st.name)}</span><span class="dim">+${st.coins} coins</span></div>`;
  drawStamp(el.querySelector('canvas'), st, lifeData?.stampDays?.[st.id] ?? now?.day ?? 1); sound.stamp();
  el.hidden = false; el.classList.remove('go', 'out'); void el.offsetWidth; el.classList.add('go');
  el.onclick = () => show('stamps');
  setTimeout(() => el.classList.add('out'), 5800);
  setTimeout(() => { el.hidden = true; stampShowing = false; nextStamp(); }, 6500);
}
if (qs.has('stamp')) setTimeout(() => { stampQueue.push(qs.get('stamp')); nextStamp(); }, 2500);   // preview a stamp pop-up

// ---- photos: render the view from where she stood ------------------------------------
const photoCam = new THREE.PerspectiveCamera(50, 1.5, 0.5, 800);
function renderPhoto(canvas, p) {
  const w = renderer.domElement.width, h = renderer.domElement.height;
  photoCam.aspect = w / h; photoCam.updateProjectionMatrix();
  photoCam.position.set(p.x, 1.7, p.z); photoCam.lookAt(p.x + Math.sin(p.h) * 12, 1.3, p.z + Math.cos(p.h) * 12);
  const hid = nena.root.visible; nena.root.visible = false;
  renderer.render(scene, photoCam);
  const g = canvas.getContext('2d'), cw = canvas.width, ch = canvas.height, sw = Math.min(w, h * cw / ch), sh = sw * ch / cw;
  g.drawImage(renderer.domElement, (w - sw) / 2, (h - sh) / 2, sw, sh, 0, 0, cw, ch);
  nena.root.visible = hid;
}

// ---- show me: fly the camera to something on the island ----------------------------------
function flyTo(x, z) {
  if (!freeCam) $('cam').click();
  const off = new THREE.Vector3(6, 6, 9);
  flight = { from: controls.target.clone(), fromCam: camera.position.clone(), to: new THREE.Vector3(x, 0.6, z), toCam: new THREE.Vector3(x, 0.6, z).add(off), t: 0 };
}
let flight = null;

// ---- the noticeboard is clickable ---------------------------------------------------------
const pickRay = new THREE.Raycaster(), ptr = new THREE.Vector2();
const clickableAt = e => { ptr.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); pickRay.setFromCamera(ptr, camera); const hit = pickRay.intersectObject(town.board, true)[0]; return hit?.object.userData.clickable || null; };
let downAt = null;
canvas.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY]; });
canvas.addEventListener('pointerup', e => { if (downAt && Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) < 6 && clickableAt(e) === 'board') show('board'); downAt = null; });
let hoverT = 0;
canvas.addEventListener('pointermove', e => { if (performance.now() - hoverT < 80) return; hoverT = performance.now(); canvas.style.cursor = clickableAt(e) ? 'pointer' : ''; });

// ---- visitors: your gull ----------------------------------------------------------------
const ray = new THREE.Raycaster(), groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
canvas.addEventListener('dblclick', e => {
  ray.setFromCamera(new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), camera);
  const hit = new THREE.Vector3(); if (ray.ray.intersectPlane(groundPlane, hit)) sendMind({ type: 'move', x: hit.x, z: hit.z });
});

// ---- frame loop ----------------------------------------------------------------
const clock = new THREE.Clock(), bubble = $('bubble'), head = new THREE.Vector3();
let swimT = 0, heading = 0, elapsed = 0, lastSay = null, talkUntil = 0;
function frame() {
  const dt = Math.min(0.1, clock.getDelta()); elapsed += dt;
  const act = now?.activity || { phase: 'idle', action: 'idle', anim: 'stand' };
  if (qs.has('ride')) { act.phase = 'walking'; act.ride = true; }   // preview her on the robot
  if (qs.has('at')) { const [ax, az] = qs.get('at').split(',').map(Number); target.set(ax, 0, az); if (!qs.has('ride')) { act.phase = 'idle'; act.anim = 'stand'; } }   // preview: stand her somewhere
  const pos = nena.root.position, k = 1 - Math.exp(-dt * 6), doing = act.phase === 'doing';

  const goal = target.clone();
  if (doing && act.anim === 'swim') { swimT += dt * 0.55; goal.set(town.pond.x + Math.cos(swimT) * 5.5, 0.12, town.pond.z + Math.sin(swimT) * 5.5); heading = -swimT; }            // circles on the pond
  else if (doing && act.anim === 'dive') { swimT += dt * 0.5; const l = Math.hypot(target.x, target.z); goal.set(target.x / l * (WORLD.radius + 3.5) + Math.cos(swimT) * 2, 0, target.z / l * (WORLD.radius + 3.5) + Math.sin(swimT) * 2); heading = -swimT; }   // out in the sea
  else if (doing && act.anim === 'sail') { swimT += dt * 0.5; const ip = isletPos(act.islet ?? 0); goal.set(ip.x + Math.cos(swimT) * 1.6, 0.35, ip.z + Math.sin(swimT) * 1.6); heading = -swimT; if (pos.distanceTo(goal) > 12) pos.copy(goal); }   // ashore on a little island
  else if (doing && act.anim === 'inside' && act.place) { const s = site(act.place); goal.set(s.x, 0, s.z); heading = 0; }                                           // indoors
  else if (doing && ['read', 'sit', 'lie'].includes(act.anim) || (doing && act.place === 'beach' && act.anim !== 'fish')) heading = Math.atan2(-target.x, -target.z);   // back to the wall / the sea
  else if (doing && act.anim === 'fish') heading = act.place === 'river' ? 0 : Math.atan2(target.x, target.z);                                                       // facing the water
  else if (now) heading = now.heading;
  if (qs.has('face')) heading = Number(qs.get('face'));   // preview: which way she faces
  pos.lerp(goal, k);
  let dh = heading - nena.root.rotation.y; dh = Math.atan2(Math.sin(dh), Math.cos(dh));
  nena.root.rotation.y += dh * k;
  // her face: mood, weather, what she's doing and what just happened
  if (now?.say !== lastSay) { lastSay = now?.say; if (lastSay) talkUntil = elapsed + Math.min(2.5, 0.6 + lastSay.length * 0.04); }
  const f = feelings.compute(now && { ...now, weather: qs.get('weather') || now.weather }, elapsed, qs.get('feel') || window.__world?.feel);
  f.talk = elapsed < talkUntil; nena.setFeeling(f);
  nena.animate(dt, act);

  const hour = qs.has('hour') ? Number(qs.get('hour')) : now ? now.hour : 12;
  const showEv = qs.get('show') || now?.event?.show || null;
  setSky(hour, qs.get('weather') || now?.weather || 'clear', dt, showEv);
  town.setNight(nightness, doing && act.action === 'watch_film', elapsed);
  town.setSeason(qs.get('season') || now?.season || 'summer', !lifeData || lifeData.shaken !== now?.day);
  town.setEvent(showEv);
  town.setClock(hour);
  town.setObservatory(nightness, doing && act.action === 'observe', elapsed);
  town.setLights(nightness, elapsed);
  far.update(elapsed, nightness, sky);
  dots.uniforms.amount.value = 1 - nightness * 0.5;   // lighter touch at night so the glow reads
  dyn.update(dt, elapsed, qs.get('npcs') ? now?.npcs?.map(n => ({ ...n, out: true })) : now?.npcs, nightness);   // ?npcs=1 shows everyone (previews)
  { const p = nena.root.position, edge = Math.hypot(controls.target.x, controls.target.z) / WORLD.radius;
    sound.update(dt, { ...wx, day: 1 - nightness, summer: (now?.season || '') === 'summer', seaNear: 0.35 + Math.max(0, edge - 0.4) * 1.2 }); void p; }
  dyn.setVisitors([...(now?.visitors || []), ...(qs.get('gull') && now ? [{ id: -1, name: 'a gull', x: now.pos.x + 1.6, z: now.pos.z + 1.2, wave: Date.now() }] : [])], elapsed, dt);   // ?gull=1 previews a visitor
  const sp = snow.geometry.attributes.position;
  if (wx.snow > 0.02) { for (let i = 0; i < SNOW; i++) { let y = sp.getY(i) - dt * (1.5 + (i % 5) * 0.3); if (y < 0) y = 30; sp.setY(i, y); } sp.needsUpdate = true; }

  if (flight) { flight.t = Math.min(1, flight.t + dt * 0.7); const e = flight.t * flight.t * (3 - 2 * flight.t); controls.target.lerpVectors(flight.from, flight.to, e); camera.position.lerpVectors(flight.fromCam, flight.toCam, e); if (flight.t >= 1 || keys.size) flight = null; }
  if (freeCam) {
    const sp = (keys.has('shift') ? 40 : 16) * dt, f = new THREE.Vector3(); camera.getWorldDirection(f); f.y = 0; f.normalize(); const r = new THREE.Vector3(-f.z, 0, f.x), mv = new THREE.Vector3();
    if (keys.has('w') || keys.has('arrowup')) mv.add(f); if (keys.has('s') || keys.has('arrowdown')) mv.sub(f); if (keys.has('d') || keys.has('arrowright')) mv.add(r); if (keys.has('a') || keys.has('arrowleft')) mv.sub(r);
    if (keys.has('e')) mv.y += 1; if (keys.has('q')) mv.y -= 1;
    mv.multiplyScalar(sp); camera.position.add(mv); controls.target.add(mv);
    if (camera.position.y < 1.5) { controls.target.y += 1.5 - camera.position.y; camera.position.y = 1.5; }
  } else if (!window.__world?.freeze && settings.follow) {
    const before = controls.target.clone();
    controls.target.lerp(new THREE.Vector3(pos.x, 1, pos.z), 1 - Math.exp(-dt * 2.5));
    camera.position.add(controls.target.clone().sub(before));   // camera travels with her
  }
  controls.update();
  composer.render();

  if (now?.say && settings.bubbles) {
    head.set(pos.x, pos.y + 2.6, pos.z).project(camera);
    bubble.hidden = head.z > 1; bubble.textContent = now.say;
    bubble.style.left = `${(head.x * 0.5 + 0.5) * innerWidth}px`; bubble.style.top = `${(-head.y * 0.5 + 0.5) * innerHeight}px`;
  } else bubble.hidden = true;
  requestAnimationFrame(frame);
}
frame();
window.__world = { dyn, scene, camera, controls, nena, sound, site, town, npcs: () => now?.npcs || [], camper: () => now?.camper, pos: () => now?.pos };   // handy in the console
