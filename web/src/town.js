// Nena's island: bright, flat-shaded and chunky by day; dark with glowing
// windows and signs at night. Everything is built from primitives here, and
// positions come from shared/world.js so the mind and the picture agree.
import * as THREE from 'three';
import { PLACES, WORLD, RIVER, BEACH, site } from '../../shared/world.js';

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
  const lamps = [];
  const rand = rng(11);
  const flat = color => new THREE.MeshLambertMaterial({ color, flatShading: true });
  const glow = (color = P.glow, base = 0xcdeeff) => { const m = new THREE.MeshLambertMaterial({ color: base, emissive: color, emissiveIntensity: 0, flatShading: true }); glowMats.push(m); return m; };
  const mesh = (geo, material, x = 0, y = 0, z = 0, parent = town) => { const m = new THREE.Mesh(geo, material); m.position.set(x, y, z); parent.add(m); return m; };
  const box = (w, h, d, color, x, y, z, parent) => mesh(new THREE.BoxGeometry(w, h, d), typeof color === 'number' ? flat(color) : color, x, y, z, parent);
  const at = key => { const s = site(key), g = new THREE.Group(); g.position.set(s.x, 0, s.z); g.rotation.y = s.ry; town.add(g); return g; };
  const ground = (geo, color, x, z, y) => { const m = mesh(geo, flat(color), x, y, z); m.rotation.x = -Math.PI / 2; return m; };

  // ---- island ----------------------------------------------------------
  mesh(new THREE.CylinderGeometry(R, R - 1.5, 0.6, 48), flat(P.grass), 0, -0.3, 0);
  mesh(new THREE.CylinderGeometry(R - 1.2, R - 6, 3.2, 14), flat(P.cliff), 0, -2.2, 0);
  mesh(new THREE.CylinderGeometry(R - 6.5, R - 16, 5, 9), flat(P.rockDark), 0, -6.2, 0);
  const inBeach = (x, z) => { const a = Math.atan2(z, x); return a > BEACH.from - 0.08 && a < BEACH.to + 0.08 && Math.hypot(x, z) > BEACH.inner - 1; };
  const nearRiver = (x, z, pad) => RIVER.some(([rx, rz]) => Math.hypot(rx - x, rz - z) < pad) || (z > 16 && x < -3 && x > -25 && Math.abs(z - 19) < pad);
  for (let i = 0; i < 16; i++) {
    const a = rand() * 6.28, r = 4 + rand() * 20, s = 1.5 + rand() * 2.4, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (inBeach(x, z) || nearRiver(x, z, 4)) continue;
    ground(new THREE.CircleGeometry(s, 7), P.grassDark, x, z, 0.01 + i * 0.001);
  }
  // snowfield around the igloo
  { const s = site('igloo'); ground(new THREE.CircleGeometry(7.5, 9), P.snow, s.x + 2, s.z, 0.03); ground(new THREE.CircleGeometry(4, 7), P.snowShade, s.x + 6, s.z + 3, 0.035); }
  // trodden paths from the mailbox to each place
  for (const key of Object.keys(PLACES)) {
    if (key === 'plaza') continue;
    const p = PLACES[key], len = Math.hypot(p.x, p.z);
    const path = ground(new THREE.PlaneGeometry(1.3, len), P.path, p.x / 2, p.z / 2, 0.05);
    path.rotation.z = -Math.atan2(p.x, p.z);
  }

  // ---- reusable bits ---------------------------------------------------
  // A sign is its own lit board, so it reads by day and glows at night.
  function sign(text, w, parent, x, y, z, { bg = '#1d2545', fg = '#ffd66b' } = {}) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 160;
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const draw = () => {
      const g = c.getContext('2d');
      g.fillStyle = bg; g.fillRect(0, 0, 512, 160);
      let size = 120; g.textAlign = 'center'; g.textBaseline = 'middle';
      do { g.font = `900 ${size}px Nunito, "Arial Black", sans-serif`; size -= 6; } while (g.measureText(text).width > 450 && size > 30);
      g.fillStyle = fg; g.fillText(text, 256, 88);
      tex.needsUpdate = true;
    };
    draw(); signs.push(draw);
    const h = w * 160 / 512;
    const m = new THREE.MeshBasicMaterial({ map: tex, fog: false }); m.userData.sign = true; glowMats.push(m);
    box(w + 0.24, h + 0.24, 0.16, P.woodDark, x, y, z - 0.06, parent);
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
  function lamp(x, z) {
    box(0.18, 2.6, 0.18, P.woodDark, x, 1.3, z);
    box(0.5, 0.5, 0.5, glow(0xffe08a, 0xfff3c4), x, 2.8, z);
    const l = new THREE.PointLight(0xffc870, 0, 12, 1.8); l.position.set(x, 2.8, z); town.add(l); lamps.push(l);
  }
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
  }
  function rock(x, z, s, parent = town) { const m = mesh(new THREE.DodecahedronGeometry(s, 0), flat(rand() > 0.5 ? P.rock : P.rockDark), x, s * 0.45, z, parent); m.rotation.set(rand(), rand() * 6, rand()); m.scale.y = 0.75; }
  function pine(x, z, s) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); town.add(g);
    mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.8, 5), flat(P.woodDark), 0, 0.4, 0, g);
    [[1.25, 1.5, 1.3], [0.95, 1.3, 2.2], [0.62, 1.1, 3.0]].forEach(([r, h, y], i) => mesh(new THREE.ConeGeometry(r, h, 6), flat(i % 2 ? P.pineDark : P.pine), 0, y, 0, g));
    mesh(new THREE.ConeGeometry(0.3, 0.45, 6), flat(P.snow), 0, 3.5, 0, g);
  }

  // ---- her house ---------------------------------------------------------
  { const g = hut('home', { w: 5.2, h: 3.2, depth: 4.4, label: 'NENA', wall: 0xfff1d6, roof: 0xe8452c, trim: 0x2f7f9a });
    box(0.8, 1.6, 0.8, 0xb86b4b, 1.4, 4.4, -0.8, g); box(1.0, 0.25, 1.0, 0x8a4a34, 1.4, 5.25, -0.8, g);   // chimney
    box(1.6, 0.12, 0.9, 0x2f7f9a, -1.3, 0.06, 2.75, g);                                                    // doormat
    box(1.5, 0.5, 0.45, P.woodDark, 2.1, 0.25, 3.1, g); for (let i = 0; i < 3; i++) flower(1.6 + i * 0.5, 3.1, 0.5, P.petals[i], g); }  // window box

  // ---- fish stall --------------------------------------------------------
  { const g = at('fish');
    box(4.2, 1.1, 1.6, P.wood, 0, 0.55, 0, g);
    for (const s of [-1, 1]) box(0.25, 3.1, 0.25, P.woodDark, s * 1.95, 1.55, -0.6, g);
    for (let i = 0; i < 6; i++) { const st = box(0.75, 0.16, 2.6, i % 2 ? 0xfffaf0 : 0xe8452c, -1.88 + i * 0.75, 3.05, 0.15, g); st.rotation.x = 0.28; }
    for (let i = 0; i < 4; i++) { const f = mesh(new THREE.ConeGeometry(0.16, 0.6, 4), flat(i % 2 ? 0x8fd3ff : 0xbfe8ff), -1.3 + i * 0.85, 1.2, 0.2, g); f.rotation.z = Math.PI / 2; f.rotation.y = 0.3; }
    box(0.6, 0.4, 0.4, glow(0xffe08a, 0xfff3c4), 1.6, 2.5, -0.5, g);
    box(0.14, 1.0, 0.14, P.woodDark, 0, 4.0, -0.6, g);
    sign('FISH', 2.4, g, 0, 4.7, -0.6); }

  hut('library', { w: 5.6, h: 3.8, depth: 4, label: 'BOOKS', wall: 0xf7b34a, roof: 0x2f7f9a });
  { const g = hut('studio', { w: 4.8, h: 3.4, depth: 4, label: 'STUDIO', wall: 0xff8f6b, roof: 0x6a2fc4 });
    box(0.9, 1.1, 0.08, 0xfffaf0, 1.7, 1.35, 3.0, g).rotation.x = -0.2;                // easel
    for (const s of [-1, 1]) box(0.08, 1.7, 0.08, P.woodDark, 1.7 + s * 0.35, 0.85, 3.05, g); }

  // ---- cinema ------------------------------------------------------------
  const marquee = [];
  { const g = at('cinema');
    box(7, 4.4, 5, 0x5a3fb8, 0, 2.2, 0, g);
    box(7.4, 0.5, 5.4, 0x3c2a86, 0, 4.6, 0, g);
    box(5.6, 0.4, 1.8, 0xe8452c, 0, 2.7, 3.2, g);                                       // canopy
    for (let i = 0; i < 7; i++) { const m = new THREE.MeshLambertMaterial({ color: 0xfff3c4, emissive: 0xffe08a, emissiveIntensity: 0, flatShading: true }); marquee.push(m); box(0.28, 0.28, 0.28, m, -2.4 + i * 0.8, 2.42, 4.0, g); }
    box(1.6, 2.0, 0.14, 0x3c2a86, 0, 1.0, 2.53, g);                                     // doors
    for (const s of [-1, 1]) box(1.3, 1.8, 0.12, glow(0xff9aa8, 0xffd9de), s * 2.5, 1.5, 2.53, g);   // poster cases
    sign('CINEMA', 4.2, g, 0, 3.75, 2.62, { bg: '#fff3c4', fg: '#e8452c' }); }

  // ---- lookout tower -------------------------------------------------------
  { const g = at('lookout');
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.3, 4.4, 0.3, P.woodDark, sx * 1.2, 2.2, sz * 1.2, g);
    box(3.2, 0.3, 3.2, P.wood, 0, 4.4, 0, g);
    for (const sx of [-1, 1]) box(0.15, 0.8, 3.2, P.woodDark, sx * 1.5, 4.95, 0, g);
    const scope = mesh(new THREE.CylinderGeometry(0.16, 0.24, 1.3, 6), flat(0x2f7f9a), 0, 5.3, 0.6, g); scope.rotation.x = -1.0;
    box(0.5, 0.5, 0.5, glow(0x9cf6ff), 0, 6.1, -1.2, g);
    box(0.12, 1.5, 0.12, P.woodDark, 0, 5.3, -1.2, g); }

  // ---- igloo and snowman -----------------------------------------------------
  { const g = at('igloo');
    mesh(new THREE.SphereGeometry(2.9, 9, 5, 0, Math.PI * 2, 0, Math.PI / 2), flat(P.snow), 0, 0, 0, g);
    mesh(new THREE.SphereGeometry(2.95, 9, 5, 0, Math.PI * 2, Math.PI / 3, Math.PI / 6), flat(P.snowShade), 0, 0, 0, g);
    box(1.9, 1.5, 1.8, P.snowShade, 0, 0.75, 2.9, g);
    box(1.1, 1.05, 0.2, glow(0xffb45a, 0x3c4a7a), 0, 0.55, 3.75, g);
    const s = new THREE.Group(); s.position.set(-2.6, 0, 5.2); g.add(s);
    mesh(new THREE.SphereGeometry(0.7, 7, 5), flat(P.snow), 0, 0.6, 0, s); mesh(new THREE.SphereGeometry(0.5, 7, 5), flat(P.snow), 0, 1.5, 0, s);
    const nose = mesh(new THREE.ConeGeometry(0.09, 0.4, 5), flat(0xff8a1f), 0.2, 1.5, 0.4, s); nose.rotation.x = Math.PI / 2; nose.rotation.z = -0.4;
    box(0.5, 0.1, 0.5, 0x1d2545, 0, 1.95, 0, s); box(0.34, 0.4, 0.34, 0x1d2545, 0, 2.2, 0, s); }

  // ---- ice pond ----------------------------------------------------------------
  const pond = site('pond');
  { mesh(new THREE.CylinderGeometry(6.0, 6.0, 0.24, 7), flat(P.snowShade), pond.x, 0.0, pond.z);
    mesh(new THREE.CylinderGeometry(5.3, 5.3, 0.26, 7), flat(P.water), pond.x, 0.0, pond.z);
    for (let i = 0; i < 6; i++) { const a = rand() * 6.28, r = 1 + rand() * 3.2; const f = mesh(new THREE.CylinderGeometry(0.5 + rand() * 0.4, 0.5, 0.1, 5), flat(P.ice), pond.x + Math.cos(a) * r, 0.16, pond.z + Math.sin(a) * r); f.rotation.y = rand() * 6; } }

  // ---- river: pond -> waterfall on the west rim ------------------------------------
  { const pts = [[pond.x - 4.5, pond.z], ...RIVER].map(([x, z]) => new THREE.Vector3(x, 0, z));
    const curve = new THREE.CatmullRomCurve3(pts);
    const ribbon = (width, color, y) => {
      const N = 40, pos = [], idx = [];
      for (let i = 0; i <= N; i++) { const p = curve.getPoint(i / N), t = curve.getTangent(i / N), nx = -t.z, nz = t.x;
        pos.push(p.x + nx * width / 2, y, p.z + nz * width / 2, p.x - nx * width / 2, y, p.z - nz * width / 2);
        if (i < N) idx.push(i * 2, i * 2 + 2, i * 2 + 1, i * 2 + 1, i * 2 + 2, i * 2 + 3); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide })); town.add(m); return m;
    };
    ribbon(4.2, P.sandDark, 0.06); ribbon(3.0, P.river, 0.09);
    const end = pts[pts.length - 1], a = Math.atan2(end.z, end.x);
    const fall = box(3.0, 7, 0.5, P.river, Math.cos(a) * (R + 0.1), -3.4, Math.sin(a) * (R + 0.1)); fall.rotation.y = -a + Math.PI / 2;
    const top = box(3.0, 0.2, 2.2, P.river, Math.cos(a) * (R - 0.8), 0.0, Math.sin(a) * (R - 0.8)); top.rotation.y = -a + Math.PI / 2;
    for (let i = 0; i < 7; i++) { const p = curve.getPoint(0.08 + i * 0.13), s = i % 2 ? 1 : -1; rock(p.x + s * 0.2, p.z + s * 2.3, 0.45 + rand() * 0.4); }
    // little bridge
    { const p = curve.getPoint(0.62), t = curve.getTangent(0.62), g = new THREE.Group(); g.position.set(p.x, 0, p.z); g.rotation.y = Math.atan2(t.x, t.z); town.add(g);
      for (let i = 0; i < 7; i++) box(0.6, 0.14, 1.8, i % 2 ? P.wood : P.woodDark, -2.1 + i * 0.7, 0.42 - Math.abs(i - 3) * 0.07, 0, g);
      for (const s of [-1, 1]) box(4.8, 0.12, 0.12, P.woodDark, 0, 1.0, s * 0.85, g); for (const s of [-1, 1]) for (const e of [-1, 1]) box(0.14, 1.0, 0.14, P.woodDark, e * 2.3, 0.5, s * 0.85, g); }
    // jetty and rod where she fishes
    { const p = PLACES.river; box(1.4, 0.16, 2.6, P.wood, p.x, 0.2, p.z + 1.6); for (const s of [-1, 1]) box(0.16, 0.6, 0.16, P.woodDark, p.x + s * 0.6, 0.1, p.z + 2.7);
      const rod = box(0.07, 2.4, 0.07, P.woodDark, p.x + 1.0, 1.2, p.z + 1.8); rod.rotation.x = 0.7; box(0.5, 0.4, 0.5, 0x2f7f9a, p.x - 1.1, 0.2, p.z + 0.3); } }

  // ---- beach: sand sector on the rim, sea beyond it ---------------------------------
  { const len = BEACH.to - BEACH.from;
    ground(new THREE.RingGeometry(BEACH.inner, R + 0.05, 24, 1, -BEACH.to, len), P.sand, 0, 0, 0.04);
    ground(new THREE.RingGeometry(BEACH.inner - 1.2, BEACH.inner, 24, 1, -BEACH.to - 0.03, len + 0.06), P.sandDark, 0, 0, 0.035);
    mesh(new THREE.CylinderGeometry(R + 0.3, R - 1, 0.7, 24, 1, false, Math.PI / 2 - BEACH.to, len), flat(P.sandDark), 0, -0.36, 0);
    const sea = mesh(new THREE.CylinderGeometry(R + 9, R + 5, 0.9, 20, 1, false, Math.PI / 2 - BEACH.to - 0.1, len + 0.2), new THREE.MeshLambertMaterial({ color: P.sea, flatShading: true, transparent: true, opacity: 0.92 }), 0, -0.55, 0);
    ground(new THREE.RingGeometry(R + 0.05, R + 0.8, 24, 1, -BEACH.to, len), 0xffffff, 0, 0, -0.08);   // foam line
    town.userData.sea = sea;
    const b = PLACES.beach, g = new THREE.Group(); g.position.set(b.x, 0, b.z); g.rotation.y = Math.atan2(-b.x, -b.z); town.add(g);
    box(0.14, 3.0, 0.14, 0xfffaf0, -2.6, 1.5, -2.0, g); const um = mesh(new THREE.ConeGeometry(2.0, 0.9, 8), flat(0xe8452c), -2.6, 3.2, -2.0, g); um.rotation.z = 0.12;
    box(1.3, 0.06, 2.4, 0x2fc6b3, -2.4, 0.08, -1.0, g); box(1.3, 0.07, 0.4, 0xfffaf0, -2.4, 0.09, -1.0, g);                 // towel
    for (const [x, z, s] of [[2.6, -1.8, 1], [3.3, -1.2, 0.7], [2.2, -1.0, 0.6]]) { mesh(new THREE.CylinderGeometry(0.45 * s, 0.55 * s, 0.7 * s, 6), flat(P.sandDark), x, 0.35 * s, z, g); mesh(new THREE.ConeGeometry(0.4 * s, 0.5 * s, 6), flat(P.sand), x, 0.95 * s, z, g); }  // sandcastle
    for (let i = 0; i < 9; i++) { const sh = mesh(new THREE.ConeGeometry(0.16, 0.3, 5), flat([0xff9aa8, 0xfffaf0, 0xffb45a][i % 3]), -5 + rand() * 10, 0.1, -5.5 + rand() * 3.5, g); sh.rotation.set(1.4, rand() * 6, 0); }
    box(2.4, 0.5, 1.0, 0x2f7f9a, 4.6, 0.3, -3.4, g).rotation.y = 0.5; box(0.1, 1.6, 0.1, P.woodDark, 4.6, 1.0, -3.4, g); }  // little boat

  // ---- garden --------------------------------------------------------------------------
  { const p = PLACES.garden, g = new THREE.Group(); g.position.set(p.x + 2.4, 0, p.z - 1.0); g.rotation.y = 0.4; town.add(g);
    box(3.6, 0.2, 3.0, 0x8a5a3a, 0, 0.08, 0, g);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) flower(-1.3 + c * 0.87, -0.95 + r * 0.95, 0.42, P.petals[(r + c) % 4], g);
    for (let i = 0; i < 9; i++) { box(0.28, 0.7, 0.1, 0xfffaf0, -1.8 + i * 0.45, 0.35, 1.6, g); box(0.28, 0.7, 0.1, 0xfffaf0, -1.8 + i * 0.45, 0.35, -1.6, g); }
    mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.5, 6), flat(0x2fc6b3), -2.3, 0.25, 0.9, g); }

  // ---- mailbox and lamps -----------------------------------------------------------------
  { box(0.2, 1.1, 0.2, P.woodDark, 1.5, 0.55, -0.6); box(0.7, 0.5, 0.95, 0xe8452c, 1.5, 1.3, -0.6);
    town.userData.flag = box(0.08, 0.5, 0.3, 0xffd93b, 1.9, 1.5, -0.6); }
  lamp(-1.8, -1.2);
  for (const key of ['home', 'fish', 'library', 'studio', 'lookout', 'cinema', 'beach']) { const p = PLACES[key], l = Math.hypot(p.x, p.z); lamp(p.x * 0.6 + (p.z / l) * 1.5, p.z * 0.6 - (p.x / l) * 1.5); }

  // ---- decoration round the edge ------------------------------------------------------------
  const clear = (x, z, pad) => !inBeach(x, z) && !nearRiver(x, z, 3.2) && Object.keys(PLACES).every(k => { const s = site(k); return Math.hypot(s.x - x, s.z - z) > (s.r || 2.5) + pad && Math.hypot(PLACES[k].x - x, PLACES[k].z - z) > 3; });
  let placed = 0;
  for (let i = 0; i < 600 && placed < 44; i++) {
    const a = rand() * 6.28, r = 16 + rand() * 12.5, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (!clear(x, z, 1.6)) continue;
    const kind = placed % 4;
    if (kind === 0) flower(x, z, 1.4 + rand() * 1.5, P.petals[Math.floor(rand() * 4)]);
    else if (kind === 1) rock(x, z, 0.7 + rand() * 1.1);
    else if (kind === 2) pine(x, z, 0.9 + rand() * 0.7);
    else mesh(new THREE.SphereGeometry(0.9 + rand(), 6, 4, 0, 6.28, 0, 1.57), flat(P.snow), x, 0, z);
    placed++;
  }
  // chunky plank fence round the rim; open along the beach and at the waterfall
  { const n = 120, slots = [], end = RIVER[RIVER.length - 1], fallA = Math.atan2(end[1], end[0]);
    for (let i = 0; i < n; i++) { const a = -Math.PI + (i / n) * 6.283; if (a > BEACH.from - 0.05 && a < BEACH.to + 0.05) continue; if (Math.abs(a - fallA) < 0.09) continue; slots.push(a); }
    const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(0.75, 1.5, 0.3), flat(P.woodDark), slots.length), m = new THREE.Object3D();
    slots.forEach((a, i) => { m.position.set(Math.cos(a) * (R - 0.9), 0.6 + (i % 2) * 0.12, Math.sin(a) * (R - 0.9)); m.rotation.set(0, -a + Math.PI / 2, (rand() - 0.5) * 0.25); m.updateMatrix(); inst.setMatrixAt(i, m.matrix); });
    town.add(inst); }

  document.fonts?.ready.then(() => signs.forEach(d => d()));

  // nightness 0..1 switches windows, signs and lamps on; `film` makes the cinema lights chase
  function setNight(n, film, t) {
    for (const m of glowMats) { if (m.userData.sign) m.color.setScalar(0.92 + n * 0.3); else m.emissiveIntensity = n * 1.6; }
    for (const l of lamps) l.intensity = n * 9;
    marquee.forEach((m, i) => { m.emissiveIntensity = film ? (Math.floor(t * 4 + i) % 3 === 0 ? 2.2 : 0.5) : n * 1.2; });
  }
  return { town, setNight, pond, flag: town.userData.flag };
}
