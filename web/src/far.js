// Other sky islands, far away in the haze. For now they are only silhouettes,
// each with one small sign of what lives there: smoke and a red glow on the
// volcano, tiny lights in the forest, and light coming up through the hole in the ice.
import * as THREE from 'three';
import { SKY_ISLANDS } from '../../shared/world.js';

export function buildFarIslands(scene) {
  const root = new THREE.Group(); scene.add(root);
  let seed = 9; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const shade = c => new THREE.MeshBasicMaterial({ color: c });           // flat silhouettes; the fog does the haze
  const add = (parent, geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };
  const glows = [], smoke = [], sparks = [], mats = [];

  for (const isl of SKY_ISLANDS) {
    const g = new THREE.Group(), S = isl.size; g.position.set(Math.cos(isl.a) * isl.r, isl.y, Math.sin(isl.a) * isl.r); g.userData.isl = isl; root.add(g);
    const base = isl.id === 'ember' ? 0x6b5a5e : isl.id === 'wood' ? 0x3f5a5c : 0x8aa3bd, dark = new THREE.Color(base).multiplyScalar(0.72).getHex();
    const top = shade(base), under = shade(dark); mats.push([top, base], [under, dark]);
    // every island hangs on a rocky root, like hers
    add(g, new THREE.CylinderGeometry(S, S * 0.92, S * 0.12, 18), top, 0, 0, 0);
    add(g, new THREE.ConeGeometry(S * 0.9, S * 1.2, 9), under, 0, -S * 0.66, 0).rotation.x = Math.PI;
    for (let i = 0; i < 4; i++) { const a = rnd() * 6.283; add(g, new THREE.ConeGeometry(S * 0.18, S * 0.6, 6), under, Math.cos(a) * S * 0.5, -S * 0.35, Math.sin(a) * S * 0.5).rotation.x = Math.PI; }

    if (isl.id === 'ember') {   // volcano and dunes
      add(g, new THREE.CylinderGeometry(S * 0.16, S * 0.62, S * 0.85, 12), top, -S * 0.1, S * 0.48, 0);
      for (let i = 0; i < 5; i++) { const d = add(g, new THREE.SphereGeometry(S * (0.18 + rnd() * 0.12), 10, 6), top, (rnd() - 0.2) * S * 1.3, S * 0.05, (rnd() - 0.5) * S * 1.2); d.scale.y = 0.35; }
      const crater = new THREE.MeshBasicMaterial({ color: 0xff6a3a, transparent: true, opacity: 0 }); glows.push(crater);
      add(g, new THREE.CircleGeometry(S * 0.14, 12), crater, -S * 0.1, S * 0.905, 0).rotation.x = -Math.PI / 2;
      for (let i = 0; i < 9; i++) { const m = new THREE.MeshBasicMaterial({ color: 0x9a8f96, transparent: true, opacity: 0.0 }); const p = add(g, new THREE.SphereGeometry(S * 0.12, 8, 6), m, -S * 0.1, S, 0); p.userData = { k: i / 9, S }; smoke.push(p); }
    }
    if (isl.id === 'wood') {    // a forest of very tall trees, one far taller than the rest
      for (let i = 0; i < 22; i++) { const a = rnd() * 6.283, r = Math.sqrt(rnd()) * S * 0.85, h = S * (0.35 + rnd() * 0.45), big = i === 0;
        const x = big ? 0 : Math.cos(a) * r, z = big ? 0 : Math.sin(a) * r, H = big ? S * 1.5 : h;
        add(g, new THREE.CylinderGeometry(S * (big ? 0.07 : 0.025), S * (big ? 0.12 : 0.04), H, 6), under, x, H / 2, z);
        const c = add(g, new THREE.SphereGeometry(S * (big ? 0.45 : 0.14 + rnd() * 0.1), 9, 7), top, x, H, z); c.scale.y = 0.7; }
      const pts = new Float32Array(90 * 3); for (let i = 0; i < 90; i++) { const a = rnd() * 6.283, r = Math.sqrt(rnd()) * S * 0.9; pts.set([Math.cos(a) * r, S * (0.2 + rnd() * 1.1), Math.sin(a) * r], i * 3); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
      const pm = new THREE.PointsMaterial({ color: 0xc9ffb0, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false }); sparks.push(pm); g.add(new THREE.Points(geo, pm));
    }
    if (isl.id === 'glass') {   // an ice crust with spires round a dark hole, ruins hanging underneath
      const hole = new THREE.MeshBasicMaterial({ color: 0x1d2545 }); add(g, new THREE.CircleGeometry(S * 0.22, 14), hole, S * 0.08, S * 0.065, 0).rotation.x = -Math.PI / 2;
      for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283 + rnd() * 0.3, r = S * (0.4 + rnd() * 0.5), h = S * (0.2 + rnd() * 0.5); const sp = add(g, new THREE.ConeGeometry(S * 0.07, h, 5), top, Math.cos(a) * r, h / 2, Math.sin(a) * r); sp.rotation.z = (rnd() - 0.5) * 0.4; }
      const dome = add(g, new THREE.SphereGeometry(S * 0.3, 12, 6, 0, 6.283, 0, Math.PI / 2), under, S * 0.08, -S * 0.32, 0); dome.rotation.x = Math.PI;
      for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; add(g, new THREE.CylinderGeometry(S * 0.025, S * 0.025, S * 0.35, 5), under, S * 0.08 + Math.cos(a) * S * 0.38, -S * 0.25, Math.sin(a) * S * 0.38); }
      const shaft = new THREE.MeshBasicMaterial({ color: 0x9cf6ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }); glows.push(shaft);
      add(g, new THREE.CylinderGeometry(S * 0.2, S * 0.05, S * 0.7, 12, 1, true), shaft, S * 0.08, S * 0.4, 0);
    }
  }

  const tmp = new THREE.Color();
  function update(t, night, dayTint) {
    root.children.forEach((g, i) => { g.position.y = g.userData.isl.y + Math.sin(t * 0.08 + i * 2) * 1.5; g.rotation.y = Math.sin(t * 0.02 + i) * 0.05; });
    for (const [m, c] of mats) m.color.copy(tmp.set(c).lerp(dayTint, 0.25).multiplyScalar(1 - night * 0.55));
    glows.forEach(m => { m.opacity = 0.25 + night * 0.65; });
    sparks.forEach(m => { m.opacity = night * (0.6 + Math.sin(t * 2) * 0.25); });
    smoke.forEach(p => { const { k, S } = p.userData, f = (k + t * 0.02) % 1; p.position.set(-S * 0.1 + f * S * 0.5, S * (0.95 + f * 0.9), f * S * 0.15); p.scale.setScalar(0.6 + f * 1.8); p.material.opacity = (1 - f) * 0.45 * (1 - night * 0.4); });
  }
  return { update };
}
