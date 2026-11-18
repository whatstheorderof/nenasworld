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
}, undefined, err => console.warn('[kit] island models did not load, keeping the simple ones', err));

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
  return mats[src.name] = Object.assign(new THREE.MeshLambertMaterial({ color: col, flatShading: true }), { name: src.name });
}

// A merged copy of an asset: a Group holding one mesh per material.
// `swap` maps Blender material names to materials (e.g. the orchard's seasonal leaves).
export function kitModel(name, swap = {}) {
  const root = roots?.[name]; if (!root) return null;
  if (!merged[name]) {
    const inv = root.matrixWorld.clone().invert(), byMat = {};
    root.traverse(o => { if (!o.isMesh) return;
      const g = plain(o.geometry); g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
      (byMat[o.material.name] ||= { src: o.material, geos: [] }).geos.push(g); });
    merged[name] = Object.values(byMat).map(({ src, geos }) => ({ src, geo: mergeGeometries(geos) }));
  }
  const g = new THREE.Group();
  for (const { src, geo } of merged[name]) g.add(new THREE.Mesh(geo, swap[src.name] || material(src)));
  return g;
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

// A building: everything merged per material for speed, except its rooftop `Hero` object,
// which stays its own group so it can bob or turn. Named empties come back as positions.
const builds = {};
export function kitBuilding(name, swap = {}) {
  const root = roots?.[name]; if (!root) return null;
  if (!builds[name]) {
    const inv = root.matrixWorld.clone().invert(); let heroNode = null; root.traverse(o => { if (!heroNode && /^Hero\d*$/.test(o.name)) heroNode = o; });
    const heroInv = heroNode ? heroNode.matrixWorld.clone().invert() : null;
    const body = {}, hero = {}, anchors = {};
    root.traverse(o => {
      if (!o.isMesh) { if (o !== root) anchors[o.name.replace(/\d{3}$/, '')] = new THREE.Vector3().setFromMatrixPosition(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld)); return; }
      let inHero = false; for (let p = o.parent; p; p = p.parent) if (p === heroNode) inHero = true;
      const g = plain(o.geometry); g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inHero ? heroInv : inv, o.matrixWorld));
      ((inHero ? hero : body)[o.material.name] ||= { src: o.material, geos: [] }).geos.push(g);
    });
    const pack = byMat => Object.values(byMat).map(({ src, geos }) => ({ src, geo: mergeGeometries(geos) }));
    builds[name] = { body: pack(body), hero: pack(hero), anchors };
  }
  const b = builds[name], make = list => { const g = new THREE.Group(); for (const { src, geo } of list) g.add(new THREE.Mesh(geo, swap[src.name] || material(src))); return g; };
  const group = make(b.body), hero = make(b.hero);
  if (b.anchors.Hero) { hero.position.copy(b.anchors.Hero); group.add(hero); }
  return { group, hero, anchors: b.anchors };
}
