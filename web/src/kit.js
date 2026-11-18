// The island's model kit, made in Blender (art/island.blend -> web/public/models/island.glb).
// Each asset is merged into one mesh per material so a hundred trees stay cheap to draw.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

let roots = null;
const waiting = [], merged = {}, mats = {};
new GLTFLoader().load(`${import.meta.env.BASE_URL}models/island.glb`, gltf => {
  roots = {}; for (const o of gltf.scene.children) roots[o.name] = o;
  gltf.scene.updateMatrixWorld(true);
  for (const f of waiting.splice(0)) f();
}, undefined, err => console.warn('[kit] island models did not load, keeping the simple ones', err));

// Run `f` once the kit is here (straight away if it already is).
export const whenKit = f => { if (roots) f(); else waiting.push(f); };

// One shared material per Blender material name, unless the caller swaps it for its own.
function material(src) {
  return mats[src.name] ||= Object.assign(new THREE.MeshLambertMaterial({ color: src.color.clone() }), { name: src.name });
}

// A merged copy of an asset: a Group holding one mesh per material.
// `swap` maps Blender material names to materials (e.g. the orchard's seasonal leaves).
export function kitModel(name, swap = {}) {
  const root = roots?.[name]; if (!root) return null;
  if (!merged[name]) {
    const inv = root.matrixWorld.clone().invert(), byMat = {};
    root.traverse(o => { if (!o.isMesh) return;
      const g = o.geometry.clone(); for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
      g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
      (byMat[o.material.name] ||= { src: o.material, geos: [] }).geos.push(g.index ? g.toNonIndexed() : g); });
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
