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

// A merged copy of an asset: a Group holding one mesh per material.
// `swap` maps Blender material names to materials (e.g. the orchard's seasonal leaves).
// `keep`: names of parts left out of the merge and added as their own objects (so code can move them, e.g. windmill sails)
export function kitModel(name, swap = {}, keep = []) {
  const root = roots?.[name]; if (!root) return null;
  const kept = o => { for (let a = o; a && a !== root; a = a.parent) if (keep.includes(a.name)) return true; return false; };
  if (!merged[name]) {
    const inv = root.matrixWorld.clone().invert(), byMat = {};
    root.traverse(o => { if (!o.isMesh || kept(o)) return;
      const g = plain(o.geometry); g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
      (byMat[o.material.name] ||= { src: o.material, geos: [] }).geos.push(g); });
    merged[name] = Object.values(byMat).map(({ src, geos }) => ({ src, geo: mergeGeometries(geos) }));
  }
  const g = new THREE.Group();
  for (const { src, geo } of merged[name]) g.add(new THREE.Mesh(geo, swap[src.name] || material(src)));
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
    root.traverse(o => {
      if (!o.isMesh) { if (o !== root) anchors[o.name.replace(/\d{3}$/, '')] = new THREE.Vector3().setFromMatrixPosition(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld)); return; }
      const lp = owner(o), key = lp ? lives.get(lp) : 'body';
      const g = plain(o.geometry); g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(lp ? lp.matrixWorld.clone().invert() : inv, o.matrixWorld));
      (packs[key][o.material.name] ||= { src: o.material, geos: [] }).geos.push(g);
    });
    const pack = byMat => Object.values(byMat).map(({ src, geos }) => ({ src, geo: mergeGeometries(geos) }));
    builds[name] = { packs: Object.fromEntries(Object.entries(packs).map(([k, v]) => [k, pack(v)])), anchors };
  }
  const b = builds[name], make = list => { const g = new THREE.Group(); for (const { src, geo } of list) g.add(new THREE.Mesh(geo, swap[src.name] || material(src))); return g; };
  const group = make(b.packs.body), parts = {};
  for (const [k, list] of Object.entries(b.packs)) if (k !== 'body') { parts[k] = make(list); if (b.anchors[k]) parts[k].position.copy(b.anchors[k]); group.add(parts[k]); }
  return { group, hero: parts.Hero || new THREE.Group(), parts, anchors: b.anchors };
}
