// Nena herself: an original chunky low-poly penguin built from primitives.
import * as THREE from 'three';

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

export function buildNena() {
  const root = new THREE.Group();          // position + heading
  const body = new THREE.Group();          // animated: waddle, tilt, lie down
  root.add(body);

  const blob = (r, sx, sy, sz, color, w = 9, h = 7) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, w, h), mat(color));
    m.scale.set(sx, sy, sz); return m;
  };

  const coat = blob(0.55, 1, 1.28, 0.95, C.coat); coat.position.y = 0.82; body.add(coat);
  const belly = blob(0.46, 0.92, 1.18, 0.55, C.belly); belly.position.set(0, 0.72, 0.3); body.add(belly);

  // face: two big eye patches, pupils, beak, cheeks
  for (const s of [-1, 1]) {
    const eye = blob(0.15, 1, 1.1, 0.5, C.eye, 8, 6); eye.position.set(0.19 * s, 1.18, 0.43); body.add(eye);
    const pupil = blob(0.065, 1, 1, 0.6, C.pupil, 6, 5); pupil.position.set(0.2 * s, 1.17, 0.5); body.add(pupil);
    const cheek = blob(0.06, 1, 0.7, 0.4, C.cheek, 6, 4); cheek.position.set(0.3 * s, 1.03, 0.42); body.add(cheek);
  }
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.26, 5), mat(C.beak));
  beak.rotation.x = Math.PI / 2; beak.position.set(0, 1.07, 0.6); body.add(beak);

  // scarf
  const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.1, 5, 10), mat(C.scarf));
  scarf.rotation.x = Math.PI / 2; scarf.position.y = 0.97; scarf.scale.set(1, 0.95, 1); body.add(scarf);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.36, 0.07), mat(C.scarf));
  tail.position.set(0.3, 0.76, 0.5); tail.rotation.z = -0.25; body.add(tail);

  // flippers pivot at the shoulder
  const flippers = [-1, 1].map(s => {
    const pivot = new THREE.Group(); pivot.position.set(0.5 * s, 1.0, 0);
    const f = blob(0.3, 0.28, 1.15, 0.7, C.coat, 6, 5); f.position.y = -0.3; pivot.add(f);
    pivot.rotation.z = 0.25 * s; body.add(pivot); return pivot;
  });

  // feet stay on the ground under the root
  const feet = [-1, 1].map(s => {
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.09, 0.4), mat(C.feet));
    f.position.set(0.2 * s, 0.045, 0.14); root.add(f); return f;
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

  let t = Math.random() * 10;
  // state: { phase:'walking'|'doing'|'idle', action }
  function animate(dt, state) {
    t += dt;
    const walking = state.phase === 'walking';
    const act = state.phase === 'doing' ? state.anim : null;
    const k = 1 - Math.exp(-dt * 8);
    const to = (obj, prop, v) => { obj[prop] += (v - obj[prop]) * k; };

    let roll = 0, pitch = 0, y = 0, flap = 0.25, footSwing = 0;
    const riding = walking && state.ride;
    robot.visible = riding; boat.visible = act === 'sail';
    if (riding) robot.userData.brush.rotation.y = t * 14;
    if (riding) { y = 0.2; pitch = 0.1; roll = Math.sin(t * 3) * 0.04; flap = 0.75 + Math.sin(t * 6) * 0.08; }
    else if (act === 'sail') { y = 0.32; roll = Math.sin(t * 1.3) * 0.06; flap = 0.6 + Math.sin(t * 2.5) * 0.4; }
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

    to(body.rotation, 'z', roll); to(body.rotation, 'x', pitch); to(body.position, 'y', y);
    flippers.forEach((f, i) => to(f.rotation, 'z', (i ? 1 : -1) * flap));
    const inside = act === 'inside';   // she has gone indoors
    body.visible = shadow.visible = !inside;
    feet.forEach((f, i) => { f.position.z = 0.14 + (i ? 1 : -1) * footSwing; f.visible = !inside && !['swim', 'lie', 'dive', 'sail'].includes(act); f.position.y = riding ? 0.3 : 0.045; });
    shadow.visible = !inside && act !== 'sail';
    zs.forEach((z, i) => {
      z.visible = inside && state.action === 'sleep';
      const p = (t * 0.35 + i / 3) % 1;
      z.position.set(0.6 + p * 0.8, 3.4 + p * 2.2, 0); z.scale.setScalar(0.5 + p * 0.6); z.material.opacity = 1 - p;
    });
  }

  const setScarf = hex => { scarf.material.color.set(hex); tail.material.color.set(hex); };
  return { root, animate, setScarf };
}
