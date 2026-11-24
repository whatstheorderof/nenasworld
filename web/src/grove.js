// The Lantern Grove: a dark island of great bare trees with fireflies clinging to every branch, so that
// after dark they shine like trees wrapped in fairy lights; little firs glowing white between them; and in
// the middle, in a ring of fog, a tall black monolith with a pale light breaking over its tip.
// Built here in code (not Blender) because thousands of separately twinkling lights are cheapest as points.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const R = 26;   // the island's top, in island units (the island is drawn at GROVE_ISLE.scale)

export function buildGrove() {
  const g = new THREE.Group();
  let seed = 41; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const flat = c => new THREE.MeshLambertMaterial({ color: c, flatShading: true });

  // ---- the island: a dark lawn on top of a jagged rock that tapers to a point underneath ----
  { const top = new THREE.CylinderGeometry(R, R * 0.96, 2.4, 44, 1); const p = top.attributes.position;
    for (let i = 0; i < p.count; i++) if (p.getY(i) > 1) p.setY(i, 1.2 + Math.sin(p.getX(i) * 0.3) * Math.cos(p.getZ(i) * 0.27) * 0.25);
    top.computeVertexNormals(); const lawn = new THREE.Mesh(top, flat(0x2f4a35)); lawn.position.y = -1.2; g.add(lawn);
    const rock = new THREE.ConeGeometry(R * 0.96, 30, 22, 6, true); const q = rock.attributes.position;
    for (let i = 0; i < q.count; i++) { const y = q.getY(i), k = 1 + (Math.sin(i * 12.9898) * 43758.5453 % 1) * 0.16 * (y < 14 ? 1 : 0); q.setX(i, q.getX(i) * k); q.setZ(i, q.getZ(i) * k); }
    rock.rotateX(Math.PI); rock.computeVertexNormals(); const under = new THREE.Mesh(rock, flat(0x4a4252)); under.position.y = -2.4 - 15; g.add(under);
    for (let i = 0; i < 5; i++) { const a = i * 1.3 + 0.4, d = R * (0.4 + (i % 3) * 0.12), c = new THREE.Mesh(new THREE.ConeGeometry(2.4 + (i % 2) * 1.5, 9 + i * 2, 6), flat(0x3e3746));
      c.rotation.x = Math.PI; c.position.set(Math.cos(a) * d, -2.4 - (4.5 + i), Math.sin(a) * d); g.add(c); } }
  // stepping stones from the landing pad to the monolith
  { const stones = []; for (let i = 0; i < 11; i++) { const z = 20 - i * 1.75, x = Math.sin(i * 0.9) * 1.4, s = new THREE.CylinderGeometry(0.75, 0.85, 0.2, 7); s.translate(x, 0.08, z); stones.push(s); }
    g.add(new THREE.Mesh(mergeGeometries(stones), flat(0x7b7486))); }

  // ---- the lights: one shader for every firefly on the island ----
  const lightPos = [], lightPh = [], lightCol = [];
  const WARM = new THREE.Color(0xfff2cf), COOL = new THREE.Color(0xe6f4ff), PINK = new THREE.Color(0xffc4e6);
  const addLight = (v, c = WARM) => { lightPos.push(v.x, v.y, v.z); lightPh.push(rnd()); lightCol.push(c.r, c.g, c.b); };

  // ---- great bare trees, branching, with fireflies all along the branches ----
  const bark = [], up = new THREE.Vector3(0, 1, 0);
  function branch(a, dir, len, r, depth, tint) {
    const b = a.clone().addScaledVector(dir, len), geo = new THREE.CylinderGeometry(r * 0.62, r, len, 5, 1, true);
    geo.translate(0, len / 2, 0); geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up, dir)); geo.translate(a.x, a.y, a.z); bark.push(geo);
    const n = Math.ceil(len * (3 + depth * 2.2));   // the finer the branch, the thicker the lights
    for (let i = 0; i < n; i++) { const f = rnd(), p = a.clone().lerp(b, f), side = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize();
      if (depth > 0 || f > 0.15) addLight(p.addScaledVector(side, r * (1 - f * 0.38) + 0.06), tint); }
    if (depth >= 4 || r < 0.06) return;
    const kids = depth === 0 ? 4 : 3;
    for (let k = 0; k < kids; k++) { const spread = depth === 0 ? 0.95 : 0.75, d = dir.clone().add(new THREE.Vector3((rnd() - 0.5) * 2 * spread, rnd() * 0.5 - 0.05, (rnd() - 0.5) * 2 * spread)).normalize();
      if (d.y < 0.05) d.y = 0.05 + rnd() * 0.2;
      branch(b.clone().lerp(a, k === 0 ? 0 : rnd() * 0.35), d.normalize(), len * (0.6 + rnd() * 0.2), r * 0.6, depth + 1, tint); }
  }
  const trees = [[-12, 4], [-15, -8], [-5, 13], [12, -9], [15, 4], [6, 14], [-4, -15], [19, -2], [-19, 1]];
  trees.forEach(([x, z], i) => branch(new THREE.Vector3(x, 0, z), new THREE.Vector3((rnd() - 0.5) * 0.15, 1, (rnd() - 0.5) * 0.15).normalize(), 3.4 + rnd() * 1.6, 0.55 + rnd() * 0.2, 0, i === 8 ? PINK : WARM));
  g.add(new THREE.Mesh(mergeGeometries(bark), flat(0x2a2430)));

  // ---- little firs, every needle-tier hung with cool white lights ----
  const firs = [];
  [[-8, 8, 3.2], [3, 9, 2.6], [9, 11, 3.6], [-14, 12, 2.4], [14, -14, 3], [-9, -4, 2.2], [7, 3, 2.4], [-2, -9, 2.6], [17, 9, 2.8], [-18, -12, 2.4], [2, 17, 2.2]].forEach(([x, z, h]) => {
    for (let t = 0; t < 3; t++) { const c = new THREE.ConeGeometry(h * (0.42 - t * 0.1), h * 0.5, 7); c.translate(x, h * (0.3 + t * 0.24), z); firs.push(c); }
    const n = Math.round(h * 34); for (let i = 0; i < n; i++) { const f = i / n, a = f * 40 + rnd(), rr = h * 0.42 * (1 - f) + 0.05, y = 0.15 + f * h * 0.95;
      addLight(new THREE.Vector3(x + Math.cos(a) * rr, y, z + Math.sin(a) * rr), COOL); }
    addLight(new THREE.Vector3(x, h * 1.02 + 0.1, z), new THREE.Color(0xffe7a0)); });
  g.add(new THREE.Mesh(mergeGeometries(firs), flat(0x22382c)));
  // a few loose fireflies drifting low over the lawn
  for (let i = 0; i < 160; i++) { const a = rnd() * 6.283, d = Math.sqrt(rnd()) * R * 0.9; addLight(new THREE.Vector3(Math.cos(a) * d, 0.5 + rnd() * 3, Math.sin(a) * d), WARM); }

  const lg = new THREE.BufferGeometry();
  lg.setAttribute('position', new THREE.Float32BufferAttribute(lightPos, 3)); lg.setAttribute('ph', new THREE.Float32BufferAttribute(lightPh, 1)); lg.setAttribute('col', new THREE.Float32BufferAttribute(lightCol, 3));
  const lightMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uT: { value: 0 }, uNight: { value: 0 }, uPx: { value: 1 } },
    vertexShader: `attribute float ph; attribute vec3 col; uniform float uT, uNight, uPx; varying vec3 vC; varying float vA;
      void main() { vec3 p = position; 
        vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;
        float tw = 0.65 + 0.35 * sin(uT * (1.5 + ph * 2.5) + ph * 40.0);
        vA = tw * (0.12 + 0.88 * uNight); vC = col;
        gl_PointSize = clamp((0.9 + uNight * 0.5) * uPx * 120.0 / -mv.z, 1.0, 4.5 * uPx); }`,
    fragmentShader: `varying vec3 vC; varying float vA; void main() { vec2 d = gl_PointCoord - 0.5; float r = length(d); if (r > 0.5) discard;
      float k = smoothstep(0.5, 0.1, r); gl_FragColor = vec4(vC * k * vA * 0.75, k * vA); }` });
  const lights = new THREE.Points(lg, lightMat); lights.frustumCulled = false; g.add(lights);

  // ---- the monolith, in its ring of fog ----
  const H = 17, mono = new THREE.Group(); mono.position.set(0, 0, -2);
  { const shaft = new THREE.CylinderGeometry(1.05, 1.4, H, 4, 1); shaft.rotateY(Math.PI / 4); shaft.translate(0, H / 2, 0);
    const cap = new THREE.ConeGeometry(1.05 * Math.SQRT1_2 * 1.42, 1.6, 4); cap.rotateY(Math.PI / 4); cap.translate(0, H + 0.8, 0);
    mono.add(new THREE.Mesh(mergeGeometries([shaft, cap]), new THREE.MeshLambertMaterial({ color: 0x2c3036, flatShading: true }))); }
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.18, 'rgba(235,245,255,.75)'); gr.addColorStop(0.5, 'rgba(200,220,240,.2)'); gr.addColorStop(1, 'rgba(200,220,240,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.6 }));
  halo.position.set(0, H + 1.4, 0); halo.scale.setScalar(13); mono.add(halo);
  g.add(mono);
  const mist = [], fogTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  for (let i = 0; i < 14; i++) { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: fogTex, color: 0xc8d2dc, transparent: true, opacity: 0.32, depthWrite: false }));
    const a = i / 14 * 6.283, d = 3 + (i % 3) * 3.5; m.position.set(Math.cos(a) * d, 1.2 + (i % 4) * 0.6, -2 + Math.sin(a) * d); m.scale.set(11, 5, 1); m.userData = { a, d, ph: rnd() * 6 }; g.add(m); mist.push(m); }

  function update(t, night, px = 1) {
    lightMat.uniforms.uT.value = t; lightMat.uniforms.uNight.value = night; lightMat.uniforms.uPx.value = px;
    halo.material.opacity = 0.3 + night * 0.35 + Math.sin(t * 0.7) * 0.04; halo.scale.setScalar(10 + night * 3);
    for (const m of mist) { const u = m.userData, a = u.a + t * 0.02; m.position.x = Math.cos(a) * u.d; m.position.z = -2 + Math.sin(a) * u.d;
      m.material.opacity = (0.12 + Math.sin(t * 0.3 + u.ph) * 0.03) * (1 + night * 0.4); m.material.color.setHex(night > 0.5 ? 0x6f7f96 : 0xb8c2cc); }
  }
  return { group: g, update, lightCount: lightPh.length };
}
