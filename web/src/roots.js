// Roots hanging from under an island: a few thick gnarled roots curling out of the earth,
// and a curtain of long pale strands, some in bundles and a few hanging in loops, that sway
// slowly in the wind. All one merged mesh with a little vertex shader for the sway.
import * as THREE from 'three';

const uniforms = { uTime: { value: 0 }, uWind: { value: 0.3 } };

// a tapered tube along a curve; `along` (0 at the top, 1 at the tip) and `phase` drive the sway
function strand(curve, r0, r1, segs, radial, phase, colour, out) {
  const pts = curve.getSpacedPoints(segs), up = new THREE.Vector3(0, 1, 0), side = new THREE.Vector3(), nrm = new THREE.Vector3(), t = new THREE.Vector3();
  const base = out.pos.length / 3;
  for (let i = 0; i <= segs; i++) {
    const u = i / segs; curve.getTangentAt(Math.min(u, 0.999), t);
    side.crossVectors(t, Math.abs(t.y) > 0.95 ? new THREE.Vector3(1, 0, 0) : up).normalize(); nrm.crossVectors(side, t).normalize();
    const r = r0 + (r1 - r0) * Math.pow(u, 0.7);
    for (let k = 0; k < radial; k++) {
      const a = k / radial * Math.PI * 2, cx = Math.cos(a), sy = Math.sin(a);
      out.pos.push(pts[i].x + (side.x * cx + nrm.x * sy) * r, pts[i].y + (side.y * cx + nrm.y * sy) * r, pts[i].z + (side.z * cx + nrm.z * sy) * r);
      out.along.push(u); out.phase.push(phase); out.col.push(colour.r, colour.g, colour.b);
    }
  }
  for (let i = 0; i < segs; i++) for (let k = 0; k < radial; k++) {
    const a = base + i * radial + k, b = base + i * radial + (k + 1) % radial, c = a + radial, d = b + radial;
    out.idx.push(a, c, b, b, c, d);
  }
}

// shape: { top: y of the underside's flat bottom, bottomR: its radius, sideTop/sideR: where the sloping side starts }
// count/segs/radial: how many strands and how finely they're made (lighter for the far islands); innerR leaves a hole in the curtain
export function buildRoots(parent, { top = -8.6, bottomR = 42, sideY = -4.5, sideR = 52, seed = 7, count = 95, segs = 18, radial = 5, thick = 16, innerR = 0, under = null, lenK = 1 } = {}) {
  // under(r): the height of the underside at radius r, for islands that taper to a point (strands start right on it)
  let s = seed; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const out = { pos: [], along: [], phase: [], col: [], idx: [] };
  const pale = [0xf6eedd, 0xece0c6, 0xfbf5e8, 0xe2d4b8].map(h => new THREE.Color(h)), dark = [0x9a7a5e, 0x8a6a50, 0xa8886a].map(h => new THREE.Color(h));
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  // a long strand from (x, y, z) hanging down `len`, wandering a little
  const hang = (x, y, z, len, r0, col, loose = 1) => {
    const n = 7, pts = [V(x, y, z)], ph = rnd() * 6.28, dx = (rnd() - 0.5) * 0.25, dz = (rnd() - 0.5) * 0.25;
    for (let i = 1; i <= n; i++) { const f = i / n; pts.push(V(x + Math.sin(f * 4 + ph) * 0.9 * loose * f + dx * len * f, y - len * f, z + Math.cos(f * 3.3 + ph) * 0.9 * loose * f + dz * len * f)); }
    strand(new THREE.CatmullRomCurve3(pts), r0, 0.06, segs, radial, ph, col, out);
  };
  // 1. thick gnarled roots curling out from the sloping side and down, each fraying into strands
  for (let i = 0; i < thick; i++) {
    const a = i / thick * Math.PI * 2 + rnd() * 0.3, r = sideR - rnd() * 4, y = under ? under(r) + 1.2 : sideY - rnd() * 2, out1 = 4 + rnd() * 5, drop = 8 + rnd() * 10;
    const p0 = V(Math.cos(a) * r, y, Math.sin(a) * r), p1 = V(Math.cos(a) * (r + out1 * 0.6), y - drop * 0.25, Math.sin(a) * (r + out1 * 0.6)), p2 = V(Math.cos(a + 0.04) * (r + out1), y - drop * 0.7, Math.sin(a + 0.04) * (r + out1)), p3 = V(Math.cos(a + 0.06) * (r + out1 * 0.8), y - drop, Math.sin(a + 0.06) * (r + out1 * 0.8));
    strand(new THREE.CatmullRomCurve3([p0, p1, p2, p3]), 1.3 + rnd() * 0.6, 0.35, Math.min(16, segs), Math.min(6, radial + 1), rnd() * 6.28, dark[i % 3], out);
    for (let k = 0; k < (count < 60 ? 2 : 4); k++) hang(p3.x + (rnd() - 0.5) * 1.2, p3.y + 0.5, p3.z + (rnd() - 0.5) * 1.2, 6 + rnd() * 16, 0.28, pale[k % 4], 0.6);
  }
  // 2. a curtain of long pale strands from the bottom, many in little bundles like hanging hair
  for (let i = 0; i < count; i++) {
    const a = rnd() * Math.PI * 2, r = innerR + Math.sqrt(rnd()) * (bottomR - innerR), cx = Math.cos(a) * r, cz = Math.sin(a) * r, len = 10 + Math.pow(rnd(), 0.8) * 36, n = 2 + Math.floor(rnd() * 4);
    for (let k = 0; k < n; k++) { const x = cx + (rnd() - 0.5) * 1.4, z = cz + (rnd() - 0.5) * 1.4; hang(x, under ? under(Math.hypot(x, z)) + 0.6 : top + 0.3, z, len * (0.7 + rnd() * 0.4) * lenK, 0.45 + rnd() * 0.35, pale[(i + k) % 4]); }
  }
  // 3. a few strands hanging in loops, down and back up
  for (let i = 0; i < Math.round(count / 12); i++) {
    const a = rnd() * Math.PI * 2, r = Math.max(innerR + 3, 15) + rnd() * 24, x = Math.cos(a) * r, z = Math.sin(a) * r, d = 7 + rnd() * 9, w = 1.2 + rnd() * 1.6, t = a + Math.PI / 2;
    const pts = [V(x, top + 0.3, z), V(x, top - d * 0.7, z), V(x + Math.cos(t) * w * 0.5, top - d, z + Math.sin(t) * w * 0.5), V(x + Math.cos(t) * w, top - d * 0.7, z + Math.sin(t) * w), V(x + Math.cos(t) * w, top + 0.3, z + Math.sin(t) * w)];
    strand(new THREE.CatmullRomCurve3(pts), 0.42, 0.42, 24, 5, rnd() * 6.28, pale[i % 4], out);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(out.pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(out.col, 3));
  geo.setAttribute('aAlong', new THREE.Float32BufferAttribute(out.along, 1)); geo.setAttribute('aPhase', new THREE.Float32BufferAttribute(out.phase, 1));
  geo.setIndex(out.idx); geo.computeVertexNormals();
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, emissive: 0x6a6050, emissiveIntensity: 0.55 });   // a little self-light: they sit in the island's shadow
  mat.onBeforeCompile = sh => {
    sh.uniforms.uTime = uniforms.uTime; sh.uniforms.uWind = uniforms.uWind;
    sh.vertexShader = 'uniform float uTime, uWind;\nattribute float aAlong, aPhase;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      float k = aAlong * aAlong * (0.9 + uWind * 2.2);
      transformed.x += sin(uTime * 0.6 + aPhase) * k; transformed.z += cos(uTime * 0.47 + aPhase * 1.3) * k * 0.8;`);
  };
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; parent.add(mesh);
  return mesh;
}
export function tickRoots(t, wind = 0.3) { uniforms.uTime.value = t; uniforms.uWind.value = wind; }
