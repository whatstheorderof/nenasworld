// Other sky islands, far away in the haze. For now they are only silhouettes,
// each with one small sign of what lives there: smoke and a red glow on the
// volcano, tiny lights in the forest, and light coming up through the hole in the ice.
import * as THREE from 'three';
import { SKY_ISLANDS, TOWN_ISLANDS, BLOOM_ISLE, RUIN_ISLE, POMPOM_ISLE, PAVILION_ISLE, GROVE_ISLE, townPos, islePos, isleTurn } from '../../shared/world.js';
import { buildGrove } from './grove.js';
import { waterMaterial } from './water.js';
import { kitParts, kitBoxes } from './kit.js';
import { buildRoots } from './roots.js';
import { whenFar as whenKit, kitModel } from './kit.js';

export function buildFarIslands(scene) {
  const root = new THREE.Group(); scene.add(root);
  let seed = 9; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const shade = c => new THREE.MeshBasicMaterial({ color: c });           // flat silhouettes; the fog does the haze
  const add = (parent, geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };
  const glows = [], smoke = [], sparks = [], mats = [];
  const lit = (c, e = c) => new THREE.MeshLambertMaterial({ color: c, emissive: e, emissiveIntensity: 0.4, flatShading: true });
  const farLit = { glow_lava: lit(0xff7a2a), glow_opal: lit(0xff9a7a), glow_hutwin: lit(0xffd27a), glow_shroom: lit(0x7ff0e6), glow_fairy: lit(0xfff1a8), glow_coins: lit(0xf5c84a), glow_pearl: lit(0xf4f2ff), glow_icehole: lit(0x7fe6ff), glow_ruinlamp: lit(0xffd58a) };
  const winMat = new THREE.MeshLambertMaterial({ color: 0xfff2c4, emissive: 0xffc870, emissiveIntensity: 0, flatShading: true });
  const townWater = waterMaterial({ deep: 0x2f8fc8, mid: 0x5fb8d8, foam: 0xe6fbff, scale: 1.4, speed: 0.5, flow: [0.05, 0.02] });
  const townFall = waterMaterial({ deep: 0x3aa0cc, mid: 0x7fd0e0, foam: 0xf0fcff, fall: 'world', scale: 3.0, speed: 0.9 });
  const townIce = new THREE.MeshLambertMaterial({ color: 0xcfeefa, emissive: 0x4a7a8a, emissiveIntensity: 0.15 });
  // the big islands share the towns' lit windows (camp fires, lanterns, igloo doors), water and ice
  const farGlow = { ...farLit, glow_farwin: winMat, tn_water: townWater, tn_fall: townFall, tn_ice: townIce };

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
  let sails = null;
  // chimney smoke: a few puffs drifting up off the roofs of some of the town houses
  const SMOKE_PER = 7, SMOKE_MAX = 200, smokeEm = [];
  const chimney = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshLambertMaterial({ color: 0xf4f2ee, transparent: true, opacity: 0.72, flatShading: true, depthWrite: false }), SMOKE_MAX);
  chimney.count = 0; chimney.frustumCulled = false; scene.add(chimney);
  for (const t of TOWN_ISLANDS) {
    const g = new THREE.Group(), p = townPos(t); g.position.set(p.x, t.y, p.z); g.scale.setScalar(t.scale); g.rotation.y = -t.a - Math.PI / 2 + 0.5; g.userData.isl = t; towns.add(g);
    whenKit(() => { const m = kitModel(t.model, { glow_farwin: winMat, tn_water: townWater, tn_fall: townFall, tn_ice: townIce }, ['GableSails']); if (!m) return; g.add(m);
      sails = sails || m.getObjectByName('GableSails');
      g.updateWorldMatrix(true, true);
      const hs = kitBoxes(t.model, /_H\d+$/);
      hs.filter((o, i) => hs.length < 4 || i % 2 === 0).slice(0, 4).forEach(lb => {
        const b = lb.clone().applyMatrix4(m.matrixWorld), c = b.getCenter(new THREE.Vector3());
        smokeEm.push({ x: c.x + (b.max.x - c.x) * 0.4, y: b.max.y - 0.3 * t.scale, z: c.z + (b.max.z - c.z) * 0.3, s: t.scale, ph: Math.random() }); });
      // roots hanging underneath, a lighter version of her island's, fitted to the model
      g.updateWorldMatrix(true, true); const box = new THREE.Box3().setFromObject(m), bottom = (box.min.y - g.position.y) / t.scale, R = (box.max.x - box.min.x) / 2 / t.scale, k = R / 60;
      const rg = new THREE.Group(); rg.scale.setScalar(k); g.add(rg);
      const rimY = -1.6 / k, botY = bottom / k, RR = R / k;   // the underside tapers from the rim (r = R) down to its lowest point (r = 0)
      const under = r => botY + (rimY - botY) * Math.min(1, r / RR) ** 1.4;
      buildRoots(rg, { top: botY, bottomR: RR * 0.8, sideY: rimY, sideR: RR * 0.82, seed: 11 + t.a * 7, count: 18, segs: 8, radial: 4, thick: 8, innerR: t.id === 'hoop' ? 7.6 / k : 0, under, lenK: 0.6 }); });   // Hoopstead: none in its hole
  }

  // Bluebell Isle: rolling blue flower hills, a marbled gold-and-teal river, and goats wandering about
  const bloom = new THREE.Group(), B = BLOOM_ISLE; bloom.position.set(Math.cos(B.a) * B.r, B.y, Math.sin(B.a) * B.r); bloom.scale.setScalar(B.scale); bloom.rotation.y = isleTurn(B); scene.add(bloom);   // its landing pad faces her island
  const speckled = (c) => { const m = new THREE.MeshLambertMaterial({ color: c, flatShading: true });   // little flowers all over the hills
    m.onBeforeCompile = sh => { sh.vertexShader = 'varying vec3 vWp;\n' + sh.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n vWp = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = 'varying vec3 vWp;\n' + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
        vec2 q = vWp.xz * 1.6 + vWp.y * 0.7; vec2 c = floor(q), f = fract(q) - 0.5; float h = fract(sin(dot(c, vec2(12.9898, 78.233))) * 43758.5453);
        vec2 o = vec2(fract(h * 7.1), fract(h * 3.7)) - 0.5; float d = length(f - o * 0.5);
        vec3 tint = h < 0.33 ? vec3(0.93, 0.95, 1.0) : h < 0.66 ? vec3(0.72, 0.66, 1.0) : vec3(0.55, 0.68, 1.0);
        diffuseColor.rgb = mix(diffuseColor.rgb, tint, smoothstep(0.2, 0.12, d) * 0.85);
        diffuseColor.rgb *= 0.9 + 0.2 * fract(sin(dot(floor(vWp.xz * 4.0), vec2(4.1, 9.7))) * 917.3);`); }; return m; };
  // dry-stone walls: courses of irregular stones with dark gaps between them
  const stony = (c) => { const m = new THREE.MeshLambertMaterial({ color: c });
    m.onBeforeCompile = sh => { sh.vertexShader = 'varying vec3 vWp;\n' + sh.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n vWp = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = 'varying vec3 vWp;\n' + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
        float row = floor(vWp.y * 3.2); float w = 0.8 + 0.5 * fract(sin(row * 3.7) * 43.1); float u = ((vWp.x + vWp.z) * 1.4 + fract(sin(row * 7.13) * 91.7) * 3.0) * w;
        float col = floor(u); vec2 f = vec2(fract(u), fract(vWp.y * 3.2));
        float h = fract(sin(dot(vec2(col, row), vec2(12.9898, 78.233))) * 43758.5453);
        float gap = smoothstep(0.0, 0.09, f.x) * smoothstep(1.0, 0.91, f.x) * smoothstep(0.0, 0.13, f.y) * smoothstep(1.0, 0.87, f.y);
        diffuseColor.rgb *= (0.78 + 0.34 * h) * mix(0.42, 1.0, gap);`); }; return m; };
  // mist where the waterfall off Bluebell Isle gives out (model space, below the lip at angle 0.194)
  whenKit(() => { const mistM = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xdff4ff, emissiveIntensity: 0.6, transparent: true, opacity: 0.5, depthWrite: false, flatShading: true });
    for (let i = 0; i < 7; i++) { const a = 0.194 + (Math.random() - 0.5) * 0.25, r = 14.2 + Math.random() * 1.5, m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9 + Math.random() * 1.1, 1), mistM);
      m.position.set(Math.cos(a) * r, -13.2 - Math.random() * 1.6, -Math.sin(a) * r); bloom.add(m); } });
  const bloomPool = waterMaterial({ deep: 0x123c40, mid: 0x2a6a6a, foam: 0xcfe8e2, scale: 2.4, speed: 0.12, flow: [0.01, 0.0] });
  const bloomRiver = waterMaterial({ deep: 0x1f9bb0, mid: 0x46c6c4, foam: 0xf2cf62, scale: 1.1, speed: 0.6, flow: [0.12, 0.04] });   // teal water, marbled with gold
  const bloomFall = waterMaterial({ deep: 0x2aa9bc, mid: 0x6fd8cf, foam: 0xf3d77a, fall: 'world', scale: 4.5, speed: 0.9 });
  whenKit(() => { const m = kitModel('IslandBloom', { bloom_flowers: speckled(0x5a6ae6), bloom_flowers_dark: speckled(0x4352c8), bloom_flowers_light: speckled(0x7f8cf2), bloom_river: bloomRiver, bloom_fall: bloomFall, bloom_pool: bloomPool, bloom_wall: stony(0x8f8a80), bloom_cope: stony(0xb3aea3) }); if (m) bloom.add(m);
    const pad = kitModel('Sky_Pad'); if (pad) { pad.scale.setScalar(0.7 * 2.2 / B.scale); pad.position.set(B.spots.pad[0], 0, -B.spots.pad[1]); bloom.add(pad); }
    for (let i = 0; i < 5; i++) { const g = kitParts('Goat'); if (!g) break; g.scale.setScalar((0.85 + Math.random() * 0.3) * 2.2 / B.scale); const a = Math.random() * 6.28, r = Math.random() * 8;
      g.position.set(Math.cos(a) * r, 0, -Math.sin(a) * r); g.userData.goat = { tx: g.position.x, tz: g.position.z, wait: Math.random() * 6, step: Math.random() * 6, legs: ['FL', 'FR', 'BL', 'BR'].map(k => g.getObjectByName(`GoatLeg${k}`)), head: g.getObjectByName('GoatHead') }; bloom.add(g); goats.push(g); } });
  // Pompom Meadow: the heads glow softly, as if the sun were shining through them, and sway in the breeze
  const pom = new THREE.Group(), PM = POMPOM_ISLE; pom.position.set(Math.cos(PM.a) * PM.r, PM.y, Math.sin(PM.a) * PM.r); pom.scale.setScalar(PM.scale); pom.rotation.y = isleTurn(PM); scene.add(pom);
  const pomLit = (c, e) => new THREE.MeshLambertMaterial({ color: c, emissive: e, emissiveIntensity: 0.55, flatShading: true, side: THREE.DoubleSide });
  whenKit(() => { const m = kitModel('IslandPompom', { pom_head: pomLit(0xb2e23a, 0x7aa82a), pom_tip: pomLit(0xf0fdc8, 0xd8f0a0), pom_core: pomLit(0x86b832, 0x4a7a1a) }); if (m) pom.add(m); });
  // the Quarry House: see-through glass onto a warm orange room that glows, brighter at dusk and night
  const pav = new THREE.Group(), PV = PAVILION_ISLE; pav.position.set(Math.cos(PV.a) * PV.r, PV.y, Math.sin(PV.a) * PV.r); pav.scale.setScalar(PV.scale); pav.rotation.y = isleTurn(PV); scene.add(pav);
  const pavWarm = new THREE.MeshLambertMaterial({ color: 0xff6a22, emissive: 0xff5a14, emissiveIntensity: 0.35, flatShading: true, side: THREE.DoubleSide });
  const pavBulb = new THREE.MeshBasicMaterial({ color: 0xfff1d0 });
  const pavGlass = new THREE.MeshLambertMaterial({ color: 0xffd2a8, emissive: 0xff9a50, emissiveIntensity: 0.15, transparent: true, opacity: 0.18, depthWrite: false });
  // someone is home: a dark figure moving about behind the glass, seen against the glow after dark
  const pavFigure = new THREE.Group(); { const ink = new THREE.MeshBasicMaterial({ color: 0x3a1a10 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.42, 3, 8), ink); body.position.y = 0.36; const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), ink); head.position.y = 0.74;
    pavFigure.add(body, head); pavFigure.scale.setScalar(1.25); pavFigure.visible = false; pav.add(pavFigure); }
  const pavRoom = { box: null, x: 0, tx: 0, wait: 2 };
  whenKit(() => { const m = kitModel('IslandPavilion', { glow_pav: pavWarm, glow_pavbulb: pavBulb, pav_glass: pavGlass }); if (!m) return; pav.add(m);
    pav.updateMatrixWorld(true); const inv = pav.matrixWorld.clone().invert(), bb = new THREE.Box3();
    m.traverse(o => { if (o.isMesh && o.material === pavWarm) { o.geometry.computeBoundingBox(); bb.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld).applyMatrix4(inv)); } });
    if (!bb.isEmpty()) { pavRoom.box = bb; pavRoom.x = pavRoom.tx = (bb.min.x + bb.max.x) / 2; } });
  // the Lantern Grove: lit trees and the monolith (built in code, see grove.js)
  const GV = GROVE_ISLE, grove = buildGrove(); grove.group.position.set(Math.cos(GV.a) * GV.r, GV.y, Math.sin(GV.a) * GV.r); grove.group.scale.setScalar(GV.scale); grove.group.rotation.y = isleTurn(GV); scene.add(grove.group);
  // landing pads for the balloon on the islands she can fly to
  whenKit(() => { for (const [g, I] of [[ruin, RUIN_ISLE], [pom, POMPOM_ISLE], [pav, PAVILION_ISLE], [grove.group, GROVE_ISLE]]) { const pad = kitModel('Sky_Pad'); if (!pad || !I.spots?.pad) continue; pad.scale.setScalar(1.55 / I.scale); pad.position.set(I.spots.pad[0], 0.02, -I.spots.pad[1]); g.add(pad); } });
  // gulls wheeling round the Old Hotel
  const gulls = [], gullMat = new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide, flatShading: true });
  const wingGeo = new THREE.BufferGeometry(); wingGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -0.3, 0, 0, 0.3, 1.5, 0.15, -0.05], 3)); wingGeo.computeVertexNormals();
  const gullBody = new THREE.IcosahedronGeometry(0.28, 0);
  for (let i = 0; i < 7; i++) { const b = new THREE.Group(), body = new THREE.Mesh(gullBody, gullMat); body.scale.set(0.6, 0.55, 1.5); b.add(body);
    const L = new THREE.Mesh(wingGeo, gullMat), R = new THREE.Mesh(wingGeo, gullMat); R.scale.x = -1; b.add(L, R); b.scale.setScalar(2.6); scene.add(b);
    gulls.push({ b, L, R, r: 16 + Math.random() * 18, h: 26 + Math.random() * 14, w: (0.18 + Math.random() * 0.14) * (i % 3 ? 1 : -1), a: Math.random() * 6.28, ph: Math.random() * 6.28 }); }
  const goats = [];   // (goats are scaled by 2.2 / B.scale so they stay goat-sized however big the island is drawn)
  // the Old Hotel, empty but for one lit window
  const ruin = new THREE.Group(), RU = RUIN_ISLE; ruin.position.set(Math.cos(RU.a) * RU.r, RU.y, Math.sin(RU.a) * RU.r); ruin.scale.setScalar(RU.scale); ruin.rotation.y = isleTurn(RU); scene.add(ruin);
  const ruinPond = waterMaterial({ deep: 0x2c5a63, mid: 0x4f8790, foam: 0xdfeee9, scale: 2.0, speed: 0.15, flow: [0.02, 0.0] });
  // where gulls can land: the highest ledges and roof tops of the hotel, found by dropping a line from above
  const perches = [];
  whenKit(() => { const m = kitModel('IslandRuin', { ...farLit, ruin_pond: ruinPond }); if (!m) return; ruin.add(m); ruin.updateMatrixWorld(true);
    const ray = new THREE.Raycaster(), hits = [], meshes = []; m.traverse(o => { if (o.isMesh && !o.material.transparent) meshes.push(o); });
    for (let x = -9; x <= 9; x += 1.5) for (let z = -9; z <= 9; z += 1.5) { const from = ruin.localToWorld(new THREE.Vector3(x, 30, z));
      ray.set(from, new THREE.Vector3(0, -1, 0)); const h = ray.intersectObjects(meshes, false)[0]; if (h && h.face && h.face.normal.y > 0.7) hits.push(h.point.clone()); }
    hits.sort((a, b) => b.y - a.y); for (const h of hits) { if (perches.length >= 6) break; if (perches.every(p => p.distanceTo(h) > 4)) perches.push({ at: h, taken: false }); } });
  // the height of the hills at a point (model units; three x = model x, three z = -model y)
  // goats live in the meadow and now and then hop up the terraces to graze
  const T = B.terraces, terH = (x, z) => { const d = Math.hypot(x - T.c[0], -z - T.c[1]); let h = 0;
    for (let i = 0; i < T.n; i++) { const r = T.r0 - i * T.dr; h = Math.max(h, (i + 1) * T.h * Math.min(1, Math.max(0, (r - d) / 0.18))); } return h; };
  const hillH = (x, z) => { let h = terH(x, z); for (const [hx, hy, rx, ry, top] of B.hills) { const dx = (x - hx) / rx, dy = (-z - hy) / ry, k = 1 - dx * dx - dy * dy; if (k > 0) { const zc = -ry * 0.1; h = Math.max(h, zc + (top - zc) * Math.sqrt(k)); } } return h; };
  // (a goat already standing somewhere blocked may still walk out of it)
  const segD = (px, py, [ax, ay], [bx, by]) => { const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy))); return Math.hypot(px - ax - dx * t, py - ay - dy * t); };
  const inRiver = (x, y, pad) => (B.river || []).some((p, i, a) => i > 0 && segD(x, y, a[i - 1], p) < 1.5 + pad);
  const blocked = (x, z, pad) => (B.props || []).some(([px, py, r]) => Math.hypot(x - px, z + py) < r + pad) || inRiver(x, -z, pad);   // goat space is model x, -y
  function tickGoats(dt) {
    for (const g of goats) { const s = g.userData.goat;
      if (s.wait > 0) { s.wait -= dt; if (s.head) s.head.rotation.x = s.graze ? -0.55 + Math.sin(performance.now() / 300) * 0.08 : 0; s.legs.forEach(l => l && (l.rotation.x = 0)); if (s.wait <= 0) { let tries = 0; do { const a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * 9.5; s.tx = Math.cos(a) * r; s.tz = Math.sin(a) * r; } while (++tries < 8 && (terH(s.tx, s.tz) > 0 || blocked(s.tx, s.tz, 0.5))); } continue; }
      const dx = s.tx - g.position.x, dz = s.tz - g.position.z, d = Math.hypot(dx, dz);
      if (d < 0.1) { s.wait = 3 + Math.random() * 9; s.graze = Math.random() < 0.7; continue; }
      const sp = 0.55 * dt, nx = g.position.x + dx / d * Math.min(sp, d), nz = g.position.z + dz / d * Math.min(sp, d);
      if (blocked(nx, nz, 0.35) && !blocked(g.position.x, g.position.z, 0.35)) { s.wait = 0.4 + Math.random(); s.graze = false; continue; }   // something in the way: stop, then pick somewhere else
      g.position.x = nx; g.position.z = nz;
      const want = Math.atan2(dx, dz); let turn = want - g.rotation.y; turn = Math.atan2(Math.sin(turn), Math.cos(turn)); g.rotation.y += turn * Math.min(1, dt * 4);
      g.position.y = hillH(g.position.x, g.position.z); s.step += dt * 7;
      s.legs.forEach((l, i) => l && (l.rotation.x = Math.sin(s.step + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.45)); if (s.head) s.head.rotation.x = Math.sin(s.step * 2) * 0.04; } }

  const tmp = new THREE.Color(), tickM4 = new THREE.Matrix4(), tickQ = new THREE.Quaternion(), tickV = new THREE.Vector3(), tickV2 = new THREE.Vector3();
  function update(t, night, dayTint) {
    grove.update(t, night);
    for (const [m, c] of mats) m.color.copy(tmp.set(c).lerp(dayTint, 0.25).multiplyScalar(1 - night * 0.55));
    glows.forEach(m => { m.opacity = 0.25 + night * 0.65; });
    towns.children.forEach((g, i) => { g.position.y = g.userData.isl.y + Math.sin(t * 0.1 + i * 1.7) * 1.2; });
    winMat.emissiveIntensity = night * 1.4;
    pavWarm.emissiveIntensity = 0.35 + night * 0.9;
    if (sails) sails.rotation.z = t * 0.6;   // the windmill on Little Gable turns
    { let n = 0; const M4 = tickM4, sc = tickV2;
      for (const e of smokeEm) for (let i = 0; i < SMOKE_PER && n < SMOKE_MAX; i++) {
        const u = (t * 0.06 + e.ph + i / SMOKE_PER) % 1, k = Math.sin(Math.PI * Math.min(1, u * 1.08)) * (0.14 + u * 0.62) * e.s, w = Math.sin(u * 5 + e.ph * 9 + t * 0.4) * 0.5 * u;
        tickV.set(e.x + (u * u * 4.5 + w) * e.s, e.y + u * 6.5 * e.s, e.z + (u * 1.6 + w * 0.6) * e.s); sc.setScalar(Math.max(0.001, k)); M4.compose(tickV, tickQ, sc); chimney.setMatrixAt(n++, M4); }   // rises, leans with the wind, wavers
      chimney.count = n; chimney.instanceMatrix.needsUpdate = true; }
    { const cx = Math.cos(RUIN_ISLE.a) * RUIN_ISLE.r, cz = Math.sin(RUIN_ISLE.a) * RUIN_ISLE.r;
      const dtG = Math.min(0.1, t - (update.lastG ?? t)); update.lastG = t;
      for (const g of gulls) { const a = g.a + t * g.w, f = Math.sin(t * 7 + g.ph);
        const circ = tickV2.set(cx + Math.cos(a) * g.r, RUIN_ISLE.y + g.h + Math.sin(t * 0.5 + g.ph) * 2, cz + Math.sin(a) * g.r);
        // now and then one comes down to sit on the hotel for a while, then goes back up
        g.mode ??= 'fly';
        if (g.mode === 'fly' && perches.length && Math.random() < dtG * 0.03) { const p = perches.find(q => !q.taken); if (p) { p.taken = true; g.perch = p; g.mode = 'land'; g.k = 0; g.from = g.b.position.clone(); } }
        if (g.mode === 'land' || g.mode === 'leave') { g.k += dtG / 5; const e = g.k * g.k * (3 - 2 * g.k), to = g.mode === 'land' ? g.perch.at : circ;
          const prev = g.b.position.clone(); g.b.position.lerpVectors(g.mode === 'land' ? g.from : g.perch.at, to, Math.min(1, e)); if (g.mode === 'leave') g.b.position.y += Math.sin(Math.PI * Math.min(1, g.k)) * 3;
          const dv = g.b.position.clone().sub(prev); if (dv.lengthSq() > 1e-6) g.b.rotation.set(0, Math.atan2(dv.x, dv.z), 0);
          const fl = Math.sin(t * 10 + g.ph) * 0.5; g.L.rotation.z = fl; g.R.rotation.z = -fl;
          if (g.k >= 1) { if (g.mode === 'land') { g.mode = 'perch'; g.sit = 8 + Math.random() * 14; } else { g.mode = 'fly'; g.perch.taken = false; g.perch = null; } }
          continue; }
        if (g.mode === 'perch') { g.sit -= dtG; g.b.position.copy(g.perch.at); g.b.position.y += Math.abs(Math.sin(t * 1.3 + g.ph)) * 0.05; g.L.rotation.z = 1.1; g.R.rotation.z = -1.1;   // wings folded
          g.b.rotation.y += Math.sin(t * 0.7 + g.ph) * 0.004; if (g.sit <= 0) { g.mode = 'leave'; g.k = 0; } continue; }
        g.b.position.copy(circ);
        g.b.rotation.set(0, -a + (g.w > 0 ? 0 : Math.PI), (g.w > 0 ? -0.25 : 0.25));
        const flap = f > 0.3 ? 0.15 : f * 0.55; g.L.rotation.z = flap; g.R.rotation.z = -flap; } }
    // the figure in the Quarry House: about at dusk and in the evening, pacing, stopping, pacing
    { const evening = night > 0.25, R = pavRoom; pavFigure.visible = evening && !!R.box;
      if (pavFigure.visible) { const dtP = Math.min(0.1, t - (update.lastP ?? t)); update.lastP = t; const B = R.box;
        if (R.wait > 0) { R.wait -= dtP; if (R.wait <= 0) R.tx = B.min.x + 0.5 + Math.random() * Math.max(0.1, B.max.x - B.min.x - 1); }
        else { const d = R.tx - R.x; if (Math.abs(d) < 0.03) R.wait = 2 + Math.random() * 6; else R.x += Math.sign(d) * Math.min(Math.abs(d), dtP * 0.45); }
        pavFigure.position.set(R.x, B.min.y + 0.02, B.max.z - 0.6); pavFigure.rotation.y = R.wait > 0 ? 0 : Math.sign(R.tx - R.x) * Math.PI / 2;
        pavFigure.children[0].position.y = 0.36 + (R.wait > 0 ? 0 : Math.abs(Math.sin(t * 8)) * 0.02); } }
    tickGoats(Math.min(0.1, t - (update.last ?? t))); update.last = t;
    for (const m of Object.values(farLit)) m.emissiveIntensity = 0.4 + night * 1.1;
    sparks.forEach(m => { m.opacity = night * (0.6 + Math.sin(t * 2) * 0.25); });
    smoke.forEach(p => { const { k, at } = p.userData, f = (k + t * 0.02) % 1; p.position.set(at[0] + f * 22, at[1] + 2 + f * 40, at[2] + f * 6); p.scale.setScalar(0.7 + f * 2.4); p.material.opacity = (1 - f) * 0.45 * (1 - night * 0.4); });
  }
  return { update };
}
