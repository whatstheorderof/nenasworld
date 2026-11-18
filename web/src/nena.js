// Nena herself. Her model comes from Blender (web/public/models/nena.glb); until it has
// loaded (or if it cannot load) a simple stand-in built from primitives is shown.
// Poses are worked out here every frame; her face shows whatever feeling she is given.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const mat = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, flatShading: true, ...extra });
const C = { coat: 0x232a4d, belly: 0xfdfaf2, beak: 0xffa62b, feet: 0xff8a1f, scarf: 0x2fc6b3, eye: 0xffffff, pupil: 0x141833, cheek: 0xff9aa8 };

// Her little round robot. She stands on it for longer trips.
export function buildRobot() {
  const g = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.82, 0.2, 14), mat(0x3b4252)); disc.position.y = 0.14; g.add(disc);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.04, 14), mat(0x5b657a)); top.position.y = 0.26; g.add(top);
  const bumper = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.2), mat(0x2fc6b3)); bumper.position.set(0, 0.14, 0.72); g.add(bumper);
  const eye = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.1), new THREE.MeshBasicMaterial({ color: 0x9cf6ff })); eye.position.set(0, 0.27, 0.48); g.add(eye);
  const brush = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.06), mat(0xffd93b)); brush.position.set(0.55, 0.04, 0.5); g.add(brush);
  g.userData.brush = brush;
  return g;
}

const STRONG_BLUSH = new THREE.Color(0xff5f86);

// Symbols drawn on a canvas, in the island's ink-and-colour style.
function emoteTexture(name) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const ink = '#1d2545'; g.lineJoin = g.lineCap = 'round';
  const bubble = (fill = '#fffaf0') => { g.fillStyle = fill; g.strokeStyle = ink; g.lineWidth = 7; g.beginPath(); g.arc(64, 58, 46, 0, 6.283); g.fill(); g.stroke(); g.beginPath(); g.moveTo(40, 96); g.lineTo(30, 118); g.lineTo(58, 102); g.fill(); g.stroke(); g.fillStyle = fill; g.beginPath(); g.arc(64, 58, 42, 0, 6.283); g.fill(); };
  const text = (t, col, size = 70) => { g.fillStyle = col; g.font = `900 ${size}px Nunito, Arial Black, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, 64, 62); };
  const heart = (x, y, r, col) => { g.fillStyle = col; g.strokeStyle = ink; g.lineWidth = 6; g.beginPath(); g.moveTo(x, y + r * 0.9); g.bezierCurveTo(x - r * 1.6, y - r * 0.1, x - r * 0.7, y - r * 1.3, x, y - r * 0.45); g.bezierCurveTo(x + r * 0.7, y - r * 1.3, x + r * 1.6, y - r * 0.1, x, y + r * 0.9); g.fill(); g.stroke(); };
  const drop = (x, y, r, col) => { g.fillStyle = col; g.strokeStyle = ink; g.lineWidth = 6; g.beginPath(); g.moveTo(x, y - r * 1.5); g.quadraticCurveTo(x + r * 1.2, y, x, y + r); g.quadraticCurveTo(x - r * 1.2, y, x, y - r * 1.5); g.fill(); g.stroke(); };
  const star = (x, y, r, col) => { g.fillStyle = col; g.strokeStyle = ink; g.lineWidth = 5; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 - Math.PI / 2, rr = i % 2 ? r * 0.38 : r; g[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); g.stroke(); };
  switch (name) {
    case 'heart': heart(64, 64, 34, '#ff5f86'); break;
    case 'exclaim': bubble('#ffd93b'); text('!', ink, 80); break;
    case 'question': bubble(); text('?', '#6a2fc4', 74); break;
    case 'dots': bubble(); text('...', ink, 56); break;
    case 'music': g.fillStyle = '#6a2fc4'; g.strokeStyle = ink; g.lineWidth = 6; g.beginPath(); g.ellipse(46, 92, 17, 13, -0.4, 0, 6.283); g.fill(); g.stroke(); g.beginPath(); g.ellipse(92, 80, 17, 13, -0.4, 0, 6.283); g.fill(); g.stroke();
      g.fillRect(58, 26, 7, 66); g.fillRect(103, 14, 7, 66); g.beginPath(); g.moveTo(58, 26); g.lineTo(110, 14); g.lineTo(110, 32); g.lineTo(58, 44); g.closePath(); g.fill(); g.stroke(); break;
    case 'sweat': drop(70, 66, 26, '#9fd6f0'); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(62, 70, 6, 10, -0.3, 0, 6.283); g.fill(); break;
    case 'tear': drop(54, 60, 20, '#58b7e8'); drop(84, 80, 14, '#58b7e8'); break;
    case 'anger': g.strokeStyle = '#e8452c'; g.lineWidth = 13; for (const [a, b, c2, d] of [[30, 48, 54, 52], [74, 52, 98, 48], [48, 30, 52, 54], [76, 54, 80, 30], [30, 80, 54, 76], [74, 76, 98, 80], [48, 98, 52, 74], [76, 74, 80, 98]]) { g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo(64, 64, c2, d); g.stroke(); } break;
    case 'sparkle': star(56, 64, 34, '#ffd93b'); star(98, 34, 16, '#fff3c4'); star(100, 96, 12, '#fff3c4'); break;
    case 'gloom': g.fillStyle = '#8f9aa6'; g.strokeStyle = ink; g.lineWidth = 6; g.beginPath(); g.arc(44, 56, 22, 0, 6.283); g.arc(70, 46, 26, 0, 6.283); g.arc(92, 60, 18, 0, 6.283); g.fill(); g.stroke(); g.fillStyle = '#8f9aa6'; g.fillRect(36, 56, 60, 22);
      g.strokeStyle = '#58b7e8'; g.lineWidth = 6; for (const x of [46, 66, 86]) { g.beginPath(); g.moveTo(x, 88); g.lineTo(x - 5, 106); g.stroke(); } break;
    case 'food': bubble(); g.fillStyle = '#58b7e8'; g.strokeStyle = ink; g.lineWidth = 5; g.beginPath(); g.ellipse(58, 58, 24, 14, 0, 0, 6.283); g.fill(); g.stroke(); g.beginPath(); g.moveTo(80, 58); g.lineTo(98, 44); g.lineTo(98, 72); g.closePath(); g.fill(); g.stroke(); g.fillStyle = ink; g.beginPath(); g.arc(46, 54, 4, 0, 6.283); g.fill(); break;
    case 'zzz': bubble('#e6e3f2'); text('z', '#3c2a86', 66); break;
  }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}

export function buildNena() {
  const root = new THREE.Group();          // position + heading
  const body = new THREE.Group();          // animated: waddle, tilt, lie down
  root.add(body);
  const old = new THREE.Group(); body.add(old);   // the stand-in, hidden once her real model loads

  const blob = (r, sx, sy, sz, color, w = 9, h = 7) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, w, h), mat(color));
    m.scale.set(sx, sy, sz); return m;
  };

  const coat = blob(0.55, 1, 1.28, 0.95, C.coat); coat.position.y = 0.82; old.add(coat);
  const belly = blob(0.46, 0.92, 1.18, 0.55, C.belly); belly.position.set(0, 0.72, 0.3); old.add(belly);

  // face: two big eye patches, pupils, beak, cheeks
  for (const s of [-1, 1]) {
    const eye = blob(0.15, 1, 1.1, 0.5, C.eye, 8, 6); eye.position.set(0.19 * s, 1.18, 0.43); old.add(eye);
    const pupil = blob(0.065, 1, 1, 0.6, C.pupil, 6, 5); pupil.position.set(0.2 * s, 1.17, 0.5); old.add(pupil);
    const cheek = blob(0.06, 1, 0.7, 0.4, C.cheek, 6, 4); cheek.position.set(0.3 * s, 1.03, 0.42); old.add(cheek);
  }
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.26, 5), mat(C.beak));
  beak.rotation.x = Math.PI / 2; beak.position.set(0, 1.07, 0.6); old.add(beak);

  // scarf
  const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.1, 5, 10), mat(C.scarf));
  scarf.rotation.x = Math.PI / 2; scarf.position.y = 0.97; scarf.scale.set(1, 0.95, 1); old.add(scarf);
  let tail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.36, 0.07), mat(C.scarf));
  tail.position.set(0.3, 0.76, 0.5); tail.rotation.z = -0.25; old.add(tail);

  // flippers pivot at the shoulder
  let flippers = [-1, 1].map(s => {
    const pivot = new THREE.Group(); pivot.position.set(0.5 * s, 1.0, 0);
    const f = blob(0.3, 0.28, 1.15, 0.7, C.coat, 6, 5); f.position.y = -0.3; pivot.add(f);
    pivot.rotation.z = 0.25 * s; pivot.userData.rest = pivot.rotation.z; old.add(pivot); return pivot;
  });

  // feet stay on the ground under the root
  let feet = [-1, 1].map(s => {
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.09, 0.4), mat(C.feet));
    f.position.set(0.2 * s, 0.045, 0.14); f.userData.rest = f.position.clone(); root.add(f); return f;
  });

  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.62, 12), new THREE.MeshBasicMaterial({ color: 0x1d2545, transparent: true, opacity: 0.22, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.02; root.add(shadow);

  // zzz for sleeping
  const zs = [0, 1, 2].map(i => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'); g.font = '900 52px Nunito, sans-serif'; g.fillStyle = '#fff'; g.strokeStyle = '#1d2545'; g.lineWidth = 6; g.textAlign = 'center';
    g.strokeText('z', 32, 48); g.fillText('z', 32, 48);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
    sp.visible = false; root.add(sp); return sp;
  });

  const robot = buildRobot(); robot.visible = false; root.add(robot);
  const boat = new THREE.Group(); boat.visible = false; root.add(boat);
  { const hull = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 2.6), mat(0x2f7f9a)); hull.position.y = 0.2; boat.add(hull);
    const rim = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 2.8), mat(0xfffaf0)); rim.position.y = 0.48; boat.add(rim);
    for (const sd of [-1, 1]) { const oar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.14), mat(0xc9531c)); oar.position.set(sd * 1.2, 0.5, 0); oar.rotation.z = sd * -0.3; boat.add(oar); } }

  let t = Math.random() * 10, windAmt = 0, wellies = false;
  let footMat = feet[0].material; feet.forEach(f => { f.material = footMat; });
  let scarfMats = [scarf.material, tail.material], tailRest = -0.25;
  tail.userData.restX = 0;

  // ---- her face: feelings are given as numbers 0..1 and eased towards ----
  const FEEL0 = () => ({ blink: 0, happy: 0, sad: 0, squint: 0, wide: 0, browUp: 0, browTilt: 0, beak: 0, blush: 0.2, lookX: 0, lookY: 0, shiver: 0, bounce: 0, droop: 0, tilt: 0, talk: false, emote: null });
  let want = FEEL0(); const feel = FEEL0();
  let face = null, nextBlink = 2, blinkLeft = 0;
  const setFeeling = f => { want = { ...FEEL0(), ...f }; };

  // a little symbol over her head: heart, !, ?, note, sweat drop...
  const emote = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false, depthTest: false })); emote.renderOrder = 9; emote.visible = false; emote.scale.setScalar(0.62); root.add(emote);
  const emoteTex = {}; let emoteNow = null, emoteAge = 0;
  const showEmote = name => { if (name === emoteNow) return; emoteNow = name; emoteAge = 0; if (!name) { emote.visible = false; return; } emote.material.map = emoteTex[name] ||= emoteTexture(name); emote.material.needsUpdate = true; emote.visible = true; };

  // ---- load her real model ----
  new GLTFLoader().load(`${import.meta.env.BASE_URL}models/nena.glb`, gltf => {
    const mats = {};
    gltf.scene.traverse(o => { if (!o.isMesh) return; const m = o.material, key = m.name;
      o.material = mats[key] ||= (key === 'nena_shine' ? new THREE.MeshBasicMaterial({ color: 0xffffff }) : new THREE.MeshLambertMaterial({ color: m.color, map: m.map || null }));
      o.material.name = key; });
    const byName = {}; gltf.scene.traverse(o => { byName[o.name] = o; });   // look everything up before moving parts about
    const N = n => byName[n];
    const bp = N('BodyPivot'); body.add(bp); old.visible = false;
    for (const f of feet) f.visible = false;
    feet = ['FootPivotR', 'FootPivotL'].map(n => { const f = N(n); root.add(f); f.userData.rest = f.position.clone(); return f; });
    flippers = ['FlipperPivotR', 'FlipperPivotL'].map(n => { const f = N(n); f.userData.rest = f.rotation.z; return f; });
    tail = N('ScarfTailPivot'); tailRest = tail.rotation.z; tail.userData.restX = tail.rotation.x;
    footMat = mats.nena_feet; if (wellies) { footMat.color.set(0xffd93b); feet.forEach(f => { f.scale.y = 1.8; }); } scarfMats = [mats.nena_scarf]; if (scarfHex != null) setScarf(scarfHex);
    const rest = o => ({ o, p: o.position.clone(), r: o.rotation.clone(), s: o.scale.clone() });
    face = {
      eyes: ['EyeL', 'EyeR'].map(n => N(n)), eyeRest: ['EyeL', 'EyeR'].map(n => rest(N(n))), pivots: ['EyePivotL', 'EyePivotR'].map(n => rest(N(n))),
      shines: ['EyeShineL', 'EyeShine2L', 'EyeShineR', 'EyeShine2R'].map(n => N(n)),
      brows: ['BrowPivotL', 'BrowPivotR'].map(n => rest(N(n))), hinge: rest(N('BeakHinge')),
      cheeks: ['CheekL', 'CheekR'].map(n => rest(N(n))), cheekMat: mats.nena_cheek, cheekBase: mats.nena_cheek.color.clone(),
    };
    // hats and sunglasses move onto her new head
    hatSlot.position.set(0, N('Crown').position.y - 0.07, 0.0);
    glassSlot.position.copy(N('GlassesAnchor').position).add(new THREE.Vector3(0, 0, 0.045)); glassSlot.scale.setScalar(0.88);
    loaded = true;
  }, undefined, err => console.warn('[nena] model did not load, keeping the stand-in', err));
  let loaded = false, scarfHex = null;
  // state: { phase:'walking'|'doing'|'idle', action }
  function animate(dt, state) {
    t += dt;
    const walking = state.phase === 'walking';
    const act = state.phase === 'doing' ? state.anim : null;
    const k = 1 - Math.exp(-dt * 8);
    const to = (obj, prop, v) => { obj[prop] += (v - obj[prop]) * k; };

    let roll = 0, pitch = 0, y = 0, flap = 0.25, footSwing = 0;
    const riding = walking && state.ride;
    robot.visible = riding; boat.visible = false;
    if (riding) robot.userData.brush.rotation.y = t * 14;
    if (riding) { y = 0.2; pitch = 0.1; roll = Math.sin(t * 3) * 0.04; flap = 0.75 + Math.sin(t * 6) * 0.08; }
    else if (act === 'sail') { pitch = Math.max(0, Math.sin(t * 3)) * 0.5; flap = 0.4; }   // poking about on an islet
    else if (walking) { const w = Math.sin(t * 9); roll = w * 0.16; y = Math.abs(w) * 0.05; footSwing = w * 0.16; flap = 0.5 + Math.abs(w) * 0.15; }
    else if (act === 'peck') { pitch = Math.max(0, Math.sin(t * 4)) * 0.55; flap = 0.4; }
    else if (act === 'flap') { roll = Math.sin(t * 2) * 0.05; flap = 0.9 + Math.sin(t * 10) * 0.35; y = Math.abs(Math.sin(t * 5)) * 0.04; }
    else if (act === 'swim') { pitch = 1.35; y = -0.42; flap = 1.2 + Math.sin(t * 8) * 0.2; }
    else if (act === 'dive') { pitch = 1.35 + Math.sin(t * 1.3) * 0.5; y = -0.75 + Math.sin(t * 1.3) * 0.35; flap = 1.2; }
    else if (act === 'read') { pitch = 0.22; roll = Math.sin(t * 0.8) * 0.05; }
    else if (act === 'lookup') { pitch = -0.38; flap = 0.4 + Math.max(0, Math.sin(t * 3)) * 0.5; }
    else if (act === 'lie') { pitch = -1.4; y = -0.38; flap = 1.3; }
    else if (act === 'sit') { y = -0.08; roll = Math.sin(t * 1.2) * 0.03; }
    else if (act === 'fish') { pitch = 0.12; y = Math.sin(t * 1.5) * 0.02; flap = 0.9; }
    else { roll = Math.sin(t * 1.5) * 0.04; y = Math.sin(t * 2.2) * 0.012; }

    // ease her feelings towards what she is given
    const kf = 1 - Math.exp(-dt * 5);
    for (const key of Object.keys(feel)) if (typeof feel[key] === 'number') feel[key] += ((want[key] ?? 0) - feel[key]) * kf;
    feel.talk = want.talk;
    if (!walking && (!act || act === 'sit' || act === 'fish')) { roll += feel.tilt; pitch += feel.droop; }
    roll += Math.sin(t * 46) * 0.025 * feel.shiver; y += Math.abs(Math.sin(t * 7)) * 0.07 * feel.bounce;

    tail.rotation.z = tailRest + (windAmt > 0.05 ? Math.sin(t * (8 + windAmt * 10)) * 0.5 * windAmt - 0.6 * windAmt : 0);
    tail.rotation.x = tail.userData.restX + (windAmt > 0.05 ? -0.9 * windAmt : 0);
    to(body.rotation, 'z', roll); to(body.rotation, 'x', pitch); to(body.position, 'y', y);
    flippers.forEach((f, i) => to(f.rotation, 'z', f.userData.rest + (i ? 1 : -1) * (flap - 0.25)));

    if (face) {
      nextBlink -= dt; if (nextBlink < 0) { blinkLeft = 0.14; nextBlink = 2 + Math.random() * 4.5; if (Math.random() < 0.2) nextBlink = 0.25; }   // sometimes a double blink
      blinkLeft -= dt;
      const happy = Math.min(1, feel.happy), shut = Math.max(feel.blink, blinkLeft > 0 ? 1 : 0) * (1 - happy);
      face.eyes.forEach((e, i) => { const d = e.morphTargetDictionary, inf = e.morphTargetInfluences; if (!d) return;
        inf[d.blink] = shut; inf[d.happy] = happy; inf[d.sad] = feel.sad * (1 - happy) * (1 - shut); inf[d.squint] = feel.squint * (1 - happy) * (1 - shut); });
      const open = 1 - Math.max(shut, happy, feel.squint * 0.6);
      face.shines.forEach(sh => { sh.visible = open > 0.35; sh.scale.setScalar(Math.max(0.01, open)); });
      face.pivots.forEach(({ o, p, s }) => {  o.position.set(p.x + feel.lookX * 0.014, p.y + feel.lookY * 0.012, p.z); });
      face.eyeRest.forEach(({ o, p, s }) => { const m = 1 + feel.wide * 0.2; o.scale.set(s.x * m, s.y * m, s.z); o.position.set(p.x, p.y, p.z + feel.wide * 0.03); });
      face.brows.forEach(({ o, p, r }, i) => { const sx = i ? -1 : 1; o.position.set(p.x, p.y + feel.browUp * 0.03 - happy * 0.006, p.z); o.rotation.set(r.x, r.y, r.z - sx * feel.browTilt * 0.45); });
      const talking = feel.talk ? Math.max(0, Math.sin(t * 15)) * 0.55 + 0.1 : 0;
      face.hinge.o.rotation.set(face.hinge.r.x + Math.min(1, feel.beak + talking) * 0.6, face.hinge.r.y, face.hinge.r.z);
      face.cheeks.forEach(({ o, s }) => o.scale.copy(s).multiplyScalar(0.85 + feel.blush * 0.55));
      face.cheekMat.color.copy(face.cheekBase).lerp(STRONG_BLUSH, Math.min(1, feel.blush));
    }
    // the symbol over her head bobs and pops in
    showEmote(want.emote || null);
    if (emote.visible) { emoteAge += dt; const pop = Math.min(1, emoteAge * 5); emote.scale.setScalar(0.62 * (pop < 1 ? 0.6 + pop * 0.5 : 1)); emote.position.set(0.55, 1.95 + Math.sin(t * 3) * 0.05, 0.1); }
    const inside = act === 'inside';   // she has gone indoors
    body.visible = shadow.visible = !inside; if (inside) emote.visible = false;
    feet.forEach((f, i) => { const r = f.userData.rest; f.position.z = r.z + (i ? 1 : -1) * footSwing; f.visible = !inside && !['swim', 'lie', 'dive'].includes(act); f.position.y = r.y + (riding ? 0.255 : 0) + (wellies ? (loaded ? 0.03 : 0.075) : 0); });

    zs.forEach((z, i) => {
      z.visible = inside && state.action === 'sleep';
      const p = (t * 0.35 + i / 3) % 1;
      z.position.set(0.6 + p * 0.8, 3.4 + p * 2.2, 0); z.scale.setScalar(0.5 + p * 0.6); z.material.opacity = 1 - p;
    });
  }

  const setScarf = hex => { scarfHex = hex; for (const m of scarfMats) m.color.set(hex); };

  // hats sit on the crown of her head
  const hatSlot = new THREE.Group(); hatSlot.position.set(0, 1.47, 0.02); body.add(hatSlot);
  const part = (geo, color, x = 0, y = 0, z = 0, parent = hatSlot) => { const m = new THREE.Mesh(geo, mat(color)); m.position.set(x, y, z); parent.add(m); return m; };
  const HAT = {
    beanie: () => { part(new THREE.SphereGeometry(0.42, 9, 6, 0, 6.283, 0, 1.6), 0xe8452c, 0, -0.08); part(new THREE.CylinderGeometry(0.43, 0.43, 0.14, 10), 0xfffaf0, 0, -0.07); },
    'sun hat': () => { part(new THREE.CylinderGeometry(0.75, 0.8, 0.05, 12), 0xf7dc8f, 0, -0.03); part(new THREE.CylinderGeometry(0.3, 0.36, 0.28, 10), 0xf7dc8f, 0, 0.1); part(new THREE.CylinderGeometry(0.37, 0.37, 0.08, 10), 0xe8452c, 0, 0.0); },
    bow: () => { for (const sd of [-1, 1]) { const m = part(new THREE.ConeGeometry(0.16, 0.3, 4), 0xff7fa3, sd * 0.17, 0.02, 0.05); m.rotation.z = sd * Math.PI / 2; } part(new THREE.SphereGeometry(0.08, 6, 5), 0xff7fa3, 0, 0.02, 0.05); hatSlot.position.x = 0.18; },
    'flower crown': () => { for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283; part(new THREE.ConeGeometry(0.1, 0.12, 5), [0xffd93b, 0xff7fa3, 0xfffaf0][i % 3], Math.cos(a) * 0.36, -0.05, Math.sin(a) * 0.36).rotation.x = Math.PI; } const ring = part(new THREE.TorusGeometry(0.36, 0.04, 4, 12), 0x4fae52, 0, -0.08); ring.rotation.x = Math.PI / 2; },
    beret: () => { const m = part(new THREE.SphereGeometry(0.42, 10, 5), 0x6a2fc4, 0.06, 0.0); m.scale.set(1, 0.32, 1); part(new THREE.CylinderGeometry(0.03, 0.03, 0.1, 5), 0x6a2fc4, 0.06, 0.15); },
    'bucket hat': () => { part(new THREE.CylinderGeometry(0.34, 0.4, 0.3, 10), 0x58b7e8, 0, 0.08); part(new THREE.CylinderGeometry(0.52, 0.58, 0.05, 12), 0x58b7e8, 0, -0.06); },
    'party hat': () => { part(new THREE.ConeGeometry(0.24, 0.62, 8), 0xffd93b, 0, 0.26); part(new THREE.SphereGeometry(0.08, 6, 5), 0xe8452c, 0, 0.6); for (let i = 0; i < 3; i++) part(new THREE.TorusGeometry(0.2 - i * 0.06, 0.025, 4, 8), 0xe8452c, 0, 0.06 + i * 0.16).rotation.x = Math.PI / 2; },
    'umbrella hat': () => { const shade = new THREE.Mesh(new THREE.ConeGeometry(0.95, 0.42, 8, 1, true), new THREE.MeshLambertMaterial({ color: 0xffd93b, flatShading: true, side: THREE.DoubleSide })); shade.position.y = 0.62; hatSlot.add(shade);
      for (let i = 0; i < 8; i += 2) { const p = new THREE.Mesh(new THREE.ConeGeometry(0.95, 0.42, 8, 1, true, i / 8 * 6.283, 6.283 / 8), new THREE.MeshLambertMaterial({ color: 0xe8452c, flatShading: true, side: THREE.DoubleSide })); p.position.y = 0.625; hatSlot.add(p); }
      part(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 5), 0x1d2545, 0, 0.3); part(new THREE.SphereGeometry(0.06, 6, 5), 0x1d2545, 0, 0.88); part(new THREE.CylinderGeometry(0.34, 0.36, 0.1, 10), 0x1d2545, 0, 0.02); },
    'pom-pom hat': () => { part(new THREE.SphereGeometry(0.42, 9, 6, 0, 6.283, 0, 1.6), 0x2fc6b3, 0, -0.08); for (let i = 0; i < 3; i++) part(new THREE.CylinderGeometry(0.43, 0.43, 0.05, 10), 0xfffaf0, 0, -0.04 + i * 0.13); part(new THREE.SphereGeometry(0.13, 7, 5), 0xfffaf0, 0, 0.37); },
  };
  let hatNow = null;
  const setHat = name => { if (name === hatNow) return; hatNow = name; hatSlot.clear(); hatSlot.position.x = 0; if (HAT[name]) HAT[name](); };

  // sunglasses sit over her eye patches
  const glassSlot = new THREE.Group(); glassSlot.position.set(0, 1.18, 0.52); body.add(glassSlot);
  const lensMat = color => new THREE.MeshLambertMaterial({ color, flatShading: true });
  const lensShape = kind => { const sh = new THREE.Shape();
    if (kind === 'heart') { sh.moveTo(0, -0.13); sh.bezierCurveTo(-0.2, 0, -0.14, 0.15, 0, 0.06); sh.bezierCurveTo(0.14, 0.15, 0.2, 0, 0, -0.13); }
    else if (kind === 'star') { for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283 + Math.PI / 2, r = i % 2 ? 0.07 : 0.16; sh[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); } }
    else if (kind === 'cat') { sh.moveTo(-0.15, 0.06); sh.lineTo(0.15, 0.1); sh.lineTo(0.13, -0.06); sh.quadraticCurveTo(0, -0.14, -0.12, -0.07); sh.closePath(); }
    else sh.absarc(0, 0, 0.13, 0, Math.PI * 2);
    return new THREE.ShapeGeometry(sh); };
  const GLASS = {
    'round sunglasses': ['round', 0x1d2545, 0xffd93b], 'heart sunglasses': ['heart', 0xd23a6a, 0xff7fa3], 'star sunglasses': ['star', 0x3c2a86, 0xffd93b], 'cat-eye sunglasses': ['cat', 0x141833, 0xe8452c],
  };
  let glassNow = null;
  const setGlasses = name => {
    if (name === glassNow) return; glassNow = name; glassSlot.clear();
    if (name === 'visor shades') { const v = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.14, 0.05), lensMat(0x2fc6b3)); v.position.z = 0.02; glassSlot.add(v); const top = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.03, 0.07), lensMat(0xfffaf0)); top.position.set(0, 0.08, 0.02); glassSlot.add(top); }
    else if (GLASS[name]) { const [kind, lens, frame] = GLASS[name];
      for (const sd of [-1, 1]) { const back = new THREE.Mesh(lensShape(kind), lensMat(frame)); back.scale.setScalar(1.18); back.position.set(sd * 0.19, 0, 0); glassSlot.add(back);
        const l = new THREE.Mesh(lensShape(kind), lensMat(lens)); l.position.set(sd * 0.19, 0, 0.012); if (kind === 'cat') l.scale.x = back.scale.x = sd; glassSlot.add(l);
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.36), lensMat(frame)); arm.position.set(sd * 0.33, 0.02, -0.17); arm.rotation.y = sd * 0.35; glassSlot.add(arm); }
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.03), lensMat(frame)); bridge.position.set(0, 0.04, 0.01); glassSlot.add(bridge); }
  };
  // weather: wind blows her scarf, rain puts her in yellow wellies
  const setWeather = (wind, wet) => { windAmt = wind; if (wet !== wellies) { wellies = wet; footMat.color.set(wet ? 0xffd93b : C.feet); feet.forEach(f => { f.scale.y = wet ? (loaded ? 1.8 : 2.6) : 1; }); } };
  return { root, animate, setScarf, setHat, setGlasses, setWeather, setFeeling, get loaded() { return loaded; } };
}
