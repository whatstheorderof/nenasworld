// The island's model kit, made in Blender (art/island.blend -> web/public/models/island.glb).
// Each asset is merged into one mesh per material so a hundred trees stay cheap to draw.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';   // models are meshopt-compressed
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { pastel } from './palette.js';

let roots = null;
const waiting = [], merged = {}, mats = {};
new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).load(`${import.meta.env.BASE_URL}models/island.glb`, gltf => {
  roots = {}; for (const o of gltf.scene.children) roots[o.name] = o;
  gltf.scene.updateMatrixWorld(true);
  for (const f of waiting.splice(0)) try { f(); } catch (e) { console.warn('[kit]', e); }
  loading(1, true);
}, xhr => loading(xhr.total ? xhr.loaded / xhr.total : null, false, xhr.loaded), err => { console.warn('[kit] island models did not load, keeping the simple ones', err); loading(1, true); });

// a little pill at the bottom while the island's models come in, so the simple stand-ins don't look final
function loading(frac, done, bytes = 0) {
  const el = document.getElementById('loading'); if (!el) return;
  if (done) { el.classList.add('done'); setTimeout(() => el.remove(), 700); return; }
  el.hidden = false;
  el.querySelector('i').style.width = frac != null ? `${Math.round(frac * 100)}%` : `${Math.min(95, bytes / 70000)}%`;   // no size from the server: about 7 MB
}

// Compressed models store positions as packed integers; unpack to plain floats before transforming.
function plain(geo) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone(), out = new THREE.BufferGeometry();
  for (const k of ['position', 'normal']) {
    const a = g.attributes[k]; if (!a) continue;
    const f = new Float32Array(a.count * 3); for (let i = 0; i < a.count; i++) { f[i * 3] = a.getX(i); f[i * 3 + 1] = a.getY(i); f[i * 3 + 2] = a.getZ(i); }
    out.setAttribute(k, new THREE.BufferAttribute(f, 3));
  }
  return out;
}

// Run `f` once the kit is here (straight away if it already is).
export const whenKit = f => { if (roots) { try { f(); } catch (e) { console.warn('[kit]', e); } } else waiting.push(f); };

// One shared material per Blender material name, unless the caller swaps it for its own.
function material(src) {
  if (mats[src.name]) return mats[src.name];
  const col = src.color.clone(); if (/^(isl_|house_)/.test(src.name)) col.setHex(pastel(col.getHex()));
  return mats[src.name] = Object.assign(new THREE.MeshLambertMaterial({ color: col, flatShading: !/^chr_/.test(src.name) }), { name: src.name });   // characters are smooth, like Nena
}

// Cloth that moves in the wind: bunting pennants and little flags. Their pieces all have the model's root as
// their origin, so they can't be swung as objects; instead each vertex gets a weight (0 where it's tied on,
// 1 at the free edge) and the vertex shader waves it across the cloth's thin side (model z, Blender's y).
// (X_flag pieces are flagstones, not flags.)
const FLUTTER = /(_Bunt\d+|_Flag\d*|DomeFlag)$/;
export const flutter = { uT: { value: 0 }, uW: { value: 0.3 } };
function clothWeights(g, name, poles) {
  const pos = g.attributes.position, n = pos.count, box = new THREE.Box3().setFromBufferAttribute(pos), w = new Float32Array(n);
  const c = box.getCenter(new THREE.Vector3()); let pole = null, best = 1.5;
  if (!/Bunt/.test(name)) for (const b of poles) { const pc = b.getCenter(new THREE.Vector3()), d = Math.hypot(pc.x - c.x, pc.z - c.z); if (d < best && c.y > b.min.y && c.y < b.max.y + 0.5) { best = d; pole = pc; } }
  if (pole) {   // flag: tied along the pole, the far end flaps most
    let far = 0; for (let i = 0; i < n; i++) far = Math.max(far, Math.hypot(pos.getX(i) - pole.x, pos.getZ(i) - pole.z));
    let near = far; for (let i = 0; i < n; i++) near = Math.min(near, Math.hypot(pos.getX(i) - pole.x, pos.getZ(i) - pole.z));
    for (let i = 0; i < n; i++) w[i] = (Math.hypot(pos.getX(i) - pole.x, pos.getZ(i) - pole.z) - near) / Math.max(0.01, far - near);
  } else { const h = Math.max(0.01, box.max.y - box.min.y); for (let i = 0; i < n; i++) w[i] = (box.max.y - pos.getY(i)) / h; }   // pennant: hangs from its string
  g.setAttribute('flut', new THREE.BufferAttribute(w, 1));
}
const flutMats = new Map();
function flutterMat(base) {
  if (flutMats.has(base)) return flutMats.get(base);
  const m = base.clone(); m.side = THREE.DoubleSide;
  m.onBeforeCompile = sh => { Object.assign(sh.uniforms, flutter);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float flut; uniform float uT, uW;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float ph = uT * (3.0 + uW * 5.0) + position.x * 2.3 + position.y * 1.7;
        transformed.z += (sin(ph) * 0.7 + sin(ph * 2.3 + 1.0) * 0.3) * flut * (0.05 + uW * 0.16);
        transformed.y -= flut * flut * (1.0 - uW) * 0.03;`); };
  m.customProgramCacheKey = () => 'flutter';
  flutMats.set(base, m); return m;
}

// A merged copy of an asset: a Group holding one mesh per material.
// `swap` maps Blender material names to materials (e.g. the orchard's seasonal leaves).
// `keep`: names of parts left out of the merge and added as their own objects (so code can move them, e.g. windmill sails)
export function kitModel(name, swap = {}, keep = []) {
  const root = roots?.[name]; if (!root) return null;
  const kept = o => { for (let a = o; a && a !== root; a = a.parent) if (keep.includes(a.name)) return true; return false; };
  if (!merged[name]) {
    const inv = root.matrixWorld.clone().invert(), byMat = {};
    const poles = []; root.traverse(o => { if (o.isMesh && /Pole/.test(o.name)) poles.push(new THREE.Box3().setFromObject(o).applyMatrix4(inv)); });
    root.traverse(o => { if (!o.isMesh || kept(o)) return;
      const g = plain(o.geometry); g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
      const fl = FLUTTER.test(o.name); if (fl) clothWeights(g, o.name, poles);
      (byMat[(fl ? '~' : '') + o.material.name] ||= { src: o.material, fl, geos: [] }).geos.push(g); });
    merged[name] = Object.values(byMat).map(({ src, fl, geos }) => ({ src, fl, geo: mergeGeometries(geos) }));
  }
  const g = new THREE.Group();
  for (const { src, fl, geo } of merged[name]) { const m = swap[src.name] || material(src); g.add(new THREE.Mesh(geo, fl ? flutterMat(m) : m)); }
  const inv = root.matrixWorld.clone().invert();
  for (const k of keep) { const n = root.getObjectByName(k); if (!n) continue;
    const c = n.clone(true); new THREE.Matrix4().multiplyMatrices(inv, n.matrixWorld).decompose(c.position, c.quaternion, c.scale);
    c.traverse(o => { if (o.isMesh) o.material = swap[o.material.name] || material(o.material); }); g.add(c); }
  return g;
}

// Boxes (in the asset's own space) round the parts of an asset whose names match `re`: where things are,
// after kitModel has merged the names away.
export function kitBoxes(name, re) {
  const root = roots?.[name]; if (!root) return [];
  const inv = root.matrixWorld.clone().invert(), out = [];
  root.traverse(o => { if (re.test(o.name)) out.push(new THREE.Box3().setFromObject(o).applyMatrix4(inv)); });
  return out;
}

// A full copy of an asset's parts with its own names and children, for things the code
// reaches into (the house's extensions, its sign spot). Materials are swapped as above.
export function kitParts(name, swap = {}) {
  const root = roots?.[name]; if (!root) return null;
  const c = root.clone(true); c.position.set(0, 0, 0);
  c.traverse(o => { if (o.isMesh) o.material = swap[o.material.name] || material(o.material); });
  return c;
}

// The plain geometry of an asset (for instanced things like fence planks).
export function kitGeometry(name) { const m = kitModel(name); return m ? m.children[0].geometry : null; }

// A building: everything merged per material for speed, except its moving sections. Nodes
// named `Hero` (the rooftop object) or `Live<Name>` (e.g. LiveDome) stay their own groups so the
// site can bob, turn or light them. Named empties come back as positions in `anchors`.
const builds = {};
const LIVE = /^(Hero|Live[A-Z][A-Za-z]*?)\d*$/;
export function kitBuilding(name, swap = {}) {
  const root = roots?.[name]; if (!root) return null;
  if (!builds[name]) {
    const inv = root.matrixWorld.clone().invert(), lives = new Map(), anchors = {};
    root.traverse(o => { if (o !== root && LIVE.test(o.name)) lives.set(o, o.name.match(LIVE)[1]); });
    const owner = o => { for (let p = o.parent; p; p = p.parent) if (lives.has(p)) return p; return null; };
    const packs = { body: {} }; for (const n of lives.values()) packs[n] = {};
    const poles = []; root.traverse(o => { if (o.isMesh && /Pole/.test(o.name)) poles.push(new THREE.Box3().setFromObject(o).applyMatrix4(inv)); });
    root.traverse(o => {
      if (!o.isMesh) { if (o !== root) anchors[o.name.replace(/\d{3}$/, '')] = new THREE.Vector3().setFromMatrixPosition(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld)); return; }
      const lp = owner(o), key = lp ? lives.get(lp) : 'body';
      const g = plain(o.geometry); g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(lp ? lp.matrixWorld.clone().invert() : inv, o.matrixWorld));
      const fl = FLUTTER.test(o.name); if (fl) clothWeights(g, o.name, lp ? [] : poles);
      (packs[key][(fl ? '~' : '') + o.material.name] ||= { src: o.material, fl, geos: [] }).geos.push(g);
    });
    const pack = byMat => Object.values(byMat).map(({ src, fl, geos }) => ({ src, fl, geo: mergeGeometries(geos) }));
    builds[name] = { packs: Object.fromEntries(Object.entries(packs).map(([k, v]) => [k, pack(v)])), anchors };
  }
  const b = builds[name], make = list => { const g = new THREE.Group(); for (const { src, fl, geo } of list) { const m = swap[src.name] || material(src); g.add(new THREE.Mesh(geo, fl ? flutterMat(m) : m)); } return g; };
  const group = make(b.packs.body), parts = {};
  for (const [k, list] of Object.entries(b.packs)) if (k !== 'body') { parts[k] = make(list); if (b.anchors[k]) parts[k].position.copy(b.anchors[k]); group.add(parts[k]); }
  return { group, hero: parts.Hero || new THREE.Group(), parts, anchors: b.anchors };
}
