import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { PLACES, NEEDS, ISLETS, WORLD, SKY_ISLANDS, TRIP_ISLES, LONE_ISLES, BALLOON, FORAGE, CAMPERS, TOWN_ISLANDS, NEIGHBOURS, isletPos, isleSpot, islePos, townPos, site } from '../../shared/world.js';
import { kitModel as kitM, whenKit as whenK } from './kit.js';
import { icon } from './icons.js';
import { WEATHER_WORDS, FLAGS, SCARVES, HATS, GLASSES, SKY as SKY_LIST, SKY_RARE, CATS, SPECIES, STAMPS, BLOOMS, ACTIONS, todaysEvent } from '../../shared/data.js';
import { buildNena, buildRobot } from './nena.js';
import { buildTown } from './town.js';
import { buildDynamic, display } from './dynamic.js';
import { sound } from './sound.js';
import { startLocalMind } from './localmind.js';
import { drawPicture, playTune } from './art.js';
import { drawStamp } from './stamps.js';
import { buildFarIslands } from './far.js';
import { makeFeelings } from './feelings.js';
import { waterMaterial, tickWater } from './water.js';
import { buildSky, HORIZON } from './sky.js';
import { openChart, updateChart, closeChart, chartOpen } from './chart.js';
const feelings = makeFeelings();

const MIND = (import.meta.env.VITE_MIND_URL || 'http://localhost:8787').replace(/\/$/, '');
const qs = new URLSearchParams(location.search);   // ?hour=23&weather=aurora&season=winter&show=fireworks to preview a look
const $ = id => document.getElementById(id);

// ---- settings (kept in this browser) -----------------------------------------------------
const DEFAULTS = { sound: true, volume: 0.6, dots: localStorage.getItem('nena-dots') !== 'off', quality: matchMedia('(max-width: 700px)').matches ? 'low' : 'high', labels: true, bubbles: true, flashes: true, clock24: true, follow: true, res: 'auto', draw: 1 };
const settings = (() => { try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem('nena-settings') || '{}') }; } catch { return { ...DEFAULTS }; } })();
const saveSettings = () => { try { localStorage.setItem('nena-settings', JSON.stringify(settings)); } catch {} };

// ---- scene ---------------------------------------------------------------
const canvas = $('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
// Render resolution: a fixed share of the screen's pixels, or Auto, which lowers it when frames run slow
// (long frames make taps and clicks feel laggy) and raises it again when there's room.
const res = { auto: 1, acc: 0, n: 0, good: 0 };
const pixelRatio = () => (settings.quality === 'low' ? Math.min(devicePixelRatio, 1.25) : Math.min(devicePixelRatio, 2)) * (settings.res === 'auto' ? res.auto : Number(settings.res) || 1);
renderer.setPixelRatio(pixelRatio());
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x7fe9ff, 150, 470);
const camera = new THREE.PerspectiveCamera(42, 1, 0.5, 1400);
camera.position.set(PLACES.home.x + 10, 9, PLACES.home.z + 15);
const controls = new OrbitControls(camera, canvas);
controls.target.set(PLACES.home.x, 1, PLACES.home.z);
controls.enableDamping = true; controls.enablePan = false;
controls.minDistance = 8; controls.maxDistance = 165; controls.maxPolarAngle = 1.45;

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

// the ocean far below is drawn by the sky dome (sky.js), so it reaches all the way to the horizon
// clouds: it is a sky island, so a ring of slow clouds around and below it
const clouds = new THREE.Group(); scene.add(clouds);
const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.45, flatShading: true });
// Clouds thin out and shrink away when they drift into an island, or when the camera flies into them,
// so they never sit in front of what is going on. Each puff shrinks away as a whole (by its centre).
const ISLES = [{ x: 0, z: 0, r: WORLD.radius + 16, y: 0 },
  ...TOWN_ISLANDS.map(t => ({ x: Math.cos(t.a) * t.r, z: Math.sin(t.a) * t.r, r: (t.id === 'fountain' ? 16 : 13) * t.scale + 6, y: t.y })),
  ...LONE_ISLES.map(l => ({ x: Math.cos(l.a) * l.r, z: Math.sin(l.a) * l.r, r: 12 * l.scale + 6, y: l.y })),
  ...SKY_ISLANDS.map(s => ({ x: Math.cos(s.a) * s.r, z: Math.sin(s.a) * s.r, r: s.size + 8, y: s.y }))];
const cloudFade = { uIsles: { value: ISLES.slice(0, 16).map(i => new THREE.Vector4(i.x, i.z, i.r, i.y)).concat(Array(Math.max(0, 16 - ISLES.length)).fill().map(() => new THREE.Vector4(0, 0, -1, 0))) }, uCamPos: { value: new THREE.Vector3() } };
function fadeClouds(mat) {
  mat.onBeforeCompile = sh => { Object.assign(sh.uniforms, cloudFade);
    sh.vertexShader = 'uniform vec4 uIsles[16]; uniform vec3 uCamPos; varying float vFade;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      vec4 ic = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0); float f = 1.0;
      for (int i = 0; i < 16; i++) { vec4 s = uIsles[i]; if (s.z < 0.0) continue; float d = length(ic.xz - s.xy);
        f = min(f, max(smoothstep(s.z * 0.85, s.z * 1.35 + 12.0, d), smoothstep(30.0, 60.0, abs(ic.y - s.w)))); }
      f = min(f, smoothstep(10.0, 34.0, distance(ic.xyz, uCamPos)));
      vFade = f; transformed *= f * f * (3.0 - 2.0 * f);`);
    sh.fragmentShader = 'varying float vFade;\n' + sh.fragmentShader.replace('void main() {', `void main() {
      if (vFade < 0.02) discard;`); }; }
fadeClouds(cloudMat);
{ const puff = new THREE.IcosahedronGeometry(1, 1), N = 80, PER = 7;
  const inst = new THREE.InstancedMesh(puff, cloudMat, N * PER), m = new THREE.Object3D();
  let seed = 3; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let c = 0, k = 0; c < N; c++) {
    const below = c < 26, a = rnd() * 6.283, r = below ? 40 + rnd() * 150 : 120 + rnd() * 260, y = below ? -30 - rnd() * 26 : -18 + rnd() * 44, size = below ? 7 + rnd() * 6 : 6 + rnd() * 8;
    const cx = Math.cos(a) * r, cz = Math.sin(a) * r;
    const blocksView = false;   // clouds now melt away round the islands instead (fadeClouds)
    for (let i = 0; i < PER; i++, k++) {
      if (blocksView) { m.position.set(0, -9999, 0); m.scale.setScalar(0.001); m.updateMatrix(); inst.setMatrixAt(k, m.matrix); continue; }
      const s = size * (0.55 + rnd() * 0.5) * (i === 0 ? 1.3 : 1);
      m.position.set(cx + (rnd() - 0.5) * size * 2.4, y + rnd() * size * 0.35, cz + (rnd() - 0.5) * size * 1.4);
      m.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); m.scale.set(s, s * 0.62, s); m.updateMatrix(); inst.setMatrixAt(k, m.matrix);
    }
  }
  clouds.add(inst); }
// a second, far ring of big clouds round the horizon; not fogged (they are past the fog), tinted into the haze instead
const farCloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5, flatShading: true, fog: false }); fadeClouds(farCloudMat);
{ const puff = new THREE.IcosahedronGeometry(1, 0), N = 70, PER = 8,   // far away: plain puffs are enough
  inst = new THREE.InstancedMesh(puff, farCloudMat, N * PER), m = new THREE.Object3D();
  let seed = 41; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let c = 0, k = 0; c < N; c++) {
    const a = c / N * 6.283 + rnd() * 0.08, r = 480 + rnd() * 200, y = -70 + rnd() * 95, size = 14 + rnd() * 18, cx = Math.cos(a) * r, cz = Math.sin(a) * r;
    for (let i = 0; i < PER; i++, k++) { const s = size * (0.5 + rnd() * 0.55) * (i === 0 ? 1.35 : 1);
      m.position.set(cx + (rnd() - 0.5) * size * 2.8 * Math.abs(Math.sin(a)) + (rnd() - 0.5) * size * 0.8, y + rnd() * size * 0.3, cz + (rnd() - 0.5) * size * 2.8 * Math.abs(Math.cos(a)) + (rnd() - 0.5) * size * 0.8);
      m.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); m.scale.set(s, s * 0.55, s); m.updateMatrix(); inst.setMatrixAt(k, m.matrix); } }
  inst.frustumCulled = false; clouds.add(inst); }
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
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

// ---- sky by the hour -------------------------------------------------------
const SKY = HORIZON;   // the horizon colour, which the fog matches
const skyDome = buildSky(scene);
let skyHour = 12;
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const sky = new THREE.Color();
const wx = { snow: 0, aurora: 0, mist: 0, meteors: 0, rain: 0, storm: 0, cloudy: 0, wind: 0, heat: 0, rainbow: 0 };
let nightness = 0;
function setSky(hour, weather, dt, show) {
  const d = smooth(5, 7.5, hour) * (1 - smooth(18.5, 21, hour)), n = 1 - d; nightness = n; skyHour = hour;
  sky.copy(SKY.night).lerp(SKY.day, d).lerp(SKY.dusk, Math.min(1, 4 * d * (1 - d) * 0.85));
  const k = 1 - Math.exp(-dt * 1.5);
  for (const key of Object.keys(wx)) wx[key] += ((weather === key ? 1 : 0) - wx[key]) * k;
  if (wx.mist > 0.01) sky.lerp(new THREE.Color(d > 0.5 ? 0xd8eef5 : 0x232a45), wx.mist * 0.6);
  scene.background = sky; scene.fog.color.copy(sky);
  scene.fog.near = 150 - wx.mist * 115; scene.fog.far = 470 - wx.mist * 330;   // misty, but she and the town stay in view
  hemi.intensity = 0.28 + d * 1.25; hemi.color.set(d > 0.5 ? 0xffffff : 0x8fa8ff); hemi.groundColor.set(d > 0.5 ? 0x9fd27a : 0x1d2545);
  sun.intensity = d * 2.0 + n * 0.25; sun.color.set(d > 0.5 ? 0xfff2d8 : 0x9bb4ff);
  stars.visible = false;   // the sky dome draws the stars now
  aurora.children.forEach((m, i) => { m.material.opacity = n * wx.aurora * (0.55 + 0.2 * Math.sin(performance.now() / 1700 + i * 2)); });
  snow.material.opacity = wx.snow * 0.9;
  cloudMat.color.copy(CLOUD.night).lerp(CLOUD.day, d).lerp(CLOUD.dusk, 4 * d * (1 - d) * 0.6); if (wx.mist > 0.01) cloudMat.color.lerp(sky, wx.mist * 0.5); cloudMat.emissive.copy(cloudMat.color);
  clouds.rotation.y += dt * 0.004;
  farCloudMat.color.copy(cloudMat.color).lerp(sky, 0.3 + wx.mist * 0.4); farCloudMat.emissive.copy(farCloudMat.color);
  bloom.strength = settings.quality === 'low' ? 0 : n * 0.45; bloom.enabled = settings.quality !== 'low';
  setWeatherFx(dt, d, n, performance.now() / 1000);

  // shooting stars
  meteors.material.opacity = 0;   // the sky dome draws shooting stars as streaks
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
// rainbows: after rain, when the sun comes out, a big one with a faint second bow outside it,
// and smaller arcs here and there round the sky. Each is one soft band of colour, fading at its feet.
const rainbow = new THREE.Group(); scene.add(rainbow);
const bowMat = (outer) => new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
  uniforms: { uOpacity: { value: 0 }, uIn: { value: 0 }, uOut: { value: 1 }, uFlip: { value: outer ? 1 : 0 } },
  vertexShader: 'varying vec2 vP; void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform float uOpacity, uIn, uOut, uFlip; varying vec2 vP;
    vec3 spectrum(float t) { // t 0 = inner (violet) .. 1 = outer (red)
      vec3 c = mix(vec3(0.42, 0.18, 0.77), vec3(0.24, 0.45, 0.95), smoothstep(0.0, 0.2, t));
      c = mix(c, vec3(0.31, 0.75, 0.42), smoothstep(0.2, 0.42, t)); c = mix(c, vec3(1.0, 0.86, 0.24), smoothstep(0.42, 0.62, t));
      c = mix(c, vec3(0.98, 0.52, 0.2), smoothstep(0.62, 0.8, t)); return mix(c, vec3(0.93, 0.27, 0.2), smoothstep(0.8, 1.0, t)); }
    void main() { float r = length(vP), t = clamp((r - uIn) / (uOut - uIn), 0.0, 1.0); if (uFlip > 0.5) t = 1.0 - t;
      float edge = smoothstep(0.0, 0.18, t) * smoothstep(1.0, 0.82, t), feet = smoothstep(0.0, 0.35, vP.y / r);
      gl_FragColor = vec4(spectrum(t), edge * feet * uOpacity); }` });
function bow(R, w, az, dist, y, k, outer = false) {
  const m = new THREE.Mesh(new THREE.RingGeometry(R - w / 2, R + w / 2, 96, 1, 0, Math.PI), bowMat(outer));
  m.material.uniforms.uIn.value = R - w / 2; m.material.uniforms.uOut.value = R + w / 2; m.userData.k = k;
  m.position.set(Math.cos(az) * dist, y, Math.sin(az) * dist); m.lookAt(0, y, 0); rainbow.add(m); return m; }
{ const az = Math.atan2(-12, -20);
  bow(150, 16, az, 240, -40, 0.55); bow(190, 14, az, 250, -40, 0.22, true);   // the main bow and its faint double, colours reversed
  [[70, 9, az + 1.0, 280, -20, 0.38], [95, 10, az - 0.85, 300, -35, 0.32], [48, 7, az + 2.3, 230, -5, 0.3], [120, 12, az + 3.5, 330, -55, 0.28], [60, 8, az - 2.2, 260, -12, 0.3]]
    .forEach(([R, w, a, d, y, k]) => bow(R, w, a, d, y, k)); }
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
  skyDome.update(skyHour, d, sky, { grey, mist: wx.mist, flash: fl, meteors: wx.meteors }, dt, camera);
  scene.fog.near -= wet * 55; scene.fog.far -= wet * 110;
  hemi.intensity = hemi.intensity * (1 - grey * 0.45) + fl * 2.5 + wx.heat * 0.2 * d;
  sun.intensity = sun.intensity * (1 - grey * 0.75) + wx.heat * 0.6 * d;
  cloudMat.color.lerp(d > 0.5 ? new THREE.Color(0x7e8a99) : new THREE.Color(0x10142a), grey * 0.7); cloudMat.emissive.copy(cloudMat.color);
  farCloudMat.color.copy(cloudMat.color).lerp(sky, 0.3 + wx.mist * 0.4); farCloudMat.emissive.copy(farCloudMat.color);
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
  rainbow.children.forEach(m => { m.material.uniforms.uOpacity.value = wx.rainbow * d * m.userData.k * 1.4; }); rainbow.visible = wx.rainbow * d > 0.01;
  town.setWind(wx.wind + wx.storm * 0.7, t);
}

// ---- live state: the real mind over WebSocket, or a stand-in in this browser ----------
let now = null, local = null, fails = 0, lifeVersion = -1, lifeData = null, socket = null, myId = null;
const chatLog = [];
const onChat = item => { if (item.kind === 'nena' && item.to?.includes(myName())) { sound.blip(); feelings.feel('happy', 3); } else if (item.kind !== 'nena') feelings.feel('surprised', 1.2); chatLog.push(item); if (chatLog.length > 200) chatLog.shift(); if (openPanel === 'chat') renderChat(); else if (item.kind === 'nena' && item.to?.includes(myName())) $('chat-dot').hidden = false; };
const sendMind = m => { if (socket?.readyState === 1) socket.send(JSON.stringify(m)); };
const feed = [];
const target = new THREE.Vector3(PLACES.home.x, 0, PLACES.home.z);
// Her position arrives a few times a second. Between updates she carries on at the speed she was going,
// so walking and riding glide instead of surging forward and easing off each time.
const lastPos = target.clone(), vel = new THREE.Vector3(); let lastPosAt = performance.now(), sincePos = 0;
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
// start once this whole file has run: on https the stand-in starts straight away, and it
// uses things declared further down (the open panel, season names)
setTimeout(connect, 0);
setInterval(() => { if (local) apply(local.now()); }, 200);
$('status').onclick = () => $('status').classList.toggle('open');
const chartInfo = (extra = {}) => ({ islets: lifeData?.islets || [], far: Object.keys(lifeData?.farVisited || {}), at: (({ x, z }) => ({ x, z }))(nena.root.position), heading: now?.heading, cam: freeCam ? { x: camera.position.x, z: camera.position.z, yaw: 0 } : null, ...extra });
$('map-btn').onclick = () => (chartOpen() ? closeChart() : openChart(chartInfo()));
$('offline').onclick = () => { $('offline').hidden = true; };   // on phones the card starts small

const NEED_COLORS = { fullness: '#f2792e', energy: '#ffd93b', wonder: '#6a2fc4', joy: '#ff7fa3', calm: '#2fc6b3' };
const NEED_ICONS = { fullness: '🍙', energy: '⚡', wonder: '✨', joy: '💗', calm: '🍃' };
$('needs').innerHTML = NEEDS.map(k => `<div class="need" id="needbox-${k}"><svg viewBox="0 0 40 40"><circle class="track" cx="20" cy="20" r="16"/><circle class="fill" id="need-${k}" cx="20" cy="20" r="16" stroke="${NEED_COLORS[k]}" pathLength="100" stroke-dasharray="100" stroke-dashoffset="50"/></svg><span>${NEED_ICONS[k]}</span><small>${k[0].toUpperCase() + k.slice(1)}</small></div>`).join('');
const MOOD_FACES = { content: '🙂', curious: '🧐', delighted: '🤩', happy: '😊', hungry: '😋', 'put out': '😤', restless: '😣', sleepy: '🥱', asleep: '😴', unsettled: '😟', 'a little flat': '😔' };
const WEATHER_ICONS = { clear: '☀️', cloudy: '☁️', rain: '🌧️', storm: '⛈️', wind: '🌬️', heat: '🔥', rainbow: '🌈', snow: '❄️', mist: '🌫️', aurora: '🌌', meteors: '🌠' };
const SEASON_ICONS = { spring: '🌸', summer: '🌿', autumn: '🍂', winter: '❄️' };
const DOING_ICONS = [[/sleep|nap/, '💤'], [/eat|cook|bake|cookie|cocoa|lolly|drink/, '🍪'], [/fish/, '🎣'], [/read|library|letter/, '📖'], [/draw|paint|art|craft|compose|tune|record/, '🎨'], [/storm|rain/, '⛈️'], [/star|observ|sky|cloud|gaze|wish/, '🔭'], [/garden|flower|plant|crop|harvest|weed|tree/, '🌱'], [/swim|dive|boat|sea|beach|sunbathe/, '🌊'], [/film|cinema/, '🎬'], [/museum|fossil|dig/, '🦴'], [/buy|sell|shop|clothes|turnip|trade/, '🛍️'], [/chat|greet|friend|camper|hobby|gift/, '💬'], [/photo/, '📷'], [/snowman/, '⛄'], [/kite/, '🪁'], [/coin/, '🪙'], [/walk|wander|way|riding|going/, '👣']];
const doingIcon = (a = {}) => { const s = `${a.action || ''} ${a.label || ''}`; for (const [re, ic] of DOING_ICONS) if (re.test(s)) return ic; return '💭'; };
const clockText = h => { const hh = Math.floor(h) % 24, mm = String(Math.floor((h % 1) * 60)).padStart(2, '0'); return settings.clock24 ? `${String(hh).padStart(2, '0')}:${mm}` : `${hh % 12 || 12}:${mm} ${hh < 12 ? 'am' : 'pm'}`; };
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

async function refreshLife() {
  try { lifeData = local ? local.life() : await api('/api/life'); noticeStamps(lifeData.stamps || []); dyn.setDecor(lifeData.decorList || [], now?.day || 1); if (openPanel === 'things' || openPanel === 'makes') show(openPanel); } catch {}
}
function apply(n, snap) {
  now = n;
  { const t = performance.now(), gap = (t - lastPosAt) / 1000;
    if (n.pos.x !== lastPos.x || n.pos.z !== lastPos.z) {
      const v = new THREE.Vector3(n.pos.x - lastPos.x, 0, n.pos.z - lastPos.z).divideScalar(Math.max(0.05, gap));
      vel.copy(snap || v.length() > 12 || n.activity?.phase !== 'walking' ? v.set(0, 0, 0) : v);   // a jump (teleport, first load) or standing: no carrying on
      lastPos.set(n.pos.x, 0, n.pos.z); lastPosAt = t; sincePos = 0;
    } else if (gap > 0.6) vel.set(0, 0, 0); }
  target.set(n.pos.x, 0, n.pos.z);
  if (snap) nena.root.position.copy(target);
  const upcoming = n.event ? `${n.event.name} is on!` : (todaysEvent(n.day) ? `${todaysEvent(n.day).name} today` : '');
  { const w = qs.get('weather') || n.weather; $('clock').innerHTML = `<span>Day ${n.day}</span><span>${SEASON_ICONS[n.season] || ''} ${cap(n.season)} ${n.dayOfSeason}/7</span><span>${n.night ? '🌙' : '🕑'} ${clockText(n.hour)}</span><span>${WEATHER_ICONS[w] || ''} ${cap(WEATHER_WORDS[w] || w)}</span>`; }
  $('mood').textContent = `${MOOD_FACES[n.mood] || '🙂'} ${n.mood}`;
  $('doing-ico').textContent = doingIcon(n.activity);
  { const pr = n.activity.phase === 'doing' && n.activity.progress > 0; $('doing-bar').hidden = !pr; if (pr) $('doing-bar').firstChild.style.width = `${Math.round(n.activity.progress * 100)}%`; }
  $('event').textContent = upcoming; $('event').hidden = !upcoming;
  { const v = n.activity.anim === 'voyage' && n.activity.phase === 'doing' ? voyagePose(n.activity) : null;
    $('doing').textContent = v ? v.text : n.activity.label + (n.activity.detail && n.activity.phase === 'doing' ? `: ${n.activity.detail}` : ''); }
  $('thought').textContent = n.thought ? `"${n.thought}"` : '';
  $('coins').innerHTML = `<i class="coin"></i>${n.coins}`;
  { const m = $('mind'); m.textContent = n.mind.local ? 'stand-in mind' : n.mind.model ? 'her own mind' : 'scripted mind'; m.className = n.mind.local ? 'standin' : n.mind.model ? 'live' : 'scripted';
    m.title = n.mind.local ? 'Her own mind is not online yet: a stand-in is running in your browser' : n.mind.model ? `Mind: ${n.mind.model} (last choice: ${n.mind.source})` : 'Scripted fallback: no model connected yet'; }
  for (const k of NEEDS) { const v = Math.round(n.needs[k] * 100); $(`need-${k}`).setAttribute('stroke-dashoffset', 100 - v); const b = $(`needbox-${k}`); b.title = `${cap(k)}: ${v}%`; b.classList.toggle('low', v < 25); }
  updateChart({ at: n.activity.action === 'boat_trip' && n.activity.phase === 'doing' && n.activity.islet != null ? isletPos(n.activity.islet) : n.activity.anim === 'voyage' && n.activity.phase === 'doing' ? (({ x, z }) => ({ x, z }))(nena.root.position) : n.pos, heading: n.heading, far: Object.keys(lifeData?.farVisited || {}) });
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
  dyn.setCamper(qs.has('camper') ? CAMPERS.find(c => c.name === qs.get('camper') || c.kind === qs.get('camper')) || n.camper : n.camper);   // ?camper= previews a traveller
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

// Belongings and Creations: tabs, item tiles and icons
const panelTab = { things: 'pockets', makes: 'drawings' };
const tabs = (panel, list) => `<div class="tabs-wrap"><button class="tabs-more left" aria-label="More tabs to the left" tabindex="-1">‹</button><div class="tabs">${list.map(([k, label]) => `<button class="${panelTab[panel] === k ? 'on' : ''}" data-tab="${k}">${label}</button>`).join('')}</div><button class="tabs-more right" aria-label="More tabs to the right" tabindex="-1">›</button></div>`;
const wireTabs = panel => {
  const body = $('panel-body'); body.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { panelTab[panel] = b.dataset.tab; show(panel); });
  const wrap = body.querySelector('.tabs-wrap'), row = wrap?.querySelector('.tabs'); if (!row) return;
  const upd = () => { wrap.classList.toggle('more-right', row.scrollLeft + row.clientWidth < row.scrollWidth - 4); wrap.classList.toggle('more-left', row.scrollLeft > 4); };
  row.addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd);
  wrap.querySelector('.tabs-more.right').onclick = () => row.scrollBy({ left: 160, behavior: 'smooth' }); wrap.querySelector('.tabs-more.left').onclick = () => row.scrollBy({ left: -160, behavior: 'smooth' });
  const on = row.querySelector('.on'); if (on) row.scrollLeft = Math.max(0, on.offsetLeft - row.clientWidth / 2 + on.offsetWidth / 2); requestAnimationFrame(upd); };
const ICONS = { fruit: '🍎', veg: '🥕', shell: '🐚', 'sea glass': '🔹', stick: '🥢', stone: '🪨', ore: '⛏️', clay: '🟤', wood: '🪵', weeds: '🌿', gift: '🎁', sapling: '🌱', 'flower seeds': '🌼', 'hum seed': '🌰', mushroom: '🍄', 'blossom petals': '🌸', snowflake: '❄️', furnishing: '🪑',
  dates: '🌴', 'cactus fruit': '🌵', 'wild berries': '🫐', honeycomb: '🍯', 'ice fish': '🐟', 'snow berries': '🍒', obsidian: '🖤', 'fire opal': '💎', 'sand glass': '⏳', 'glow moss': '🌿', 'silver bark': '🪵', 'fairy dust': '✨', 'giant acorn': '🌰', 'clear ice': '🧊', 'old coins': '🪙', pearl: '🦪', 'sunken tile': '🔶',
  bench: '🪑', lantern: '🏮', cairn: '🪨', 'shell arch': '🐚', birdbath: '⛲', scarecrow: '🌾', signpost: '🪧', campfire: '🔥', 'wind chime': '🎐', 'log stool': '🪵', 'stepping stones': '🪨', 'clay pot': '🏺', 'stick fence': '🚧', 'blossom wreath': '💐', 'mushroom stool': '🍄', 'snow globe': '🔮', 'pearl lamp': '💡', 'gold trophy': '🏆', flowers: '🌷', tree: '🌳', 'coin tree': '🪙', 'singing stone': '🎶' };
Object.assign(ICONS, { squid: '🦑', lanternfish: '🐠', 'golden trout': '🐠', 'moon ray': '🐋', ladybird: '🐞', 'blue butterfly': '🦋', cricket: '🦗', 'stag beetle': '🪲', firefly: '✨', 'snow moth': '🦋', 'pond skater': '🦟', 'emerald dragonfly': '🪰',
  'sea star': '⭐', urchin: '🟣', scallop: '🐚', 'sea cucumber': '🥒', 'pearl oyster': '🦪', ammonite: '🐌', trilobite: '🪲', 'fern imprint': '🌿', 'old tooth': '🦷', 'giant feather': '🪶', 'tiny skull': '💀' });
const CAT_ICON = { fish: '🐟', bug: '🐞', sea: '🐚', fossil: '🦴', art: '🖼️' };
const itemIcon = (k, kind) => icon(k, kind);
const TREASURE = new Set(TRIP_ISLES.flatMap(i => i.resources || []).filter(k => !FORAGE.includes(k)));
const itemGroup = k => FORAGE.includes(k) || ['fruit', 'veg'].includes(k) || SPECIES[k]?.cat === 'fish' ? 'Food' : TREASURE.has(k) ? 'Treasures' : /seed|sapling/.test(k) ? 'Seeds and plants' : SPECIES[k] ? 'Collectables' : ['shell', 'sea glass', 'stick', 'stone', 'ore', 'clay', 'wood', 'weeds', 'blossom petals', 'snowflake'].includes(k) ? 'Materials' : 'Made and found';
const tile = (k, n, kind, cls = '') => `<div class="tile ${cls}" title="${esc(k)}"><span>${itemIcon(k, kind)}</span>${n ? `<b>${n}</b>` : ''}<small>${esc(k)}</small></div>`;
const dishIcon = d => { d = d.toLowerCase(); if (/cake|tart|crumble|bake|pancake/.test(d)) return icon('cake'); if (/soup|stew|tea/.test(d)) return icon('soup'); const hit = [...Object.keys(SPECIES), ...FORAGE, 'mushroom', 'fruit', 'veg'].filter(k => d.includes(k)).sort((a, b) => b.length - a.length)[0]; return icon(hit || 'dish'); };

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
      const l = lifeData; if (!l) { body.innerHTML = '<h2>Belongings</h2><p>Nothing yet.</p>'; return; }
      const tab = panelTab.things, got = Object.values(l.museum).reduce((t, a) => t + a.length, 0);
      let html = '';
      if (tab === 'pockets') {
        const groups = {}; for (const [k, v] of Object.entries(l.items)) (groups[itemGroup(k)] ||= []).push([k, v]);
        html = `${l.hot ? `<div class="banner">${icon('shop')} The shop pays double for <b>${esc(l.hot)}</b> today</div>` : ''}
          ${['Food', 'Treasures', 'Materials', 'Seeds and plants', 'Made and found', 'Collectables'].filter(g => groups[g]).map(g => `<h3>${g}</h3><div class="tiles">${groups[g].sort((a, b) => b[1] - a[1]).map(([k, v]) => tile(k, v)).join('')}</div>`).join('') || '<p class="dim">Her pockets are empty.</p>'}
          ${Object.keys(l.golden || {}).length ? `<h3>Golden tools</h3><div class="tiles">${Object.keys(l.golden).map(k => tile(`golden ${k}`)).join('')}</div>` : ''}
          ${l.turnips.n ? `<h3>Turnips</h3><div class="card-row">${icon('turnip')} Holding <b>${l.turnips.n}</b> bought at ${l.turnips.paid}. Today's price: <b>${l.turnipPrice}</b> ${l.turnipPrice > l.turnips.paid ? '(up)' : '(down)'}</div>` : ''}`;
      } else if (tab === 'collections') {
        html = `<div class="card-row big"><span>${icon('museum')} Museum</span><b>${got}/${l.total}</b></div><div class="meter"><i style="width:${got / l.total * 100}%"></i></div>
          ${Object.entries(CATS).map(([cat, label]) => { const all = Object.keys(SPECIES).filter(k => SPECIES[k].cat === cat), has = l.museum[cat] || [];
            return `<h3>${label} <span class="dim">${has.length}/${all.length}</span></h3><div class="tiles small">${all.map(k => has.includes(k) ? tile(k, 0, '', SPECIES[k].rare ? 'rare' : '') : '<div class="tile unknown"><span class="q">?</span></div>').join('')}</div>`; }).join('')}
          <h3>Flower colours <span class="dim">${l.blooms.length}/${Object.keys(BLOOMS).length}</span></h3><div class="swatches">${Object.keys(BLOOMS).map(k => l.blooms.includes(k) ? `<span title="${k}"><i style="background:#${BLOOMS[k].toString(16).padStart(6, '0')}"></i>${k}</span>` : '<span class="dim"><i></i>?</span>').join('')}</div>
          <h3>Star chart <span class="dim">${(l.sky || []).length}/${SKY_LIST.length + SKY_RARE.length}</span></h3><div class="chips-list">${(l.sky || []).map(x => `<span>${icon('star')} ${esc(x)}</span>`).join('') || '<span class="dim">Nothing spotted yet</span>'}</div>
          <h3>Records <span class="dim">${l.songs.length}</span></h3><div class="chips-list">${l.songs.map(x => `<span>${icon('record')} ${esc(x)}</span>`).join('') || '<span class="dim">None yet</span>'}</div>
          <h3>Stamps <span class="dim">${l.stamps.length}/${STAMPS.length}</span></h3><p><button class="inline" id="to-stamps">Open her stamp book</button></p>`;
      } else if (tab === 'wardrobe') {
        const look = now?.look || {};
        html = `<h3>Hats</h3><div class="tiles">${(l.hats || [0]).filter(i => i).map(i => tile(HATS[i], 0, 'wear', i === look.hat ? 'worn' : '')).join('') || '<p class="dim">No hats yet. The clothes shop sells them.</p>'}</div>
          <h3>Sunglasses</h3><div class="tiles">${(l.glasses || [0]).filter(i => i).map(i => tile(GLASSES[i], 0, 'wear', i === look.glasses ? 'worn' : '')).join('') || '<p class="dim">None yet.</p>'}</div>
          <h3>Scarf</h3><div class="swatches">${SCARVES.map((c, i) => `<span class="${i === look.scarf ? 'on' : ''}"><i style="background:#${c.toString(16).padStart(6, '0')}"></i>${i === look.scarf ? 'wearing' : ''}</span>`).join('')}</div>
          <p class="dim">Gold outline: what she is wearing now.</p>`;
      } else if (tab === 'home') {
        html = `<div class="home-card"><div class="house-lv">${[1, 2, 3].map(n => `<i class="${n <= l.house.level ? 'on' : ''}">${icon('house')}</i>`).join('')}</div><b>House level ${l.house.level} of 3</b>
            ${l.loan ? `<div class="meter"><i style="width:${l.house.paid / l.loan * 100}%"></i></div><small>${l.house.paid} of ${l.loan} coins paid toward the next</small>` : '<small>As big as it gets.</small>'}</div>
          <div class="stat-grid">${[['coin', l.coins, 'coins'], ['cosiness', l.cosy, 'cosiness'], ['outside', l.decor, 'things placed outside'], ['photos', l.photos, 'photos taken'], ['rides', l.rides, 'robot rides'], ['stamps', l.stamps.length, 'stamps']].map(([i, v, t]) => `<div><span>${icon(i)}</span><b>${v}</b><small>${t}</small></div>`).join('')}</div>
          ${l.tune ? `<h3>Island tune</h3><div class="card-row">${icon('record')} ${esc(l.tune)}</div>` : ''}`;
      } else if (tab === 'travels') {
        const far = l.farVisited || {};
        html = `<h3>By balloon <span class="dim">${TRIP_ISLES.filter(i => far[i.id]).length}/${TRIP_ISLES.length}</span></h3><div class="travel">${TRIP_ISLES.map(isl => `<div class="${far[isl.id] ? 'been' : ''}"><span>${icon({ ember: 'ember', wood: 'wood_isle', glass: 'glass', bloom: 'bloom_isle', ruin: 'hotel_isle', pompom: 'pompom_isle', pavilion: 'quarry_isle' }[isl.id])}</span><b>${esc(cap(isl.name))}</b><small>${far[isl.id] ? `visited ${far[isl.id]} time${far[isl.id] > 1 ? 's' : ''}` : 'not yet'}</small></div>`).join('')}</div>
          <h3>Islets <span class="dim">${l.islets.length}/${ISLETS.length}</span></h3><div class="travel">${ISLETS.map(isl => `<div class="${l.islets.includes(isl.name) ? 'been' : ''}"><span>${icon('islet')}</span><b>${esc(isl.name)}</b><small>${l.islets.includes(isl.name) ? 'rowed to' : 'not yet'}</small></div>`).join('')}</div>
          <h3>Travellers met <span class="dim">${l.metCampers.length}/${CAMPERS.length}</span></h3><div class="travel">${CAMPERS.map(c => { const met = l.metCampers.includes(c.name), home = TOWN_ISLANDS.find(t => t.id === c.home); return `<div class="${met ? 'been' : ''}"><span>${icon(c.kind)}</span><b>${met ? esc(c.name) : '?'}</b><small>${met ? `the ${esc(c.kind)}, from ${esc(home?.name || 'far off')}` : 'not met yet'}</small></div>`; }).join('')}</div>
          ${l.camper ? `<div class="banner">${icon('tent')} ${esc(l.camper.name)} the ${esc(l.camper.kind)} is at the campsite today${l.camper.from ? `, over from ${esc(l.camper.from)}` : ''}.</div>` : ''}
          ${l.inspo?.length ? `<h3>Things she wants to draw</h3><div class="chips-list">${l.inspo.map(x => `<span>${icon('pencil')} ${esc(x)}</span>`).join('')}</div>` : ''}`;
      } else if (tab === 'friends') {
        html = `<p class="dim">How close she is to each neighbour.</p>${Object.entries(l.friends).map(([k, v]) => `<div class="friend"><b>${esc(k)}</b><span class="hearts">${'♥'.repeat(Math.round(v / 2))}<i>${'♥'.repeat(5 - Math.round(v / 2))}</i></span></div>`).join('')}`;
      }
      body.innerHTML = `<div class="panel-head"><h2>Belongings</h2><div class="purse">${icon('coin')} <b>${l.coins.toLocaleString()}</b></div></div>${tabs('things', [['pockets', 'Pockets'], ['collections', 'Collections'], ['wardrobe', 'Wardrobe'], ['home', 'Home'], ['travels', 'Travels'], ['friends', 'Friends']])}<div class="tab-body">${html}</div>`;
      wireTabs('things'); if ($('to-stamps')) $('to-stamps').onclick = () => show('stamps');
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
        <label class="set"><span><b>Resolution</b><small>Auto lowers it if things get slow, so it stays smooth</small></span><select data-set="res">${[['auto', 'Auto'], ['1', '100%'], ['0.75', '75%'], ['0.5', '50%']].map(([v, l]) => `<option value="${v}"${String(settings.res) === v ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
        ${row('flashes', 'Lightning flashes', 'Turn off if flashing light bothers you')}
        <details class="advanced"><summary>Advanced</summary>
          <label class="set"><span><b>Draw distance</b><small>How far you can see. Shorter is faster on slower machines</small></span><input type="range" min="0.3" max="1" step="0.05" value="${settings.draw ?? 1}" data-set="draw" /></label>
        </details>
        <h3>On the island</h3>
        ${row('labels', 'Name tags', 'Names over neighbours, campers and visitors')}
        ${row('bubbles', 'Speech bubbles', 'What Nena and visitors say, over their heads')}
        ${row('follow', 'Camera follows Nena', 'Off: the camera stays where you put it')}
        ${row('clock24', '24-hour clock', 'Off: 9:30 pm instead of 21:30')}
        <h3>You</h3>
        <label class="set"><span><b>Your name</b><small>Shown on your gull, in chat and on notes</small></span><input type="text" id="set-name" maxlength="16" value="${esc(myName())}" /></label>
        <p class="row"><button class="inline" id="set-reset" type="button">Reset to defaults</button></p>
        <p class="dim">Looking after Nena? <a href="/world.html">Read the world diary</a>, a day-by-day record of the island, and leave feedback.</p>`;
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
      const l = lifeData; if (!l) { body.innerHTML = '<h2>Creations</h2><p>Nothing yet.</p>'; return; }
      const tab = panelTab.makes, built = {}; for (const d of l.decorList || []) (built[d.kind] ||= []).push(d);
      const names = { flowers: ['flower patch', 'flower patches'], 'stepping stones': ['set of stepping stones', 'sets of stepping stones'], 'stick fence': ['stick fence', 'stick fences'], 'wind chime': ['wind chime', 'wind chimes'] };
      const named = (k, n) => names[k] ? names[k][n > 1 ? 1 : 0] : n > 1 ? (k.endsWith('s') ? k : k.endsWith('h') ? k + 'es' : k + 's') : k;
      let html = '';
      if (tab === 'drawings') html = l.drawings.length ? `<p class="dim">${l.drawings.length} drawing${l.drawings.length > 1 ? 's' : ''}. Her latest is on the easel outside the studio. Tap one to see it bigger.</p><div class="gallery framed">${[...l.drawings].reverse().slice(0, 16).map((d, i) => `<figure data-big="${i}"><canvas width="320" height="214" data-draw="${i}"></canvas><figcaption>${esc(d.title)}<span class="dim">day ${d.day}</span></figcaption></figure>`).join('')}</div>` : '<p class="empty">No drawings yet. She draws at the studio, often things she saw on her travels.</p>';
      else if (tab === 'photos') html = l.photoLog.length ? `<p class="dim">Taken from where she stood, shown in today's light.</p><div class="gallery framed">${[...l.photoLog].reverse().slice(0, 10).map((p, i) => `<figure><canvas width="320" height="214" data-photo="${i}"></canvas><figcaption>day ${p.day}, ${clockText(p.hour)}</figcaption></figure>`).join('')}</div>` : '<p class="empty">No photos yet.</p>';
      else if (tab === 'built') html = Object.keys(built).length ? `<p class="dim">Out on the island. Tap to fly over and look.</p><div class="tiles wide">${Object.entries(built).map(([k, list]) => `<button class="tile" data-fly="${esc(k)}"><span>${itemIcon(k)}</span><b>${list.length}</b><small>${esc(named(k, list.length))}</small></button>`).join('')}</div>` : '<p class="empty">Nothing out on the island yet.</p>';
      else if (tab === 'kitchen') html = l.dishes.length ? `<p class="dim">The last ${Math.min(14, l.dishes.length)} things she cooked, newest first.</p>${[...l.dishes].reverse().slice(0, 14).map(d => `<div class="dish"><span>${dishIcon(d.name)}</span><div><b>${esc(cap(d.name))}</b><small>day ${d.day}</small></div></div>`).join('')}` : '<p class="empty">She has not cooked anything yet.</p>';
      else if (tab === 'music') html = `<h3>Her island tune</h3>${l.tune ? `<div class="card-row">${icon('record')} <b>${esc(l.tune)}</b> <button class="inline" id="play-tune">Play it</button></div>` : '<p class="dim">She has not made one up yet.</p>'}
        <h3>Her flag</h3><div class="flag-card"><span class="flag" style="background:#${(FLAGS[l.flag] ?? FLAGS[0]).toString(16).padStart(6, '0')}"></span><small>Flying in the square</small></div>`;
      body.innerHTML = `<h2>Creations</h2>${tabs('makes', [['drawings', 'Drawings'], ['photos', 'Photos'], ['built', 'Built & planted'], ['kitchen', 'Kitchen'], ['music', 'Tune & flag']])}<div class="tab-body">${html}</div>`;
      wireTabs('makes');
      const ds = [...l.drawings].reverse(), ps = [...l.photoLog].reverse();
      body.querySelectorAll('canvas[data-draw]').forEach(c => { const d = ds[+c.dataset.draw]; drawPicture(c, d.title, d.seed); });
      body.querySelectorAll('canvas[data-photo]').forEach(c => renderPhoto(c, ps[+c.dataset.photo]));
      body.querySelectorAll('figure[data-big]').forEach(f => f.onclick = () => f.classList.toggle('big'));
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
addEventListener('keydown', e => { if (chartOpen() && e.key.startsWith('Arrow')) return;   // with the chart open the arrows pick squares; WASD still flies
  if (!/INPUT|TEXTAREA/.test(document.activeElement?.tagName)) keys.add(e.key.toLowerCase()); });
addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => keys.clear());
$('cam').onclick = () => {
  freeCam = !freeCam;
  controls.enablePan = freeCam; controls.maxDistance = freeCam ? 300 : 165; controls.maxPolarAngle = freeCam ? Math.PI * 0.94 : 1.45;
  $('cam').classList.toggle('on', freeCam); $('cam').title = freeCam ? 'Follow Nena again' : 'Roam the island yourself';
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
  if (k === 'quality' || k === 'res') { if (k === 'res') res.auto = 1; renderer.setPixelRatio(pixelRatio()); dots.uniforms.cell.value = 5 * renderer.getPixelRatio(); resize(); }
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
canvas.addEventListener('pointermove', e => { if (performance.now() - hoverT < 80) return; hoverT = performance.now(); canvas.style.cursor = clickableAt(e) || isleAt(e) ? 'pointer' : ''; });

// ---- the other islands: tap one to see what it is ----------------------------------------
const ISLES_INFO = [
  ...TOWN_ISLANDS.map(t => { const p = townPos(t); return { id: t.id, name: t.name, about: t.about, kind: 'town', x: p.x, y: t.y - 4 * t.scale, z: p.z, r: (t.id === 'fountain' ? 16 : 13) * t.scale }; }),
  ...TRIP_ISLES.map(i => { const c = islePos(i); return { id: i.id, name: i.name, about: i.about, kind: 'trip', x: c.x, y: c.y - 3 * (i.scale || 1), z: c.z, r: SKY_ISLANDS.includes(i) ? i.size + 4 : 12 * i.scale }; }),
  ...ISLETS.map((il, i) => { const p = isletPos(i); return { id: 'islet' + i, name: il.name, about: `A little islet in the lagoon. She rows out here for ${il.gives.join(', ')}.`, kind: 'islet', x: p.x, y: -1, z: p.z, r: 7 }; })];
function isleAt(e) {
  ptr.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); pickRay.setFromCamera(ptr, camera);
  const o = pickRay.ray.origin, d = pickRay.ray.direction; let best = null;
  for (const I of ISLES_INFO) { const t = (I.x - o.x) * d.x + (I.y - o.y) * d.y + (I.z - o.z) * d.z; if (t < 0) continue;
    const dist = Math.hypot(o.x + d.x * t - I.x, o.y + d.y * t - I.y, o.z + d.z * t - I.z); if (dist < I.r && (!best || t < best.t)) best = { ...I, t }; }
  return best; }
function showIsle(I, e) {
  let card = $('isle-card'); if (!card) { card = document.createElement('div'); card.id = 'isle-card'; document.body.append(card); }
  const visits = lifeData?.farVisited?.[I.id] || 0, folk = CAMPERS.filter(c => c.home === I.id), met = lifeData?.metCampers || [];
  const iconKey = { ember: 'ember', wood: 'wood_isle', glass: 'glass', bloom: 'bloom_isle', ruin: 'hotel_isle', pompom: 'pompom_isle', pavilion: 'quarry_isle' }[I.id] || 'island';
  card.innerHTML = `<button class="x" aria-label="Close">×</button><div class="ic">${icon(iconKey)}</div><h3>${esc(I.name.replace(/^the /, 'The '))}</h3><p>${esc(I.about)}</p>
    ${I.kind === 'trip' ? `<p class="dim">${visits ? `Nena has flown here ${visits} time${visits > 1 ? 's' : ''} by balloon.` : 'Nena hasn\'t flown here yet. One day, by balloon.'}</p>` : ''}
    ${folk.length ? `<p class="dim">Travellers from here: ${folk.map(c => met.includes(c.name) ? `${esc(c.name)} the ${esc(c.kind)}` : 'someone she hasn\'t met yet').join(', ')}.</p>` : ''}
    <button class="map">Show on the map</button>`;
  card.style.left = Math.min(innerWidth - 300, Math.max(12, e.clientX - 140)) + 'px'; card.style.top = Math.min(innerHeight - 260, Math.max(70, e.clientY - 40)) + 'px'; card.hidden = false;
  card.querySelector('.x').onclick = () => { card.hidden = true; };
  card.querySelector('.map').onclick = () => { card.hidden = true; openChart(chartInfo({ focus: { x: I.x, z: I.z } })); };
}
canvas.addEventListener('pointerup', e => { if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return; if (clickableAt(e)) return;
  const I = isleAt(e), card = $('isle-card');
  if (I) { const near = pickRay.intersectObject(town.town, true)[0]; if (!near || near.distance > I.t - I.r) { showIsle(I, e); return; } }   // her island in front wins
  if (card) card.hidden = true; }, true);

// ---- visitors: your gull ----------------------------------------------------------------
const ray = new THREE.Raycaster(), groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
canvas.addEventListener('dblclick', e => {
  ray.setFromCamera(new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), camera);
  const hit = new THREE.Vector3(); if (ray.ray.intersectPlane(groundPlane, hit)) sendMind({ type: 'move', x: hit.x, z: hit.z });
});

// ---- the sky balloon: waits by the lookout, carries her to the big islands -------------------
const balloon = new THREE.Group(), balloonPad = new THREE.Group(); scene.add(balloon, balloonPad);
balloonPad.position.set(BALLOON.x, 0, BALLOON.z); balloon.position.set(BALLOON.x, 0.45, BALLOON.z); balloon.scale.setScalar(1.9); balloonPad.scale.setScalar(1.7);   // big enough for her to stand in the basket
whenK(() => { const b = kitM('SkyBalloon', { glow_flame: new THREE.MeshBasicMaterial({ color: 0xffb04a }) }); if (b) balloon.add(b); const p = kitM('Sky_Pad'); if (p) balloonPad.add(p); });
// where she and the balloon are during a trip: flying out (first 10%), walking from spot to spot, flying home (last 10%)
const V3 = THREE.Vector3;
function voyagePose(act) {
  const isl = TRIP_ISLES.find(i => i.id === act.isle); if (!isl) return null;
  const p = act.progress || 0, home = new V3(BALLOON.x, 0.45, BALLOON.z), padP = isleSpot(isl, 'pad'), land = new V3(padP.x, padP.y, padP.z);
  if (p < 0.1 || p > 0.9) {
    const u = p < 0.1 ? p / 0.1 : 1 - (p - 0.9) / 0.1, e = u * u * (3 - 2 * u), b = home.clone().lerp(land, e); b.y += Math.sin(e * Math.PI) * 45;
    const dir = p < 0.1 ? land.clone().sub(home) : home.clone().sub(land);
    return { flying: true, balloon: b, pos: b.clone().add(new V3(0, 0.2, 0)), heading: Math.atan2(dir.x, dir.z), act: { ...act, ride: false, phase: 'doing', anim: 'lookup' }, isl, text: p < 0.1 ? `flying the balloon to ${isl.name}` : 'flying home in the balloon' };
  }
  const stops = ['pad', ...(act.route || []), 'pad'], segs = stops.length - 1, x = (p - 0.1) / 0.8 * segs, i = Math.min(segs - 1, Math.floor(x)), f = x - i;
  const A = isleSpot(isl, stops[i]), B = isleSpot(isl, stops[i + 1]), walk = f < 0.3, w = walk ? f / 0.3 : 1;
  const pos = new V3(A.x + (B.x - A.x) * w, A.y + (B.y - A.y) * w, A.z + (B.z - A.z) * w), sp = isl.spots[stops[i + 1]][2];
  return { flying: false, balloon: land, pos, heading: Math.atan2(B.x - A.x, B.z - A.z), act: { ...act, ride: false, phase: walk ? 'walking' : 'doing', anim: !sp ? 'stand' : sp.draw && !sp.food ? 'flap' : 'peck' }, isl,
    text: walk ? (sp ? `on ${isl.name}, heading off ${sp.food ? 'to find food' : 'exploring'}` : `on ${isl.name}, back to the balloon`) : sp ? `on ${isl.name}: ${sp.does}` : `on ${isl.name}, packing up the balloon` };
}

// ---- speech and thought bubbles: one crisp layer over the scene for everyone who talks or thinks ----
const bubbleLayer = document.createElement('div'); bubbleLayer.id = 'bubbles'; document.body.appendChild(bubbleLayer);
const bubbles = new Map(), chatter = new Map();
let lastThought = '', thoughtUntil = 0;
const THINKS = { lie: ['so warm.', 'mm. sun.', 'five more minutes.'], sit: ['nice and quiet here.', 'i wonder what nena is up to.', 'hm.'], jog: ['left, right, left.', 'one more lap!', 'puff puff.'], jump: ['and up!', 'nine... ten...'],
  peck: ['ooh, a good one.', 'what is this?', 'that one is mine.'], dig: ['dig dig dig.', 'nearly there.', 'the ground is soft here.'], chop: ['timber!', 'one more swing.', 'hup!'], sing: ['♪ la la laaa ♪', '♪ hm hm hmm ♪'] };
const NPC_COLOR = { Bo: '#7f8fa6', Pip: '#3a3f6b', Suvi: '#e8743a' };
const pickOf = a => a[Math.floor(Math.random() * a.length)];
// who is saying or thinking something right now: Nena, visitors' gulls, the neighbours and the camper
function talkers(pos) {
  const list = [], t = Date.now();
  const thought = qs.get('think') || now?.thought, says = qs.get('say') || now?.say;   // ?say= / ?think= preview a bubble
  if (thought && thought !== lastThought) { lastThought = thought; thoughtUntil = qs.has('think') ? Infinity : t + 9000; }
  const nenaAt = new THREE.Vector3(pos.x, pos.y + 2.5, pos.z);
  if (says) list.push({ key: 'nena', name: 'Nena', text: says, kind: 'say', pos: nenaAt, color: '#f2792e', main: true });
  else if (t < thoughtUntil && lastThought) list.push({ key: 'nena', name: 'Nena', text: lastThought, kind: 'think', pos: nenaAt, color: '#f2792e', main: true });
  list.push(...dyn.talkers());
  // the neighbours say something when she is close, and think to themselves now and then
  for (const n of now?.npcs || []) {
    const at = dyn.npcAt(n.name); if (!at || !n.out) continue;
    let c = chatter.get(n.name); if (!c) { c = { next: t + 4000 + Math.random() * 20000 }; chatter.set(n.name, c); }
    if (qs.has('chatter') && !c.text) c.next = 0;
    if (t > c.next && !n.moving) { const near = Math.hypot(at.x - pos.x, at.z - pos.z) < 6, info = NEIGHBOURS.find(x => x.name === n.name);
      if (near && info?.says) Object.assign(c, { text: pickOf(info.says), kind: 'say', until: t + 7000 });
      else if (Math.random() < 0.55 && THINKS[n.anim]) Object.assign(c, { text: pickOf(THINKS[n.anim]), kind: 'think', until: t + 5500 });
      c.next = t + 18000 + Math.random() * 30000; }
    if (c.until > t) list.push({ key: `n:${n.name}`, name: n.name, text: c.text, kind: c.kind, pos: at.clone().setY(at.y + 2.1), color: NPC_COLOR[n.name] || '#6a6f94' });
  }
  const camp = now?.camper && dyn.camperAt();
  if (camp) { const info = CAMPERS.find(x => x.name === now.camper.name); let c = chatter.get('camper'); if (!c) { c = { next: t + 8000 }; chatter.set('camper', c); }
    if (t > c.next && info) { const near = Math.hypot(camp.x - pos.x, camp.z - pos.z) < 7; Object.assign(c, near ? { text: info.says, kind: 'say', until: t + 8000 } : { text: pickOf(['nice island.', 'my tent is very straight today.', `i miss ${TOWN_ISLANDS.find(x => x.id === info.home)?.name || 'home'} a little.`]), kind: 'think', until: t + 5500 }); c.next = t + 25000 + Math.random() * 30000; }
    if (c.until > t) list.push({ key: 'camper', name: info?.name || 'camper', text: c.text, kind: c.kind, pos: camp.clone().setY(camp.y + 2.2), color: '#2f9a7f' }); }
  return list;
}
const scr = new THREE.Vector3();
function placeBubbles(list) {
  const seen = new Set(), rects = [], W = innerWidth, H = innerHeight;
  const items = list.map(it => { scr.copy(it.pos).project(camera); return { ...it, sx: (scr.x * 0.5 + 0.5) * W, sy: (-scr.y * 0.5 + 0.5) * H, behind: scr.z > 1, d: camera.position.distanceTo(it.pos) }; })
    .filter(it => !it.behind && it.d < (it.main ? 220 : 95)).sort((a, b) => (b.main ? 1 : 0) - (a.main ? 1 : 0) || a.d - b.d);
  for (const it of items) {
    let b = bubbles.get(it.key);
    if (!b) { const el = document.createElement('div'); el.className = 'bub-at'; el.innerHTML = '<div class="bub"><b class="who"></b><span class="txt"></span></div>'; bubbleLayer.appendChild(el); b = { el, inner: el.firstChild }; bubbles.set(it.key, b); }
    if (b.text !== it.text || b.kind !== it.kind) {
      b.text = it.text; b.kind = it.kind; b.inner.className = `bub ${it.kind}`; b.inner.style.setProperty('--who', it.color);
      b.inner.querySelector('.who').textContent = it.kind === 'think' ? `${it.name} thinks` : it.name; b.inner.querySelector('.txt').textContent = it.text;
      b.inner.classList.remove('pop'); void b.inner.offsetWidth; b.inner.classList.add('pop'); b.w = b.inner.offsetWidth; b.h = b.inner.offsetHeight + (it.kind === 'think' ? 30 : 16);
    }
    seen.add(it.key); b.el.classList.remove('out');
    const s = it.main ? Math.max(0.8, Math.min(1.05, 1.2 - it.d / 120)) : Math.max(0.62, Math.min(1, 1.15 - it.d / 80)), w = b.w * s, h = b.h * s;
    let x = Math.max(w / 2 + 8, Math.min(W - w / 2 - 8, it.sx)), y = it.sy;
    for (let k = 0; k < 4; k++) { const hit = rects.find(r => x - w / 2 < r.x + r.w && x + w / 2 > r.x && y - h < r.y + r.h && y > r.y); if (!hit) break; y = hit.y - 4; }
    y = Math.max(h + 8, y); rects.push({ x: x - w / 2, y: y - h, w, h });
    b.inner.style.setProperty('--tx', `${Math.max(-b.w / 2 + 22, Math.min(b.w / 2 - 22, (it.sx - x) / s))}px`);
    b.el.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
  }
  for (const [k, b] of bubbles) if (!seen.has(k) && !b.el.classList.contains('out')) { b.el.classList.add('out'); setTimeout(() => { if (b.el.classList.contains('out')) { b.el.remove(); bubbles.delete(k); } }, 300); }
}

// ---- frame loop ----------------------------------------------------------------
const clock = new THREE.Clock(), bubble = $('bubble'), head = new THREE.Vector3();
let swimT = 0, heading = 0, elapsed = 0, lastSay = null, talkUntil = 0;
let chopT = null, chopping = null;   // the woodlot tree she is chopping, and how far she got
function frame() {
  const dt = Math.min(0.1, clock.getDelta()); elapsed += dt;
  const act = now?.activity || { phase: 'idle', action: 'idle', anim: 'stand' };
  if (qs.has('ride')) { act.phase = 'walking'; act.ride = true; }   // preview her on the robot
  if (qs.has('voyage')) { const [id, pr] = qs.get('voyage').split(':'), isl = TRIP_ISLES.find(i => i.id === id) || SKY_ISLANDS[0]; Object.assign(act, { action: 'voyage', anim: 'voyage', phase: 'doing', isle: isl.id, route: Object.keys(isl.spots).filter(k => k !== 'pad').slice(0, 4), progress: window.__world?.vp ?? Number(pr || 0.5) }); }   // preview a trip: ?voyage=wood:0.5
  if (qs.has('act')) { const [a, pr] = qs.get('act').split(':'); if (ACTIONS[a]) Object.assign(act, { action: a, anim: ACTIONS[a].anim, phase: 'doing', progress: Number(pr ?? 0.5), label: ACTIONS[a].label }); }   // preview: doing something
  if (qs.has('at')) { const [ax, az] = qs.get('at').split(',').map(Number); target.set(ax, 0, az); if (!qs.has('ride') && !qs.has('act')) { act.phase = 'idle'; act.anim = 'stand'; } }   // preview: stand her somewhere
  const pos = nena.root.position, k = 1 - Math.exp(-dt * 6), doing = act.phase === 'doing';

  sincePos += dt;
  const goal = target.clone().addScaledVector(vel, Math.min(sincePos, 0.35)); let voy = null;   // where she'll be by now
  if (doing && act.anim === 'swim') { swimT += dt * 0.55; goal.set(town.pond.x + Math.cos(swimT) * 5.5, 0.12, town.pond.z + Math.sin(swimT) * 5.5); heading = -swimT; }            // circles on the pond
  else if (doing && act.anim === 'dive') { swimT += dt * 0.5; const l = Math.hypot(target.x, target.z); goal.set(target.x / l * (WORLD.radius + 3.5) + Math.cos(swimT) * 2, 0, target.z / l * (WORLD.radius + 3.5) + Math.sin(swimT) * 2); heading = -swimT; }   // out in the sea
  else if (doing && act.anim === 'voyage' && (voy = voyagePose(act))) { goal.copy(voy.pos); heading = voy.heading; if (voy.flying || pos.distanceTo(goal) > 6) pos.copy(goal); }   // out on a big island
  else if (doing && act.anim === 'sail') { swimT += dt * 0.5; const ip = isletPos(act.islet ?? 0); goal.set(ip.x + Math.cos(swimT) * 1.6, 0.35, ip.z + Math.sin(swimT) * 1.6); heading = -swimT; if (pos.distanceTo(goal) > 12) pos.copy(goal); }   // ashore on a little island
  else if (doing && act.anim === 'chop' && (chopT = chopT && town.woodlot.standing().includes(chopT) ? chopT : town.woodlot.standing().sort((a, b) => Math.hypot(a.x - target.x, a.z - target.z) - Math.hypot(b.x - target.x, b.z - target.z))[0] || null)) {
    // walk up to a standing woodlot tree and face it
    const dx = target.x - chopT.x, dz = target.z - chopT.z, d = Math.hypot(dx, dz) || 1; goal.set(chopT.x + dx / d * 1.3, 0, chopT.z + dz / d * 1.3); heading = Math.atan2(chopT.x - goal.x, chopT.z - goal.z); }
  else if (doing && act.anim === 'inside' && act.place) { const s = site(act.place); goal.set(s.x, 0, s.z); heading = 0; }                                           // indoors
  else if (doing && ['read', 'sit', 'lie'].includes(act.anim) || (doing && act.place === 'beach' && act.anim !== 'fish')) heading = Math.atan2(-target.x, -target.z);   // back to the wall / the sea
  else if (doing && act.anim === 'fish') heading = act.place === 'river' ? 0 : Math.atan2(target.x, target.z);                                                       // facing the water
  else if (now) heading = now.heading;
  if (qs.has('face')) heading = Number(qs.get('face'));   // preview: which way she faces
  pos.lerp(goal, act.phase === 'walking' && vel.lengthSq() > 0 ? 1 - Math.exp(-dt * 14) : k);   // on the move: follow closely; settling: ease in
  let dh = heading - nena.root.rotation.y; dh = Math.atan2(Math.sin(dh), Math.cos(dh));
  nena.root.rotation.y += dh * k;
  // her face: mood, weather, what she's doing and what just happened
  if (now?.say !== lastSay) { lastSay = now?.say; if (lastSay) talkUntil = elapsed + Math.min(2.5, 0.6 + lastSay.length * 0.04); }
  const f = feelings.compute(now && { ...now, weather: qs.get('weather') || now.weather }, elapsed, qs.get('feel') || window.__world?.feel);
  f.talk = elapsed < talkUntil; nena.setFeeling(f);
  const tool = nena.animate(dt, voy ? voy.act : act);
  // chopping: each blow shakes the tree; when she finishes, the tree comes down, away from her
  if (doing && act.anim === 'chop' && chopT) { if (tool?.hit) town.woodlot.hit(chopT); chopping = { t: chopT, p: act.progress ?? 0 }; }
  else if (chopping) { if (chopping.p > 0.7 || qs.has('act')) town.woodlot.fell(chopping.t, Math.atan2(chopping.t.x - pos.x, chopping.t.z - pos.z), now?.day ?? 0); chopping = null; chopT = null; }
  town.woodlot.tick(dt, now?.day ?? 0, elapsed);
  if (voy) { balloon.position.copy(voy.balloon); } else balloon.position.set(BALLOON.x, 0.45 + Math.sin(elapsed * 0.8) * 0.05, BALLOON.z);   // waiting at the lookout, tugging gently at its rope

  const hour = qs.has('hour') ? Number(qs.get('hour')) : now ? now.hour : 12;
  const showEv = qs.get('show') || now?.event?.show || null;
  setSky(hour, qs.get('weather') || now?.weather || 'clear', dt, showEv);
  // draw distance: pull the haze in and stop drawing what is past it (the sky dome shrinks to stay inside)
  { const D = settings.draw ?? 1; scene.fog.near *= D; scene.fog.far *= D;
    const far = Math.max(scene.fog.far + 60, 1400 * Math.pow(D, 1.5)); if (Math.abs(camera.far - far) > 1) { camera.far = far; camera.updateProjectionMatrix(); }
    skyDome.dome.scale.setScalar(Math.min(1, far * 0.92 / 700)); }
  // Auto resolution: every second or so, look at how long frames are taking
  if (settings.res === 'auto' && dt > 0 && dt < 0.25) { res.acc += dt; res.n++;
    if (res.acc > 1.2) { const ms = res.acc / res.n * 1000; res.acc = 0; res.n = 0;
      if (ms > 24 && res.auto > 0.5) { res.auto = Math.max(0.5, res.auto - 0.125); res.good = 0; renderer.setPixelRatio(pixelRatio()); resize(); }
      else if (ms < 17.5 && res.auto < 1 && ++res.good >= 4) { res.auto = Math.min(1, res.auto + 0.125); res.good = 0; renderer.setPixelRatio(pixelRatio()); resize(); } } }
  town.setNight(nightness, doing && act.action === 'watch_film', elapsed); tickWater(elapsed, nightness);
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
    // over her island the ground is the floor, or once you are underneath, the bottom of the island is the ceiling.
    // Anywhere else you can sink a long way down towards the sea.
    const L = town.town.userData.lagoon, wet = L && L.inLagoon(camera.position.x, camera.position.z), wasWet = L && L.inLagoon(camera.position.x - mv.x, camera.position.z - mv.z);
    if (L && wasWet && !wet && camera.position.y < L.surf && camera.position.y - mv.y < L.surf) { camera.position.x -= mv.x; camera.position.z -= mv.z; controls.target.x -= mv.x; controls.target.z -= mv.z; }   // underwater, the lagoon's sides are walls
    else if (wet && camera.position.y < L.bed + 0.4 && camera.position.y > L.bed - 18) { const P = camera.position, prev = P.y - mv.y, to = prev >= L.bed + 0.4 ? L.bed + 0.4 : L.bed - 18; controls.target.y += to - P.y; P.y = to; }   // the seabed
    else { const P = camera.position, TOP = 1.5, BOT = -46, R = WORLD.radius + 8, inBand = y => y < TOP && y > BOT;
      const over = Math.hypot(P.x, P.z) < R && !wet, wasOver = Math.hypot(P.x - mv.x, P.z - mv.z) < R && !wasWet;
      if (over && inBand(P.y)) {
        if (!wasOver) { P.x -= mv.x; P.z -= mv.z; controls.target.x -= mv.x; controls.target.z -= mv.z; }   // the island's side is a wall
        else { const prev = P.y - mv.y, to = prev >= TOP ? TOP : prev <= BOT ? BOT : P.y > -20 ? TOP : BOT; controls.target.y += to - P.y; P.y = to; } }
      if (P.y < -400) { controls.target.y += -400 - P.y; P.y = -400; } }
  } else if (!window.__world?.freeze && settings.follow) {
    controls.maxPolarAngle = doing && act.anim === 'dive' ? 2.15 : 1.45;
    { const L = town.town.userData.lagoon; if (L && camera.position.y < L.bed + 0.6) { const d = L.bed + 0.6 - camera.position.y; camera.position.y += d; } }
    const before = controls.target.clone();
    controls.target.lerp(new THREE.Vector3(pos.x, pos.y + 1, pos.z), 1 - Math.exp(-dt * 2.5));
    camera.position.add(controls.target.clone().sub(before));   // camera travels with her
  }
  cloudFade.uCamPos.value.copy(camera.position);
  controls.update();
  { const L = town.town.userData.lagoon, under = L && camera.position.y < L.surf - 0.02 && L.inLagoon(camera.position.x, camera.position.z);
    $('underwater').classList.toggle('on', !!under);
    if (under) { const lum = scene.background?.isColor ? Math.min(1, 0.35 + scene.background.r + scene.background.g) : 1; scene.fog.color.set(0x1f8fa8).multiplyScalar(Math.min(1, lum)); scene.fog.near = 1; scene.fog.far = 34; } }
  if (chartOpen()) { const d = camera.getWorldDirection(new THREE.Vector3()); updateChart({ cam: freeCam ? { x: camera.position.x, z: camera.position.z, yaw: Math.atan2(d.x, d.z) } : null }); }
  composer.render();

  bubble.hidden = true;
  placeBubbles(settings.bubbles ? talkers(pos) : []);
  requestAnimationFrame(frame);
}
frame();
window.__world = { renderer, dyn, scene, camera, controls, nena, sound, site, town, npcs: () => now?.npcs || [], camper: () => now?.camper, pos: () => now?.pos };   // handy in the console

// Phone tab row scrolls sideways: fade the right edge until you reach the end, so it's clear there's more
{ const nav = document.getElementById('nav');
  const edge = () => nav.classList.toggle('end', nav.scrollLeft + nav.clientWidth >= nav.scrollWidth - 4);
  nav.addEventListener('scroll', edge, { passive: true }); addEventListener('resize', edge); edge(); }
