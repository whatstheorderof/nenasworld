// Other sky islands, far away in the haze. For now they are only silhouettes,
// each with one small sign of what lives there: smoke and a red glow on the
// volcano, tiny lights in the forest, and light coming up through the hole in the ice.
import * as THREE from 'three';
import { SKY_ISLANDS, TOWN_ISLANDS, BLOOM_ISLE, townPos, islePos, isleTurn } from '../../shared/world.js';
import { waterMaterial } from './water.js';
import { kitParts } from './kit.js';
import { whenKit, kitModel } from './kit.js';

export function buildFarIslands(scene) {
  const root = new THREE.Group(); scene.add(root);
  let seed = 9; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const shade = c => new THREE.MeshBasicMaterial({ color: c });           // flat silhouettes; the fog does the haze
  const add = (parent, geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };
  const glows = [], smoke = [], sparks = [], mats = [];
  const lit = (c, e = c) => new THREE.MeshLambertMaterial({ color: c, emissive: e, emissiveIntensity: 0.4, flatShading: true });
  const farLit = { glow_lava: lit(0xff7a2a), glow_opal: lit(0xff9a7a), glow_hutwin: lit(0xffd27a), glow_shroom: lit(0x7ff0e6), glow_fairy: lit(0xfff1a8), glow_coins: lit(0xf5c84a), glow_pearl: lit(0xf4f2ff), glow_icehole: lit(0x7fe6ff) };
  const farGlow = { ...farLit };

  // the three big islands (biomes): proper models, turned so their landing pad faces her island, and held still
  // so she can walk about on them when she flies over. A plain silhouette stands in until the models load.
  for (const isl of SKY_ISLANDS) {
    const g = new THREE.Group(), c = islePos(isl), S = isl.size, k = isl.scale; g.position.set(c.x, c.y, c.z); g.rotation.y = isleTurn(isl); g.userData.isl = isl; root.add(g);
    const base = isl.id === 'ember' ? 0x6b5a5e : isl.id === 'wood' ? 0x3f5a5c : 0x8aa3bd, dark = new THREE.Color(base).multiplyScalar(0.72).getHex();
    const top = shade(base), under = shade(dark); mats.push([top, base], [under, dark]);
    const sil = [add(g, new THREE.CylinderGeometry(S, S * 0.92, 2, 24), top, 0, -0.9, 0), add(g, new THREE.ConeGeometry(S * 0.85, S * 0.5, 12), under, 0, -S * 0.27, 0)]; sil[1].rotation.x = Math.PI;
    whenKit(() => { const m = kitModel({ ember: 'IslandEmber', wood: 'IslandWood', glass: 'IslandGlass' }[isl.id], farGlow); if (!m) return; m.scale.setScalar(k); g.add(m); sil.forEach(o => { o.visible = false; }); });
    if (isl.id === 'ember') {   // smoke and a glow from the crater (the volcano stands at model (0, 14), 2.2× its kit size)
      const cx = 0, cy = 20.0 * k, cz = -14 * k;
      const crater = new THREE.MeshBasicMaterial({ color: 0xff6a3a, transparent: true, opacity: 0 }); glows.push(crater);
      add(g, new THREE.CircleGeometry(1.4 * 2.2 * k, 12), crater, cx, cy + 0.2, cz).rotation.x = -Math.PI / 2;
      for (let i = 0; i < 10; i++) { const m = new THREE.MeshBasicMaterial({ color: 0x9a8f96, transparent: true, opacity: 0 }); const p = add(g, new THREE.SphereGeometry(4, 8, 6), m, cx, cy, cz); p.userData = { k: i / 10, at: [cx, cy, cz] }; smoke.push(p); }
    }
    if (isl.id === 'wood') {    // fireflies and fairy lights among the trees at night
      const pts = new Float32Array(160 * 3); for (let i = 0; i < 160; i++) { const a = rnd() * 6.283, r = Math.sqrt(rnd()) * 33 * k; pts.set([Math.cos(a) * r, 1.5 + rnd() * 14, Math.sin(a) * r], i * 3); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
      const pm = new THREE.PointsMaterial({ color: 0xd9ffb0, size: 2.4, sizeAttenuation: false, transparent: true, opacity: 0, fog: false }); sparks.push(pm); g.add(new THREE.Points(geo, pm));
    }
    if (isl.id === 'glass') {   // light coming up through the big hole in the ice
      const shaft = new THREE.MeshBasicMaterial({ color: 0x9cf6ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }); glows.push(shaft);
      add(g, new THREE.CylinderGeometry(4.6 * k / 1.6, 1.2, 30, 14, 1, true), shaft, 0, 15, 0);
    }
  }

  // neighbouring islands with towns on them: proper models, near enough to make out, windows lit at night
  const towns = new THREE.Group(); scene.add(towns);
  const winMat = new THREE.MeshLambertMaterial({ color: 0xfff2c4, emissive: 0xffc870, emissiveIntensity: 0, flatShading: true });
  for (const t of TOWN_ISLANDS) {
    const g = new THREE.Group(), p = townPos(t); g.position.set(p.x, t.y, p.z); g.scale.setScalar(t.scale); g.rotation.y = -t.a - Math.PI / 2 + 0.5; g.userData.isl = t; towns.add(g);
    whenKit(() => { const m = kitModel(t.model, { glow_farwin: winMat }); if (m) g.add(m); });
  }

  // Bluebell Isle: rolling blue flower hills, a marbled gold-and-teal river, and goats wandering about
  const bloom = new THREE.Group(), B = BLOOM_ISLE; bloom.position.set(Math.cos(B.a) * B.r, B.y, Math.sin(B.a) * B.r); bloom.scale.setScalar(B.scale); bloom.rotation.y = -B.a + Math.PI / 2; scene.add(bloom);
  const speckled = (c) => { const m = new THREE.MeshLambertMaterial({ color: c, flatShading: true });   // little flowers all over the hills
    m.onBeforeCompile = sh => { sh.vertexShader = 'varying vec3 vWp;\n' + sh.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n vWp = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = 'varying vec3 vWp;\n' + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
        vec2 q = vWp.xz * 1.6 + vWp.y * 0.7; vec2 c = floor(q), f = fract(q) - 0.5; float h = fract(sin(dot(c, vec2(12.9898, 78.233))) * 43758.5453);
        vec2 o = vec2(fract(h * 7.1), fract(h * 3.7)) - 0.5; float d = length(f - o * 0.5);
        vec3 tint = h < 0.33 ? vec3(0.93, 0.95, 1.0) : h < 0.66 ? vec3(0.72, 0.66, 1.0) : vec3(0.55, 0.68, 1.0);
        diffuseColor.rgb = mix(diffuseColor.rgb, tint, smoothstep(0.2, 0.12, d) * 0.85);
        diffuseColor.rgb *= 0.9 + 0.2 * fract(sin(dot(floor(vWp.xz * 4.0), vec2(4.1, 9.7))) * 917.3);`); }; return m; };
  const bloomRiver = waterMaterial({ deep: 0x2fbfb0, mid: 0xe9c25a, foam: 0xfff6dc, scale: 1.5, speed: 0.55, flow: [0.12, 0.04] });
  whenKit(() => { const m = kitModel('IslandBloom', { bloom_flowers: speckled(0x5a6ae6), bloom_flowers_dark: speckled(0x4352c8), bloom_flowers_light: speckled(0x7f8cf2), bloom_river: bloomRiver }); if (m) bloom.add(m);
    for (let i = 0; i < 5; i++) { const g = kitParts('Goat'); if (!g) break; g.scale.setScalar(0.85 + Math.random() * 0.3); const a = Math.random() * 6.28, r = Math.random() * 8;
      g.position.set(Math.cos(a) * r, 0, -Math.sin(a) * r); g.userData.goat = { tx: g.position.x, tz: g.position.z, wait: Math.random() * 6, step: Math.random() * 6, legs: ['FL', 'FR', 'BL', 'BR'].map(k => g.getObjectByName(`GoatLeg${k}`)), head: g.getObjectByName('GoatHead') }; bloom.add(g); goats.push(g); } });
  const goats = [];
  // the height of the hills at a point (model units; three x = model x, three z = -model y)
  const hillH = (x, z) => { let h = 0; for (const [hx, hy, rx, ry, top] of B.hills) { const dx = (x - hx) / rx, dy = (-z - hy) / ry, k = 1 - dx * dx - dy * dy; if (k > 0) { const zc = -ry * 0.1; h = Math.max(h, zc + (top - zc) * Math.sqrt(k)); } } return h; };
  function tickGoats(dt) {
    for (const g of goats) { const s = g.userData.goat;
      if (s.wait > 0) { s.wait -= dt; if (s.head) s.head.rotation.x = s.graze ? -0.55 + Math.sin(performance.now() / 300) * 0.08 : 0; s.legs.forEach(l => l && (l.rotation.x = 0)); if (s.wait <= 0) { const a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * 9.5; s.tx = Math.cos(a) * r; s.tz = Math.sin(a) * r; } continue; }
      const dx = s.tx - g.position.x, dz = s.tz - g.position.z, d = Math.hypot(dx, dz);
      if (d < 0.1) { s.wait = 3 + Math.random() * 9; s.graze = Math.random() < 0.7; continue; }
      const sp = 0.55 * dt; g.position.x += dx / d * Math.min(sp, d); g.position.z += dz / d * Math.min(sp, d);
      const want = Math.atan2(dx, dz); let turn = want - g.rotation.y; turn = Math.atan2(Math.sin(turn), Math.cos(turn)); g.rotation.y += turn * Math.min(1, dt * 4);
      g.position.y = hillH(g.position.x, g.position.z); s.step += dt * 7;
      s.legs.forEach((l, i) => l && (l.rotation.x = Math.sin(s.step + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.45)); if (s.head) s.head.rotation.x = Math.sin(s.step * 2) * 0.04; } }

  const tmp = new THREE.Color();
  function update(t, night, dayTint) {
    for (const [m, c] of mats) m.color.copy(tmp.set(c).lerp(dayTint, 0.25).multiplyScalar(1 - night * 0.55));
    glows.forEach(m => { m.opacity = 0.25 + night * 0.65; });
    towns.children.forEach((g, i) => { g.position.y = g.userData.isl.y + Math.sin(t * 0.1 + i * 1.7) * 1.2; });
    winMat.emissiveIntensity = night * 1.4;
    tickGoats(Math.min(0.1, t - (update.last ?? t))); update.last = t;
    for (const m of Object.values(farLit)) m.emissiveIntensity = 0.4 + night * 1.1;
    sparks.forEach(m => { m.opacity = night * (0.6 + Math.sin(t * 2) * 0.25); });
    smoke.forEach(p => { const { k, at } = p.userData, f = (k + t * 0.02) % 1; p.position.set(at[0] + f * 22, at[1] + 2 + f * 40, at[2] + f * 6); p.scale.setScalar(0.7 + f * 2.4); p.material.opacity = (1 - f) * 0.45 * (1 - night * 0.4); });
  }
  return { update };
}
