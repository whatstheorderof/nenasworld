// Things on the island that change: what Nena has built and planted, the fossils,
// weeds, bottles and balloons that turn up, and her neighbours.
import * as THREE from 'three';
import { BLOOMS } from '../../shared/data.js';
import { PLACES, site } from '../../shared/world.js';

const flat = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, flatShading: true, ...extra });
const add = (parent, geo, material, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, typeof material === 'number' ? flat(material) : material); m.position.set(x, y, z); parent.add(m); return m; };
const box = (p, w, h, d, c, x, y, z) => add(p, new THREE.BoxGeometry(w, h, d), c, x, y, z);
const WOOD = 0xc9531c, LIGHT = 0xf59b2f, STONE = 0x86a9cc;
const PETALS = [0xffd93b, 0x6a2fc4, 0xff7fa3, 0x2f7f9a];

function decorModel(kind, day, today, glows, color) {
  const g = new THREE.Group();
  const lit = c => { const m = flat(0xfff3c4, { emissive: c, emissiveIntensity: 0 }); glows.push(m); return m; };
  switch (kind) {
    case 'bench': box(g, 1.8, 0.14, 0.6, LIGHT, 0, 0.5, 0); box(g, 1.8, 0.5, 0.12, LIGHT, 0, 0.9, -0.26); for (const s of [-1, 1]) box(g, 0.14, 0.5, 0.5, WOOD, s * 0.75, 0.25, 0); break;
    case 'lantern': box(g, 0.14, 1.5, 0.14, WOOD, 0, 0.75, 0); box(g, 0.42, 0.42, 0.42, lit(0xffc870), 0, 1.7, 0); box(g, 0.56, 0.08, 0.56, WOOD, 0, 1.95, 0); break;
    case 'cairn': [0.55, 0.42, 0.3, 0.2].forEach((r, i) => { const m = add(g, new THREE.DodecahedronGeometry(r, 0), i % 2 ? 0x5f82ad : STONE, 0, 0.3 + i * 0.5, 0); m.rotation.y = i; m.scale.y = 0.7; }); break;
    case 'shell arch': for (let i = 0; i <= 8; i++) { const a = (i / 8) * Math.PI; const m = add(g, new THREE.ConeGeometry(0.2, 0.4, 5), [0xff9aa8, 0xfffaf0, 0xffb45a][i % 3], Math.cos(a) * 1.1, 0.15 + Math.sin(a) * 1.7, 0); m.rotation.z = a - Math.PI / 2; } break;
    case 'birdbath': add(g, new THREE.CylinderGeometry(0.16, 0.26, 0.9, 6), STONE, 0, 0.45, 0); add(g, new THREE.CylinderGeometry(0.6, 0.35, 0.22, 7), STONE, 0, 1.0, 0); add(g, new THREE.CylinderGeometry(0.48, 0.48, 0.05, 7), 0x58b7e8, 0, 1.1, 0); break;
    case 'scarecrow': box(g, 0.12, 1.9, 0.12, WOOD, 0, 0.95, 0); box(g, 1.4, 0.12, 0.12, WOOD, 0, 1.35, 0); box(g, 0.7, 0.7, 0.3, 0x2f7f9a, 0, 1.15, 0); add(g, new THREE.SphereGeometry(0.3, 6, 5), 0xf7dc8f, 0, 1.95, 0); add(g, new THREE.ConeGeometry(0.42, 0.4, 6), LIGHT, 0, 2.3, 0); break;
    case 'signpost': box(g, 0.14, 1.8, 0.14, WOOD, 0, 0.9, 0); box(g, 0.9, 0.28, 0.08, LIGHT, 0.3, 1.55, 0); box(g, 0.9, 0.28, 0.08, 0xfffaf0, -0.3, 1.15, 0); break;
    case 'campfire': for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; add(g, new THREE.DodecahedronGeometry(0.2, 0), STONE, Math.cos(a) * 0.6, 0.12, Math.sin(a) * 0.6); } for (let i = 0; i < 3; i++) { const m = box(g, 0.9, 0.14, 0.14, WOOD, 0, 0.14, 0); m.rotation.y = i * 1.05; } add(g, new THREE.ConeGeometry(0.28, 0.7, 5), lit(0xff8a1f), 0, 0.5, 0).material.color.set(0xff8a1f); break;
    case 'wind chime': box(g, 0.12, 2.0, 0.12, WOOD, 0, 1.0, 0); box(g, 0.8, 0.1, 0.1, WOOD, 0.35, 1.95, 0); for (let i = 0; i < 3; i++) add(g, new THREE.ConeGeometry(0.09, 0.35 + i * 0.1, 5), [0xff9aa8, 0xfffaf0, 0xbfe8ff][i], 0.2 + i * 0.22, 1.6 - i * 0.05, 0); break;
    case 'log stool': add(g, new THREE.CylinderGeometry(0.4, 0.44, 0.5, 7), LIGHT, 0, 0.25, 0); add(g, new THREE.CylinderGeometry(0.34, 0.34, 0.04, 7), 0xf7dc8f, 0, 0.52, 0); break;
    case 'stepping stones': for (let i = 0; i < 4; i++) { const m = add(g, new THREE.CylinderGeometry(0.42, 0.46, 0.1, 6), i % 2 ? 0x5f82ad : STONE, (i - 1.5) * 0.85, 0.06, (i % 2) * 0.3); m.rotation.y = i; } break;
    case 'clay pot': add(g, new THREE.CylinderGeometry(0.42, 0.28, 0.6, 7), 0xc9744a, 0, 0.3, 0); add(g, new THREE.ConeGeometry(0.3, 0.5, 5), 0x4fae52, 0, 0.8, 0); break;
    case 'stick fence': for (let i = 0; i < 5; i++) box(g, 0.1, 0.8 + (i % 2) * 0.15, 0.1, WOOD, (i - 2) * 0.4, 0.4, 0); box(g, 1.9, 0.08, 0.08, LIGHT, 0, 0.5, 0); break;
    case 'blossom wreath': box(g, 0.1, 1.3, 0.1, WOOD, 0, 0.65, 0); add(g, new THREE.TorusGeometry(0.45, 0.14, 5, 9), 0xffb7d0, 0, 1.55, 0); break;
    case 'mushroom stool': add(g, new THREE.CylinderGeometry(0.2, 0.26, 0.45, 6), 0xfff1d6, 0, 0.22, 0); add(g, new THREE.CylinderGeometry(0.2, 0.55, 0.3, 7), 0xe8452c, 0, 0.58, 0); break;
    case 'snow globe': add(g, new THREE.CylinderGeometry(0.4, 0.46, 0.25, 7), WOOD, 0, 0.12, 0); add(g, new THREE.SphereGeometry(0.45, 8, 6), flat(0xdff3ff, { transparent: true, opacity: 0.7 }), 0, 0.62, 0); add(g, new THREE.ConeGeometry(0.14, 0.34, 5), 0x2f8f7a, 0, 0.5, 0); break;
    case 'pearl lamp': box(g, 0.14, 1.3, 0.14, STONE, 0, 0.65, 0); add(g, new THREE.SphereGeometry(0.3, 8, 6), lit(0xdfe9ff), 0, 1.5, 0); break;
    case 'gold trophy': box(g, 0.6, 0.3, 0.6, STONE, 0, 0.15, 0); add(g, new THREE.CylinderGeometry(0.3, 0.12, 0.6, 7), 0xffd93b, 0, 0.75, 0); break;
    case 'coin tree': { const age = Math.min(1, (today - day) / 3); add(g, new THREE.CylinderGeometry(0.12, 0.18, 1.2, 5), WOOD, 0, 0.6, 0); add(g, new THREE.DodecahedronGeometry(0.8, 0), 0x4fae52, 0, 1.7, 0);
      if (age >= 1) for (let i = 0; i < 5; i++) { const a = i * 1.26; add(g, new THREE.CylinderGeometry(0.16, 0.16, 0.05, 7), lit(0xffd93b), Math.cos(a) * 0.75, 1.5 + (i % 2) * 0.4, Math.sin(a) * 0.75).rotation.x = 1.57; } g.scale.setScalar(0.35 + age * 0.65); break; }
    case 'singing stone': { const grown = today - day >= 1; if (!grown) { add(g, new THREE.ConeGeometry(0.12, 0.3, 4), 0x9cf6ff, 0, 0.15, 0); break; }
      const body = add(g, new THREE.CylinderGeometry(0.3, 0.38, 0.9, 6), 0x7fb8c9, 0, 0.45, 0); body.name = 'sway'; add(g, new THREE.SphereGeometry(0.34, 6, 5), 0x7fb8c9, 0, 1.0, 0); for (const sd of [-1, 1]) box(g, 0.08, 0.08, 0.06, 0x141833, sd * 0.13, 1.05, 0.3); box(g, 0.14, 0.14, 0.06, lit(0x9cf6ff), 0, 0.88, 0.32); break; }
    case 'flowers': for (let i = 0; i < 5; i++) { const a = i * 1.26, r = i ? 0.55 : 0, c = BLOOMS[color] ?? BLOOMS.white; add(g, new THREE.CylinderGeometry(0.04, 0.05, 0.4, 4), 0x79c653, Math.cos(a) * r, 0.2, Math.sin(a) * r); add(g, new THREE.ConeGeometry(0.2, 0.22, 5), c, Math.cos(a) * r, 0.48, Math.sin(a) * r).rotation.x = Math.PI; } break;
    case 'tree': { const age = Math.min(1, (today - day) / 3), k = 0.3 + age * 0.7; add(g, new THREE.CylinderGeometry(0.16, 0.22, 1.4, 5), WOOD, 0, 0.7, 0); add(g, new THREE.DodecahedronGeometry(1.0, 0), 0x4fae52, 0, 2.0, 0); g.scale.setScalar(k); break; }
    default: box(g, 0.6, 0.6, 0.6, LIGHT, 0, 0.3, 0);
  }
  return g;
}

function spotModel(kind) {
  const g = new THREE.Group();
  if (kind === 'fossil') { const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283, r = i % 2 ? 0.2 : 0.55; s[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); } const m = add(g, new THREE.ShapeGeometry(s), new THREE.MeshBasicMaterial({ color: 0x4a3a2a }), 0, 0.07, 0); m.rotation.x = -Math.PI / 2; }
  else if (kind === 'glow') { const m = add(g, new THREE.CircleGeometry(0.55, 10), new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.85 }), 0, 0.08, 0); m.rotation.x = -Math.PI / 2; m.name = 'pulse'; }
  else if (kind === 'weed') for (let i = 0; i < 4; i++) { const m = add(g, new THREE.ConeGeometry(0.1, 0.55, 4), 0x3f9a4a, (i - 1.5) * 0.14, 0.26, (i % 2) * 0.12); m.rotation.z = (i - 1.5) * 0.3; }
  else if (kind === 'bottle') { const m = add(g, new THREE.CylinderGeometry(0.14, 0.14, 0.5, 6), flat(0x7fe0c8, { transparent: true, opacity: 0.85 }), 0, 0.16, 0); m.rotation.z = 1.2; add(g, new THREE.CylinderGeometry(0.06, 0.06, 0.2, 5), 0xf7dc8f, 0.3, 0.26, 0).rotation.z = 1.2; }
  else if (kind === 'balloon') { const b = new THREE.Group(); b.name = 'float'; g.add(b); add(b, new THREE.SphereGeometry(0.7, 8, 6), 0xe8452c, 0, 6.2, 0).scale.y = 1.2; box(b, 0.03, 2.0, 0.03, 0xfffaf0, 0, 4.5, 0); box(b, 0.6, 0.6, 0.6, 0xffd93b, 0, 3.3, 0); box(b, 0.64, 0.14, 0.64, 0xe8452c, 0, 3.3, 0); }
  return g;
}

const VARIANT = { otter: ['seal', 0x9aa7b8, 0x8a5a3a], walrus: ['seal', 0x9aa7b8, 0xa67c5b], hare: ['fox', 0xf4f1ea, 0xc9b79a], owl: ['puffin', 0x1d2233, 0x8a6a4a] };
function critter(kindIn) {
  const variant = VARIANT[kindIn], kind = variant ? variant[0] : kindIn;
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const ball = (r, sx, sy, sz, c, x, y, z) => { const m = add(body, new THREE.SphereGeometry(r, 8, 6), c, x, y, z); m.scale.set(sx, sy, sz); return m; };
  const eyes = (y, z, gap) => { for (const s of [-1, 1]) ball(0.06, 1, 1, 0.6, 0x141833, gap * s, y, z); };
  if (kind === 'seal') { ball(0.6, 0.9, 0.75, 1.5, 0x9aa7b8, 0, 0.45, -0.2); ball(0.42, 1, 0.95, 1, 0x9aa7b8, 0, 0.8, 0.65); ball(0.3, 0.9, 0.6, 0.5, 0xdfe6ee, 0, 0.7, 0.95); ball(0.07, 1, 1, 1, 0x141833, 0, 0.78, 1.1); eyes(0.95, 0.98, 0.17);
    for (const s of [-1, 1]) ball(0.25, 1.2, 0.2, 0.7, 0x7d8b9e, 0.6 * s, 0.2, 0.2); ball(0.3, 1.4, 0.2, 0.6, 0x7d8b9e, 0, 0.2, -1.1); }
  else if (kind === 'puffin') { ball(0.4, 1, 1.25, 0.95, 0x1d2233, 0, 0.6, 0); ball(0.33, 0.9, 1.1, 0.55, 0xfdfaf2, 0, 0.52, 0.2); ball(0.2, 1, 1, 0.5, 0xfdfaf2, 0, 0.92, 0.26); eyes(0.95, 0.38, 0.12);
    const beak = add(body, new THREE.ConeGeometry(0.16, 0.34, 4), 0xff5a2a, 0, 0.84, 0.48); beak.rotation.x = Math.PI / 2; beak.scale.x = 0.55; for (const s of [-1, 1]) box(g, 0.18, 0.06, 0.28, 0xff8a1f, 0.14 * s, 0.03, 0.1); }
  else { ball(0.42, 0.9, 0.85, 1.3, 0xf4f1ea, 0, 0.55, -0.1); ball(0.34, 1, 0.95, 1, 0xf4f1ea, 0, 0.95, 0.5); const nose = add(body, new THREE.ConeGeometry(0.16, 0.36, 5), 0xf4f1ea, 0, 0.88, 0.85); nose.rotation.x = Math.PI / 2; ball(0.05, 1, 1, 1, 0x141833, 0, 0.88, 1.03); eyes(1.02, 0.78, 0.15);
    for (const s of [-1, 1]) add(body, new THREE.ConeGeometry(0.13, 0.32, 4), 0xdcd6c8, 0.2 * s, 1.36, 0.42); const tail = ball(0.26, 0.8, 0.8, 1.6, 0xfdfaf2, 0, 0.6, -0.95); tail.rotation.x = -0.5;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(body, 0.14, 0.3, 0.14, 0xdcd6c8, 0.22 * sx, 0.15, -0.1 + sz * 0.4); const sc = add(body, new THREE.TorusGeometry(0.3, 0.07, 5, 8), 0x6a2fc4, 0, 0.78, 0.36); sc.rotation.x = 1.1; }
  const shadow = add(g, new THREE.CircleGeometry(0.6, 10), new THREE.MeshBasicMaterial({ color: 0x1d2545, transparent: true, opacity: 0.2, depthWrite: false }), 0, 0.02, 0); shadow.rotation.x = -Math.PI / 2;
  if (variant) body.traverse(o => { if (o.material?.color?.getHex() === variant[1]) o.material.color.set(variant[2]); });
  if (kindIn === 'hare') body.children.filter(o => o.geometry?.type === 'ConeGeometry' && o.position.y > 1.3).forEach(o => { o.scale.y = 2.6; o.position.y += 0.4; });
  if (kindIn === 'walrus') for (const sd of [-1, 1]) add(body, new THREE.ConeGeometry(0.05, 0.4, 4), 0xfffaf0, 0.12 * sd, 0.5, 1.0).rotation.x = Math.PI;
  g.scale.setScalar(1.25); g.userData.body = body;
  return g;
}

// A visitor: a small gull with a name over it.
function gull(name) {
  const g = new THREE.Group(), b = new THREE.Group(); g.add(b); b.position.y = 1.6;
  const s = add(b, new THREE.SphereGeometry(0.3, 7, 5), 0xfffaf0); s.scale.set(0.8, 0.8, 1.3);
  add(b, new THREE.SphereGeometry(0.2, 6, 5), 0xfffaf0, 0, 0.22, 0.32); const bk = add(b, new THREE.ConeGeometry(0.07, 0.24, 4), 0xffa62b, 0, 0.2, 0.55); bk.rotation.x = Math.PI / 2;
  const wings = [-1, 1].map(sd => { const w = add(b, new THREE.BoxGeometry(0.7, 0.05, 0.36), 0xcfd8e3, sd * 0.5, 0.05, 0); return w; });
  g.add(label(name)); g.userData = { body: b, wings };
  return g;
}
function label(text, y = 2.6) {
  const c = document.createElement('canvas'), x = c.getContext('2d'); x.font = '800 30px Nunito, sans-serif';
  c.width = Math.ceil(x.measureText(text).width) + 28; c.height = 48;
  x.font = '800 30px Nunito, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 7; x.strokeStyle = '#1d2545'; x.fillStyle = '#fffaf0'; x.strokeText(text, c.width / 2, 26); x.fillText(text, c.width / 2, 26);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false })); sp.scale.set(c.width / 95, 0.5, 1); sp.position.y = y; sp.name = 'label';
  return sp;
}

export function buildDynamic(scene) {
  const decorG = new THREE.Group(), spotG = new THREE.Group(), npcG = new THREE.Group(); scene.add(decorG, spotG, npcG);
  const glows = [], spots = new Map(), npcs = new Map();
  let decorKey = '';

  function setDecor(list, today) {
    const key = JSON.stringify(list) + Math.floor(today);
    if (key === decorKey) return; decorKey = key;
    decorG.clear(); glows.length = 0;
    list.forEach((d, i) => { const m = decorModel(d.kind, d.day, today, glows, d.color); m.position.set(d.x, 0, d.z); m.rotation.y = (i * 2.4) % 6.283; m.userData.sing = d.kind === 'singing stone' && today - d.day >= 1; decorG.add(m); });
  }
  function setSpots(list) {
    const seen = new Set(list.map(s => s.id));
    for (const [id, m] of spots) if (!seen.has(id)) { spotG.remove(m); spots.delete(id); }
    for (const s of list) if (!spots.has(s.id)) { const m = spotModel(s.kind); m.position.set(s.x, 0, s.z); spotG.add(m); spots.set(s.id, m); }
  }
  function update(dt, t, npcList, night) {
    for (const m of glows) m.emissiveIntensity = 0.3 + night * 1.6;
    for (const m of spots.values()) { const f = m.getObjectByName('float'); if (f) { f.position.y = Math.sin(t * 1.2) * 0.4; f.rotation.y = t * 0.4; } const pu = m.getObjectByName('pulse'); if (pu) pu.scale.setScalar(1 + Math.sin(t * 3) * 0.2); }
    for (const d of decorG.children) if (d.userData.sing) d.rotation.z = Math.sin(t * 3 + d.id) * 0.12;
    for (const n of npcList || []) {
      let m = npcs.get(n.name);
      if (!m) { m = critter(n.kind); m.position.set(n.x, 0, n.z); npcG.add(m); npcs.set(n.name, m); }
      m.visible = n.out;
      const k = 1 - Math.exp(-dt * 6);
      m.position.x += (n.x - m.position.x) * k; m.position.z += (n.z - m.position.z) * k;
      let dh = n.heading - m.rotation.y; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); m.rotation.y += dh * k;
      const b = m.userData.body, ph = t + m.id;
      b.rotation.set(0, 0, 0); b.position.y = 0; b.scale.setScalar(1);
      if (n.moving) { const f = n.anim === 'jog' ? 14 : 8; b.rotation.z = Math.sin(ph * f) * 0.12; b.position.y = Math.abs(Math.sin(ph * f)) * (n.anim === 'jog' ? 0.12 : 0.05); }
      else if (n.anim === 'sing') { b.rotation.z = Math.sin(ph * 2.5) * 0.14; b.scale.setScalar(1 + Math.max(0, Math.sin(ph * 5)) * 0.06); }
      else if (n.anim === 'jump') { b.position.y = Math.abs(Math.sin(ph * 5)) * 0.45; }
      else if (n.anim === 'peck') { b.rotation.x = Math.max(0, Math.sin(ph * 3)) * 0.4; }
      else if (n.anim === 'lie') { b.rotation.z = 1.2; b.position.y = 0.25; }
      else b.position.y = Math.sin(ph * 2) * 0.01;
      let tag = m.getObjectByName('label'); const want = n.doing ? `${n.name}: ${n.doing}` : n.name;
      if (!tag || tag.userData.text !== want) { if (tag) m.remove(tag); tag = label(want, 2.2); tag.userData.text = want; m.add(tag); }
    }
  }
  // whoever is at the campsite today
  let camperKey = '', camperMesh = null;
  function setCamper(c) {
    const key = c ? c.name : ''; if (key === camperKey) return; camperKey = key;
    if (camperMesh) { scene.remove(camperMesh); camperMesh = null; }
    if (!c) return;
    const s = site('camp'), p = PLACES.camp; camperMesh = critter(c.kind); const lx = -1.6, lz = 2.6; camperMesh.position.set(s.x + lx * Math.cos(s.ry) + lz * Math.sin(s.ry), 0, s.z - lx * Math.sin(s.ry) + lz * Math.cos(s.ry)); camperMesh.rotation.y = s.ry; camperMesh.add(label(c.name, 2.2)); scene.add(camperMesh);
  }
  // visitors' gulls
  const gulls = new Map(), gullG = new THREE.Group(); scene.add(gullG);
  function setVisitors(list, t, dt) {
    const seen = new Set(list.map(v => v.id));
    for (const [id, m] of gulls) if (!seen.has(id)) { gullG.remove(m); gulls.delete(id); }
    for (const v of list) {
      let m = gulls.get(v.id); if (!m) { m = gull(v.name); m.position.set(v.x, 0, v.z); gullG.add(m); gulls.set(v.id, m); }
      const dx = v.x - m.position.x, dz = v.z - m.position.z, dist = Math.hypot(dx, dz), flying = dist > 0.3;
      if (flying) { const st = Math.min(dist, 9 * dt); m.position.x += dx / dist * st; m.position.z += dz / dist * st; m.rotation.y = Math.atan2(dx, dz); }
      const waving = Date.now() - v.wave < 2500, b = m.userData.body;
      b.position.y = flying ? 2.6 + Math.sin(t * 3 + v.id) * 0.2 : 0.35 + (waving ? Math.abs(Math.sin(t * 9)) * 0.5 : 0);
      m.userData.wings.forEach((w, i) => { w.rotation.z = (i ? -1 : 1) * (flying || waving ? Math.sin(t * 14) * 0.7 : -0.9); });
      m.getObjectByName('label').position.y = b.position.y + 1.0;
    }
  }
  return { setDecor, setSpots, setCamper, setVisitors, update };
}
