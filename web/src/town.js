// Nena's island: bright, flat-shaded and chunky by day; dark with glowing
// windows and signs at night. Everything is built from primitives here, and
// positions come from shared/world.js so the mind and the picture agree.
import * as THREE from 'three';
import { PLACES, WORLD, RIVER, BEACH, NEIGHBOURS, ORCHARD_TREES, ISLETS, BIG_ROCK, CLOCK, isletPos, site, PATHS, onPath, nearRiver as riverBand } from '../../shared/world.js';
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
  const lamps = [];
  const rand = rng(11);
  const flat = color => new THREE.MeshLambertMaterial({ color, flatShading: true });
  const glow = (color = P.glow, base = 0xcdeeff) => { const m = new THREE.MeshLambertMaterial({ color: base, emissive: color, emissiveIntensity: 0, flatShading: true }); glowMats.push(m); return m; };
  const mesh = (geo, material, x = 0, y = 0, z = 0, parent = town) => { const m = new THREE.Mesh(geo, material); m.position.set(x, y, z); parent.add(m); return m; };
  const box = (w, h, d, color, x, y, z, parent) => mesh(new THREE.BoxGeometry(w, h, d), typeof color === 'number' ? flat(color) : color, x, y, z, parent);
  const at = key => { const s = site(key), g = new THREE.Group(); g.position.set(s.x, 0, s.z); g.rotation.y = s.ry; town.add(g); return g; };
  const ground = (geo, color, x, z, y) => { const m = mesh(geo, flat(color), x, y, z); m.rotation.x = -Math.PI / 2; return m; };

  // ---- island ----------------------------------------------------------
  const grassMat = flat(P.grass), grassDarkMat = flat(P.grassDark), leafMat = flat(0x5fbf5a), fruitMat = flat(0xff5a4d);
  mesh(new THREE.CylinderGeometry(R, R - 1.5, 0.6, 48), grassMat, 0, -0.3, 0);
  mesh(new THREE.CylinderGeometry(R - 1.2, R - 6, 3.2, 14), flat(P.cliff), 0, -2.2, 0);
  mesh(new THREE.CylinderGeometry(R - 6.5, R - 16, 5, 9), flat(P.rockDark), 0, -6.2, 0);
  const inBeach = (x, z) => { const a = Math.atan2(z, x); return a > BEACH.from - 0.08 && a < BEACH.to + 0.08 && Math.hypot(x, z) > BEACH.inner - 1; };
  const nearRiver = (x, z, pad) => riverBand(x, z, pad) || RIVER.some(([rx, rz]) => Math.hypot(rx - x, rz - z) < pad);
  for (let i = 0; i < 30; i++) {
    const a = rand() * 6.28, r = 4 + rand() * (R - 10), s = 1.5 + rand() * 3, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (inBeach(x, z) || nearRiver(x, z, 4) || onPath(x, z, s * 0.6)) continue;
    const m = mesh(new THREE.CircleGeometry(s, 7), grassDarkMat, x, 0.01 + i * 0.001, z); m.rotation.x = -Math.PI / 2;
  }
  // snowfield around the igloo
  { const s = site('igloo'); ground(new THREE.CircleGeometry(7.5, 9), P.snow, s.x + 2, s.z, 0.03); ground(new THREE.CircleGeometry(4, 7), P.snowShade, s.x + 6, s.z + 3, 0.035); }
  // pebble paths: a gravel bed with stones pressed into it, and a round pebble square in the middle
  { const bed = flat(0xe6dcc4), stones = [];
    const disc = (x, z, r, y) => ground(new THREE.CircleGeometry(r, 14), 0xe6dcc4, x, z, y);
    const lay = (x, z) => stones.push([x, z]);
    disc(0, 0, 4.6, 0.05);
    for (let ring = 0.45; ring < 4.4; ring += 0.36) { const n = Math.floor(ring * 2 * Math.PI / 0.36); for (let i = 0; i < n; i++) { const a = i / n * 6.283 + ring; lay(Math.cos(a) * ring, Math.sin(a) * ring); } }
    for (const line of PATHS) for (let i = 0; i < line.length - 1; i++) {
      const a = line[i], b = line[i + 1], dx = b.x - a.x, dz = b.z - a.z, len = Math.hypot(dx, dz); if (len < 0.05) continue;
      const strip = mesh(new THREE.PlaneGeometry(1.6, len), bed, (a.x + b.x) / 2, 0.052, (a.z + b.z) / 2); strip.rotation.x = -Math.PI / 2; strip.rotation.z = Math.atan2(dx, dz);
      disc(a.x, a.z, 0.8, 0.051); if (i === line.length - 2) disc(b.x, b.z, 0.8, 0.051);   // round off the bends and ends
      const nx = -dz / len, nz = dx / len;
      for (let t = 0.1; t < len; t += 0.3) for (const off of [-0.54, -0.18, 0.18, 0.54]) { const j = rand() - 0.5, k = (rand() - 0.5) * 0.12, x = a.x + dx / len * (t + k) + nx * (off + j * 0.1), z = a.z + dz / len * (t + k) + nz * (off + j * 0.1); if (Math.hypot(x, z) > 4.3) lay(x, z); }
    }
    const inst = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.2, 0), new THREE.MeshLambertMaterial({ flatShading: true }), stones.length), m = new THREE.Object3D(), c = new THREE.Color();
    const tones = [0xc9c2b4, 0xb4bfcb, 0xd9d0bf, 0xa9b2bc, 0xe4dccd, 0xcdc1ab, 0xbcc6cf];
    stones.forEach(([x, z], i) => { const sc = 0.7 + rand() * 0.45; m.position.set(x, 0.07, z); m.rotation.set(0, rand() * 6.283, 0); m.scale.set(sc, sc * 0.3, sc * (0.75 + rand() * 0.35)); m.updateMatrix(); inst.setMatrixAt(i, m.matrix); inst.setColorAt(i, c.set(tones[Math.floor(rand() * tones.length)])); });
    town.add(inst); }
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
  const house = { wall: flat(0xfff1d6), roof: flat(0xe8452c), extras: [] };
  { const g = at('home'), w = 5.2, h = 3.2, depth = 4.4, trim = 0x2f7f9a;
    mesh(new THREE.BoxGeometry(w, h, depth), house.wall, 0, h / 2, 0, g);
    for (const s of [-1, 1]) box(0.3, h, 0.3, trim, s * (w / 2), h / 2, depth / 2, g);
    gable(w, depth, 1.7, 0, h, g).material = house.roof;
    box(1.0, 1.7, 0.14, trim, -w / 4, 0.85, depth / 2 + 0.03, g); box(1.1, 0.9, 0.14, glow(), w / 4, 1.35, depth / 2 + 0.03, g);
    sign('NENA', 3, g, 0, h - 0.62, depth / 2 + 0.12);
    box(0.8, 1.6, 0.8, 0xb86b4b, 1.4, 4.4, -0.8, g); box(1.0, 0.25, 1.0, 0x8a4a34, 1.4, 5.25, -0.8, g);   // chimney
    box(1.6, 0.12, 0.9, trim, -1.3, 0.06, 2.75, g);                                                        // doormat
    box(1.5, 0.5, 0.45, P.woodDark, 2.1, 0.25, 3.1, g); for (let i = 0; i < 3; i++) flower(1.6 + i * 0.5, 3.1, 0.5, P.petals[i], g);
    // level 2: a side room. level 3: an upstairs.
    const l2 = new THREE.Group(), l3 = new THREE.Group(); g.add(l2, l3); house.extras = [l2, l3];
    mesh(new THREE.BoxGeometry(2.6, 2.4, 3.2), house.wall, -3.8, 1.2, -0.2, l2); const r2 = gable(2.6, 3.2, 1.1, 0, 2.4, l2); r2.material = house.roof; r2.position.x = -3.8; r2.position.z = -0.2; box(0.9, 0.8, 0.14, glow(), -3.8, 1.3, 1.43, l2);
    mesh(new THREE.BoxGeometry(3.4, 2.2, 3.0), house.wall, 0.3, 5.0, -0.3, l3); const r3 = gable(3.4, 3.0, 1.3, 0, 6.1, l3); r3.material = house.roof; r3.position.x = 0.3; r3.position.z = -0.3; box(1.0, 0.8, 0.14, glow(), 0.3, 5.0, 1.23, l3); }

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

  // ---- museum -----------------------------------------------------------
  { const g = at('museum');
    box(6, 3.6, 4.2, 0xf4efe2, 0, 1.8, 0, g); box(6.6, 0.4, 4.8, 0xd9cfb8, 0, 3.8, 0, g); gable(5.2, 3.6, 1.2, 0x8fa3b8, 4.0, g);
    for (let i = 0; i < 4; i++) mesh(new THREE.CylinderGeometry(0.22, 0.26, 2.4, 6), flat(0xfffaf0), -2.4 + i * 1.6, 1.2, 2.45, g);
    box(6.4, 0.3, 1.6, 0xd9cfb8, 0, 0.15, 2.6, g); box(6.0, 0.25, 0.9, 0xd9cfb8, 0, 2.5, 2.45, g); box(1.2, 1.9, 0.14, 0x5f82ad, 0, 0.95, 2.13, g);
    for (const sx of [-1, 1]) box(1.0, 1.0, 0.14, glow(), sx * 1.9, 1.7, 2.13, g);
    sign('MUSEUM', 3.2, g, 0, 3.05, 2.2, { bg: '#5f82ad', fg: '#fffaf0' }); }

  // ---- shop and workbench ----------------------------------------------------
  { const g = hut('shop', { w: 5, h: 3.4, depth: 4, label: 'SHOP', wall: 0x9fe0c8, roof: 0xf2792e, trim: 0x2f7f9a });
    box(2.2, 0.9, 1.0, P.wood, -3.6, 0.45, 2.6, g); box(2.4, 0.14, 1.2, P.woodDark, -3.6, 0.95, 2.6, g);     // workbench
    box(0.5, 0.3, 0.3, 0x5f82ad, -3.9, 1.15, 2.6, g); box(0.1, 0.5, 0.1, P.woodDark, -3.1, 1.25, 2.5, g);
    for (let i = 0; i < 3; i++) box(0.7, 0.6, 0.7, [0xe8452c, 0xffd93b, 0x6a2fc4][i], 2.9 + (i % 2) * 0.5, 0.3 + (i > 1 ? 0.6 : 0), 2.5 + (i % 2) * 0.6, g); }   // crates

  // ---- orchard: leaves change with the season, fruit shows when it is ready -----------
  const fruit = [];
  for (const [x, z] of ORCHARD_TREES) {
    mesh(new THREE.CylinderGeometry(0.28, 0.36, 1.8, 6), flat(P.woodDark), x, 0.9, z);
    mesh(new THREE.DodecahedronGeometry(1.5, 0), leafMat, x, 2.9, z).rotation.y = rand() * 3;
    mesh(new THREE.DodecahedronGeometry(1.0, 0), leafMat, x + 0.5, 3.8, z - 0.3);
    for (let i = 0; i < 4; i++) { const a = i * 1.6 + rand(); fruit.push(mesh(new THREE.SphereGeometry(0.2, 6, 5), fruitMat, x + Math.cos(a) * 1.25, 2.3 + rand() * 0.8, z + Math.sin(a) * 1.25)); }
  }
  // the big rock she chips at
  { const m = mesh(new THREE.DodecahedronGeometry(1.5, 0), flat(P.rockDark), BIG_ROCK.x, 0.9, BIG_ROCK.z); m.scale.y = 0.9; mesh(new THREE.DodecahedronGeometry(0.35, 0), glow(0xffe08a, 0xffd93b), BIG_ROCK.x + 0.9, 1.5, BIG_ROCK.z + 0.6); }

  // ---- neighbours' tents -----------------------------------------------------------
  NEIGHBOURS.forEach((n, i) => {
    const col = [0x2f7f9a, 0xe8452c, 0xffd93b][i], g = new THREE.Group(); g.position.set(n.home.x, 0, n.home.z); town.add(g);
    const t = mesh(new THREE.ConeGeometry(2.0, 2.6, 6), flat(col), 0, 1.3, 0, g); t.rotation.y = 0.52;
    box(0.9, 1.3, 0.2, 0x1d2545, 0, 0.65, 1.62, g); box(0.1, 0.9, 0.1, P.woodDark, 0, 3.0, 0, g); box(0.5, 0.3, 0.05, 0xfffaf0, 0.28, 3.25, 0, g);
    box(0.5, 0.5, 0.5, glow(0xffe08a, 0xfff3c4), 1.9, 0.25, 1.6, g);
  });

  // ---- festival things in the square, only out for events ------------------------------
  const festival = new THREE.Group(), lanternsG = new THREE.Group(); festival.visible = lanternsG.visible = false; town.add(festival, lanternsG);
  { const poles = [[-4, -4], [4, -4], [4, 4], [-4, 4]];
    poles.forEach(([x, z]) => box(0.16, 4, 0.16, P.woodDark, x, 2, z, festival));
    poles.forEach(([x, z], i) => { const [nx, nz] = poles[(i + 1) % 4]; for (let k = 1; k < 8; k++) { const f = mesh(new THREE.ConeGeometry(0.22, 0.5, 3), flat([0xe8452c, 0xffd93b, 0x2fc6b3, 0x6a2fc4][k % 4]), x + (nx - x) * k / 8, 3.7 - Math.sin(k / 8 * Math.PI) * 0.5, z + (nz - z) * k / 8, festival); f.rotation.x = Math.PI; } });
    box(3, 0.4, 2, P.wood, -3, 0.2, 3, festival); box(1.6, 0.8, 0.8, 0xfffaf0, 3, 0.4, 3, festival);
    for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283, r = 6 + (i % 2) * 5; const m = new THREE.MeshLambertMaterial({ color: 0xff8a1f, emissive: 0xff8a1f, emissiveIntensity: 1.6, flatShading: true }); box(0.5, 0.6, 0.5, m, Math.cos(a) * r, 0.5, Math.sin(a) * r, lanternsG); box(0.08, 0.5, 0.08, P.woodDark, Math.cos(a) * r, 0.1, Math.sin(a) * r, lanternsG); } }

  // ---- cocoa cart ----------------------------------------------------------
  { const g = at('cafe');
    box(2.2, 1.0, 1.2, 0x8a5a3a, 0, 0.6, 0, g); box(2.4, 0.12, 1.4, 0xfff1d6, 0, 1.15, 0, g);
    for (const s of [-1, 1]) { box(0.12, 1.5, 0.12, P.woodDark, s * 1.0, 1.9, 0, g); const wh = mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.12, 8), flat(0x1d2545), s * 1.0, 0.32, 0.65, g); wh.rotation.x = Math.PI / 2; }
    for (let i = 0; i < 5; i++) box(0.5, 0.12, 1.7, i % 2 ? 0xfffaf0 : 0x8a5a3a, -1.0 + i * 0.5, 2.7, 0.1, g).rotation.x = 0.2;
    mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.26, 7), flat(0xfffaf0), -0.5, 1.35, 0.2, g); mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.5, 7), glow(0xffb45a, 0xe8452c), 0.5, 1.46, 0, g);
    sign('COCOA', 1.5, g, 0, 0.62, 0.62, { bg: '#fff1d6', fg: '#8a5a3a' });
    for (const [x, z] of [[-1.9, 1.9], [1.9, 2.1]]) mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.45, 7), flat(P.wood), x, 0.22, z, g); }

  // ---- flagpole in the square (she designs the flag) -------------------------------
  const flagMat = flat(FLAGS[0]);
  { box(0.16, 5.2, 0.16, 0xfffaf0, -2.6, 2.6, 2.4); mesh(new THREE.BoxGeometry(1.6, 1.0, 0.06), flagMat, -1.75, 4.6, 2.4); box(0.5, 0.34, 0.07, 0xfffaf0, -1.75, 4.6, 2.4); box(0.6, 0.3, 0.6, P.rockDark, -2.6, 0.15, 2.4);
    box(1.6, 1.3, 0.12, P.woodDark, 2.6, 1.25, 2.6).rotation.y = -0.5; box(1.4, 1.0, 0.06, 0xfff1d6, 2.56, 1.3, 2.67).rotation.y = -0.5; for (const s of [-1, 1]) box(0.12, 1.1, 0.12, P.woodDark, 2.6 + s * 0.6, 0.55, 2.6 + s * 0.33); }   // noticeboard

  // ---- the painter's boat (only moored on some days) ---------------------------------
  const painter = new THREE.Group(); painter.visible = false; town.add(painter);
  { const a = 0.75, r = R + 3.2; painter.position.set(Math.cos(a) * r, -0.15, Math.sin(a) * r); painter.rotation.y = -a;
    box(2.2, 0.9, 5.0, 0x3c2a86, 0, 0.3, 0, painter); box(2.5, 0.16, 5.3, 0xffd93b, 0, 0.8, 0, painter); box(1.5, 1.3, 1.8, 0xfff1d6, 0, 1.5, -1.2, painter); box(1.8, 0.16, 2.1, 0xe8452c, 0, 2.2, -1.2, painter);
    box(0.12, 3.4, 0.12, P.woodDark, 0, 2.5, 0.9, painter); box(1.3, 1.0, 0.06, 0xff9aa8, 0.72, 3.5, 0.9, painter);
    for (let i = 0; i < 3; i++) box(0.7, 0.9, 0.08, [0x58b7e8, 0xf59b2f, 0x2f8f7a][i], -0.8 + i * 0.8, 1.35, 1.9, painter).rotation.x = -0.25; }

  // ---- vegetable patch beside the garden: sown, sprouting, ready ---------------------------
  const cropStages = [new THREE.Group(), new THREE.Group(), new THREE.Group()];
  { const p = PLACES.garden, g = new THREE.Group(); g.position.set(p.x + 0.4, 0, p.z + 3.4); g.rotation.y = 0.4; town.add(g);
    box(3.2, 0.16, 1.8, 0x6e4a30, 0, 0.07, 0, g); cropStages.forEach(c => { c.visible = false; g.add(c); });
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
    sign('CAMP', 1.3, g, 2.4, 1.2, 1.6); box(0.12, 1.0, 0.12, P.woodDark, 2.4, 0.5, 1.5, g); }

  // ---- islets out at sea that she rows to ------------------------------------------------
  const isletBoats = ISLETS.map((isl, i) => {
    const p = isletPos(i), g = new THREE.Group(); g.position.set(p.x, -0.3, p.z); town.add(g);
    mesh(new THREE.CylinderGeometry(9, 12, 0.9, 12), new THREE.MeshLambertMaterial({ color: P.sea, flatShading: true, transparent: true, opacity: 0.9 }), 0, -0.3, 0, g);
    mesh(new THREE.CylinderGeometry(5.2, 5.8, 0.5, 9), flat(P.sand), 0, 0.1, 0, g); mesh(new THREE.CylinderGeometry(3.6, 4.2, 0.4, 8), flat(i === 1 ? P.rock : P.grass), 0, 0.42, 0, g);
    mesh(new THREE.CylinderGeometry(4.6, 2.5, 3.5, 7), flat(P.rockDark), 0, -2.0, 0, g);
    if (i === 0) for (const [x, z] of [[-1.4, 0.6], [1.2, -1]]) { mesh(new THREE.CylinderGeometry(0.2, 0.26, 1.5, 5), flat(P.woodDark), x, 1.3, z, g); mesh(new THREE.DodecahedronGeometry(1.2, 0), flat(0xffb7d0), x, 2.9, z, g); }
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
      const face = new THREE.Group(); face.rotation.y = f * Math.PI / 2; g.add(face);
      const disc = mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.08, 20), faceMat, 0, 8.5, 1.28, face); disc.rotation.x = Math.PI / 2;
      const rim = mesh(new THREE.TorusGeometry(1.0, 0.09, 5, 20), flat(0x1d2545), 0, 8.5, 1.3, face);
      for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283, big = i % 3 === 0; const tk = box(0.07, big ? 0.24 : 0.12, 0.03, 0x1d2545, Math.sin(a) * 0.8, 8.5 + Math.cos(a) * 0.8, 1.34, face); tk.rotation.z = -a; }
      const mk = (len, w, col) => { const pivot = new THREE.Group(); pivot.position.set(0, 8.5, 1.36); face.add(pivot); box(w, len, 0.03, col, 0, len / 2 - 0.08, 0, pivot); return pivot; };
      clockHands.push({ hour: mk(0.5, 0.11, 0x1d2545), minute: mk(0.78, 0.07, 0xe8452c) });
      box(0.1, 0.1, 0.06, 0x1d2545, 0, 8.5, 1.38, face); void rim;
    } }
  function setObservatory(night, using, t) { dome.rotation.y = night > 0.5 ? Math.sin(t * 0.05) * 1.2 : 0; scopeLight.emissiveIntensity = using ? 1.8 : night * 0.4; }
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
    for (let i = 0; i < 3; i++) { const gx = 1.65 + i * 0.36, col = [0x1d2545, 0xff7fa3, 0xffd93b][i]; for (const sd of [-1, 1]) { const l = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 8), flat(col), gx + sd * 0.08, 0.8, 3.2, g); l.rotation.x = Math.PI / 2 - 0.4; } } const bh = mesh(new THREE.SphereGeometry(0.26, 8, 5), flat(0x2fc6b3), -0.24, 1.45, 0.05, stand); bh.scale.y = 0.6; }

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
    sign('OBSERVATORY', 3.6, g, 0, 3.35, 2.68, { bg: '#3c2a86', fg: '#fffaf0' }); }

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
  { const R0 = PLACES.pond.r;
    mesh(new THREE.CylinderGeometry(R0, R0, 0.24, 9), flat(P.snowShade), pond.x, 0.0, pond.z);
    mesh(new THREE.CylinderGeometry(R0 - 0.8, R0 - 0.8, 0.26, 9), flat(P.water), pond.x, 0.0, pond.z);
    for (let i = 0; i < 12; i++) { const a = rand() * 6.28, r = 1.5 + rand() * (R0 - 3.2); const f = mesh(new THREE.CylinderGeometry(0.5 + rand() * 0.6, 0.55, 0.1, 5), flat(P.ice), pond.x + Math.cos(a) * r, 0.16, pond.z + Math.sin(a) * r); f.rotation.y = rand() * 6; }
    for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283 + 0.3; if (Math.cos(a) < -0.6) continue; rock(pond.x + Math.cos(a) * (R0 + 0.4), pond.z + Math.sin(a) * (R0 + 0.4), 0.35 + rand() * 0.35); } }

  // ---- river: pond -> waterfall on the west rim ------------------------------------
  { const pts = [[pond.x - PLACES.pond.r + 1.5, pond.z], ...RIVER].map(([x, z]) => new THREE.Vector3(x, 0, z));
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

  const beachBoat = new THREE.Group();
  // ---- beach: sand sector on the rim, sea beyond it ---------------------------------
  { const len = BEACH.to - BEACH.from;
    ground(new THREE.RingGeometry(BEACH.inner, R + 0.05, 24, 1, -BEACH.to, len), P.sand, 0, 0, 0.04);
    ground(new THREE.RingGeometry(BEACH.inner - 1.2, BEACH.inner, 24, 1, -BEACH.to - 0.03, len + 0.06), P.sandDark, 0, 0, 0.035);
    mesh(new THREE.CylinderGeometry(R + 0.3, R - 1, 0.7, 24, 1, false, Math.PI / 2 - BEACH.to, len), flat(P.sandDark), 0, -0.36, 0);
    const sea = mesh(new THREE.CylinderGeometry(R + 9, R + 5, 0.9, 20, 1, false, Math.PI / 2 - BEACH.to - 0.1, len + 0.2), new THREE.MeshLambertMaterial({ color: P.sea, flatShading: true, transparent: true, opacity: 0.92 }), 0, -0.55, 0);
    ground(new THREE.RingGeometry(R + 0.05, R + 0.8, 24, 1, -BEACH.to, len), 0xffffff, 0, 0, -0.08);   // foam line
    town.userData.sea = sea;
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
  { box(0.2, 1.1, 0.2, P.woodDark, 1.5, 0.55, -0.6); box(0.7, 0.5, 0.95, 0xe8452c, 1.5, 1.3, -0.6);
    town.userData.flag = box(0.08, 0.5, 0.3, 0xffd93b, 1.9, 1.5, -0.6); }
  lamp(-2.4, -2.0);
  for (const key of ['home', 'fish', 'library', 'studio', 'lookout', 'cinema', 'beach', 'museum', 'shop', 'tailor', 'observatory']) { const p = PLACES[key], l = Math.hypot(p.x, p.z); lamp(p.x * 0.6 + (p.z / l) * 1.5, p.z * 0.6 - (p.x / l) * 1.5); }

  // ---- decoration round the edge ------------------------------------------------------------
  const extraObs = [site('cafe'), CLOCK, BIG_ROCK, ...NEIGHBOURS.flatMap(n => n.hobbies.filter(h => h.at).map(h => h.at)), ...ORCHARD_TREES.map(([x, z]) => ({ x, z })), ...NEIGHBOURS.map(n => n.home)];
  const clear = (x, z, pad) => !onPath(x, z, 1.8) && !inBeach(x, z) && !nearRiver(x, z, 3.2) && extraObs.every(o => Math.hypot(o.x - x, o.z - z) > 3.6) && Object.keys(PLACES).every(k => { const s = site(k); return Math.hypot(s.x - x, s.z - z) > (s.r || 2.5) + pad && Math.hypot(PLACES[k].x - x, PLACES[k].z - z) > 3; });
  let placed = 0;
  for (let i = 0; i < 900 && placed < 52; i++) {
    const a = rand() * 6.28, r = R * 0.5 + rand() * (R * 0.45), x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (!clear(x, z, 1.6)) continue;
    const kind = placed % 4;
    if (kind === 0) flower(x, z, 1.4 + rand() * 1.5, P.petals[Math.floor(rand() * 4)]);
    else if (kind === 1) rock(x, z, 0.7 + rand() * 1.1);
    else if (kind === 2) pine(x, z, 0.9 + rand() * 0.7);
    else mesh(new THREE.SphereGeometry(0.9 + rand(), 6, 4, 0, 6.28, 0, 1.57), flat(P.snow), x, 0, z);
    placed++;
  }
  // chunky plank fence round the rim; open along the beach and at the waterfall
  { const n = Math.round(R * 4), slots = [], end = RIVER[RIVER.length - 1], fallA = Math.atan2(end[1], end[0]);
    for (let i = 0; i < n; i++) { const a = -Math.PI + (i / n) * 6.283; if (a > BEACH.from - 0.05 && a < BEACH.to + 0.05) continue; if (Math.abs(a - fallA) < 0.09) continue; slots.push(a); }
    const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(0.75, 1.5, 0.3), flat(P.woodDark), slots.length), m = new THREE.Object3D();
    slots.forEach((a, i) => { m.position.set(Math.cos(a) * (R - 0.9), 0.6 + (i % 2) * 0.12, Math.sin(a) * (R - 0.9)); m.rotation.set(0, -a + Math.PI / 2, (rand() - 0.5) * 0.25); m.updateMatrix(); inst.setMatrixAt(i, m.matrix); });
    town.add(inst); }

  document.fonts?.ready.then(() => signs.forEach(d => d()));

  // nightness 0..1 switches windows, signs and lamps on; `film` makes the cinema lights chase
  function setNight(n, film, t) {
    for (const m of glowMats) { if (m.userData.sign) m.color.setScalar(0.92 + n * 0.3); else m.emissiveIntensity = n * (m.userData.soft ? 0.5 : 1.6); }
    for (const l of lamps) l.intensity = n * 9;
    marquee.forEach((m, i) => { m.emissiveIntensity = film ? (Math.floor(t * 4 + i) % 3 === 0 ? 2.2 : 0.5) : n * 1.2; });
  }
  const SEASON = { spring: [0xb9e36a, 0x86cf5c, 0xffb7d0], summer: [0xb4dc5a, 0x79c653, 0x4fae52], autumn: [0xd8cf62, 0xc2a84a, 0xf2792e], winter: [0xeef6fb, 0xd5e6f2, 0xdfeaf2] };
  function setSeason(name, fruitReady) {
    const c = SEASON[name] || SEASON.summer; grassMat.color.set(c[0]); grassDarkMat.color.set(c[1]); leafMat.color.set(c[2]);
    fruit.forEach(f => { f.visible = fruitReady && name !== 'winter'; });
  }
  function setHouse(look, level) { const l = HOUSE_LOOKS[look] || HOUSE_LOOKS[0]; house.wall.color.set(l.wall); house.roof.color.set(l.roof); house.extras[0].visible = level >= 2; house.extras[1].visible = level >= 3; }
  function setIsland(flag, painterIn, crops) { flagMat.color.set(FLAGS[flag] ?? FLAGS[0]); painter.visible = !!painterIn; cropStages.forEach((c, i) => { c.visible = crops === i + 1; }); }
  function setAway(islet) { isletBoats.forEach((b, i) => { b.visible = islet === i; }); beachBoat.visible = islet == null; }
  function setEvent(show) { festival.visible = !!show; lanternsG.visible = show === 'lanterns'; }
  setHouse(0, 1);
  return { town, setNight, setSeason, setHouse, setEvent, setIsland, setAway, setClock, setObservatory, pond, flag: town.userData.flag };
}
