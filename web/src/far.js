// Other sky islands, far away in the haze. For now they are only silhouettes,
// each with one small sign of what lives there: smoke and a red glow on the
// volcano, tiny lights in the forest, and light coming up through the hole in the ice.
import * as THREE from 'three';
import { SKY_ISLANDS, TOWN_ISLANDS, townPos, islePos, isleTurn } from '../../shared/world.js';
import { whenKit, kitModel } from './kit.js';

export function buildFarIslands(scene) {
  const root = new THREE.Group(); scene.add(root);
  let seed = 9; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const shade = c => new THREE.MeshBasicMaterial({ color: c });           // flat silhouettes; the fog does the haze
  const add = (parent, geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };
  const glows = [], smoke = [], sparks = [], mats = [];
  const lit = (c, e = c) => new THREE.MeshLambertMaterial({ color: c, emissive: e, emissiveIntensity: 0.4, flatShading: true });
  const farLit = { glow_lava: lit(0xff7a2a), glow_opal: lit(0xff9a7a), glow_hutwin: lit(0xffd27a), glow_shroom: lit(0x7ff0e6), glow_fairy: lit(0xfff1a8), glow_coins: lit(0xf5c84a), glow_pearl: lit(0xf4f2ff), glow_icehole: lit(0x7fe6ff) };
  const farGlow = { ...farLit };

  // the three big islands (biomes): proper models, turned so their landing pad faces her island, and held still
  // so she can walk about on them when she flies over. A plain silhouette stands in until the models load.
  for (const isl of SKY_ISLANDS) {
    const g = new THREE.Group(), c = islePos(isl), S = isl.size, k = isl.scale; g.position.set(c.x, c.y, c.z); g.rotation.y = isleTurn(isl); g.userData.isl = isl; root.add(g);
    const base = isl.id === 'ember' ? 0x6b5a5e : isl.id === 'wood' ? 0x3f5a5c : 0x8aa3bd, dark = new THREE.Color(base).multiplyScalar(0.72).getHex();
    const top = shade(base), under = shade(dark); mats.push([top, base], [under, dark]);
    const sil = [add(g, new THREE.CylinderGeometry(S, S * 0.92, 2, 24), top, 0, -0.9, 0), add(g, new THREE.ConeGeometry(S * 0.85, S * 0.5, 12), under, 0, -S * 0.27, 0)]; sil[1].rotation.x = Math.PI;
    whenKit(() => { const m = kitModel({ ember: 'IslandEmber', wood: 'IslandWood', glass: 'IslandGlass' }[isl.id], farGlow); if (!m) return; m.scale.setScalar(k); g.add(m); sil.forEach(o => { o.visible = false; }); });
    if (isl.id === 'ember') {   // smoke and a glow from the crater (the volcano stands at model (0, 14), 2.2× its kit size)
      const cx = 0, cy = 20.0 * k, cz = -14 * k;
      const crater = new THREE.MeshBasicMaterial({ color: 0xff6a3a, transparent: true, opacity: 0 }); glows.push(crater);
      add(g, new THREE.CircleGeometry(1.4 * 2.2 * k, 12), crater, cx, cy + 0.2, cz).rotation.x = -Math.PI / 2;
      for (let i = 0; i < 10; i++) { const m = new THREE.MeshBasicMaterial({ color: 0x9a8f96, transparent: true, opacity: 0 }); const p = add(g, new THREE.SphereGeometry(4, 8, 6), m, cx, cy, cz); p.userData = { k: i / 10, at: [cx, cy, cz] }; smoke.push(p); }
    }
    if (isl.id === 'wood') {    // fireflies and fairy lights among the trees at night
      const pts = new Float32Array(160 * 3); for (let i = 0; i < 160; i++) { const a = rnd() * 6.283, r = Math.sqrt(rnd()) * 33 * k; pts.set([Math.cos(a) * r, 1.5 + rnd() * 14, Math.sin(a) * r], i * 3); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
      const pm = new THREE.PointsMaterial({ color: 0xd9ffb0, size: 2.4, sizeAttenuation: false, transparent: true, opacity: 0, fog: false }); sparks.push(pm); g.add(new THREE.Points(geo, pm));
    }
    if (isl.id === 'glass') {   // light coming up through the big hole in the ice
      const shaft = new THREE.MeshBasicMaterial({ color: 0x9cf6ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }); glows.push(shaft);
      add(g, new THREE.CylinderGeometry(4.6 * k / 1.6, 1.2, 30, 14, 1, true), shaft, 0, 15, 0);
    }
  }

  // neighbouring islands with towns on them: proper models, near enough to make out, windows lit at night
  const towns = new THREE.Group(); scene.add(towns);
  const winMat = new THREE.MeshLambertMaterial({ color: 0xfff2c4, emissive: 0xffc870, emissiveIntensity: 0, flatShading: true });
  for (const t of TOWN_ISLANDS) {
    const g = new THREE.Group(), p = townPos(t); g.position.set(p.x, t.y, p.z); g.scale.setScalar(t.scale); g.rotation.y = -t.a - Math.PI / 2 + 0.5; g.userData.isl = t; towns.add(g);
    whenKit(() => { const m = kitModel(t.model, { glow_farwin: winMat }); if (m) g.add(m); });
  }

  const tmp = new THREE.Color();
  function update(t, night, dayTint) {
    for (const [m, c] of mats) m.color.copy(tmp.set(c).lerp(dayTint, 0.25).multiplyScalar(1 - night * 0.55));
    glows.forEach(m => { m.opacity = 0.25 + night * 0.65; });
    towns.children.forEach((g, i) => { g.position.y = g.userData.isl.y + Math.sin(t * 0.1 + i * 1.7) * 1.2; });
    winMat.emissiveIntensity = night * 1.4;
    for (const m of Object.values(farLit)) m.emissiveIntensity = 0.4 + night * 1.1;
    sparks.forEach(m => { m.opacity = night * (0.6 + Math.sin(t * 2) * 0.25); });
    smoke.forEach(p => { const { k, at } = p.userData, f = (k + t * 0.02) % 1; p.position.set(at[0] + f * 22, at[1] + 2 + f * 40, at[2] + f * 6); p.scale.setScalar(0.7 + f * 2.4); p.material.opacity = (1 - f) * 0.45 * (1 - night * 0.4); });
  }
  return { update };
}
