// Nena's island: bright, flat-shaded and chunky by day; dark with glowing
// windows and signs at night. Everything is first built from primitives; models made in
// Blender (kit.js) replace them as soon as they load. Positions come from shared/world.js
// so the mind and the picture agree.
import * as THREE from 'three';
import { PLACES, WORLD, RIVER, BEACH, NEIGHBOURS, ORCHARD_TREES, WOODLOT, ISLETS, BIG_ROCK, CLOCK, isletPos, site, PATHS, SQUARE, SQUARE_SEATS, BOARD, RING, OBSTACLES, BALLOON, onPath, STREAM, STREAM_A, nearRiver as riverBand } from '../../shared/world.js';
import { drawPicture } from './art.js';
import { pastel } from './palette.js';
import { waterMaterial } from './water.js';
import { buildRim, buildPromenade } from './rim.js';
import { buildRoots, tickRoots } from './roots.js';
import { makeTree, makeBush, setTreeSeason, tickTrees } from './trees.js';
import { whenKit, kitModel, kitParts, kitGeometry, kitBuilding } from './kit.js';
import { HOUSE_LOOKS, FLAGS } from '../../shared/data.js';

const P = {
  grass: 0xb4dc5a, grassDark: 0x79c653, cliff: 0x5aa84a, snow: 0xf6fcff, snowShade: 0xcfe6f7,
  wood: 0xf59b2f, woodDark: 0xc9531c, roof: 0xb3401a, rock: 0x86a9cc, rockDark: 0x5f82ad,
  water: 0x6f97c9, river: 0x58b7e8, sea: 0x46cfe0, ice: 0xdff3ff, sand: 0xf7dc8f, sandDark: 0xe9c46a,
  pine: 0x2f8f7a, pineDark: 0x237066, glow: 0xffd66b, path: 0xf2e2a8,
  petals: [0xffd93b, 0x6a2fc4, 0x2f7f9a, 0xff7fa3], centre: 0xb3401a,
};
const R = WORLD.radius;

// seeded random so the island looks the same on every visit
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export function buildTown() {
  const town = new THREE.Group();
  const glowMats = [];   // emissive materials that switch on at night
  const signs = [];      // redrawn once the web font has loaded
  const lamps = [], torches = [], swayers = [], heroes = [];   // heroes: the big objects on rooftops
  const rand = rng(11);
  const flat = color => new THREE.MeshLambertMaterial({ color: pastel(color), flatShading: true });
  const glow = (color = P.glow, base = 0xcdeeff) => { const m = new THREE.MeshLambertMaterial({ color: pastel(base), emissive: color, emissiveIntensity: 0, flatShading: true }); glowMats.push(m); return m; };
  const mesh = (geo, material, x = 0, y = 0, z = 0, parent = town) => { const m = new THREE.Mesh(geo, material); m.position.set(x, y, z); parent.add(m); return m; };
  const box = (w, h, d, color, x, y, z, parent) => mesh(new THREE.BoxGeometry(w, h, d), typeof color === 'number' ? flat(color) : color, x, y, z, parent);
  const blockedAt = (x, z) => OBSTACLES.some(o => Math.hypot(o.x - x, o.z - z) < o.r + 1.2);
  const at = key => { const s = site(key), g = new THREE.Group(); g.position.set(s.x, 0, s.z); g.rotation.y = s.ry; town.add(g); return g; };
  const ground = (geo, color, x, z, y) => { const m = mesh(geo, flat(color), x, y, z); m.rotation.x = -Math.PI / 2; return m; };

  // ---- island ----------------------------------------------------------
  const grassMat = flat(P.grass), grassDarkMat = flat(P.grassDark), leafMat = flat(0x5fbf5a), fruitMat = flat(0xff5a4d);
  mesh(new THREE.CylinderGeometry(R, R - 1.5, 0.6, 48), grassMat, 0, -0.3, 0);
  mesh(new THREE.CylinderGeometry(R - 1.2, R - 6, 3.2, 28), flat(0x9a6e52), 0, -2.2, 0);   // brown earth under the grass, like the reference rim
  mesh(new THREE.CylinderGeometry(R - 6.5, R - 16, 5, 9), flat(P.rockDark), 0, -6.2, 0);
  buildRoots(town, { top: -8.6, bottomR: R - 17, sideY: -4.3, sideR: R - 8.5, segs: 12, radial: 4 });   // roots hanging from underneath
  const inBeach = (x, z) => { const a = Math.atan2(z, x); return a > BEACH.from - 0.08 && a < BEACH.to + 0.08 && Math.hypot(x, z) > BEACH.inner - 1; };
  const nearRiver = (x, z, pad) => riverBand(x, z, pad) || RIVER.some(([rx, rz]) => Math.hypot(rx - x, rz - z) < pad);
  for (let i = 0; i < 44; i++) {
    const a = rand() * 6.28, r = SQUARE + 2 + rand() * (R - SQUARE - 12), s = 1.5 + rand() * 3, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (inBeach(x, z) || nearRiver(x, z, 4) || onPath(x, z, s * 0.6)) continue;
    const m = mesh(new THREE.CircleGeometry(s, 7), grassDarkMat, x, 0.01 + i * 0.001, z); m.rotation.x = -Math.PI / 2;
  }
  // snowfield around the igloo
  { const s = site('igloo'); ground(new THREE.CircleGeometry(7.5, 9), P.snow, s.x + 2, s.z, 0.03); ground(new THREE.CircleGeometry(4, 7), P.snowShade, s.x + 6, s.z + 3, 0.035); }
  // the water: the river (pond -> falls, wider toward the falls) and the stream (lagoon -> pond), as sampled centre lines
  const water = (() => { const pd = site('pond');
    const mk = (pts, w0, widen) => { const c = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z))); return { c, w0, widen, samp: c.getPoints(200).map((q, i) => ({ x: q.x, z: q.z, hw: w0 * widen(i / 200) / 2 })) }; };
    return { river: mk([[pd.x - PLACES.pond.r + 1.5, pd.z], ...RIVER], 4.6, u => 1 + Math.max(0, (u - 0.5) / 0.5) ** 1.5 * 1.15), stream: mk(STREAM, 2.6, u => 0.85 + u * 0.3) }; })();
  const inWater = (x, z, pad = 0) => [water.river, water.stream].some(L => L.samp.some(q => Math.hypot(q.x - x, q.z - z) < q.hw + pad));
  // a plank bridge: centred at (x, z), running along angle a (world xz), long enough to clear the banks
  const bridge = (x, z, a, len, wide = 2.0) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = -a; town.add(g);
    const n = Math.ceil(len / 0.62); for (let i = 0; i < n; i++) { const u = (i + 0.5) / n - 0.5, lx = u * len; box(0.58, 0.14, wide, i % 2 ? P.wood : P.woodDark, lx, 0.22 + Math.cos(u * Math.PI) * 0.32, 0, g); }
    for (const sd of [-1, 1]) { for (let i = 0; i <= 4; i++) { const u = i / 4 - 0.5; box(0.13, 0.95, 0.13, P.woodDark, u * len, 0.62 + Math.cos(u * Math.PI) * 0.32, sd * (wide / 2 - 0.05), g); }
      for (let i = 0; i < 4; i++) { const u0 = i / 4 - 0.5, u1 = u0 + 0.25, y0 = 1.1 + Math.cos(u0 * Math.PI) * 0.32, y1 = 1.1 + Math.cos(u1 * Math.PI) * 0.32, rl = box(len / 4 + 0.05, 0.11, 0.11, P.wood, (u0 + 0.125) * len, (y0 + y1) / 2, sd * (wide / 2 - 0.05), g); rl.rotation.z = Math.atan2(y1 - y0, len / 4); } }
    return g; };
  const bridges = [], boardwalks = [];
  // a wooden boardwalk across the sand from (x, z) along angle a, out past the edge to the sea, on little posts at the end
  const boardwalk = ({ x, z, a }) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = -a; town.add(g);
    let L = 0; while (Math.hypot(x + Math.cos(a) * L, z + Math.sin(a) * L) < R + 3.2) L += 0.5;
    const tones = [0xb88a5a, 0xa8784c, 0xc49866, 0x9e7046];
    for (let u = 0.25, k = 0; u < L; u += 0.5, k++) { const out = Math.hypot(x + Math.cos(a) * u, z + Math.sin(a) * u) - R, y = out > 0 ? 0.05 : 0.12; box(0.42, 0.09, 2.0 + (rand() - 0.5) * 0.12, tones[k % 4], u, y, (rand() - 0.5) * 0.06, g); }
    for (const sd of [-1, 1]) box(L, 0.1, 0.16, 0x7a5236, L / 2, 0.02, sd * 0.78, g);
    for (let u = L - 4.2; u < L; u += 1.4) for (const sd of [-1, 1]) if (Math.hypot(x + Math.cos(a) * u, z + Math.sin(a) * u) > R - 0.5) box(0.2, 2.0, 0.2, 0x6a4a30, u, -0.95, sd * 0.85, g);
    return g; };

  // pebble paths: a gravel bed with stones pressed into it, and a round pebble square in the middle
  { const bed = flat(0xe6dcc4), stones = [];
    const disc = (x, z, r, y) => ground(new THREE.CircleGeometry(r, 14), 0xe6dcc4, x, z, y);
    const lay = (x, z) => stones.push([x, z]);
    disc(0, 0, SQUARE + 0.1, 0.05);
    for (let ring = 0.45; ring < SQUARE - 0.2; ring += 0.36) { const n = Math.floor(ring * 2 * Math.PI / 0.36); for (let i = 0; i < n; i++) { const a = i / n * 6.283 + ring; lay(Math.cos(a) * ring, Math.sin(a) * ring); } }
    for (const line of PATHS) for (let i = 0; i < line.length - 1; i++) {
      const a = line[i], b = line[i + 1], dx = b.x - a.x, dz = b.z - a.z, full = Math.hypot(dx, dz); if (full < 0.05) continue;
      // where a path runs onto the beach, the pebbles stop at the sand and a boardwalk carries on to the water
      let len = full; for (let t = 0; t <= full; t += 0.2) if (inBeach(a.x + dx / full * t, a.z + dz / full * t)) { len = t; if (!boardwalks.some(w => Math.hypot(w.x - a.x - dx / full * t, w.z - a.z - dz / full * t) < 3)) boardwalks.push({ x: a.x + dx / full * t, z: a.z + dz / full * t, a: Math.atan2(dz, dx) }); break; }
      if (len < 0.05) continue;
      const strip = mesh(new THREE.PlaneGeometry(1.6, len), bed, a.x + dx / full * len / 2, 0.052, a.z + dz / full * len / 2); strip.rotation.x = -Math.PI / 2; strip.rotation.z = Math.atan2(dx, dz);
      disc(a.x, a.z, 0.8, 0.051); if (i === line.length - 2 && len === full) disc(b.x, b.z, 0.8, 0.051);   // round off the bends and ends
      const nx = -dz / full, nz = dx / full;
      for (let t = 0.1; t < len; t += 0.3) for (const off of [-0.54, -0.18, 0.18, 0.54]) { const j = rand() - 0.5, k = (rand() - 0.5) * 0.12, x = a.x + dx / full * (t + k) + nx * (off + j * 0.1), z = a.z + dz / full * (t + k) + nz * (off + j * 0.1); if (Math.hypot(x, z) > SQUARE - 0.3 && !inWater(x, z, 0.9)) lay(x, z); }
      let wet = null;   // where this stretch of path crosses water: put a bridge over it
      for (let t = 0; t <= len; t += 0.25) { const x = a.x + dx / full * t, z = a.z + dz / full * t, w = inWater(x, z, 0.9);
        if (w && wet == null) wet = t; if ((!w || t + 0.25 > len) && wet != null) { const t0 = wet, t1 = t, mx = a.x + dx / full * (t0 + t1) / 2, mz = a.z + dz / full * (t0 + t1) / 2; wet = null;
          if (t1 - t0 > 0.6 && !bridges.some(b => Math.hypot(b.x - mx, b.z - mz) < 3)) bridges.push({ x: mx, z: mz, a: Math.atan2(dz, dx), len: t1 - t0 + 1.6 }); } }
    }
    const hex = (() => { const v = [], r = 0.2, h = 0.2; /* cobbles are just their tops (sides would be ~12 of their 16 triangles, unseen at this size) */
      for (let i = 1; i < 5; i++) { const p = k => [Math.cos(k / 6 * 6.2832 + 0.26) * r, h, Math.sin(k / 6 * 6.2832 + 0.26) * r]; v.push(...p(0), ...p(i + 1), ...p(i)); }   // the top
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.computeVertexNormals(); return g; })();
    const inst = new THREE.InstancedMesh(hex, new THREE.MeshLambertMaterial({ flatShading: true }), stones.length), m = new THREE.Object3D(), c = new THREE.Color();
    const tones = [0xc9c2b4, 0xb4bfcb, 0xd9d0bf, 0xa9b2bc, 0xe4dccd, 0xcdc1ab, 0xbcc6cf];
    stones.forEach(([x, z], i) => { const sc = 0.7 + rand() * 0.45; m.position.set(x, 0.07, z); m.rotation.set(0, rand() * 6.283, 0); m.scale.set(sc, sc * 0.3, sc * (0.75 + rand() * 0.35)); m.updateMatrix(); inst.setMatrixAt(i, m.matrix); inst.setColorAt(i, c.set(tones[Math.floor(rand() * tones.length)])); });
    town.add(inst); }
  // ---- reusable bits ---------------------------------------------------
  // A sign is its own lit board, so it reads by day and glows at night.
  function sign(text, w, parent, x, y, z, { bg = '#1d2545', fg = '#ffd66b', board = true, h = w * 160 / 512 } = {}) {
    const ch = Math.round(512 * h / w), c = document.createElement('canvas'); c.width = 512; c.height = ch;
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const draw = () => {
      const g = c.getContext('2d');
      g.fillStyle = bg; g.fillRect(0, 0, 512, ch);
      let size = Math.min(120, ch * 0.78); g.textAlign = 'center'; g.textBaseline = 'middle';
      do { g.font = `900 ${size}px Nunito, "Arial Black", sans-serif`; size -= 4; } while (g.measureText(text).width > 450 && size > 24);
      g.fillStyle = fg; g.fillText(text, 256, ch * 0.55);
      tex.needsUpdate = true;
    };
    draw(); signs.push(draw);
    const m = new THREE.MeshBasicMaterial({ map: tex, fog: false }); m.userData.sign = true; m.userData.light = /^#[e-f]/i.test(bg); glowMats.push(m);   // pale boards only glow a little, or they wash out
    if (board) box(w + 0.24, h + 0.24, 0.16, P.woodDark, x, y, z - 0.06, parent);
    return mesh(new THREE.PlaneGeometry(w, h), m, x, y, z + 0.035, parent);
  }
  // Gable roof: a triangular prism with a little overhang.
  function gable(w, d, rise, color, y, parent) {
    const s = new THREE.Shape(); s.moveTo(-w / 2 - 0.4, 0); s.lineTo(w / 2 + 0.4, 0); s.lineTo(0, rise); s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth: d + 0.7, bevelEnabled: false }); geo.translate(0, 0, -(d + 0.7) / 2);
    return mesh(geo, flat(color), 0, y, 0, parent);
  }
  // Every hut has tall walls with the sign on the wall above the door, under the eave.
  function hut(key, { w = 5, h = 3.4, depth = 4, label, wall = P.wood, roof = P.roof, trim = P.woodDark }) {
    const g = at(key);
    box(w, h, depth, wall, 0, h / 2, 0, g);
    for (const s of [-1, 1]) box(0.3, h, 0.3, trim, s * (w / 2), h / 2, depth / 2, g);
    gable(w, depth, 1.7, roof, h, g);
    box(1.0, 1.7, 0.14, trim, -w / 4, 0.85, depth / 2 + 0.03, g);                 // door
    box(1.1, 0.9, 0.14, glow(), w / 4, 1.35, depth / 2 + 0.03, g);                // window
    if (label) sign(label, Math.min(w - 1.2, 3), g, 0, h - 0.62, depth / 2 + 0.12);
    return g;
  }
  // Street lights. Only the first few carry a real light; the rest just glow (bloom does the rest).
  function lamp(x, z, kind = 'classic', face = 0) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = face; town.add(g);
    const warm = () => glow(0xffe08a, 0xfff3c4);
    let top = 2.8;
    if (kind === 'classic') { box(0.18, 2.6, 0.18, P.woodDark, 0, 1.3, 0, g); box(0.5, 0.5, 0.5, warm(), 0, 2.8, 0, g); }
    else if (kind === 'globes') {   // iron post with two round globes
      mesh(new THREE.CylinderGeometry(0.09, 0.14, 3.0, 6), flat(0x1d2545), 0, 1.5, 0, g); mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.3, 8), flat(0x1d2545), 0, 0.15, 0, g);
      box(1.5, 0.08, 0.08, 0x1d2545, 0, 2.9, 0, g);
      for (const sd of [-1, 1]) { mesh(new THREE.SphereGeometry(0.3, 10, 8), warm(), sd * 0.75, 2.62, 0, g); box(0.06, 0.18, 0.06, 0x1d2545, sd * 0.75, 2.84, 0, g); }
      mesh(new THREE.SphereGeometry(0.12, 6, 5), flat(0xffd93b), 0, 3.1, 0, g); top = 3.6; }   // the square's lamps: three lanterns on scroll brackets
    else if (kind === 'hanging') {  // a crook-necked post with a lantern hanging from it
      box(0.16, 3.2, 0.16, 0x2f7f9a, 0, 1.6, 0, g); box(0.95, 0.12, 0.12, 0x2f7f9a, 0.42, 3.2, 0, g); box(0.12, 0.3, 0.12, 0x2f7f9a, 0.85, 3.05, 0, g);
      box(0.05, 0.25, 0.05, 0x1d2545, 0.85, 2.82, 0, g); mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.5, 6), warm(), 0.85, 2.5, 0, g); mesh(new THREE.ConeGeometry(0.3, 0.22, 6), flat(0x2f7f9a), 0.85, 2.85, 0, g); top = 2.5; }
    else if (kind === 'bollard') {  // knee-high path light
      mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.7, 7), flat(0x5f82ad), 0, 0.35, 0, g); mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.2, 7), warm(), 0, 0.78, 0, g); mesh(new THREE.ConeGeometry(0.22, 0.16, 7), flat(0x5f82ad), 0, 0.96, 0, g); top = 0.8; }
    else if (kind === 'torch') {    // beach torch
      box(0.12, 2.0, 0.12, 0xc9744a, 0, 1.0, 0, g); mesh(new THREE.CylinderGeometry(0.2, 0.12, 0.3, 6), flat(0x8a5a3a), 0, 2.1, 0, g);
      const f = mesh(new THREE.ConeGeometry(0.17, 0.5, 5), glow(0xff8a1f, 0xffb45a), 0, 2.45, 0, g); f.userData.flicker = true; f.userData.keep = true; torches.push(f); top = 2.4; }
    // the Blender lamp replaces the simple one (the torch keeps its live flame)
    const model = { classic: 'LampClassic', globes: 'LampTriple', hanging: 'LampHanging', bollard: 'LampBollard', torch: 'LampTorch' }[kind], light = warm();
    whenKit(() => { const m = kitModel(model, { glow_lampwarm: light }); if (!m) return; for (const c of [...g.children]) if (!c.userData.keep) g.remove(c); g.add(m); });
    if (lamps.length < 14 && kind !== 'bollard') { const l = new THREE.PointLight(kind === 'torch' ? 0xff9a4a : 0xffc870, 0, 12, 1.8); l.position.set(x, top, z); town.add(l); lamps.push(l); }
    return g;
  }
  const petalMats = {}, petalMat = c => petalMats[c] ||= new THREE.MeshLambertMaterial({ color: pastel(c), flatShading: true });
  function flower(x, z, s, color, parent = town) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rand() * 6.28; g.scale.setScalar(s); parent.add(g);
    mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.9, 5), flat(P.grassDark), 0, 0.45, 0, g);
    const head = new THREE.Group(); head.position.y = 0.95; head.rotation.x = 0.5; g.add(head);
    for (let i = 0; i < 5; i++) {
      const petal = mesh(new THREE.ConeGeometry(0.3, 0.75, 4), flat(color), 0, 0, 0, head);
      const a = (i / 5) * 6.28; petal.position.set(Math.cos(a) * 0.42, 0, Math.sin(a) * 0.42);
      petal.rotation.z = -Math.PI / 2; petal.rotation.y = -a; petal.scale.set(1, 1, 0.45);
    }
    mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.16, 6), flat(P.centre), 0, 0.05, 0, head);
    whenKit(() => { const m = kitModel('Flower', { isl_petal: petalMat(color) }); if (m) { g.clear(); g.add(m); } });

    return g;
  }
  let rocks = 0; const rockMats = {}, rockMat = c => rockMats[c] ||= new THREE.MeshLambertMaterial({ color: pastel(c), flatShading: true });
  function rock(x, z, s, parent = town) {
    const c = rand() > 0.5 ? P.rock : P.rockDark, m = mesh(new THREE.DodecahedronGeometry(s, 0), flat(c), x, s * 0.45, z, parent); m.rotation.set(rand(), rand() * 6, rand()); m.scale.y = 0.75;
    const kind = rocks++ % 3, turn = m.rotation.y;
    whenKit(() => { const k = kitModel('Rock' + kind, { isl_rock: rockMat(c), isl_rock_dark: rockMat(c) }); if (!k) return; k.position.set(x, 0, z); k.rotation.y = turn; k.scale.setScalar(s * 0.85); parent.add(k); parent.remove(m); });
  }
  function pine(x, z, s) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); town.add(g); swayers.push(g);
    mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.8, 5), flat(P.woodDark), 0, 0.4, 0, g);
    [[1.25, 1.5, 1.3], [0.95, 1.3, 2.2], [0.62, 1.1, 3.0]].forEach(([r, h, y], i) => mesh(new THREE.ConeGeometry(r, h, 6), flat(i % 2 ? P.pineDark : P.pine), 0, y, 0, g));
    mesh(new THREE.ConeGeometry(0.3, 0.45, 6), flat(P.snow), 0, 3.5, 0, g);
    whenKit(() => { const m = kitModel('Pine'); if (m) { g.clear(); m.rotation.y = x * 7.1; g.add(m); } });
  }

  // ---- her house ---------------------------------------------------------
  const house = { wall: new THREE.MeshLambertMaterial({ color: pastel(0xfff1d6), flatShading: true }), roof: new THREE.MeshLambertMaterial({ color: pastel(0xe8452c), flatShading: true }), extras: [] };
  { const g = at('home'), w = 5.2, h = 3.2, depth = 4.4, trim = 0x2f7f9a, hp = new THREE.Group(), win = glow(); g.add(hp);
    mesh(new THREE.BoxGeometry(w, h, depth), house.wall, 0, h / 2, 0, hp);
    for (const s of [-1, 1]) box(0.3, h, 0.3, trim, s * (w / 2), h / 2, depth / 2, hp);
    gable(w, depth, 1.7, 0, h, hp).material = house.roof;
    box(1.0, 1.7, 0.14, trim, -w / 4, 0.85, depth / 2 + 0.03, hp); box(1.1, 0.9, 0.14, win, w / 4, 1.35, depth / 2 + 0.03, hp);
    sign('NENA', 1.7, g, 0, h - 0.62, depth / 2 + 0.125, { bg: '#f4eee2', fg: '#c45a7a', board: false, h: 0.42 });
    box(0.8, 1.6, 0.8, 0xb86b4b, 1.4, 4.4, -0.8, hp); box(1.0, 0.25, 1.0, 0x8a4a34, 1.4, 5.25, -0.8, hp);   // chimney
    box(1.6, 0.12, 0.9, trim, -1.3, 0.06, 2.75, hp);                                                        // doormat
    box(1.5, 0.5, 0.45, P.woodDark, 2.1, 0.25, 3.1, hp); for (let i = 0; i < 3; i++) flower(1.6 + i * 0.5, 3.1, 0.5, P.petals[i], g).position.y = 0.55;   // growing in the planter
    // level 2: a side room. level 3: an upstairs.
    const l2 = new THREE.Group(), l3 = new THREE.Group(); g.add(l2, l3); house.extras = [l2, l3];
    mesh(new THREE.BoxGeometry(2.6, 2.4, 3.2), house.wall, -3.8, 1.2, -0.2, l2); const r2 = gable(2.6, 3.2, 1.1, 0, 2.4, l2); r2.material = house.roof; r2.position.x = -3.8; r2.position.z = -0.2; box(0.9, 0.8, 0.14, win, -3.8, 1.3, 1.43, l2);
    mesh(new THREE.BoxGeometry(3.4, 2.2, 3.0), house.wall, 0.3, 5.0, -0.3, l3); const r3 = gable(3.4, 3.0, 1.3, 0, 6.1, l3); r3.material = house.roof; r3.position.x = 0.3; r3.position.z = -0.3; box(1.0, 0.8, 0.14, win, 0.3, 5.0, 1.23, l3);
    // the Blender house: same rooms, so buying an extension still shows the same part
    whenKit(() => {
      const m = kitParts('House', { house_wall: house.wall, house_roof: house.roof, glow_window: win }); if (!m) return;
      const part = n => m.getObjectByName(n);
      const L2 = part('HouseL2'), L3 = part('HouseL3');
      hp.clear(); l2.clear(); l3.clear();
      for (const c of [...L2.children]) l2.add(c);
      for (const c of [...L3.children]) l3.add(c);
      m.remove(L2, L3); for (const c of [...m.children]) if (c.name !== 'SignAnchor') hp.add(c);
    }); }

  // ---- fish stall --------------------------------------------------------
  { const g = at('fish');
    box(4.2, 1.1, 1.6, P.wood, 0, 0.55, 0, g);
    for (const s of [-1, 1]) box(0.25, 3.1, 0.25, P.woodDark, s * 1.95, 1.55, -0.6, g);
    for (let i = 0; i < 6; i++) { const st = box(0.75, 0.16, 2.6, i % 2 ? 0xfffaf0 : 0xe8452c, -1.88 + i * 0.75, 3.05, 0.15, g); st.rotation.x = 0.28; }
    for (let i = 0; i < 4; i++) { const f = mesh(new THREE.ConeGeometry(0.16, 0.6, 4), flat(i % 2 ? 0x8fd3ff : 0xbfe8ff), -1.3 + i * 0.85, 1.2, 0.2, g); f.rotation.z = Math.PI / 2; f.rotation.y = 0.3; }
    box(0.6, 0.4, 0.4, glow(0xffe08a, 0xfff3c4), 1.6, 2.5, -0.5, g);
    box(0.14, 1.0, 0.14, P.woodDark, 0, 4.0, -0.6, g);
    sign('FISH', 2.4, g, 0, 4.7, -0.6);
    building(g, 'FishStall', {}, 'FISH', [2.2, 0.44], { bg: '#f4eee2', fg: '#5f82ad' }); }

  building(hut('library', { w: 5.6, h: 3.8, depth: 4, label: 'BOOKS', wall: 0xf7b34a, roof: 0x2f7f9a }), 'Library', {}, 'LIBRARY', [1.3, 0.38], { bg: '#f4eee2', fg: '#c45a7a' });
  { const g = hut('studio', { w: 4.8, h: 3.4, depth: 4, label: 'STUDIO', wall: 0xff8f6b, roof: 0x6a2fc4 }), eg = new THREE.Group(); eg.userData.keep = true; g.add(eg);
    building(g, 'Studio', {}, 'STUDIO', [1.8, 0.42], { bg: '#f4eee2', fg: '#c45a7a' });
    const easelCanvas = document.createElement('canvas'); easelCanvas.width = 300; easelCanvas.height = 200; drawPicture(easelCanvas, 'flowers', 1);
    const easelTex = new THREE.CanvasTexture(easelCanvas); easelTex.colorSpace = THREE.SRGBColorSpace;
    box(1.3, 0.95, 0.06, P.woodDark, 1.7, 1.45, 2.97, eg).rotation.x = -0.2;
    const pic = mesh(new THREE.PlaneGeometry(1.2, 0.8), new THREE.MeshBasicMaterial({ map: easelTex }), 1.7, 1.45, 3.01, eg); pic.rotation.x = -0.2;   // easel, showing her latest drawing
    town.userData.easel = { canvas: easelCanvas, tex: easelTex, key: '' };
    box(1.4, 0.06, 0.2, P.woodDark, 1.7, 0.98, 3.05, eg);
    for (const s of [-1, 1]) box(0.08, 1.7, 0.08, P.woodDark, 1.7 + s * 0.35, 0.85, 3.05, eg); }

  // ---- museum -----------------------------------------------------------
  { const g = at('museum');
    box(6, 3.6, 4.2, 0xf4efe2, 0, 1.8, 0, g); box(6.6, 0.4, 4.8, 0xd9cfb8, 0, 3.8, 0, g); gable(5.2, 3.6, 1.2, 0x8fa3b8, 4.0, g);
    for (let i = 0; i < 4; i++) mesh(new THREE.CylinderGeometry(0.22, 0.26, 2.4, 6), flat(0xfffaf0), -2.4 + i * 1.6, 1.2, 2.45, g);
    box(6.4, 0.3, 1.6, 0xd9cfb8, 0, 0.15, 2.6, g); box(6.0, 0.25, 0.9, 0xd9cfb8, 0, 2.5, 2.45, g); box(1.2, 1.9, 0.14, 0x5f82ad, 0, 0.95, 2.13, g);
    for (const sx of [-1, 1]) box(1.0, 1.0, 0.14, glow(), sx * 1.9, 1.7, 2.13, g);
    sign('MUSEUM', 3.2, g, 0, 3.05, 2.2, { bg: '#5f82ad', fg: '#fffaf0' });
    building(g, 'Museum', {}, 'MUSEUM', [2.6, 0.43], { bg: '#2c3157', fg: '#f4eee2' }); }

  // ---- shop and workbench ----------------------------------------------------
  { const g = hut('shop', { w: 5, h: 3.4, depth: 4, label: 'SHOP', wall: 0x9fe0c8, roof: 0xf2792e, trim: 0x2f7f9a });
    box(2.2, 0.9, 1.0, P.wood, -3.6, 0.45, 2.6, g); box(2.4, 0.14, 1.2, P.woodDark, -3.6, 0.95, 2.6, g);     // workbench
    box(0.5, 0.3, 0.3, 0x5f82ad, -3.9, 1.15, 2.6, g); box(0.1, 0.5, 0.1, P.woodDark, -3.1, 1.25, 2.5, g);
    for (let i = 0; i < 3; i++) box(0.7, 0.6, 0.7, [0xe8452c, 0xffd93b, 0x6a2fc4][i], 2.9 + (i % 2) * 0.5, 0.3 + (i > 1 ? 0.6 : 0), 2.5 + (i % 2) * 0.6, g);   // crates
    building(g, 'Shop', {}, 'SHOP', [2.4, 0.5], { bg: '#f4eee2', fg: '#c45a7a' }); }

  // ---- orchard: leaves change with the season, fruit shows when it is ready -----------
  const fruit = [];
  const seasonLeaves = new THREE.MeshLambertMaterial({ flatShading: true }); seasonLeaves.color = leafMat.color;   // the same Color, so seasons still tint it
  for (const [x, z] of ORCHARD_TREES) {
    const old = [mesh(new THREE.CylinderGeometry(0.28, 0.36, 1.8, 6), flat(P.woodDark), x, 0.9, z), mesh(new THREE.DodecahedronGeometry(1.5, 0), leafMat, x, 2.9, z), mesh(new THREE.DodecahedronGeometry(1.0, 0), leafMat, x + 0.5, 3.8, z - 0.3)];
    old[1].rotation.y = rand() * 3; const turn = old[1].rotation.y;
    whenKit(() => { const m = kitModel('FruitTree', { isl_leaf: seasonLeaves }); if (!m) return; m.position.set(x, 0, z); m.rotation.y = turn; town.add(m); for (const o of old) town.remove(o); });
    for (let i = 0; i < 4; i++) { const a = i * 1.6 + rand(); fruit.push(mesh(new THREE.SphereGeometry(0.2, 6, 5), fruitMat, x + Math.cos(a) * 1.25, 2.3 + rand() * 0.8, z + Math.sin(a) * 1.25)); }
  }
  // ---- the woodlot: the trees she chops for wood. Each axe blow shakes the tree; when she's done it topples
  // away from her and is gone, leaving a stump, and a new one grows back from the stump over a few days.
  const woodlot = (() => {
    let saved = {}; try { saved = JSON.parse(localStorage.getItem('nena-woodlot') || '{}'); } catch { saved = {}; }
    const save = () => { try { localStorage.setItem('nena-woodlot', JSON.stringify(saved)); } catch {} };
    const trees = WOODLOT.map(([x, z], i) => {
      const g = new THREE.Group(); g.position.set(x, 0, z); town.add(g);
      const rig = new THREE.Group(), pivot = new THREE.Group(); g.add(rig); rig.add(pivot);
      const tree = makeTree(2, 'oak'); tree.scale.setScalar(0.8 + (i % 2) * 0.12); tree.rotation.y = i * 1.7; pivot.add(tree);
      const stump = new THREE.Group(); g.add(stump);
      mesh(new THREE.CylinderGeometry(0.3, 0.38, 0.34, 8), flat(P.woodDark), 0, 0.17, 0, stump); mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.03, 8), flat(0xe3c48e), 0, 0.35, 0, stump);
      return { i, x, z, g, rig, pivot, tree, stump, shake: 0, fall: -1 };
    });
    const show = (day = 0) => trees.forEach(t => { if (t.fall >= 0) return;
      const d = saved[t.i]; let s = 1;
      if (d != null) { const age = day - d; if (age >= 4) { delete saved[t.i]; save(); } else s = age < 1 ? 0 : 0.25 + 0.75 * (age - 1) / 3; }
      t.tree.visible = s > 0; t.pivot.scale.setScalar(Math.max(0.001, s)); t.pivot.rotation.x = 0; t.pivot.position.y = 0; t.stump.visible = d != null && s < 0.6; });
    show();
    return {
      trees,
      standing: () => trees.filter(t => saved[t.i] == null && t.fall < 0),
      hit(t) { t.shake = 1; },
      fell(t, dir, day) { if (t.fall >= 0 || saved[t.i] != null) return; t.rig.rotation.y = dir; t.fall = 0; t.day = day; },
      tick(dt, day, time) {
        for (const t of trees) {
          if (t.shake > 0) { t.shake = Math.max(0, t.shake - dt * 3); t.pivot.rotation.z = Math.sin(time * 45) * 0.06 * t.shake; }
          if (t.fall >= 0) { t.fall += dt;
            const k = Math.min(1, t.fall / 1.4); t.pivot.rotation.x = (k * k) * Math.PI / 2; t.stump.visible = true;   // topples, speeding up
            if (t.fall > 1.6) { const f = Math.min(1, (t.fall - 1.6) / 0.8); t.pivot.position.y = -f * 1.2; t.pivot.scale.setScalar(Math.max(0.001, 1 - f)); }
            if (t.fall > 2.4) { t.fall = -1; saved[t.i] = t.day; save(); show(day); } }
        }
        if ((this._day ?? -1) !== day) { this._day = day; show(day); }
      },
    };
  })();

  // the big rock she chips at
  { const m = mesh(new THREE.DodecahedronGeometry(1.5, 0), flat(P.rockDark), BIG_ROCK.x, 0.9, BIG_ROCK.z); m.scale.y = 0.9;
    whenKit(() => { const k = kitModel('Rock1', { isl_rock_dark: new THREE.MeshLambertMaterial({ color: pastel(P.rockDark), flatShading: true }) }); if (!k) return; k.position.set(BIG_ROCK.x, 0, BIG_ROCK.z); k.scale.set(1.75, 1.6, 1.75); town.add(k); town.remove(m); }); mesh(new THREE.DodecahedronGeometry(0.35, 0), glow(0xffe08a, 0xffd93b), BIG_ROCK.x + 0.9, 1.5, BIG_ROCK.z + 0.6); }

  // ---- neighbours' tents -----------------------------------------------------------
  NEIGHBOURS.forEach((n, i) => {
    const col = [0x2f7f9a, 0xe8452c, 0xffd93b][i], g = new THREE.Group(); g.position.set(n.home.x, 0, n.home.z); town.add(g);
    const t = mesh(new THREE.ConeGeometry(2.0, 2.6, 6), flat(col), 0, 1.3, 0, g); t.rotation.y = 0.52;
    box(0.9, 1.3, 0.2, 0x1d2545, 0, 0.65, 1.62, g); box(0.1, 0.9, 0.1, P.woodDark, 0, 3.0, 0, g); box(0.5, 0.3, 0.05, 0xfffaf0, 0.28, 3.25, 0, g);
    box(0.5, 0.5, 0.5, glow(0xffe08a, 0xfff3c4), 1.9, 0.25, 1.6, g);
    building(g, 'BellTent', { tent_canvas: flat(col) }, null, [0, 0], {}, 'none');
  });

  // ---- festival things in the square, only out for events ------------------------------
  const festival = new THREE.Group(), lanternsG = new THREE.Group(); festival.visible = lanternsG.visible = false; town.add(festival, lanternsG);
  { const poles = [[-5, -5], [5, -5], [5, 5], [-5, 5]];
    poles.forEach(([x, z]) => box(0.16, 4, 0.16, P.woodDark, x, 2, z, festival));
    poles.forEach(([x, z], i) => { const [nx, nz] = poles[(i + 1) % 4]; for (let k = 1; k < 8; k++) { const f = mesh(new THREE.ConeGeometry(0.22, 0.5, 3), flat([0xe8452c, 0xffd93b, 0x2fc6b3, 0x6a2fc4][k % 4]), x + (nx - x) * k / 8, 3.7 - Math.sin(k / 8 * Math.PI) * 0.5, z + (nz - z) * k / 8, festival); f.rotation.x = Math.PI; } });
    const stalls = [box(3, 0.4, 2, P.wood, -3, 0.2, 3, festival), box(1.6, 0.8, 0.8, 0xfffaf0, 3, 0.4, 3, festival)];
    whenKit(() => { for (const [i, x] of [-3.2, 3.2].entries()) { const b = kitBuilding('FestivalStall'); if (!b) return; b.group.position.set(x, 0, 3.4); b.group.rotation.y = Math.atan2(-x, -3.4); festival.add(b.group); festival.remove(stalls[i]); } });   // cake stalls
    for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283, r = 6 + (i % 2) * 5; const m = new THREE.MeshLambertMaterial({ color: 0xff8a1f, emissive: 0xff8a1f, emissiveIntensity: 1.6, flatShading: true }); box(0.5, 0.6, 0.5, m, Math.cos(a) * r, 0.5, Math.sin(a) * r, lanternsG); box(0.08, 0.5, 0.08, P.woodDark, Math.cos(a) * r, 0.1, Math.sin(a) * r, lanternsG); } }

  // ---- cocoa cart ----------------------------------------------------------
  { const g = at('cafe');
    box(2.2, 1.0, 1.2, 0x8a5a3a, 0, 0.6, 0, g); box(2.4, 0.12, 1.4, 0xfff1d6, 0, 1.15, 0, g);
    for (const s of [-1, 1]) { box(0.12, 1.5, 0.12, P.woodDark, s * 1.0, 1.9, 0, g); const wh = mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.12, 8), flat(0x1d2545), s * 1.0, 0.32, 0.65, g); wh.rotation.x = Math.PI / 2; }
    for (let i = 0; i < 5; i++) box(0.5, 0.12, 1.7, i % 2 ? 0xfffaf0 : 0x8a5a3a, -1.0 + i * 0.5, 2.7, 0.1, g).rotation.x = 0.2;
    mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.26, 7), flat(0xfffaf0), -0.5, 1.35, 0.2, g); mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.5, 7), glow(0xffb45a, 0xe8452c), 0.5, 1.46, 0, g);
    sign('COCOA', 1.5, g, 0, 0.62, 0.62, { bg: '#fff1d6', fg: '#8a5a3a' });
    for (const [x, z] of [[-1.9, 1.9], [1.9, 2.1]]) mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.45, 7), flat(P.wood), x, 0.22, z, g);
    building(g, 'CocoaCart', {}, 'COCOA', [1.8, 0.55], { bg: '#f4eee2', fg: '#a8794a' }); }

  // ---- flagpole in the square (she designs the flag) -------------------------------
  const flagMat = flat(FLAGS[0]);
  { box(0.16, 5.2, 0.16, 0xfffaf0, -3.8, 2.6, 3.6); const flagCloth = mesh(new THREE.BoxGeometry(1.6, 1.0, 0.06), flagMat, -2.95, 4.6, 3.6); flagCloth.geometry.translate(0.8, 0, 0); flagCloth.position.x = -3.75; town.userData.flagCloth = flagCloth; box(0.6, 0.3, 0.6, P.rockDark, -3.8, 0.15, 3.6); }
  // ---- the noticeboard: click it to read the notes left for her ----------------------
  const board = new THREE.Group();
  { board.position.set(BOARD.x, 0, BOARD.z); board.rotation.y = Math.atan2(-BOARD.x, -BOARD.z); town.add(board);
    for (const sd of [-1, 1]) box(0.16, 2.3, 0.16, P.woodDark, sd * 1.05, 1.15, 0, board);
    box(2.3, 1.55, 0.14, P.woodDark, 0, 1.55, 0, board); box(2.05, 1.3, 0.06, 0xd9b48a, 0, 1.55, 0.07, board);
    const gable = new THREE.Shape(); gable.moveTo(-1.35, 0); gable.lineTo(1.35, 0); gable.lineTo(0, 0.55); gable.closePath();
    const roof = mesh(new THREE.ExtrudeGeometry(gable, { depth: 0.5, bevelEnabled: false }), flat(0xe8452c), 0, 2.35, -0.25, board); void roof;
    [[-0.6, 1.85, 0xfff1d6], [0.1, 1.9, 0xffd9de], [0.65, 1.7, 0xdff3ff], [-0.45, 1.3, 0xfff3c4], [0.35, 1.25, 0xfff1d6], [-0.85, 1.1, 0xe2f5e0]].forEach(([x, y, c], i) => {
      const n = box(0.48, 0.4, 0.02, c, x, y, 0.11, board); n.rotation.z = (i % 2 ? 1 : -1) * 0.08; box(0.06, 0.06, 0.03, 0xe8452c, x, y + 0.15, 0.13, board); });
    sign('NOTICES', 1.5, board, 0, 2.62, 0.3, { bg: '#fff1d6', fg: '#e8452c' });
    building(board, 'Noticeboard', {}, 'NOTICES', [1.3, 0.3], { bg: '#f4eee2', fg: '#c45a7a' }, 'none', () => board.traverse(o => { o.userData.clickable = 'board'; })); }
  // the noticeboard reads as one thing to click
  board.traverse(o => { o.userData.clickable = 'board'; });
  // ---- the painter's boat (only moored on some days) ---------------------------------
  const painter = new THREE.Group(); painter.visible = false; town.add(painter);
  { const a = 0.75, r = R + 3.2; painter.position.set(Math.cos(a) * r, -0.15, Math.sin(a) * r); painter.rotation.y = -a;
    box(2.2, 0.9, 5.0, 0x3c2a86, 0, 0.3, 0, painter); box(2.5, 0.16, 5.3, 0xffd93b, 0, 0.8, 0, painter); box(1.5, 1.3, 1.8, 0xfff1d6, 0, 1.5, -1.2, painter); box(1.8, 0.16, 2.1, 0xe8452c, 0, 2.2, -1.2, painter);
    box(0.12, 3.4, 0.12, P.woodDark, 0, 2.5, 0.9, painter); box(1.3, 1.0, 0.06, 0xff9aa8, 0.72, 3.5, 0.9, painter);
    for (let i = 0; i < 3; i++) box(0.7, 0.9, 0.08, [0x58b7e8, 0xf59b2f, 0x2f8f7a][i], -0.8 + i * 0.8, 1.35, 1.9, painter).rotation.x = -0.25;
    building(painter, 'PainterBoat', {}, null, [0, 0], {}, 'none'); }

  // ---- vegetable patch beside the garden: sown, sprouting, ready ---------------------------
  const cropStages = [new THREE.Group(), new THREE.Group(), new THREE.Group()];
  { const p = PLACES.garden, g = new THREE.Group(); g.position.set(p.x + 0.4, 0, p.z + 3.4); g.rotation.y = 0.4; town.add(g);
    const bed = box(3.2, 0.16, 1.8, 0x6e4a30, 0, 0.07, 0, g); cropStages.forEach(c => { c.visible = false; c.position.y = 0.06; g.add(c); });
    whenKit(() => { const m = kitModel('VegBed'); if (m) { g.add(m); g.remove(bed); } });   // a raised wooden bed
    for (let i = 0; i < 8; i++) { const x = -1.2 + (i % 4) * 0.8, z = -0.4 + Math.floor(i / 4) * 0.8;
      box(0.12, 0.06, 0.12, 0x3f9a4a, x, 0.18, z, cropStages[0]);
      mesh(new THREE.ConeGeometry(0.14, 0.4, 4), flat(0x3f9a4a), x, 0.35, z, cropStages[1]);
      mesh(new THREE.ConeGeometry(0.2, 0.5, 5), flat(0x3f9a4a), x, 0.4, z, cropStages[2]); mesh(new THREE.SphereGeometry(0.2, 6, 5), flat(i % 2 ? 0xff8a1f : 0xe8452c), x, 0.24, z + 0.16, cropStages[2]); } }

  // ---- campsite: a striped tent, a log and a fire for whoever turns up ------------------
  { const g = at('camp');
    const sh = new THREE.Shape(); sh.moveTo(-1.7, 0); sh.lineTo(1.7, 0); sh.lineTo(0, 2.3); sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 2.8, bevelEnabled: false }); geo.translate(0, 0, -1.4);
    mesh(geo, flat(0xfff1d6), 0, 0, 0, g); for (const sx of [-1, 1]) { const st = box(0.5, 2.9, 2.84, 0x2fc6b3, sx * 0.85, 1.12, 0, g); st.rotation.z = sx * 0.637; st.scale.x = 0.12; }
    box(0.9, 1.3, 0.1, 0x1d2545, 0, 0.65, 1.42, g);
    const log = mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.8, 7), flat(P.woodDark), -2.2, 0.28, 3.0, g); log.rotation.z = Math.PI / 2; log.rotation.y = 0.4;
    for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; mesh(new THREE.DodecahedronGeometry(0.2, 0), flat(P.rock), Math.cos(a) * 0.55, 0.12, 3.2 + Math.sin(a) * 0.55, g); }
    mesh(new THREE.ConeGeometry(0.26, 0.65, 5), glow(0xff8a1f, 0xff8a1f), 0, 0.42, 3.2, g);
    sign('CAMP', 1.3, g, 2.4, 1.2, 1.6); box(0.12, 1.0, 0.12, P.woodDark, 2.4, 0.5, 1.5, g);
    building(g, 'Campsite', { glow_fire: glow(0xff8a1f, 0xffb45a) }, 'CAMP', [1.2, 0.34], { bg: '#f4eee2', fg: '#c45a7a' }, 'none'); }

  // ---- islets out at sea that she rows to ------------------------------------------------
  const isletBoats = ISLETS.map((isl, i) => {
    const p = isletPos(i), g = new THREE.Group(); g.position.set(p.x, -0.3, p.z); town.add(g);
    mesh(new THREE.CylinderGeometry(5.2, 5.8, 0.5, 9), flat(P.sand), 0, 0.1, 0, g); mesh(new THREE.CylinderGeometry(3.6, 4.2, 0.4, 8), flat(i === 1 ? P.rock : P.grass), 0, 0.42, 0, g);
    mesh(new THREE.CylinderGeometry(4.6, 2.5, 3.5, 7), flat(P.rockDark), 0, -2.0, 0, g);
    if (i === 0) for (const [x, z, st, sc] of [[-1.4, 0.6, 2, 0.6], [1.5, -1.1, 1, 0.75], [1.4, 1.7, 0, 0.9]]) { const t = makeTree(st, 'cherry'); t.position.set(x, 0.62, z); t.rotation.y = x * 2; t.scale.setScalar(sc); g.add(t); }
    if (i === 2) { const t = makeTree(1, 'oak'); t.position.set(-2.4, 0.62, -1.6); t.scale.setScalar(0.7); g.add(t); }
    if (i === 1) { for (const [x, z, sc] of [[-1, 0.5, 1.3], [1.3, -0.8, 0.9], [0.4, 1.6, 0.6]]) { const m = mesh(new THREE.DodecahedronGeometry(sc, 0), flat(x > 0 ? P.rock : P.rockDark), x, 0.6 + sc * 0.5, z, g); m.scale.y = 0.8; } mesh(new THREE.DodecahedronGeometry(0.3, 0), glow(0xffe08a, 0xffd93b), -0.3, 1.9, 0.9, g); }
    if (i === 2) for (const [x, z, sc] of [[-1.2, 0.4, 1.4], [1.1, -0.9, 1], [0.6, 1.5, 0.7]]) { mesh(new THREE.CylinderGeometry(0.22 * sc, 0.3 * sc, 1.3 * sc, 6), flat(0xfff1d6), x, 0.62 + 0.65 * sc, z, g); mesh(new THREE.CylinderGeometry(0.3 * sc, 1.0 * sc, 0.6 * sc, 8), flat([0xe8452c, 0x6a2fc4, 0xff8a1f][Math.round(sc * 10) % 3]), x, 0.62 + 1.5 * sc, z, g); }
    const boat = new THREE.Group(); boat.visible = false; g.add(boat); boat.position.set(-Math.cos(isl.a) * 6, 0.1, -Math.sin(isl.a) * 6); boat.rotation.y = -isl.a;
    box(1.5, 0.5, 2.6, 0x2f7f9a, 0, 0.2, 0, boat); box(1.7, 0.12, 2.8, 0xfffaf0, 0, 0.48, 0, boat);
    return boat;
  });

  // ---- clocktower: its hands show the time in her world ---------------------------------
  const clockHands = [];
  { const g = new THREE.Group(); g.position.set(CLOCK.x, 0, CLOCK.z); g.rotation.y = Math.atan2(-CLOCK.x, -CLOCK.z); town.add(g);
    box(2.6, 0.5, 2.6, P.rockDark, 0, 0.25, 0, g); box(2.0, 6.4, 2.0, 0xfff1d6, 0, 3.7, 0, g);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.3, 6.4, 0.3, 0x2f7f9a, sx * 1.0, 3.7, sz * 1.0, g);
    box(1.0, 1.7, 0.12, 0x2f7f9a, 0, 1.35, 1.02, g); box(2.8, 0.3, 2.8, 0x2f7f9a, 0, 7.05, 0, g); box(2.5, 2.6, 2.5, 0xfff1d6, 0, 8.5, 0, g); box(2.9, 0.25, 2.9, 0x2f7f9a, 0, 9.9, 0, g);
    const roof = mesh(new THREE.ConeGeometry(2.1, 2.2, 4), flat(0xe8452c), 0, 11.1, 0, g); roof.rotation.y = Math.PI / 4; mesh(new THREE.SphereGeometry(0.22, 6, 5), flat(0xffd93b), 0, 12.3, 0, g);
    const faceMat = new THREE.MeshLambertMaterial({ color: 0xfffaf0, emissive: 0xffe9b0, emissiveIntensity: 0 }); faceMat.userData.soft = true; glowMats.push(faceMat);
    for (let f = 0; f < 4; f++) {
      const face = new THREE.Group(); face.rotation.y = f * Math.PI / 2; face.userData.keep = true; g.add(face);   // faces and hands stay live
      const disc = mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.08, 20), faceMat, 0, 8.5, 1.28, face); disc.rotation.x = Math.PI / 2;
      const rim = mesh(new THREE.TorusGeometry(1.0, 0.09, 5, 20), flat(0x1d2545), 0, 8.5, 1.3, face);
      for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283, big = i % 3 === 0; const tk = box(0.07, big ? 0.24 : 0.12, 0.03, 0x1d2545, Math.sin(a) * 0.8, 8.5 + Math.cos(a) * 0.8, 1.34, face); tk.rotation.z = -a; }
      const mk = (len, w, col) => { const pivot = new THREE.Group(); pivot.position.set(0, 8.5, 1.36); face.add(pivot); box(w, len, 0.03, col, 0, len / 2 - 0.08, 0, pivot); return pivot; };
      clockHands.push({ hour: mk(0.5, 0.11, 0x1d2545), minute: mk(0.78, 0.07, 0xe8452c) });
      box(0.1, 0.1, 0.06, 0x1d2545, 0, 8.5, 1.38, face); void rim;
    }
    building(g, 'Clocktower', {}, null, [0, 0], {}, 'none'); }
  // night lights: the lighthouse turns, torches flicker, fairy lights twinkle
  const tmpC = new THREE.Color();
  function setLights(night, t) {
    beam.rotation.y = t * 0.45;
    beam.children.forEach(h => { const cone = h.children[0]; if (cone?.material) cone.material.opacity = night * 0.55; });
    beamLamp.emissiveIntensity = 0.3 + night * 2.2; beamLight.intensity = night * 260;
    for (const f of torches) { f.scale.y = 1 + Math.sin(t * 11 + f.id) * 0.12 * night; f.material.emissiveIntensity = night * (1.4 + Math.sin(t * 7 + f.id) * 0.4); }
    bulbs.forEach((b, i) => { const k = night > 0.25 ? 0.55 + 0.45 * Math.max(0, Math.sin(t * 1.7 + b.ph)) * night + night * 0.45 : 0.55; fairyMesh.setColorAt(i, tmpC.copy(b.c).multiplyScalar(night > 0.25 ? k * 1.6 : 0.55)); });
    fairyMesh.instanceColor.needsUpdate = true;
    if (bigTree.flies) { const n = Math.max(0, Math.min(1, (night - 0.15) / 0.5)); bigTree.flies.uniforms.uNight.value = n; bigTree.flies.uniforms.uTime.value = t; bigTree.glow.intensity = n * 40 * (0.85 + 0.15 * Math.sin(t * 0.7)); }
  }
  // wind: trees lean and sway, the flag streams out
  function setWind(w, t) {
    blades.material.uniforms.uWind.value += (w - blades.material.uniforms.uWind.value) * 0.05;   // grass leans more in a breeze
    tickPetals(t, Math.min(0.1, t - (bigTree.lastT ?? t)), w); bigTree.lastT = t; town.userData.tickSea?.(t);
    tickTrees(t, w); tickRoots(t, w);
    for (const g of swayers) { g.rotation.z = Math.sin(t * 1.6 + g.id) * 0.04 * w + 0.05 * w; g.rotation.x = Math.cos(t * 1.3 + g.id) * 0.03 * w; }
    const f = town.userData.flagCloth; if (f) { f.rotation.y = Math.sin(t * (2 + w * 6)) * (0.25 + w * 0.35); f.rotation.z = -0.15 * (1 - w); }
  }
  function setObservatory(night, using, t) { dome.rotation.y = night > 0.5 ? Math.sin(t * 0.05) * 1.2 : 0; scopeLight.emissiveIntensity = using ? 1.8 : night * 0.4; }
  function setEasel(d) { const e = town.userData.easel, key = d ? `${d.seed}` : ''; if (!d || key === e.key) return; e.key = key; drawPicture(e.canvas, d.title, d.seed); e.tex.needsUpdate = true; }
  function setClock(hour) { const h = -(hour % 12) / 12 * 6.283, m = -(hour % 1) * 6.283; for (const c of clockHands) { c.hour.rotation.z = h; c.minute.rotation.z = m; } }

  // ---- clothes shop: striped awning, a mannequin and a hat stand out front -------------------
  { const g = hut('tailor', { w: 5, h: 3.4, depth: 4, label: 'CLOTHES', wall: 0xffd9de, roof: 0x2f7f9a, trim: 0xe8452c });
    for (let i = 0; i < 6; i++) { const st = box(0.84, 0.1, 1.2, i % 2 ? 0xfffaf0 : 0xe8452c, -2.1 + i * 0.84, 2.12, 2.5, g); st.rotation.x = 0.4; }
    const dummy = new THREE.Group(); dummy.position.set(-3.4, 0, 2.6); g.add(dummy);
    box(0.08, 0.9, 0.08, P.woodDark, 0, 0.45, 0, dummy); const torso = mesh(new THREE.SphereGeometry(0.42, 8, 6), flat(0xfff1d6), 0, 1.25, 0, dummy); torso.scale.set(0.9, 1.15, 0.7);
    const sc = mesh(new THREE.TorusGeometry(0.36, 0.08, 5, 10), flat(0x6a2fc4), 0, 1.55, 0, dummy); sc.rotation.x = Math.PI / 2;
    mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.3, 9), flat(0xe8452c), 0, 1.95, 0, dummy); mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.05, 12), flat(0xe8452c), 0, 1.8, 0, dummy);
    const stand = new THREE.Group(); stand.position.set(3.3, 0, 2.5); g.add(stand);
    box(0.1, 1.7, 0.1, P.woodDark, 0, 0.85, 0, stand); mesh(new THREE.CylinderGeometry(0.4, 0.45, 0.08, 8), flat(P.woodDark), 0, 0.04, 0, stand);
    mesh(new THREE.ConeGeometry(0.2, 0.5, 7), flat(0xffd93b), 0.25, 1.65, 0, stand).rotation.z = -0.5;
    // a rail of scarves along the front
    box(2.6, 0.08, 0.08, P.woodDark, 0.3, 1.55, 2.95, g); for (const sd of [-1, 1]) box(0.08, 1.55, 0.08, P.woodDark, 0.3 + sd * 1.3, 0.78, 2.95, g);
    [0x2fc6b3, 0xffd93b, 0x6a2fc4, 0xff7fa3, 0xe8452c].forEach((col, i) => box(0.32, 0.9, 0.06, col, -0.7 + i * 0.5, 1.08, 2.95, g));
    // a little table of sunglasses
    box(1.1, 0.7, 0.6, P.wood, 2.0, 0.35, 3.2, g); box(1.2, 0.08, 0.7, 0xfffaf0, 2.0, 0.72, 3.2, g);
    for (let i = 0; i < 3; i++) { const gx = 1.65 + i * 0.36, col = [0x1d2545, 0xff7fa3, 0xffd93b][i]; for (const sd of [-1, 1]) { const l = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 8), flat(col), gx + sd * 0.08, 0.8, 3.2, g); l.rotation.x = Math.PI / 2 - 0.4; } } const bh = mesh(new THREE.SphereGeometry(0.26, 8, 5), flat(0x2fc6b3), -0.24, 1.45, 0.05, stand); bh.scale.y = 0.6;
    building(g, 'Tailor', {}, 'CLOTHES', [2.4, 0.5], { bg: '#f4eee2', fg: '#9c6fc4' }); }

  // ---- observatory: a round tower with a dome that turns at night ----------------------------
  let dome = null, scopeLight = null;
  { const g = at('observatory');
    mesh(new THREE.CylinderGeometry(3.0, 3.2, 0.5, 14), flat(P.rockDark), 0, 0.25, 0, g);
    mesh(new THREE.CylinderGeometry(2.6, 2.7, 3.6, 14), flat(0xf4efe2), 0, 2.3, 0, g);
    mesh(new THREE.CylinderGeometry(2.75, 2.75, 0.25, 14), flat(0x3c2a86), 0, 4.2, 0, g);
    box(1.1, 1.9, 0.2, 0x3c2a86, 0, 1.45, 2.55, g); for (const sd of [-1, 1]) box(0.7, 0.7, 0.14, glow(0x9cf6ff, 0xdff3ff), sd * 1.6, 2.6, 2.05, g).rotation.y = sd * -0.6;
    dome = new THREE.Group(); dome.position.y = 4.3; g.add(dome);
    mesh(new THREE.SphereGeometry(2.6, 14, 7, 0, 6.283, 0, Math.PI / 2), flat(0x8fa3b8), 0, 0, 0, dome);
    box(0.9, 2.7, 0.3, 0x1d2545, 0, 1.25, 2.1, dome).rotation.x = -0.75;                                   // the slit
    const scope = mesh(new THREE.CylinderGeometry(0.28, 0.38, 3.0, 8), flat(0xfff1d6), 0, 1.9, 2.0, dome); scope.rotation.x = 0.95;
    mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.2, 8), flat(0x3c2a86), 0, 2.75, 3.1, dome).rotation.x = 0.95;
    const sm = new THREE.MeshLambertMaterial({ color: 0xdff3ff, emissive: 0x9cf6ff, emissiveIntensity: 0 }); scopeLight = sm;
    mesh(new THREE.CircleGeometry(0.34, 10), sm, 0, 2.86, 3.25, dome).rotation.x = 0.95 - Math.PI / 2;
    sign('OBSERVATORY', 3.6, g, 0, 3.35, 2.68, { bg: '#3c2a86', fg: '#fffaf0' });
    building(g, 'Observatory', { glow_scope: sm, glow_star: glow(0x9cf6ff, 0xdff3ff) }, 'OBSERVATORY', [2.3, 0.36], { bg: '#2c3157', fg: '#f4eee2' }, 'none', b => { if (b.parts.LiveDome) { b.parts.LiveDome.rotation.y = dome.rotation.y; dome = b.parts.LiveDome; } }); }

  // ---- lighthouse: a striped tower whose beam sweeps the island and the sky at night --------
  const beam = new THREE.Group(); let beamLamp = null, beamLight = null;
  { const g = at('lighthouse');
    mesh(new THREE.CylinderGeometry(3.2, 3.5, 0.8, 12), flat(P.rockDark), 0, 0.4, 0, g);
    const bands = 6, H = 11;
    for (let i = 0; i < bands; i++) { const r0 = 2.2 - i * 0.16, r1 = 2.2 - (i + 1) * 0.16; mesh(new THREE.CylinderGeometry(r1, r0, H / bands, 12), flat(i % 2 ? 0xfffaf0 : 0xe8452c), 0, 0.8 + H / bands * (i + 0.5), 0, g); }
    box(1.0, 1.8, 0.2, 0x1d2545, 0, 1.7, 2.12, g); for (const y of [4.4, 7.6]) box(0.6, 0.8, 0.2, glow(), 0, y, 1.93 - (y - 4) * 0.04, g);
    const topY = 0.8 + H;
    mesh(new THREE.CylinderGeometry(1.75, 1.75, 0.3, 12), flat(0x1d2545), 0, topY + 0.15, 0, g);
    for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283; box(0.07, 0.7, 0.07, 0x1d2545, Math.cos(a) * 1.65, topY + 0.6, Math.sin(a) * 1.65, g); }
    const ringRail = mesh(new THREE.TorusGeometry(1.65, 0.05, 4, 20), flat(0x1d2545), 0, topY + 0.95, 0, g); ringRail.rotation.x = Math.PI / 2;
    mesh(new THREE.CylinderGeometry(1.0, 1.0, 1.5, 10), new THREE.MeshLambertMaterial({ color: 0xdff3ff, transparent: true, opacity: 0.45 }), 0, topY + 1.05, 0, g);
    beamLamp = new THREE.MeshLambertMaterial({ color: 0xfff3c4, emissive: 0xffe9a0, emissiveIntensity: 0 }); mesh(new THREE.SphereGeometry(0.5, 10, 8), beamLamp, 0, topY + 1.05, 0, g);
    mesh(new THREE.ConeGeometry(1.25, 1.1, 10), flat(0xe8452c), 0, topY + 2.35, 0, g); mesh(new THREE.SphereGeometry(0.18, 6, 5), flat(0xffd93b), 0, topY + 3.0, 0, g);
    sign('LIGHTHOUSE', 2.2, g, 0, 3.2, 2.04, { bg: '#e8452c', fg: '#fffaf0' });
    building(g, 'Lighthouse', { glow_lamp: beamLamp, glass_lantern: new THREE.MeshLambertMaterial({ color: 0xdff3ff, transparent: true, opacity: 0.4 }) }, 'LIGHTHOUSE', [1.9, 0.34], { bg: '#f4eee2', fg: '#c45a7a' });
    // the beam: two long soft cones pointing opposite ways, turning round
    const s = site('lighthouse'); beam.position.set(s.x, topY + 1.05, s.z); town.add(beam);
    const c = document.createElement('canvas'); c.width = 4; c.height = 128; const gx = c.getContext('2d'); const gr = gx.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, 'rgba(255,240,190,0)'); gr.addColorStop(0.75, 'rgba(255,240,190,0.55)'); gr.addColorStop(1, 'rgba(255,248,220,0.95)'); gx.fillStyle = gr; gx.fillRect(0, 0, 4, 128);
    const beamTex = new THREE.CanvasTexture(c);
    for (const dir of [1, -1]) { const cone = new THREE.Mesh(new THREE.ConeGeometry(9, 120, 16, 1, true), new THREE.MeshBasicMaterial({ map: beamTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
      cone.geometry.translate(0, -60, 0); cone.rotation.z = dir * Math.PI / 2; cone.rotation.y = 0; cone.rotation.x = 0; cone.position.y = 0; const holder = new THREE.Group(); holder.rotation.z = dir * -0.06; holder.add(cone); beam.add(holder); }
    beamLight = new THREE.SpotLight(0xffe9b0, 0, 90, 0.2, 0.6, 1.2); beamLight.position.set(0, 0, 0); beam.add(beamLight); beamLight.target.position.set(40, -12, 0); beam.add(beamLight.target); }

  // ---- fairy lights: strings of small bulbs draped along some buildings --------------------
  const bulbs = [];
  const FAIRY = [0xffd93b, 0xff7fa3, 0x9fe0c8, 0xfff3c4, 0x58b7e8, 0xff8a1f];
  function fairy(group, pts, sag = 0.25, spacing = 0.32) {
    group.updateMatrixWorld(true);
    const world = pts.map(([x, y, z]) => group.localToWorld(new THREE.Vector3(x, y, z)));
    for (let i = 0; i < world.length - 1; i++) { const a = world[i], b = world[i + 1], n = Math.max(2, Math.round(a.distanceTo(b) / spacing));
      for (let k = 0; k <= n; k++) { const t = k / n, p = a.clone().lerp(b, t); p.y -= Math.sin(t * Math.PI) * sag * a.distanceTo(b) / 3; bulbs.push({ p, c: new THREE.Color(FAIRY[bulbs.length % FAIRY.length]), ph: Math.random() * 6.283 }); } }
  }
  const front = key => town.children.find(o => o.isGroup && Math.abs(o.position.x - site(key).x) < 0.01 && Math.abs(o.position.z - site(key).z) < 0.01);

  // Swap a place's simple shapes for its Blender building once the kit loads. Everything
  // already in the group is the stand-in; window glass and bulbs become night lights.
  function building(g, name, swap, label, [w, h], colours, motion = 'bob', done) {
    whenKit(() => {
      const warm = glow(0xffe0a0, 0xfff1cf), bulbs = glow(0xffe08a, 0xfff6d8);
      const b = kitBuilding(name, { glow_shopwindow: warm, glow_bulb: bulbs, ...swap }); if (!b) return;
      for (const c of [...g.children]) if (!c.userData.keep) g.remove(c);   // keep live bits (like the studio easel)
      g.add(b.group);
      const a = b.anchors.SignAnchor; if (a && label) sign(label, w, g, a.x, a.y, a.z, { ...colours, board: false, h });
      if (b.anchors.Hero && motion !== 'none') heroes.push({ o: b.hero, y: b.hero.position.y, motion });
      done?.(b);
    });
  }
  // ---- cookie shop: pastel storefront, striped awning, a giant cookie on the roof ----------------
  { const g = at('cookie'), simple = new THREE.Group(); g.add(simple);
    box(5.2, 3.6, 3.6, 0xd9a3b4, 0, 2.2, 0, simple); box(5.8, 0.4, 4.1, 0x9cc9b8, 0, 4.2, 0, simple);
    mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.24, 12), flat(0xa8794a), 0, 5.4, -1.4, simple).rotation.x = Math.PI / 2;
    building(g, 'CookieShop', {}, 'Cookie Shop', [3.22, 0.56], { bg: '#f4eee2', fg: '#c45a7a' }); }

  // ---- cinema ------------------------------------------------------------
  const marquee = [];
  { const g = at('cinema');
    box(7, 4.4, 5, 0x5a3fb8, 0, 2.2, 0, g);
    box(7.4, 0.5, 5.4, 0x3c2a86, 0, 4.6, 0, g);
    box(5.6, 0.4, 1.8, 0xe8452c, 0, 2.7, 3.2, g);                                       // canopy
    for (let i = 0; i < 7; i++) { const m = new THREE.MeshLambertMaterial({ color: 0xfff3c4, emissive: 0xffe08a, emissiveIntensity: 0, flatShading: true }); marquee.push(m); box(0.28, 0.28, 0.28, m, -2.4 + i * 0.8, 2.42, 4.0, g); }
    box(1.6, 2.0, 0.14, 0x3c2a86, 0, 1.0, 2.53, g);                                     // doors
    for (const s of [-1, 1]) box(1.3, 1.8, 0.12, glow(0xff9aa8, 0xffd9de), s * 2.5, 1.5, 2.53, g);   // poster cases
    sign('CINEMA', 4.2, g, 0, 3.75, 2.62, { bg: '#fff3c4', fg: '#e8452c' });
    const chase = [0, 1, 2].map(() => { const m = new THREE.MeshLambertMaterial({ color: 0xfff3c4, emissive: 0xffe08a, emissiveIntensity: 0, flatShading: true }); return m; });
    building(g, 'Cinema', { glow_marquee0: chase[0], glow_marquee1: chase[1], glow_marquee2: chase[2], glow_poster: glow(0xff9aa8, 0xffd9de) }, 'CINEMA', [4.4, 0.76], { bg: '#2c3157', fg: '#f3dc9b' }, 'spin', () => { marquee.length = 0; marquee.push(...chase); }); }

  // ---- lookout tower -------------------------------------------------------
  { const g = at('lookout');
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.3, 4.4, 0.3, P.woodDark, sx * 1.2, 2.2, sz * 1.2, g);
    box(3.2, 0.3, 3.2, P.wood, 0, 4.4, 0, g);
    for (const sx of [-1, 1]) box(0.15, 0.8, 3.2, P.woodDark, sx * 1.5, 4.95, 0, g);
    const scope = mesh(new THREE.CylinderGeometry(0.16, 0.24, 1.3, 6), flat(0x2f7f9a), 0, 5.3, 0.6, g); scope.rotation.x = -1.0;
    box(0.5, 0.5, 0.5, glow(0x9cf6ff), 0, 6.1, -1.2, g);
    box(0.12, 1.5, 0.12, P.woodDark, 0, 5.3, -1.2, g);
    building(g, 'Lookout', {}, null, [0, 0], {}, 'none'); }

  // ---- igloo and snowman -----------------------------------------------------
  { const g = at('igloo');
    mesh(new THREE.SphereGeometry(2.9, 9, 5, 0, Math.PI * 2, 0, Math.PI / 2), flat(P.snow), 0, 0, 0, g);
    mesh(new THREE.SphereGeometry(2.95, 9, 5, 0, Math.PI * 2, Math.PI / 3, Math.PI / 6), flat(P.snowShade), 0, 0, 0, g);
    box(1.9, 1.5, 1.8, P.snowShade, 0, 0.75, 2.9, g);
    box(1.1, 1.05, 0.2, glow(0xffb45a, 0x3c4a7a), 0, 0.55, 3.75, g);
    const s = new THREE.Group(); s.position.set(-2.6, 0, 5.2); g.add(s);
    mesh(new THREE.SphereGeometry(0.7, 7, 5), flat(P.snow), 0, 0.6, 0, s); mesh(new THREE.SphereGeometry(0.5, 7, 5), flat(P.snow), 0, 1.5, 0, s);
    const nose = mesh(new THREE.ConeGeometry(0.09, 0.4, 5), flat(0xff8a1f), 0.2, 1.5, 0.4, s); nose.rotation.x = Math.PI / 2; nose.rotation.z = -0.4;
    box(0.5, 0.1, 0.5, 0x1d2545, 0, 1.95, 0, s); box(0.34, 0.4, 0.34, 0x1d2545, 0, 2.2, 0, s);
    building(g, 'Igloo', { glow_igloo: glow(0xffb45a, 0xffd08a) }, null, [0, 0], {}, 'none'); }

  // ---- ice pond ----------------------------------------------------------------
  const pond = site('pond');
  { const R0 = PLACES.pond.r;
    mesh(new THREE.CylinderGeometry(R0, R0, 0.24, 9), flat(P.snowShade), pond.x, 0.0, pond.z);
    mesh(new THREE.CylinderGeometry(R0 - 0.8, R0 - 0.8, 0.26, 24), waterMaterial({ scale: 2.2 }), pond.x, 0.0, pond.z);   // cartoon water
    for (let i = 0; i < 12; i++) { const a = rand() * 6.28, r = 1.5 + rand() * (R0 - 3.2); const f = mesh(new THREE.CylinderGeometry(0.5 + rand() * 0.6, 0.55, 0.1, 5), flat(P.ice), pond.x + Math.cos(a) * r, 0.16, pond.z + Math.sin(a) * r); f.rotation.y = rand() * 6; }
    for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283 + 0.3; if (Math.cos(a) < -0.6) continue; rock(pond.x + Math.cos(a) * (R0 + 0.4), pond.z + Math.sin(a) * (R0 + 0.4), 0.35 + rand() * 0.35); } }

  // ---- river: pond -> waterfall on the west rim ------------------------------------
  { const curve = water.river.c, pts = curve.points, widen = water.river.widen;
    const ribbon = (width0, color, y, material) => {
      const N = 60, pos = [], idx = [];
      for (let i = 0; i <= N; i++) { const p = curve.getPoint(i / N), t = curve.getTangent(i / N), nx = -t.z, nz = t.x, width = width0 * widen(i / N);
        pos.push(p.x + nx * width / 2, y, p.z + nz * width / 2, p.x - nx * width / 2, y, p.z - nz * width / 2);
        if (i < N) idx.push(i * 2, i * 2 + 2, i * 2 + 1, i * 2 + 1, i * 2 + 2, i * 2 + 3); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, material || new THREE.MeshLambertMaterial({ color: pastel(color), side: THREE.DoubleSide })); town.add(m); return m;
    };
    ribbon(water.river.w0 + 1.8, P.sandDark, 0.06); ribbon(water.river.w0, P.river, 0.09, waterMaterial({ scale: 1.6, speed: 0.8, flow: [0.25, 0.18] }));
    const end = pts[pts.length - 1], a = Math.atan2(end.z, end.x);
    const fw = water.river.w0 * widen(1) + 0.4;
    // the waterfall: pours off the rim, curves out from the cliff as it drops, spreads and thins,
    // and breaks up into mist far below the island
    { const H = 78, NU = 6, NV = 28, pos = [], uv = [], idx = [], ox = Math.cos(a), oz = Math.sin(a), sx = -oz, sz = ox;
      for (let j = 0; j <= NV; j++) { const v = j / NV, drop = v * H, out = R + 0.2 + 4.2 * Math.sqrt(v) + 2.5 * v, w = fw * (1 + 0.9 * v);
        for (let i = 0; i <= NU; i++) { const u = i / NU - 0.5, wob = Math.sin(v * 9 + u * 4) * 0.35 * v;
          pos.push(ox * (out + wob) + sx * u * w, 0.05 - drop, oz * (out + wob) + sz * u * w); uv.push(i / NU, 1 - v); } }
      for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const k = j * (NU + 1) + i; idx.push(k, k + NU + 1, k + 1, k + 1, k + NU + 1, k + NU + 2); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      const fall = new THREE.Mesh(g, waterMaterial({ fall: true, edge: 0.09, fade: 0.35 })); fall.renderOrder = 2; town.add(fall);
      // spray at the lip and a cloud of mist where it gives out
      const mist = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xdff4ff, emissiveIntensity: 0.75, transparent: true, opacity: 0.45, depthWrite: false, flatShading: true });
      town.userData.fallMist = [];
      for (let i = 0; i < 16; i++) { const v = 0.55 + Math.random() * 0.45, out = R + 0.2 + 4.2 * Math.sqrt(v) + 2.5 * v, u = (Math.random() - 0.5) * fw * 1.6;
        const m = new THREE.Mesh(new THREE.IcosahedronGeometry(2.2 + Math.random() * 3.2, 1), mist); m.position.set(ox * out + sx * u, 0.05 - v * H, oz * out + sz * u); m.userData.base = m.position.clone(); m.userData.ph = Math.random() * 6.28; town.add(m); town.userData.fallMist.push(m); }
      for (let i = 0; i < 5; i++) { const u = (i / 4 - 0.5) * fw, m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 0), mist); m.position.set(ox * (R + 0.6) + sx * u, -0.4, oz * (R + 0.6) + sz * u); town.add(m); } }
    const lip = box(fw, 0.2, 1.0, P.river, Math.cos(a) * (R - 0.3), 0.0, Math.sin(a) * (R - 0.3)); lip.rotation.y = -a + Math.PI / 2; lip.material = waterMaterial({ scale: 1.6, speed: 0.8, flow: [0.25, 0.18] });
    for (let i = 0; i < 7; i++) { const u = 0.08 + i * 0.13, p = curve.getPoint(u), s = i % 2 ? 1 : -1; rock(p.x + s * 0.2, p.z + s * (water.river.w0 * widen(u) / 2 + 1.2), 0.45 + rand() * 0.4); }
    // the bridge Suvi sings by, plus one wherever a path crosses the water
    { const p = curve.getPoint(0.62), t = curve.getTangent(0.62); if (!bridges.some(b => Math.hypot(b.x - p.x, b.z - p.z) < 6)) bridges.push({ x: p.x, z: p.z, a: Math.atan2(t.x, -t.z), len: water.river.w0 * widen(0.62) + 2.6 }); }
    for (const b of bridges) bridge(b.x, b.z, b.a, b.len);
    for (const w of boardwalks) boardwalk(w);
    // jetty and rod where she fishes
    { const p = PLACES.river; box(1.4, 0.16, 3.6, P.wood, p.x, 0.2, p.z + 2.1); for (const s of [-1, 1]) box(0.16, 0.6, 0.16, P.woodDark, p.x + s * 0.6, 0.1, p.z + 3.7);
      const rod = box(0.07, 2.4, 0.07, P.woodDark, p.x + 1.0, 1.2, p.z + 1.8); rod.rotation.x = 0.7; box(0.5, 0.4, 0.5, 0x2f7f9a, p.x - 1.1, 0.2, p.z + 0.3); } }

  // ---- the stream: in from the lagoon through the rim, down into the pond ---------------
  { const L = water.stream, curve = L.c;
    const strip = (w0, y, material, color) => { const N = 40, pos = [], idx = [];
      for (let i = 0; i <= N; i++) { const u = i / N, q = curve.getPoint(u), t = curve.getTangent(u), w = w0 * L.widen(u); pos.push(q.x - t.z * w / 2, y, q.z + t.x * w / 2, q.x + t.z * w / 2, y, q.z - t.x * w / 2); if (i < N) idx.push(i * 2, i * 2 + 2, i * 2 + 1, i * 2 + 1, i * 2 + 2, i * 2 + 3); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
      town.add(new THREE.Mesh(geo, material || new THREE.MeshLambertMaterial({ color: pastel(color), side: THREE.DoubleSide }))); };
    strip(L.w0 + 1.6, 0.061, null, P.sandDark); strip(L.w0, 0.092, waterMaterial({ scale: 1.4, speed: 0.9, flow: [-0.05, -0.3] }));
    for (let i = 0; i < 10; i++) { const u = 0.12 + i * 0.085, q = curve.getPoint(u), t = curve.getTangent(u), sd = i % 2 ? 1 : -1, off = L.w0 * L.widen(u) / 2 + 1.0; rock(q.x - t.z * off * sd, q.z + t.x * off * sd, 0.35 + rand() * 0.35); }
    // where it comes in under the rim: two stone posts either side
    const m = curve.getPoint(0.04), t0 = curve.getTangent(0.04);
    for (const sd of [-1, 1]) { const x = m.x - t0.z * sd * 1.9, z = m.z + t0.x * sd * 1.9; mesh(new THREE.CylinderGeometry(0.5, 0.6, 1.5, 6), flat(0xbab4a8), x, 0.75, z); mesh(new THREE.SphereGeometry(0.42, 6, 4), flat(0xc9c3b6), x, 1.6, z); }
    // a footbridge where the promenade crosses it
    { let best = 0, bd = 1e9; for (let i = 0; i <= 60; i++) { const q = curve.getPoint(i / 60), d = Math.abs(Math.hypot(q.x, q.z) - (R - 2.4)); if (d < bd) { bd = d; best = i / 60; } }
      const q = curve.getPoint(best), tt = curve.getTangent(best); bridge(q.x, q.z, Math.atan2(tt.x, -tt.z), L.w0 + 2.2, 1.7); } }

  const beachBoat = new THREE.Group();
  // ---- beach: sand sector on the rim, sea beyond it ---------------------------------
  { const len = BEACH.to - BEACH.from;
    ground(new THREE.RingGeometry(BEACH.inner, R + 0.05, 24, 1, -BEACH.to, len), P.sand, 0, 0, 0.04);
    ground(new THREE.RingGeometry(BEACH.inner - 1.2, BEACH.inner, 24, 1, -BEACH.to - 0.03, len + 0.06), P.sandDark, 0, 0, 0.035);
    mesh(new THREE.CylinderGeometry(R + 0.3, R - 1, 0.7, 24, 1, false, Math.PI / 2 - BEACH.to, len), flat(P.sandDark), 0, -0.36, 0);
    const sea = new THREE.Group();   // (the lagoon below is the sea here now)
    ground(new THREE.RingGeometry(R + 0.05, R + 0.8, 24, 1, -BEACH.to, len), 0xffffff, 0, 0, -0.08);   // foam line
    town.userData.sea = sea;
    // one sea running out from the beach to all three islets: a curved lagoon with rounded ends, a slab so it has a side
    { const a0 = ISLETS[0].a - 0.32, a1 = ISLETS[ISLETS.length - 1].a + 0.32, rin = R - 3, rout = Math.max(...ISLETS.map(i => i.r)) + 11, mid = (rin + rout) / 2, w = (rout - rin) / 2;
      const sh = new THREE.Shape(), edge = [], pt = (x, z, first) => { edge.push([x, z]); first ? sh.moveTo(x, -z) : sh.lineTo(x, -z); };
      for (let i = 0; i <= 40; i++) { const a = a0 + (a1 - a0) * i / 40; pt(Math.cos(a) * rout, Math.sin(a) * rout, i === 0); }
      const cap = (a, dir) => { const ux = Math.cos(a), uz = Math.sin(a), vx = -uz, vz = ux, cx = ux * mid, cz = uz * mid;
        for (let i = 1; i < 16; i++) { const t = Math.PI * i / 16, c = Math.cos(t) * dir, s = Math.sin(t) * dir; pt(cx + w * (ux * c + vx * s), cz + w * (uz * c + vz * s)); } };
      cap(a1, 1);
      for (let i = 0; i <= 40; i++) { const a = a1 - (a1 - a0) * i / 40; pt(Math.cos(a) * rin, Math.sin(a) * rin); }
      cap(a0, -1);
      // the water is 4 deep: a surface you can see from above and below, and sides (no bottom, so the seabed shows)
      const DEEP = 4.0, SURF = -0.15, BED = SURF - DEEP;
      const geo = new THREE.ExtrudeGeometry(sh, { depth: DEEP, bevelEnabled: false, curveSegments: 4 }); geo.rotateX(-Math.PI / 2);
      const waterM = waterMaterial({ scale: 3.6 });
      const lagoon = new THREE.Mesh(geo, [new THREE.MeshBasicMaterial({ visible: false }), waterM]); lagoon.position.y = BED; town.add(lagoon);
      const top = new THREE.Mesh(new THREE.ShapeGeometry(sh, 4).rotateX(-Math.PI / 2), waterM); top.position.y = SURF; town.add(top);
      // is (x, z) over the lagoon? (for the camera, and for scattering the seabed)
      const inLagoon = (x, z) => { let c = false; for (let i = 0, j = edge.length - 1; i < edge.length; j = i++) { const [xi, zi] = edge[i], [xj, zj] = edge[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
      town.userData.lagoon = { inLagoon, surf: SURF, bed: BED };
      // the seabed: sand, seaweed swaying, rocks, shells, starfish, coral, and fish swimming about
      { const sea = new THREE.Group(); town.add(sea); const weeds = [], fish = [];
        const pick = (minR = R + 0.5) => { for (let k = 0; k < 60; k++) { const a = a0 + rand() * (a1 - a0), r = rin + rand() * (rout - rin); const x = Math.cos(a) * r, z = Math.sin(a) * r; if (Math.hypot(x, z) > minR && inLagoon(x, z) && !ISLETS.some((il, ii) => { const ip = isletPos(ii); return Math.hypot(ip.x - x, ip.z - z) < 7; })) return [x, z]; } return null; };
        const kelp = flat(0x3f9a5a), kelp2 = flat(0x6cbf6a);
        for (let i = 0; i < 90; i++) { const p = pick(); if (!p) continue; const g = new THREE.Group(); g.position.set(p[0], BED, p[1]); sea.add(g); const n = 2 + Math.floor(rand() * 3);
          for (let k = 0; k < n; k++) { const h = 1.2 + rand() * 2.2, m = mesh(new THREE.ConeGeometry(0.16, h, 4), k % 2 ? kelp : kelp2, (rand() - 0.5) * 0.7, h / 2, (rand() - 0.5) * 0.7, g); m.userData.h = h; }
          g.userData.ph = rand() * 6.28; weeds.push(g); }
        for (let i = 0; i < 45; i++) { const p = pick(); if (!p) continue; const s2 = 0.3 + rand() * 0.9; const m = mesh(new THREE.DodecahedronGeometry(s2, 0), flat(rand() < 0.5 ? P.rock : P.rockDark), p[0], BED + s2 * 0.4, p[1], sea); m.rotation.set(rand() * 3, rand() * 3, 0); m.scale.y = 0.6; }
        for (let i = 0; i < 40; i++) { const p = pick(); if (!p) continue; const c = [0xff9aa8, 0xffb45a, 0xfffaf0, 0xe8452c, 0xb27ad6][i % 5];
          if (i % 3 === 0) { const st = new THREE.Shape(); for (let k = 0; k < 10; k++) { const aa = k / 10 * 6.283, rr = k % 2 ? 0.12 : 0.32; st[k ? 'lineTo' : 'moveTo'](Math.cos(aa) * rr, Math.sin(aa) * rr); } const m = new THREE.Mesh(new THREE.ShapeGeometry(st), flat(c)); m.rotation.x = -Math.PI / 2; m.position.set(p[0], BED + 0.03, p[1]); sea.add(m); }
          else if (i % 3 === 1) { const m = mesh(new THREE.ConeGeometry(0.2, 0.32, 6), flat(c), p[0], BED + 0.12, p[1], sea); m.rotation.set(1.3, rand() * 6, 0); }
          else for (let k = 0; k < 4; k++) mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.5 + rand() * 0.6, 5), flat(c), p[0] + (rand() - 0.5) * 0.6, BED + 0.35, p[1] + (rand() - 0.5) * 0.6, sea).rotation.set((rand() - 0.5) * 0.8, 0, (rand() - 0.5) * 0.8); }
        const fishCol = [0xffb45a, 0x58b7e8, 0xffd93b, 0xff7fa3, 0x2fc6b3, 0xfffaf0];
        for (let i = 0; i < 26; i++) { const p = pick(R + 2); if (!p) continue; const g = new THREE.Group(), c = fishCol[i % fishCol.length], sz = 0.5 + rand() * 0.6;
          const body = mesh(new THREE.SphereGeometry(0.3, 7, 5), flat(c), 0, 0, 0, g); body.scale.set(0.55, 0.7, 1.3);
          const tail = mesh(new THREE.ConeGeometry(0.22, 0.32, 4), flat(c), 0, 0, -0.45, g); tail.rotation.x = -Math.PI / 2; tail.scale.x = 0.3; g.userData.tail = tail;
          for (const sd of [-1, 1]) mesh(new THREE.SphereGeometry(0.04, 4, 3), flat(0x141833), sd * 0.13, 0.06, 0.25, g);
          g.scale.setScalar(sz); sea.add(g); fish.push({ g, cx: p[0], cz: p[1], r: 1.5 + rand() * 3.5, y: BED + 0.7 + rand() * (DEEP - 1.4), w: (0.3 + rand() * 0.5) * (rand() < 0.5 ? 1 : -1), a: rand() * 6.28 }); }
        town.userData.tickSea = t => {
          for (const g of weeds) g.children.forEach((m, k) => { m.rotation.z = Math.sin(t * 0.9 + g.userData.ph + k) * 0.18; m.rotation.x = Math.cos(t * 0.7 + g.userData.ph + k * 2) * 0.12; });
          for (const f of fish) { const a = f.a + t * f.w; let x = f.cx + Math.cos(a) * f.r, z = f.cz + Math.sin(a) * f.r; if (!inLagoon(x, z)) { f.cx += (0 - f.cx) * 0.002; f.cz += (0 - f.cz) * 0.002; }
            f.g.position.set(x, f.y + Math.sin(t * 0.8 + f.a) * 0.3, z); f.g.rotation.y = -a + (f.w > 0 ? Math.PI : 0); f.g.userData.tail.rotation.y = Math.sin(t * 9 + f.a) * 0.5; } }; }
      // the ground it sits in: a lip of sand, then earth and rock stepping in underneath, like the island itself
      const slab = (depth, mat, y, k) => { const g2 = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: 4 }); g2.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g2, mat); m.position.y = y; m.scale.set(k, 1, k); town.add(m); return m; };
      slab(0.5, flat(P.sand), BED - 0.5, 1.006);   // the sandy seabed
      slab(3.2, flat(P.rockDark), BED - 3.7, 0.995);
      slab(4.5, flat(P.rock), BED - 8.2, 0.94);
      slab(5, flat(P.rockDark), BED - 13.2, 0.86);
      // the same rim as the island's along its outer edge
      const runs = []; let cur = null;
      for (const [x, z] of edge) { if (Math.hypot(x, z) < R + 4) { if (cur && cur.length > 1) runs.push(cur); cur = null; continue; } const k = 0.988; (cur ||= []).push([x * k, z * k]); }
      if (cur && cur.length > 1) runs.push(cur);
      if (runs.length > 1) { const last = runs.pop(); runs[0] = [...last, ...runs[0]]; }
      buildRim(town, runs, { y: -0.3, glow: () => glow(0xffc870, 0xffe2a0), rand, outward: (x, z) => { const ang = Math.min(a1, Math.max(a0, Math.atan2(z, x))), cx = Math.cos(ang) * mid, cz = Math.sin(ang) * mid, l = Math.hypot(x - cx, z - cz) || 1; return [(x - cx) / l, (z - cz) / l]; } }); }
    const b = PLACES.beach, g = new THREE.Group(); g.position.set(b.x, 0, b.z); g.rotation.y = Math.atan2(-b.x, -b.z); town.add(g);
    box(0.14, 3.0, 0.14, 0xfffaf0, -4.6, 1.5, -2.4, g); const um = mesh(new THREE.ConeGeometry(2.0, 0.9, 8), flat(0xe8452c), -4.6, 3.2, -2.4, g); um.rotation.z = 0.12;
    box(1.3, 0.06, 2.4, 0x2fc6b3, -4.4, 0.08, -1.4, g); box(1.3, 0.07, 0.4, 0xfffaf0, -4.4, 0.09, -1.4, g);                 // towel
    for (const [x, z, s] of [[2.6, -1.8, 1], [3.3, -1.2, 0.7], [2.2, -1.0, 0.6]]) { mesh(new THREE.CylinderGeometry(0.45 * s, 0.55 * s, 0.7 * s, 6), flat(P.sandDark), x, 0.35 * s, z, g); mesh(new THREE.ConeGeometry(0.4 * s, 0.5 * s, 6), flat(P.sand), x, 0.95 * s, z, g); }  // sandcastle
    for (let i = 0; i < 9; i++) { const sh = mesh(new THREE.ConeGeometry(0.16, 0.3, 5), flat([0xff9aa8, 0xfffaf0, 0xffb45a][i % 3]), -5 + rand() * 10, 0.1, -5.5 + rand() * 3.5, g); sh.rotation.set(1.4, rand() * 6, 0); }
    beachBoat.position.set(4.6, 0, -3.4); beachBoat.rotation.y = 0.5; g.add(beachBoat); box(1.5, 0.5, 2.6, 0x2f7f9a, 0, 0.25, 0, beachBoat); box(1.7, 0.12, 2.8, 0xfffaf0, 0, 0.52, 0, beachBoat); }  // her rowing boat

  // ---- garden --------------------------------------------------------------------------
  { const p = PLACES.garden, g = new THREE.Group(); g.position.set(p.x + 2.4, 0, p.z - 1.0); g.rotation.y = 0.4; town.add(g);
    box(3.6, 0.2, 3.0, 0x8a5a3a, 0, 0.08, 0, g);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) flower(-1.3 + c * 0.87, -0.95 + r * 0.95, 0.42, P.petals[(r + c) % 4], g);
    for (let i = 0; i < 9; i++) { box(0.28, 0.7, 0.1, 0xfffaf0, -1.8 + i * 0.45, 0.35, 1.6, g); box(0.28, 0.7, 0.1, 0xfffaf0, -1.8 + i * 0.45, 0.35, -1.6, g); }
    mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.5, 6), flat(0x2fc6b3), -2.3, 0.25, 0.9, g); }

  // ---- mailbox and lamps -----------------------------------------------------------------
  { const mb = [box(0.2, 1.1, 0.2, P.woodDark, 1.5, 0.55, -0.6), box(0.7, 0.5, 0.95, 0xe8452c, 1.5, 1.3, -0.6)];
    whenKit(() => { const m = kitModel('Mailbox'); if (!m) return; m.position.set(1.5, 0, -0.6); town.add(m); for (const o of mb) town.remove(o); });
    town.userData.flag = box(0.08, 0.5, 0.3, 0xffd93b, 1.9, 1.5, -0.6); }
  // the square: four double-globe posts round the edge
  // benches and round flower planters round the edge of the square, between the paths (SQUARE_SEATS)
  for (const { x, z, a, kind } of SQUARE_SEATS) {
    if (kind === 'bench') { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = -a - Math.PI / 2; town.add(g); whenKit(() => { const k = kitModel('D_bench'); if (k) g.add(k); }); continue; }
    mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.5, 10), flat(0xc9c3b6), x, 0.25, z); mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.1, 10), flat(0x6b4a3a), x, 0.5, z);
    for (let k = 0; k < 6; k++) { const b = k / 6 * 6.28 + a; mesh(new THREE.DodecahedronGeometry(0.18, 0), flat(P.petals[k % 4]), x + Math.cos(b) * 0.42, 0.66, z + Math.sin(b) * 0.42); }
    mesh(new THREE.DodecahedronGeometry(0.3, 0), flat(P.grassDark), x, 0.7, z); }
  for (const deg of [20, 110, 200, 290]) { const a = deg * Math.PI / 180; lamp(Math.cos(a) * (SQUARE - 0.9), Math.sin(a) * (SQUARE - 0.9), 'globes', -a); }
  // along the paths: tall lamps on the ring, hanging lanterns and bollards on the spurs
  { const placed = [];
    PATHS.forEach((line, li) => { let since = 3 + (li % 4) * 2;
      for (let i = 0; i < line.length - 1; i++) { const a = line[i], b = line[i + 1], dx = b.x - a.x, dz = b.z - a.z, len = Math.hypot(dx, dz); if (len < 0.1) continue;
        for (let t = 0; t < len; t += 0.5) { since += 0.5; if (since < 9.5) continue;
          const side = (placed.length % 2 ? 1 : -1) * 1.35, x = a.x + dx / len * t - dz / len * side, z = a.z + dz / len * t + dx / len * side;
          if (Math.hypot(x, z) < SQUARE + 1.5 || blockedAt(x, z) || onPath(x, z, 0.75) || placed.some(p => Math.hypot(p.x - x, p.z - z) < 7)) continue;
          const onRing = Math.abs(Math.hypot(x, z) - RING) < 2.5, kind = onRing ? (placed.length % 3 ? 'classic' : 'hanging') : (placed.length % 2 ? 'bollard' : 'hanging');
          lamp(x, z, kind, Math.atan2(-dz, dx) + (side > 0 ? Math.PI : 0)); placed.push({ x, z }); since = 0; } } }); }
  // torches on the beach
  for (let i = 0; i < 5; i++) { const a = BEACH.from + 0.08 + i / 4 * (BEACH.to - BEACH.from - 0.16), r = BEACH.inner + 2.5 + (i % 2) * 6; lamp(Math.cos(a) * r, Math.sin(a) * r, 'torch'); }

  // ---- decoration round the edge ------------------------------------------------------------
  const extraObs = [site('cafe'), CLOCK, BIG_ROCK, BALLOON, ...NEIGHBOURS.flatMap(n => n.hobbies.filter(h => h.at).map(h => h.at)), ...ORCHARD_TREES.map(([x, z]) => ({ x, z })), ...WOODLOT.map(([x, z]) => ({ x, z })), ...NEIGHBOURS.map(n => n.home)];
  const clear = (x, z, pad) => !onPath(x, z, 1.8) && !inBeach(x, z) && !nearRiver(x, z, 3.2) && extraObs.every(o => Math.hypot(o.x - x, o.z - z) > 3.6) && Object.keys(PLACES).every(k => { const s = site(k); return Math.hypot(s.x - x, s.z - z) > (s.r || 2.5) + pad && Math.hypot(PLACES[k].x - x, PLACES[k].z - z) > 3; });
  // every decoration has a footprint (roughly its canopy or spread), and nothing goes down inside another's
  let placed = 0;
  const trees = [], decor = [];
  const roomFor = (x, z, r) => decor.every(d => Math.hypot(d.x - x, d.z - z) > (d.r + r) * 0.9);
  const TREE_R = [0.9, 1.7, 2.6, 3.4];
  for (let i = 0; i < 6000 && placed < 175; i++) {
    const a = rand() * 6.28, r = R * 0.5 + rand() * (R * 0.39), x = Math.cos(a) * r, z = Math.sin(a) * r;
    const kind = placed % 5, roll = rand(), stage = roll < 0.2 ? 0 : roll < 0.5 ? 1 : roll < 0.85 ? 2 : 3;
    const size = kind === 0 ? 0.95 + rand() * 0.75 : kind === 1 ? 0.7 + rand() * 1.1 : kind === 2 ? 0.9 + rand() * 0.7 : kind === 3 ? 0.85 + rand() * 0.9 : 0.8 + rand() * 0.3;
    const foot = kind === 0 ? 0.5 + size * 0.45 : kind === 1 ? size * 1.1 : kind === 2 ? size * 1.3 : kind === 3 ? size * 1.25 : TREE_R[stage] * size;
    if (!clear(x, z, kind === 4 ? 1.2 + foot : 1.2 + foot * 0.6) || !roomFor(x, z, foot)) continue;
    if (kind === 0) flower(x, z, size, P.petals[Math.floor(rand() * 4)]);
    else if (kind === 1) rock(x, z, size);
    else if (kind === 2) pine(x, z, size);
    else if (kind === 3) { const b = makeBush(); b.position.set(x, 0, z); b.rotation.y = rand() * 6; b.scale.setScalar(size); town.add(b); }
    else { const t = makeTree(stage, rand() < 0.35 ? 'cherry' : 'oak'), wrap = new THREE.Group(); wrap.position.set(x, 0, z); wrap.rotation.y = rand() * 6.28; t.scale.setScalar(size); wrap.add(t); town.add(wrap); trees.push({ x, z }); }
    decor.push({ x, z, r: foot }); placed++;
  }
  // sunflowers: a few patches, each turned its own way; small in spring, tall in summer,
  // turning bronze in autumn, gone in winter
  const sunflowers = [];
  { const patches = [];
    for (let i = 0; i < 3000 && patches.length < 5; i++) {
      const a = rand() * 6.28, r = R * 0.3 + rand() * R * 0.52, x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (!clear(x, z, 3.0) || !roomFor(x, z, 2.2) || patches.some(p => Math.hypot(p.x - x, p.z - z) < 16)) continue;
      patches.push({ x, z }); decor.push({ x, z, r: 2.2 }); const n = 6 + Math.floor(rand() * 4), face = rand() * 6.28;   // each patch leans its own way, each flower a little differently
      for (let k = 0; k < n; k++) { const b = rand() * 6.28, d = Math.sqrt(rand()) * 1.7; sunflowers.push({ x: x + Math.cos(b) * d, z: z + Math.sin(b) * d, s: 0.5 + rand() * 0.28, ry: face + (rand() - 0.5) * 2.2 }); }
    } }
  const sunInst = [], sunMats = {}; town.userData.sunflowers = sunflowers;
  const layoutSunflowers = season => {
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), sc = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), k = { spring: 0.55, summer: 1, autumn: 0.95 }[season] || 0;
    for (const im of sunInst) { im.visible = k > 0; sunflowers.forEach((f, i) => { q.setFromAxisAngle(up, f.ry); m4.compose(p.set(f.x, 0, f.z), q, sc.setScalar(f.s * k || 0.001)); im.setMatrixAt(i, m4); }); im.instanceMatrix.needsUpdate = true; }
    const look = { petal: season === 'autumn' ? 0xd98a2a : 0xffc928, petal2: season === 'autumn' ? 0xb8641e : 0xffaa1c, leaf: season === 'autumn' ? 0x9aa84a : 0x7cc15a };
    if (sunMats.petal) { sunMats.petal.color.set(look.petal); sunMats.petal2.color.set(look.petal2); sunMats.leaf.color.set(look.leaf); }
  };
  whenKit(() => {
    sunMats.petal = flat(0xffc928); sunMats.petal2 = flat(0xffaa1c); sunMats.leaf = flat(0x7cc15a);
    const k = kitModel('Sunflower', { sf_petal: sunMats.petal, sf_petal2: sunMats.petal2, sf_leaf: sunMats.leaf }); if (!k) return;
    for (const m of k.children) { const im = new THREE.InstancedMesh(m.geometry, m.material, sunflowers.length); town.add(im); sunInst.push(im); }
    layoutSunflowers(town.userData.season || 'summer');
  });

  // the rim: stone coping with a wooden fence on top, lanterns, a promenade inside it and vines trailing over the edge;
  // open along the beach and at the waterfall
  { const end = RIVER[RIVER.length - 1], fallA = Math.atan2(end[1], end[0]);
    const gap = a => (a > BEACH.from - 0.05 && a < BEACH.to + 0.05) || Math.abs(Math.atan2(Math.sin(a - fallA), Math.cos(a - fallA))) < 0.19 || Math.abs(Math.atan2(Math.sin(a - STREAM_A), Math.cos(a - STREAM_A))) < 0.055;
    const runs = [], rr = R - 0.75, N = 900; let cur = null;
    for (let i = 0; i <= N; i++) { const a = -Math.PI + i / N * Math.PI * 2; if (gap(a)) { if (cur && cur.length > 1) runs.push(cur); cur = null; continue; } (cur ||= []).push([Math.cos(a) * rr, Math.sin(a) * rr]); }
    if (cur && cur.length > 1) runs.push(cur);
    if (runs.length > 1 && !gap(-Math.PI)) { const last = runs.pop(); runs[0] = [...last, ...runs[0].slice(1)]; }   // join up across ±180°
    buildRim(town, runs, { glow: () => glow(0xffc870, 0xffe2a0), rand, outward: (x, z) => { const l = Math.hypot(x, z); return [x / l, z / l]; } });
    buildPromenade(town, R, { skip: gap, rand }); }

  // where the fairy lights go
  { const home = front('home'); if (home) fairy(home, [[-2.7, 3.15, 2.3], [-0.9, 3.15, 2.3], [0.9, 3.15, 2.3], [2.7, 3.15, 2.3]]);
    const tailor = front('tailor'); if (tailor) fairy(tailor, [[-2.8, 3.78, 2.3], [0, 3.78, 2.3], [2.8, 3.78, 2.3]], 0.25);   // along the cornice
    const studio = front('studio'); if (studio) fairy(studio, [[-2.7, 3.58, 2.3], [0, 3.58, 2.3], [2.7, 3.58, 2.3]], 0.25);
    const cafe = front('cafe'); if (cafe) fairy(cafe, [[-1.3, 2.62, 0.95], [0, 2.62, 0.95], [1.3, 2.62, 0.95]], 0.5);
    const camp = front('camp'); if (camp) fairy(camp, [[-1.75, 0.15, 1.5], [0, 2.35, 1.5], [1.75, 0.15, 1.5]], 0.1);
    // swags round the square, strung between slim poles
    const poles = 10, rr = SQUARE + 0.5, pts = [];
    for (let i = 0; i < poles; i++) { const a = i / poles * 6.283 + 0.31, x = Math.cos(a) * rr, z = Math.sin(a) * rr; box(0.09, 3.3, 0.09, 0x1d2545, x, 1.65, z); pts.push([x, 3.25, z]); }
    pts.push(pts[0]); fairy(town, pts, 0.55, 0.36); }
  const fairyMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.075, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }), bulbs.length);
  { const m = new THREE.Object3D(); bulbs.forEach((b, i) => { m.position.copy(b.p); m.updateMatrix(); fairyMesh.setMatrixAt(i, m.matrix); fairyMesh.setColorAt(i, b.c); }); town.add(fairyMesh); }

  document.fonts?.ready.then(() => signs.forEach(d => d()));

  // nightness 0..1 switches windows, signs and lamps on; `film` makes the cinema lights chase
  function setNight(n, film, t) {
    for (const m of glowMats) { if (m.userData.sign) m.color.setScalar(0.92 + n * (m.userData.light ? 0.06 : 0.3)); else m.emissiveIntensity = n * (m.userData.soft ? 0.5 : 1.6); }
    for (const l of lamps) l.intensity = n * 9;
    marquee.forEach((m, i) => { m.emissiveIntensity = film ? (Math.floor(t * 4 + i) % 3 === 0 ? 2.2 : 0.5) : n * 1.2; });
    blades.material.uniforms.uTime.value = t; blades.material.uniforms.uNight.value = n;
    for (const h of heroes) { if (h.motion === 'spin') h.o.rotation.z = -t * (film ? 1.6 : 0.35); else { h.o.position.y = h.y + (1 + Math.sin(t * 1.3)) * 0.035; h.o.rotation.z = Math.sin(t * 0.7) * 0.04; } }   // rooftop things lift gently off their perch and settle back; the film reel turns
  }
  // grass, darker grass, leaves, then the grass blades' base and tip (already pastel: used as they are)
  // ---- the big tree at the island's edge: blossom that changes with the seasons, petals drifting down -----
  const bigTree = { leaves: null, mats: [0xf2a0b4, 0xf7c2cf, 0xe58aa2].map(c => new THREE.MeshLambertMaterial({ color: c, flatShading: true })), petals: null };
  { const g = at('bigtree'); g.scale.setScalar(1.5);   // a landmark: towers over the pines
    mesh(new THREE.CylinderGeometry(0.5, 0.9, 6.5, 7), flat(0x9c6b5a), 0, 3.2, -1, g); mesh(new THREE.DodecahedronGeometry(4.2, 0), bigTree.mats[0], 0, 8.5, -1.5, g);
    building(g, 'BigTree', { bigtree_leaf: bigTree.mats[0], bigtree_leaf2: bigTree.mats[1], bigtree_leaf3: bigTree.mats[2] }, null, [0, 0], {}, 'none', b => { bigTree.leaves = b.parts.LiveLeaves || null; if (bigTree.leaves && bigTree.flies) { g.updateWorldMatrix(true, true); const bx = new THREE.Box3().setFromObject(bigTree.leaves), c = bx.getCenter(new THREE.Vector3()), sz = bx.getSize(new THREE.Vector3()); g.worldToLocal(c); const k = 1 / g.scale.x; bigTree.flies.uniforms.uC.value.copy(c); bigTree.flies.uniforms.uR.value.set(sz.x * k * 0.5, sz.y * k * 0.5, sz.z * k * 0.5); bigTree.glow.position.copy(c); } if (bigTree.leaves) bigTree.leaves.visible = bigTree.petals.visible; });
    // petals: little flat pieces that fall from the canopy, drift on the wind and start again at the top
    const N = 160, geo = new THREE.BufferGeometry(), pos = new Float32Array(N * 3), seeds = [];
    for (let i = 0; i < N; i++) { const p = [(rand() - 0.5) * 9, 2 + rand() * 8, -1 - rand() * 4 + (rand() - 0.5) * 3]; pos.set(p, i * 3); seeds.push({ x: p[0], z: p[2], sp: 0.45 + rand() * 0.6, ph: rand() * 6.28, top: 7 + rand() * 3.5 }); }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pm = new THREE.PointsMaterial({ color: 0xf7b8c8, size: 0.16, transparent: true, opacity: 0.95, depthWrite: false });
    bigTree.petals = new THREE.Points(geo, pm); bigTree.petals.frustumCulled = false; bigTree.petals.userData.keep = true; g.add(bigTree.petals); bigTree.seeds = seeds;   // keep: the model swap clears everything else
    town.userData.bigTree = g;
    // fireflies: the big tree is where they gather. At dusk they come out in the canopy and round the trunk,
    // drifting and twinkling, so the tree looks strung with fairy lights.
    const NF = 380, fgeo = new THREE.BufferGeometry(), home = new Float32Array(NF * 3), seed = new Float32Array(NF * 4);
    for (let i = 0; i < NF; i++) { const kind = rand(), a = rand() * 6.283, u = rand() * 2 - 1, sq = Math.sqrt(1 - u * u);
      let p;
      if (kind < 0.62) { const r = 0.8 + rand() * 0.35; p = [Math.cos(a) * sq * r, u * r * 0.8, Math.sin(a) * sq * r]; }               // in and just outside the canopy
      else if (kind < 0.86) { const r = 0.12 + rand() * 0.22; p = [Math.cos(a) * r, -1.15 - rand() * 1.1, Math.sin(a) * r]; }          // round the trunk, down to the grass
      else { const r = 1.2 + rand() * 0.7; p = [Math.cos(a) * r, -1.6 + rand() * 1.9, Math.sin(a) * r]; }                                 // a few out wandering
      home.set(p, i * 3); seed.set([rand() * 6.283, 0.35 + rand() * 0.7, 0.25 + rand() * 0.6, rand()], i * 4); }
    fgeo.setAttribute('position', new THREE.BufferAttribute(home, 3)); fgeo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
    bigTree.flies = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uNight: { value: 0 }, uC: { value: new THREE.Vector3(0, 8.5, -1.5) }, uR: { value: new THREE.Vector3(5, 3.2, 5) } },
      vertexShader: `uniform float uTime, uNight; uniform vec3 uC, uR; attribute vec4 aSeed; varying float vA; varying vec3 vCol;
        void main() { float t = uTime * aSeed.y, ph = aSeed.x, amp = aSeed.z;
          vec3 p = uC + position * uR + vec3(sin(t + ph) * amp, sin(t * 0.7 + ph * 2.0) * amp * 0.5, cos(t * 0.83 + ph * 1.3) * amp);
          vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;
          float tw = 0.5 + 0.5 * sin(uTime * (1.2 + aSeed.y * 2.0) + ph * 3.0); vA = uNight * (0.35 + 0.65 * tw * tw);
          vCol = aSeed.w < 0.55 ? vec3(1.0, 0.86, 0.45) : aSeed.w < 0.85 ? vec3(1.0, 0.95, 0.75) : vec3(0.78, 1.0, 0.5);   // warm gold, warm white, a few green
          gl_PointSize = (4.0 + 5.0 * tw) * 70.0 / max(1.0, -mv.z) * (uNight > 0.01 ? 1.0 : 0.0); }`,
      fragmentShader: `varying float vA; varying vec3 vCol;
        void main() { float d = length(gl_PointCoord - 0.5); float halo = smoothstep(0.5, 0.0, d); halo *= halo; float core = smoothstep(0.16, 0.0, d);
          gl_FragColor = vec4(vCol * (0.8 + 1.6 * core), (halo * 0.7 + core) * vA); }` });
    bigTree.fly = new THREE.Points(fgeo, bigTree.flies); bigTree.fly.frustumCulled = false; bigTree.fly.userData.keep = true; g.add(bigTree.fly);
    bigTree.glow = new THREE.PointLight(0xffd88a, 0, 22, 2); bigTree.glow.position.set(0, 7.5, -1.5); bigTree.glow.userData.keep = true; g.add(bigTree.glow);   // a soft warm wash on the tree at night
  }
  function tickPetals(t, dt, wind) {
    for (const m of town.userData.fallMist || []) { const b = m.userData.base, ph = m.userData.ph; m.position.set(b.x + Math.sin(t * 0.3 + ph) * 1.2, b.y + Math.sin(t * 0.5 + ph) * 0.8, b.z + Math.cos(t * 0.27 + ph) * 1.2); m.scale.setScalar(1 + Math.sin(t * 0.6 + ph) * 0.12); }   // the mist billows
    const p = bigTree.petals; if (!p || !p.visible) return;
    const a = p.geometry.attributes.position, arr = a.array;
    for (let i = 0; i < bigTree.seeds.length; i++) { const sd = bigTree.seeds[i]; let y = arr[i * 3 + 1] - sd.sp * dt;
      if (y < 0.05) { y = sd.top; arr[i * 3] = sd.x; arr[i * 3 + 2] = sd.z; }
      arr[i * 3] += (Math.sin(t * 1.3 + sd.ph) * 0.4 + wind * 1.4) * dt; arr[i * 3 + 2] += Math.cos(t * 0.9 + sd.ph) * 0.3 * dt; arr[i * 3 + 1] = y; }
    a.needsUpdate = true;
  }

  // ---- grass blades: thousands of little tufts, kept off paths, water, sand and buildings ------
  const blades = (() => {
    const tuft = new THREE.BufferGeometry(), pos = [], hgt = [];
    for (let k = 0; k < 4; k++) {   // four blades fanned round a tuft, each a thin bent triangle
      const a = k / 4 * Math.PI * 2 + 0.4, ox = Math.cos(a) * 0.07, oz = Math.sin(a) * 0.07, h = 0.24 + (k % 2) * 0.1, lean = 0.08;   // grass: kept short
      const px = -Math.sin(a) * 0.035, pz = Math.cos(a) * 0.035;
      pos.push(ox - px, 0, oz - pz, ox + px, 0, oz + pz, ox * 1.8 + Math.cos(a) * lean, h, oz * 1.8 + Math.sin(a) * lean); hgt.push(0, 0, 1);
    }
    tuft.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); tuft.setAttribute('h', new THREE.Float32BufferAttribute(hgt, 1)); tuft.computeVertexNormals();
    const mat = new THREE.ShaderMaterial({ side: THREE.DoubleSide, fog: true,
      uniforms: { ...THREE.UniformsLib.fog, uTime: { value: 0 }, uWind: { value: 0.3 }, uNight: { value: 0 }, uBase: { value: new THREE.Color(0x6fb46a) }, uTip: { value: new THREE.Color(0xbfe39c) } },
      vertexShader: `attribute float h; uniform float uTime, uWind; varying float vH; varying vec2 vW;
        #include <fog_pars_vertex>
        void main() { vH = h; vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0); vW = w.xz;
          float sway = sin(uTime * (1.6 + uWind * 3.0) + w.x * 0.35 + w.z * 0.27) * (0.05 + uWind * 0.16) * h;
          w.x += sway; w.z += sway * 0.6; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: `uniform vec3 uBase, uTip; uniform float uNight; varying float vH; varying vec2 vW;
        #include <fog_pars_fragment>
        void main() { vec3 c = mix(uBase, uTip, vH) * (0.92 + 0.08 * sin(vW.x * 1.7 + vW.y * 2.3)); c = mix(c, c * vec3(0.11, 0.14, 0.26), uNight);   // darker and bluer at night, like the ground
          gl_FragColor = vec4(c, 1.0);
          #include <colorspace_fragment>
          #include <fog_fragment>
        }` });
    const N = 7600, inst = new THREE.InstancedMesh(tuft, mat, N), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3();
    const pondS = site('pond');
    let n = 0;
    for (let tries = 0; tries < N * 6 && n < N; tries++) {
      const r = Math.sqrt(rand()) * (R - 1.6), a = rand() * Math.PI * 2, x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (Math.hypot(x, z) < SQUARE + 0.6 || inBeach(x, z) || nearRiver(x, z, 2.4) || onPath(x, z, 0.9) || blockedAt(x, z)) continue;
      if (Math.hypot(pondS.x - x, pondS.z - z) < PLACES.pond.r * 1.65 + 1.2) continue;
      if (Object.keys(PLACES).some(k => { const s2 = site(k); return Math.hypot(s2.x - x, s2.z - z) < (s2.r || 0) + 0.9; })) continue;
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rand() * 6.28); const k = 0.7 + rand() * 0.8; sc.set(k, k * (0.8 + rand() * 0.6), k);
      m4.compose(p.set(x, 0, z), q, sc); inst.setMatrixAt(n++, m4);
    }
    inst.count = n; inst.frustumCulled = false; town.add(inst); return inst;
  })();
  const SEASON = { spring: [0xa8d88a, 0x8cc77c, 0xf4bfd0, 0x7fbf74, 0xc4e8a4], summer: [0x9fd486, 0x82c276, 0x86c97a, 0x6fb46a, 0xbfe39c], autumn: [0xc9d08a, 0xb3b672, 0xeab08a, 0x9fa564, 0xe2dc9c], winter: [0xeef6fb, 0xd5e6f2, 0xdfeaf2, 0xc9d9e6, 0xf6fbff] };
  function setSeason(name, fruitReady) {
    setTreeSeason(name); town.userData.season = name; layoutSunflowers(name);
    const c = SEASON[name] || SEASON.summer; grassMat.color.set(c[0]); grassDarkMat.color.set(c[1]); leafMat.color.set(c[2]);
    blades.material.uniforms.uBase.value.set(c[3]); blades.material.uniforms.uTip.value.set(c[4]); blades.visible = name !== 'winter';
    const tree = { spring: [0xf2a0b4, 0xf7c2cf, 0xe58aa2, 0xf7b8c8], summer: [0xe98fa6, 0xf3b1c1, 0xd97a95, 0xf3b1c1], autumn: [0xeb9a72, 0xf2bf8a, 0xd9765e, 0xeb9a72] }[name];
    if (tree) bigTree.mats.forEach((m, i) => m.color.set(tree[i]));
    if (bigTree.petals) { bigTree.petals.visible = !!tree; if (tree) bigTree.petals.material.color.set(tree[3]); }
    if (bigTree.leaves) bigTree.leaves.visible = !!tree;   // bare branches in winter
    fruit.forEach(f => { f.visible = fruitReady && name !== 'winter'; });
  }
  function setHouse(look, level) { const l = HOUSE_LOOKS[look] || HOUSE_LOOKS[0]; house.wall.color.set(pastel(l.wall)); house.roof.color.set(pastel(l.roof)); house.extras[0].visible = level >= 2; house.extras[1].visible = level >= 3; }
  function setIsland(flag, painterIn, crops) { flagMat.color.set(pastel(FLAGS[flag] ?? FLAGS[0])); painter.visible = !!painterIn; cropStages.forEach((c, i) => { c.visible = crops === i + 1; }); }
  function setAway(islet) { isletBoats.forEach((b, i) => { b.visible = islet === i; }); beachBoat.visible = islet == null; }
  function setEvent(show) { festival.visible = !!show; lanternsG.visible = show === 'lanterns'; }
  setHouse(0, 1);
  return { town, woodlot, board, setEasel, setLights, setWind, setNight, setSeason, setHouse, setEvent, setIsland, setAway, setClock, setObservatory, pond, flag: town.userData.flag };
}
