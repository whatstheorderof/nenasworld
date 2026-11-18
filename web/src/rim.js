// The edge of an island: a stone coping wall, a wooden fence on top of it (square posts with
// brass bands, arches and a ring holding a gold star), a lantern on every few posts, and vines
// with little white flowers trailing over the edge and down the earth below.
// Everything is instanced, so the whole rim is a handful of draw calls.
import * as THREE from 'three';
import { whenKit, kitModel } from './kit.js';

const L = 3.0;   // one fence section, post to post (art/island.blend: RimFence)
const lam = c => new THREE.MeshLambertMaterial({ color: c, flatShading: true });

// runs: polylines [[x, z], ...] along the edge, outermost side to the right of travel doesn't matter.
// opts: { y: ground height, glow: () => material that lights at night, rand, outward: (x, z) => [nx, nz] }
export function buildRim(parent, runs, { y = 0, glow, rand = Math.random, outward } = {}) {
  const sections = [], copes = [], lanterns = [], vines = [];
  const top = y + 0.42;   // the coping's top, where the fence stands
  for (const run of runs) {
    // resample the run into equal fence sections
    const pts = [run[0]]; let carry = 0;
    for (let i = 1; i < run.length; i++) { const [x0, z0] = run[i - 1], [x1, z1] = run[i], len = Math.hypot(x1 - x0, z1 - z0);
      let u = L - carry; while (u <= len) { pts.push([x0 + (x1 - x0) * u / len, z0 + (z1 - z0) * u / len]); u += L; } carry = len - (u - L); }
    for (let i = 0; i < pts.length - 1; i++) { const [x0, z0] = pts[i], [x1, z1] = pts[i + 1]; sections.push({ x: x0, z: z0, a: Math.atan2(z1 - z0, x1 - x0), len: Math.hypot(x1 - x0, z1 - z0) }); if (i % 4 === 0) lanterns.push([x0, z0]); }
    const [ex, ez] = pts[pts.length - 1]; sections.push({ x: ex, z: ez, a: 0, len: 0.01 });   // the last post on its own
    // coping blocks under the whole run, and vines hanging off its outer side
    for (let i = 1; i < run.length; i++) { const [x0, z0] = run[i - 1], [x1, z1] = run[i], len = Math.hypot(x1 - x0, z1 - z0), a = Math.atan2(z1 - z0, x1 - x0);
      for (let u = 0; u < len; u += 1.45) { const x = x0 + (x1 - x0) * u / len, z = z0 + (z1 - z0) * u / len; copes.push({ x, z, a, s: 0.92 + rand() * 0.1, h: rand() });
        if (rand() < 0.42) vines.push({ x, z, len: 1.2 + rand() * rand() * 5.5, seed: rand() * 100 }); } }
  }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), p = new THREE.Vector3(), sc = new THREE.Vector3();
  const inst = (geo, mat, list, set) => { const im = new THREE.InstancedMesh(geo, mat, list.length); list.forEach((it, i) => { set(it, i); im.setMatrixAt(i, m4); }); parent.add(im); return im; };

  // stone coping: chunky blocks in a few greys
  { const im = inst(new THREE.BoxGeometry(1.42, 0.55, 1.3), lam(0xffffff), copes, (c) => { q.setFromAxisAngle(up, -c.a); m4.compose(p.set(c.x, y + 0.15, c.z), q, sc.set(1, c.s, 1)); });
    const tones = [0xc9c3b6, 0xbab4a8, 0xd6d0c2, 0xb0ab9f].map(h => new THREE.Color(h)); copes.forEach((c, i) => im.setColorAt(i, tones[Math.floor(c.h * 4)])); }

  // the fence and lanterns, from the kit
  const lampGlow = glow ? glow() : lam(0xffe2a0);
  whenKit(() => {
    const fence = kitModel('RimFence'); if (fence) for (const m of fence.children) inst(m.geometry, m.material, sections, s => { q.setFromAxisAngle(up, -s.a); m4.compose(p.set(s.x, top, s.z), q, sc.set(s.len / L, 1, 1)); });
    const lamp = kitModel('RimLantern', { glow_rimlamp: lampGlow }); if (lamp) for (const m of lamp.children) inst(m.geometry, m.material, lanterns, ([x, z]) => { q.identity(); m4.compose(p.set(x, top + 1.65, z), q, sc.set(1, 1, 1)); });
  });

  // vines: strands of leaves dropping over the outer edge, a white flower here and there
  const leaves = [], flowers = [];
  for (const v of vines) {
    const [nx, nz] = outward ? outward(v.x, v.z) : [0, 0];
    let px = v.x + nx * 0.62, pz = v.z + nz * 0.62, py = top - 0.05;
    const n = Math.round(v.len / 0.22);
    for (let k = 0; k < n; k++) {
      const t = k / n, sway = Math.sin(v.seed + k * 0.7) * 0.12;
      px += nx * (k < 2 ? 0.12 : 0.02) + Math.cos(v.seed) * sway * 0.3; pz += nz * (k < 2 ? 0.12 : 0.02) + Math.sin(v.seed) * sway * 0.3; py -= k < 2 ? 0.08 : 0.22;
      leaves.push({ x: px + Math.cos(k * 2.4 + v.seed) * 0.12, y: py, z: pz + Math.sin(k * 2.4 + v.seed) * 0.12, r: k * 2.4 + v.seed, s: 0.75 + 0.5 * (1 - t) });
      if ((k + Math.floor(v.seed)) % 5 === 2) flowers.push({ x: px + nx * 0.08, y: py, z: pz + nz * 0.08, r: v.seed + k });
    }
  }
  const leafGeo = new THREE.OctahedronGeometry(0.16, 0); leafGeo.scale(1.1, 0.5, 0.7);
  const lm = inst(leafGeo, lam(0xffffff), leaves, l => { q.setFromEuler(new THREE.Euler(l.r, l.r * 1.3, l.r * 0.7)); m4.compose(p.set(l.x, l.y, l.z), q, sc.setScalar(l.s)); });
  const greens = [0x5fae4f, 0x76c159, 0x4f9a48, 0x8fcf6a].map(h => new THREE.Color(h)); leaves.forEach((l, i) => lm.setColorAt(i, greens[Math.floor(Math.abs(Math.sin(l.r * 7.1)) * 4) % 4]));
  const petal = new THREE.IcosahedronGeometry(0.11, 0); petal.scale(1, 0.55, 1);
  inst(petal, lam(0xfffbf2), flowers, f => { q.setFromEuler(new THREE.Euler(f.r, f.r, 0)); m4.compose(p.set(f.x, f.y, f.z), q, sc.setScalar(1)); });
  inst(new THREE.IcosahedronGeometry(0.045, 0), lam(0xffd65c), flowers, f => { m4.compose(p.set(f.x, f.y + 0.03, f.z), q.identity(), sc.setScalar(1)); });
  return { sections: sections.length, vines: vines.length };
}

// a stone promenade just inside a round rim, two rows of slabs; skip(a) leaves gaps (beach, waterfall)
export function buildPromenade(parent, R, { y = 0, skip = () => false, rand = Math.random } = {}) {
  const slabs = [];
  for (const [r0, w] of [[R - 1.85, 1.0], [R - 2.9, 1.0]]) {
    const n = Math.round(Math.PI * 2 * r0 / 1.05);
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + (r0 % 1); if (skip(Math.atan2(Math.sin(a), Math.cos(a)))) continue; slabs.push({ x: Math.cos(a) * r0, z: Math.sin(a) * r0, a, w, h: rand() }); }
  }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), p = new THREE.Vector3(), sc = new THREE.Vector3(1, 1, 1);
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.98, 0.08, 0.96), lam(0xffffff), slabs.length);
  const tones = [0xe3ddd0, 0xd5cfc2, 0xebe6da, 0xcfc8ba].map(h => new THREE.Color(h));
  slabs.forEach((s, i) => { q.setFromAxisAngle(up, -s.a + Math.PI / 2 + (s.h - 0.5) * 0.08); m4.compose(p.set(s.x, y + 0.04, s.z), q, sc); im.setMatrixAt(i, m4); im.setColorAt(i, tones[Math.floor(s.h * 4)]); });
  parent.add(im); return im;
}
