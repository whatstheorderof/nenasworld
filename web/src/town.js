// Nena's island: bright, flat-shaded and chunky by day; dark with glowing
// windows and signs at night. Everything is built from primitives here, and
// positions come from shared/world.js so the mind and the picture agree.
import * as THREE from 'three';
import { PLACES } from '../../shared/world.js';

const P = {
  grass: 0xb4dc5a, grassDark: 0x79c653, cliff: 0x5aa84a, snow: 0xf6fcff, snowShade: 0xcfe6f7,
  wood: 0xf59b2f, woodDark: 0xc9531c, roof: 0xb3401a, rock: 0x86a9cc, rockDark: 0x5f82ad,
  water: 0x6f97c9, ice: 0xdff3ff, pine: 0x2f8f7a, pineDark: 0x237066, glow: 0xffd66b,
  petals: [0xffd93b, 0x6a2fc4, 0x2f7f9a, 0xff7fa3], centre: 0xb3401a,
};

// seeded random so the island looks the same on every visit
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export const ISLAND_R = 30;

// A place's building sits a little further out from the centre than where Nena stands, facing in.
export function anchor(key, d) {
  const p = PLACES[key], len = Math.hypot(p.x, p.z) || 1;
  return { x: p.x + (p.x / len) * d, z: p.z + (p.z / len) * d, ry: Math.atan2(-p.x, -p.z) };
}

export function buildTown() {
  const town = new THREE.Group();
  const glowMats = [];   // emissive materials that switch on at night
  const lamps = [];
  const rand = rng(7);
  const flat = color => new THREE.MeshLambertMaterial({ color, flatShading: true });
  const glow = (color = P.glow, base = 0xcdeeff) => { const m = new THREE.MeshLambertMaterial({ color: base, emissive: color, emissiveIntensity: 0, flatShading: true }); glowMats.push(m); return m; };
  const mesh = (geo, material, x = 0, y = 0, z = 0, parent = town) => { const m = new THREE.Mesh(geo, material); m.position.set(x, y, z); parent.add(m); return m; };
  const box = (w, h, d, color, x, y, z, parent) => mesh(new THREE.BoxGeometry(w, h, d), typeof color === 'number' ? flat(color) : color, x, y, z, parent);

  // ---- island ----------------------------------------------------------
  mesh(new THREE.CylinderGeometry(ISLAND_R, ISLAND_R - 1.5, 0.6, 40), flat(P.grass), 0, -0.3, 0);
  mesh(new THREE.CylinderGeometry(ISLAND_R - 1.2, ISLAND_R - 6, 3.2, 14), flat(P.cliff), 0, -2.2, 0);
  mesh(new THREE.CylinderGeometry(ISLAND_R - 6.5, ISLAND_R - 16, 5, 9), flat(P.rockDark), 0, -6.2, 0);
  // darker grass patches and snow drifts
  for (let i = 0; i < 16; i++) {
    const a = rand() * 6.28, r = 4 + rand() * 21, s = 1.5 + rand() * 2.4;
    mesh(new THREE.CircleGeometry(s, 7), flat(i % 4 ? P.grassDark : P.snow), Math.cos(a) * r, 0.01 + i * 0.001, Math.sin(a) * r).rotation.x = -Math.PI / 2;
  }
  // trodden paths from the mailbox to each place
  for (const key of Object.keys(PLACES)) {
    if (key === 'plaza') continue;
    const p = PLACES[key], len = Math.hypot(p.x, p.z);
    const path = mesh(new THREE.PlaneGeometry(1.3, len), flat(0xf2e2a8), p.x / 2, 0.03, p.z / 2);
    path.rotation.x = -Math.PI / 2; path.rotation.z = -Math.atan2(p.x, p.z);
  }

  // ---- reusable bits ---------------------------------------------------
  function sign(text, w, parent, x, y, z) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 96;
    const g = c.getContext('2d');
    g.fillStyle = '#1d2545'; g.fillRect(0, 0, 256, 96);
    g.fillStyle = '#ffd66b'; g.font = '900 60px Nunito, Arial Black, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 128, 52);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.MeshLambertMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0 });
    glowMats.push(m);
    box(w + 0.2, w * 0.375 + 0.2, 0.12, P.woodDark, x, y, z - 0.04, parent);
    return mesh(new THREE.PlaneGeometry(w, w * 0.375), m, x, y, z + 0.03, parent);
  }
  function hut(key, d, { w = 5, h = 2.6, depth = 4, label, wall = P.wood, roof = P.roof }) {
    const a = anchor(key, d), g = new THREE.Group();
    g.position.set(a.x, 0, a.z); g.rotation.y = a.ry; town.add(g);
    box(w, h, depth, wall, 0, h / 2, 0, g);
    for (const s of [-1, 1]) box(0.35, h, 0.35, P.woodDark, s * (w / 2 - 0.1), h / 2, depth / 2, g);   // corner posts
    const r = mesh(new THREE.ConeGeometry(Math.max(w, depth) * 0.82, 1.9, 4), flat(roof), 0, h + 0.9, 0, g); r.rotation.y = Math.PI / 4; r.scale.set(1, 1, depth / w * 1.05);
    box(1.0, 1.7, 0.15, P.woodDark, -w / 4, 0.85, depth / 2 + 0.02, g);                               // door
    box(1.1, 0.9, 0.15, glow(), w / 4, 1.5, depth / 2 + 0.02, g);                                     // window
    if (label) sign(label, 2.2, g, 0, h + 0.15, depth / 2 + 0.25);
    return g;
  }
  function lamp(x, z) {
    box(0.18, 2.6, 0.18, P.woodDark, x, 1.3, z);
    box(0.5, 0.5, 0.5, glow(0xffe08a, 0xfff3c4), x, 2.8, z);
    const l = new THREE.PointLight(0xffc870, 0, 12, 1.8); l.position.set(x, 2.8, z); town.add(l); lamps.push(l);
  }
  function flower(x, z, s, color) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rand() * 6.28; g.scale.setScalar(s); town.add(g);
    mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.9, 5), flat(P.grassDark), 0, 0.45, 0, g);
    const head = new THREE.Group(); head.position.y = 0.95; head.rotation.x = 0.5; g.add(head);
    for (let i = 0; i < 5; i++) {
      const petal = mesh(new THREE.ConeGeometry(0.3, 0.75, 4), flat(color), 0, 0, 0, head);
      const a = (i / 5) * 6.28; petal.position.set(Math.cos(a) * 0.42, 0, Math.sin(a) * 0.42);
      petal.rotation.z = -Math.PI / 2; petal.rotation.y = -a; petal.scale.set(1, 1, 0.45);
    }
    mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.16, 6), flat(P.centre), 0, 0.05, 0, head);
  }
  function rock(x, z, s) { const m = mesh(new THREE.DodecahedronGeometry(s, 0), flat(rand() > 0.5 ? P.rock : P.rockDark), x, s * 0.45, z); m.rotation.set(rand(), rand() * 6, rand()); m.scale.y = 0.75; }
  function pine(x, z, s) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); town.add(g);
    mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.8, 5), flat(P.woodDark), 0, 0.4, 0, g);
    [[1.25, 1.5, 1.3], [0.95, 1.3, 2.2], [0.62, 1.1, 3.0]].forEach(([r, h, y], i) => mesh(new THREE.ConeGeometry(r, h, 6), flat(i % 2 ? P.pineDark : P.pine), 0, y, 0, g));
    mesh(new THREE.ConeGeometry(0.3, 0.45, 6), flat(P.snow), 0, 3.5, 0, g);
  }

  // ---- the places ------------------------------------------------------
  // igloo
  { const a = anchor('home', 3.6), g = new THREE.Group(); g.position.set(a.x, 0, a.z); g.rotation.y = a.ry; town.add(g);
    mesh(new THREE.SphereGeometry(2.9, 9, 5, 0, Math.PI * 2, 0, Math.PI / 2), flat(P.snow), 0, 0, 0, g);
    mesh(new THREE.SphereGeometry(2.95, 9, 5, 0, Math.PI * 2, Math.PI / 3, Math.PI / 6), flat(P.snowShade), 0, 0, 0, g);
    box(1.9, 1.5, 1.8, P.snowShade, 0, 0.75, 2.9, g);
    box(1.1, 1.05, 0.2, glow(0xffb45a), 0, 0.55, 3.75, g);
    sign('NENA', 1.5, g, 0, 1.95, 3.7); }

  // fish stall
  { const a = anchor('fish', 2.6), g = new THREE.Group(); g.position.set(a.x, 0, a.z); g.rotation.y = a.ry; town.add(g);
    box(4.2, 1.1, 1.6, P.wood, 0, 0.55, 0, g);
    for (const s of [-1, 1]) box(0.25, 3.1, 0.25, P.woodDark, s * 1.95, 1.55, -0.6, g);
    for (let i = 0; i < 6; i++) { const st = box(0.75, 0.16, 2.6, i % 2 ? 0xfffaf0 : 0xe8452c, -1.88 + i * 0.75, 3.05, 0.15, g); st.rotation.x = 0.28; }
    for (let i = 0; i < 4; i++) { const f = mesh(new THREE.ConeGeometry(0.16, 0.6, 4), flat(i % 2 ? 0x8fd3ff : 0xbfe8ff), -1.3 + i * 0.85, 1.2, 0.2, g); f.rotation.z = Math.PI / 2; f.rotation.y = 0.3; }
    box(0.6, 0.4, 0.4, glow(), 1.6, 2.5, -0.5, g);
    sign('FISH', 2.0, g, 0, 3.9, -0.6); }

  hut('library', 3.4, { w: 5.6, h: 3.4, depth: 4, label: 'BOOKS', wall: 0xf7b34a, roof: 0x2f7f9a });
  { const g = hut('studio', 3.4, { w: 4.8, h: 2.6, depth: 4, label: 'STUDIO', wall: 0xff8f6b, roof: 0x6a2fc4 });
    // easel out front
    box(0.9, 1.1, 0.08, 0xfffaf0, 1.9, 1.35, 3.0, g).rotation.x = -0.2;
    for (const s of [-1, 1]) box(0.08, 1.7, 0.08, P.woodDark, 1.9 + s * 0.35, 0.85, 3.05, g); }

  // lookout tower
  { const a = anchor('lookout', 2.2), g = new THREE.Group(); g.position.set(a.x, 0, a.z); g.rotation.y = a.ry; town.add(g);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.3, 4.4, 0.3, P.woodDark, sx * 1.2, 2.2, sz * 1.2, g);
    box(3.2, 0.3, 3.2, P.wood, 0, 4.4, 0, g);
    for (const sx of [-1, 1]) box(0.15, 0.8, 3.2, P.woodDark, sx * 1.5, 4.95, 0, g);
    const scope = mesh(new THREE.CylinderGeometry(0.16, 0.24, 1.3, 6), flat(0x2f7f9a), 0, 5.3, 0.6, g); scope.rotation.x = -1.0;
    box(0.5, 0.5, 0.5, glow(0x9cf6ff), 0, 6.1, -1.2, g);
    box(0.12, 1.5, 0.12, P.woodDark, 0, 5.3, -1.2, g); }

  // ice pond
  const pond = anchor('pond', 6);
  { mesh(new THREE.CylinderGeometry(6.0, 6.0, 0.24, 7), flat(P.snowShade), pond.x, 0.0, pond.z);
    mesh(new THREE.CylinderGeometry(5.3, 5.3, 0.26, 7), flat(P.water), pond.x, 0.0, pond.z);
    for (let i = 0; i < 6; i++) { const a = rand() * 6.28, r = 1 + rand() * 3.2; const f = mesh(new THREE.CylinderGeometry(0.5 + rand() * 0.4, 0.5, 0.1, 5), flat(P.ice), pond.x + Math.cos(a) * r, 0.16, pond.z + Math.sin(a) * r); f.rotation.y = rand() * 6; } }

  // mailbox and clock lamp in the middle
  { box(0.2, 1.1, 0.2, P.woodDark, 1.5, 0.55, -0.6); box(0.7, 0.5, 0.95, 0xe8452c, 1.5, 1.3, -0.6);
    const flag = box(0.08, 0.5, 0.3, 0xffd93b, 1.9, 1.5, -0.6); town.userData.flag = flag; }
  lamp(-1.8, -1.2);

  // lamps along the paths, decoration around the edge
  for (const key of ['home', 'fish', 'library', 'studio', 'lookout']) { const p = PLACES[key]; lamp(p.x * 0.55 + p.z * 0.07, p.z * 0.55 - p.x * 0.07); }
  const clear = (x, z, r) => Object.keys(PLACES).every(k => { const a = anchor(k, k === 'pond' ? 6 : 3); return Math.hypot(a.x - x, a.z - z) > r + (k === 'pond' ? 6.5 : 4.5); });
  let placed = 0;
  for (let i = 0; i < 400 && placed < 46; i++) {
    const a = rand() * 6.28, r = 17 + rand() * 11.5, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (!clear(x, z, 1)) continue;
    const kind = placed % 4;
    if (kind === 0) flower(x, z, 1.4 + rand() * 1.5, P.petals[Math.floor(rand() * 4)]);
    else if (kind === 1) rock(x, z, 0.7 + rand() * 1.1);
    else if (kind === 2) pine(x, z, 0.9 + rand() * 0.7);
    else mesh(new THREE.SphereGeometry(0.9 + rand(), 6, 4, 0, 6.28, 0, 1.57), flat(P.snow), x, 0, z);
    placed++;
  }
  // chunky plank fence round the rim, with a gap
  { const n = 110, geo = new THREE.BoxGeometry(0.75, 1.5, 0.3), inst = new THREE.InstancedMesh(geo, flat(P.woodDark), n), m = new THREE.Object3D();
    for (let i = 0; i < n; i++) { const a = 0.35 + (i / n) * (6.28 - 0.7); m.position.set(Math.cos(a) * (ISLAND_R - 0.9), 0.6 + (i % 2) * 0.12, Math.sin(a) * (ISLAND_R - 0.9)); m.rotation.set(0, -a + Math.PI / 2, (rand() - 0.5) * 0.25); m.updateMatrix(); inst.setMatrixAt(i, m.matrix); }
    town.add(inst); }

  // nightness 0..1 switches windows, signs and lamps on
  function setNight(n) {
    for (const m of glowMats) m.emissiveIntensity = n * (m.map ? 1.1 : 1.6);
    for (const l of lamps) l.intensity = n * 9;
  }
  return { town, setNight, pond, flag: town.userData.flag };
}
