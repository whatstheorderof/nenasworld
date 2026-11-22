// Small wild things on the home island, apart from the neighbours: butterflies over the garden and flowers by
// day in spring and summer, frogs round the pond rim that croak in the evening, and a shy fox that trots across
// the meadow at dusk and dawn. None of them are characters; they just make the island feel lived in.
import * as THREE from 'three';
import { PLACES, WORLD, OBSTACLES, site, inBeach, nearRiver } from '../../shared/world.js';
import { whenKit, kitModel } from './kit.js';

const WING_COLS = [0xffd93b, 0xffffff, 0x9fd6f0, 0xffb7d0, 0xf2792e, 0xc9a7ff];

export function buildWildlife(scene) {
  const root = new THREE.Group(); scene.add(root);

  // ---- butterflies: two wing cards each, flapping on a hinge, wandering round a home spot ----
  const homes = [PLACES.garden, PLACES.orchard, PLACES.bigtree, PLACES.lookout, { x: PLACES.garden.x + 4, z: PLACES.garden.z + 5 }];
  const wingGeo = new THREE.PlaneGeometry(0.22, 0.18); wingGeo.translate(0.11, 0, 0);
  const flies = [];
  for (let i = 0; i < 12; i++) {
    const g = new THREE.Group(), mat = new THREE.MeshLambertMaterial({ color: WING_COLS[i % WING_COLS.length], side: THREE.DoubleSide });
    const L = new THREE.Mesh(wingGeo, mat), R = new THREE.Mesh(wingGeo, mat); R.scale.x = -1; g.add(L, R);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.16, 4), new THREE.MeshLambertMaterial({ color: 0x1d2545 })); body.rotation.x = Math.PI / 2; g.add(body);
    const h = homes[i % homes.length]; root.add(g);
    flies.push({ g, L, R, hx: h.x, hz: h.z, ph: i * 1.7, sp: 0.35 + (i % 4) * 0.08, r: 2 + (i % 3) * 1.2 });
  }

  // ---- frogs on the pond rim ----
  const pond = site('pond'), frogs = [];
  const frogG = new THREE.Group(); root.add(frogG);
  whenKit(() => { for (let i = 0; i < 3; i++) { const m = kitModel('Frog'); if (!m) return; const a = 0.6 + i * 2.1, r = (PLACES.pond.r || 4) - 0.2;
    m.scale.setScalar(0.38); m.position.set(pond.x + Math.cos(a) * r, 0.12, pond.z + Math.sin(a) * r); m.rotation.y = Math.atan2(Math.cos(a), Math.sin(a)) + Math.PI;   // facing the water
    frogG.add(m); frogs.push({ m, base: m.position.clone(), hop: 0, next: 3 + Math.random() * 8, croak: Math.random() * 5, a }); } });

  // ---- the fox: crosses the meadow on its own path at dusk and at dawn ----
  const SITES = Object.keys(PLACES).filter(k => PLACES[k].r > 0).map(k => site(k));
  let fox = null; const run = { t: -1, from: new THREE.Vector3(), to: new THREE.Vector3(), dur: 14, lastHourSeen: -1 };
  whenKit(() => { fox = kitModel('Fox'); if (!fox) return; fox.scale.setScalar(0.6); fox.visible = false; root.add(fox); });
  const pickRun = () => {   // from one side of the island's edge to the other, not through the middle of the square
    for (let k = 0; k < 400; k++) { const a = Math.random() * 6.283, b = a + Math.PI * (0.55 + Math.random() * 0.4), R = WORLD.radius - 4;
      run.from.set(Math.cos(a) * R, 0, Math.sin(a) * R); run.to.set(Math.cos(b) * R, 0, Math.sin(b) * R);
      const mid = run.from.clone().lerp(run.to, 0.5); if (mid.length() < 9) continue;
      let clear = true; for (let i = 0; i <= 30 && clear; i++) { const p = foxAt(i / 30);
        if (inBeach(p.x, p.z) || nearRiver(p.x, p.z, 1.5) || Math.hypot(p.x, p.z) > WORLD.radius - 1.5) clear = false;
        if (clear && OBSTACLES.some(o => Math.hypot(o.x - p.x, o.z - p.z) < (o.r || 1) + 0.6)) clear = false;
        if (clear && SITES.some(q => Math.hypot(q.x - p.x, q.z - p.z) < q.r + 0.8)) clear = false; }
      if (clear) return true; }
    return false; };
  const foxAt = k => { const p = run.from.clone().lerp(run.to, k), side = new THREE.Vector3(-(run.to.z - run.from.z), 0, run.to.x - run.from.x).normalize();
    return p.addScaledVector(side, Math.sin(k * Math.PI * 2) * 3); };

  function update(dt, t, { hour = 12, season = 'summer', rain = 0, night = 0 } = {}) {
    // butterflies: out on dry days in spring and summer
    const flying = (season === 'spring' || season === 'summer') && hour > 8 && hour < 18.5 && rain < 0.3;
    for (const f of flies) { f.g.visible = flying; if (!flying) continue;
      const a = t * f.sp + f.ph, x = f.hx + Math.cos(a) * f.r + Math.sin(a * 2.3) * 0.6, z = f.hz + Math.sin(a * 1.3) * f.r, y = 0.7 + Math.sin(a * 3.1) * 0.35 + Math.sin(t * 7 + f.ph) * 0.05;
      f.g.position.set(x, y, z); f.g.rotation.y = -a - Math.PI / 2;
      const flap = Math.sin(t * 22 + f.ph) * 0.9 + 0.3; f.L.rotation.y = -flap; f.R.rotation.y = flap; }
    // frogs: not in winter; now and then a hop, and they puff up to croak in the evening
    const frogsOut = season !== 'winter'; frogG.visible = frogsOut;
    if (frogsOut) for (const f of frogs) {
      f.next -= dt; if (f.next < 0 && f.hop <= 0) { f.hop = 0.6; f.next = 5 + Math.random() * 12; }
      if (f.hop > 0) { f.hop -= dt; const k = 1 - f.hop / 0.6; f.m.position.y = f.base.y + Math.sin(Math.PI * Math.max(0, k)) * 0.35; } else f.m.position.y = f.base.y;
      const evening = hour > 17 || hour < 5; f.croak -= dt; let puff = 1;
      if (evening && f.croak < 0) { if (f.croak < -0.9) f.croak = 2 + Math.random() * 6; else puff = 1 + Math.sin(-f.croak / 0.9 * Math.PI * 3) ** 2 * 0.18; }
      f.m.scale.set(0.38 * puff, 0.38, 0.38 * puff); }
    // the fox
    if (fox) {
      const dusk = (hour > 17.5 && hour < 20.5) || (hour > 5 && hour < 7), slot = Math.floor(hour);
      if (run.t < 0 && dusk && slot !== run.lastHourSeen && Math.random() < dt * 0.04 && pickRun()) { run.t = 0; run.lastHourSeen = slot; run.dur = 12 + Math.random() * 6; }
      if (run.t >= 0) { run.t += dt; const k = run.t / run.dur;
        if (k >= 1) { run.t = -1; fox.visible = false; }
        else { const p = foxAt(k);   // an easy curve, not a ruler line, kept clear of buildings when it was chosen
          const prev = fox.position.clone(); fox.position.set(p.x, Math.abs(Math.sin(t * 10)) * 0.06, p.z);
          const d = p.clone().sub(prev); if (d.lengthSq() > 1e-6) fox.rotation.y = Math.atan2(d.x, d.z); fox.visible = true; } } }
    void night;
  }
  // for previews: send the fox out now
  const foxNow = () => { if (fox && pickRun()) { run.t = 0; run.dur = 14; } };
  return { root, update, foxNow };
}
