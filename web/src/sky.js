// The sky: a cartoon dome in the style of a bright sea-adventure game.
// Day: deep blue overhead fading to a pale cyan horizon, long wispy streak clouds, and a soft
// white sun with rays and a halo ring. Night: navy with little sparkle stars, a cartoon moon
// with a glow, and now and then a shooting star drawn as a thin streak.
import * as THREE from 'three';

const vert = /* glsl */`
varying vec3 vDir;
void main() { vDir = normalize(position); vec4 p = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * p; }`;

const frag = /* glsl */`
uniform vec3 uTop, uHorizon, uSunDir, uMoonDir;
uniform float uDay, uNight, uTime, uStreaks, uStars, uSunVis, uMoonVis;
varying vec3 vDir;
float h1(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
vec3 h3(vec3 p) { return fract(sin(vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6)))) * 43758.5453); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float a = h1(vec3(i, 0.0)), b = h1(vec3(i + vec2(1, 0), 0.0)), c = h1(vec3(i + vec2(0, 1), 0.0)), d = h1(vec3(i + vec2(1, 1), 0.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y); }
float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += vn(p) * a; p *= 2.03; a *= 0.5; } return s; }
// a basis on the sky around a direction, so shapes on it are round
void frame(vec3 n, out vec3 t, out vec3 b) { t = normalize(cross(abs(n.y) < 0.95 ? vec3(0, 1, 0) : vec3(1, 0, 0), n)); b = cross(n, t); }

void main() {
  vec3 d = normalize(vDir);
  float el = d.y, up = clamp(el, 0.0, 1.0);
  // gradient: pale at the horizon, deep overhead, a soft bright band right on the horizon
  vec3 col = mix(uHorizon, uTop, pow(smoothstep(0.0, 0.42, up), 0.6));
  col = mix(col, uHorizon * 1.06, exp(-up * 40.0) * 0.45);
  if (el < 0.0) col = uHorizon;

  // long thin streak clouds (cirrus), drifting
  float az = atan(d.z, d.x);
  if (el > 0.02 && uStreaks > 0.01) {
    vec2 q = vec2(az * 2.2 + uTime * 0.004, el * 26.0);
    float band = fbm(vec2(q.x * 1.3, q.y)) ;
    float streak = smoothstep(0.58, 0.8, band) * smoothstep(0.02, 0.12, el) * smoothstep(0.75, 0.3, el);
    float thin = smoothstep(0.62, 0.72, fbm(vec2(q.x * 0.7 + 9.0, q.y * 2.6)));   // finer wisps
    col = mix(col, vec3(1.0), (streak * 0.55 + thin * 0.25 * smoothstep(0.03, 0.2, el) * smoothstep(0.8, 0.35, el)) * uStreaks);
  }

  // stars: one candidate per cell of a grid on the sky; most cells are empty
  if (uStars > 0.01 && el > -0.02) {
    vec3 p = d * 95.0, c = floor(p);
    {
      vec3 cell = c;
      float r = h1(cell);
      if (r < 0.16) {
        vec3 s = normalize(cell + 0.2 + h3(cell) * 0.6), t, b; frame(s, t, b);
        vec2 o = vec2(dot(d - s, t), dot(d - s, b));
        float big = h1(cell + 7.0), size = 0.0016 + pow(big, 6.0) * 0.0055;
        float a = big * 6.28; o = mat2(cos(a), -sin(a), sin(a), cos(a)) * o;
        float spark = smoothstep(1.0, 0.55, sqrt(abs(o.x) / size) + sqrt(abs(o.y) / size));   // a four-pointed sparkle
        float dot0 = smoothstep(size * 0.7, 0.0, length(o));
        float tw = 0.65 + 0.35 * sin(uTime * (1.0 + big * 3.0) + r * 60.0);
        float tint = h1(cell + 3.0);
        vec3 sc = tint < 0.12 ? vec3(1.0, 0.75, 0.88) : tint < 0.22 ? vec3(0.8, 0.88, 1.0) : vec3(1.0, 0.98, 0.92);
        col += sc * max(spark, dot0) * tw * uStars * smoothstep(-0.02, 0.1, el) * 1.3;
      }
    }
  }

  // sun: white core, warm glow, a halo ring and rays
  if (uSunVis > 0.01) {
    vec3 t, b; frame(uSunDir, t, b);
    float ang = acos(clamp(dot(d, uSunDir), -1.0, 1.0));
    float phi = atan(dot(d, b), dot(d, t));
    float core = smoothstep(0.05, 0.035, ang);
    float glow = exp(-ang * 11.0) * 0.6 + exp(-ang * 3.0) * 0.1;
    float ring = exp(-pow((ang - 0.25) / 0.012, 2.0)) * 0.22;
    float rays = pow(abs(sin(phi * 7.0 + 0.6)), 60.0) * exp(-ang * 6.0) * 0.6 + pow(abs(sin(phi * 11.0 + 2.1)), 90.0) * exp(-ang * 9.0) * 0.5;
    float streak = pow(abs(cos(phi - 0.45)), 2500.0) * exp(-ang * 1.2) * 0.55;   // a long thin flare line through it
    vec3 warm = vec3(1.0, 0.93, 0.72);
    col = mix(col, vec3(1.0, 1.0, 0.97), core * uSunVis);
    col += warm * (glow + ring + rays + streak) * uSunVis * (1.0 - core);
  }

  // moon: pale yellow disc with soft craters and a glow
  if (uMoonVis > 0.01) {
    vec3 t, b; frame(uMoonDir, t, b);
    vec2 o = vec2(dot(d - uMoonDir, t), dot(d - uMoonDir, b));
    float R = 0.055, r = length(o);
    float disc = smoothstep(R, R * 0.93, r);
    float cr = fbm(o * 70.0 + 3.0), cr2 = fbm(o * 140.0 + 9.0);
    vec3 mc = mix(vec3(0.98, 0.95, 0.66), vec3(0.66, 0.66, 0.42), smoothstep(0.52, 0.62, cr) * 0.9 + smoothstep(0.56, 0.64, cr2) * 0.35);
    mc *= 1.0 - smoothstep(R * 0.4, R, length(o - vec2(R * 0.35, -R * 0.3))) * 0.12;   // a little shading on one side
    float glow = exp(-max(0.0, r - R) * 28.0) * 0.35 + exp(-max(0.0, r - R) * 7.0) * 0.12;
    col += vec3(0.95, 0.93, 0.7) * glow * uMoonVis * (1.0 - disc);
    col = mix(col, mc, disc * uMoonVis);
  }
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

const C = (h) => new THREE.Color(h);
const TOP = { day: C(0x1283f0), night: C(0x0a1446), dusk: C(0x5a5fc8) };
export const HORIZON = { day: C(0xb4f1ff), night: C(0x1d3c96), dusk: C(0xffa47a) };

export function buildSky(scene) {
  const uni = {
    uTop: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() },
    uSunDir: { value: new THREE.Vector3(0, 0.3, -1).normalize() }, uMoonDir: { value: new THREE.Vector3(0, 0.3, 1).normalize() },
    uDay: { value: 1 }, uNight: { value: 0 }, uTime: { value: 0 }, uStreaks: { value: 1 }, uStars: { value: 0 }, uSunVis: { value: 1 }, uMoonVis: { value: 0 },
  };
  const dome = new THREE.Mesh(new THREE.SphereGeometry(700, 48, 24), new THREE.ShaderMaterial({ uniforms: uni, vertexShader: vert, fragmentShader: frag, side: THREE.BackSide, depthWrite: false, fog: false }));
  dome.renderOrder = -10; dome.frustumCulled = false; scene.add(dome);

  // shooting stars: thin bright streaks with fading tails (additive, so a black tail is invisible)
  const N = 4, seg = 10, pos = new Float32Array(N * seg * 2 * 3), colr = new Float32Array(N * seg * 2 * 3);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(colr, 3));
  const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  lines.frustumCulled = false; lines.renderOrder = -9; scene.add(lines);
  const shoot = Array.from({ length: N }, () => ({ t: 9, life: 1, a: 0, e: 0.5, da: 0, de: 0 }));
  let next = 6;

  const dirAt = (a, e) => new THREE.Vector3(Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e));
  const top = new THREE.Color();
  // hour 0..24, day 0..1, horizon colour (after weather), how grey/misty it is, meteor shower 0..1
  function update(hour, d, horizon, { grey = 0, mist = 0, flash = 0, meteors = 0 }, dt, camera) {
    const n = 1 - d, dusk = 4 * d * (1 - d);
    dome.position.copy(camera.position);
    top.copy(TOP.night).lerp(TOP.day, d).lerp(TOP.dusk, dusk * 0.7).lerp(horizon, Math.min(0.9, grey * 0.85 + mist * 0.7 + flash * 0.6));
    uni.uTop.value.copy(top); uni.uHorizon.value.copy(horizon);
    uni.uTime.value += dt; uni.uDay.value = d; uni.uNight.value = n;
    const clear = Math.max(0, 1 - grey * 1.4 - mist);
    uni.uStreaks.value = (0.35 + d * 0.65) * (1 - grey * 0.8) * (1 - mist) * (d > 0.3 ? 1 : 0.35);
    uni.uStars.value = smoothstep(0.35, 0.9, n) * clear;
    // the sun crosses the sky from 6 to 18, the moon from 18 to 6; both stay fairly low so they show above the island
    const ts = (hour - 5.5) / 14.5, tm = ((((hour - 20) % 24) + 24) % 24) / 9.5;
    uni.uSunDir.value.copy(dirAt(-1.1 + ts * 2.4 - Math.PI / 2, 0.03 + Math.sin(Math.PI * Math.min(1, Math.max(0, ts))) * 0.17));
    uni.uMoonDir.value.copy(dirAt(-1.1 + tm * 2.4 + Math.PI / 2, 0.05 + Math.sin(Math.PI * Math.min(1, Math.max(0, tm))) * 0.16));
    uni.uSunVis.value = (ts > -0.02 && ts < 1.02 ? smoothstep(0.0, 0.2, d) : 0) * Math.max(0, 1 - grey * 1.2 - mist * 0.8);
    uni.uMoonVis.value = (tm > -0.05 && tm < 1.05 ? smoothstep(0.4, 0.9, n) : 0) * Math.max(0, 1 - grey * 1.1 - mist * 0.8);

    // shooting stars: a shower when the weather says so, otherwise one now and then on a clear night
    next -= dt;
    if (uni.uStars.value > 0.3 && next <= 0) { const s = shoot.find(s => s.t >= s.life); if (s) { s.t = 0; s.life = 0.8 + Math.random() * 0.6; s.a = Math.random() * 6.28; s.e = 0.35 + Math.random() * 0.5; s.da = (Math.random() < 0.5 ? -1 : 1) * (0.25 + Math.random() * 0.2); s.de = -0.12 - Math.random() * 0.12; }
      next = meteors > 0.3 ? 0.4 + Math.random() * 1.4 : 9 + Math.random() * 18; }
    shoot.forEach((s, i) => {
      s.t += dt; const live = s.t < s.life, k = s.t / s.life, fade = live ? Math.sin(Math.PI * k) * uni.uStars.value : 0;
      for (let j = 0; j < seg; j++) {
        const u0 = k - j * 0.035, u1 = k - (j + 1) * 0.035, base = (i * seg + j) * 6;
        const p0 = dirAt(s.a + s.da * u0, s.e + s.de * u0).multiplyScalar(650).add(camera.position), p1 = dirAt(s.a + s.da * u1, s.e + s.de * u1).multiplyScalar(650).add(camera.position);
        pos.set([p0.x, p0.y, p0.z, p1.x, p1.y, p1.z], base);
        const b0 = live && u0 > 0 ? fade * (1 - j / seg) : 0, b1 = live && u1 > 0 ? fade * (1 - (j + 1) / seg) : 0;
        colr.set([b0, b0, b0 * 0.95, b1, b1, b1 * 0.95], base);
      }
    });
    geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
  }
  return { dome, update };
}
function smoothstep(a, b, x) { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
