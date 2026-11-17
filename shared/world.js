// Shared between the mind (server) and the web client.
// x/z are ground coordinates in metres. Each place's x/z is where Nena STANDS to use it;
// the thing itself (building, pond...) sits `d` metres further out from the island centre
// and blocks a circle of radius `r`, which she walks around.
export const WORLD = { size: 64, radius: 30, name: "Nena's World" };

export const PLACES = {
  home:    { label: 'House',        x: -13,   z: -9,   d: 4.7, r: 3.1 },
  fish:    { label: 'Fish Stall',   x: 10,    z: -11,  d: 3.2, r: 2.2 },
  pond:    { label: 'Ice Pond',     x: 0,     z: 12,   d: 7.2, r: 6.0 },
  library: { label: 'Library',      x: -15,   z: 9,    d: 4.9, r: 3.3 },
  studio:  { label: 'Studio',       x: 15,    z: 8,    d: 4.6, r: 3.0 },
  plaza:   { label: 'Mailbox',      x: 0,     z: 0,    d: 0,   r: 0   },
  lookout: { label: 'Lookout',      x: 17,    z: -15,  d: 3.4, r: 2.2 },
  cinema:  { label: 'Cinema',       x: -2,    z: -17,  d: 5.6, r: 4.0 },
  igloo:   { label: 'Igloo',        x: -20,   z: -1,   d: 5.4, r: 3.3 },
  garden:  { label: 'Garden',       x: 7,     z: -3,   d: 0,   r: 0   },
  river:   { label: 'River',        x: -9,    z: 16.2, d: 0,   r: 0   },
  beach:   { label: 'Beach',        x: 14.2,  z: 19.9, d: 0,   r: 0   },
};

// Where the building for a place actually sits, and which way it faces (towards the centre).
export function site(key) {
  const p = PLACES[key], len = Math.hypot(p.x, p.z) || 1;
  return { x: p.x + (p.x / len) * p.d, z: p.z + (p.z / len) * p.d, ry: Math.atan2(-p.x, -p.z), r: p.r };
}

// Things she cannot walk through.
export const OBSTACLES = [
  ...Object.keys(PLACES).filter(k => PLACES[k].r > 0).map(k => ({ key: k, ...site(k) })),
  { key: 'mailbox', x: 1.5, z: -0.6, r: 0.6 },
];

// The river runs from the pond to a waterfall on the west rim.
export const RIVER = [[-4.5, 19.2], [-9, 18.6], [-14, 19.6], [-19, 19.0], [-23.4, 18.6]];
// The beach is the sandy sector of the rim between these angles (atan2(z, x)).
export const BEACH = { from: 0.55, to: 1.35, inner: 21 };

// dur = real seconds spent doing it. effects = total change to each need over that time.
export const ACTIONS = {
  sleep:      { place: 'home',    label: 'sleeping',              dur: 420, effects: { energy: 1.0, calm: 0.3, fullness: -0.15 } },
  rest:       { place: 'home',    label: 'resting at home',       dur: 45,  effects: { energy: 0.18, calm: 0.25 } },
  eat:        { place: 'fish',    label: 'eating fish',           dur: 35,  effects: { fullness: 0.7, joy: 0.1 } },
  swim:       { place: 'pond',    label: 'sliding on the pond',   dur: 55,  effects: { joy: 0.45, energy: -0.12, calm: 0.1 } },
  read:       { place: 'library', label: 'reading',               dur: 70,  effects: { wonder: 0.55, calm: 0.1, energy: -0.05 } },
  draw:       { place: 'studio',  label: 'drawing',               dur: 85,  effects: { joy: 0.3, wonder: 0.25, calm: 0.15, energy: -0.08 } },
  stargaze:   { place: 'lookout', label: 'watching the sky',      dur: 50,  effects: { calm: 0.5, wonder: 0.2 } },
  watch_film: { place: 'cinema',  label: 'watching a film',       dur: 90,  effects: { joy: 0.4, wonder: 0.3, energy: -0.05 } },
  go_fishing: { place: 'river',   label: 'fishing in the river',  dur: 65,  effects: { fullness: 0.4, calm: 0.35 } },
  beachcomb:  { place: 'beach',   label: 'combing the beach',     dur: 50,  effects: { wonder: 0.35, joy: 0.15, energy: -0.08 } },
  sunbathe:   { place: 'beach',   label: 'lying on the sand',     dur: 45,  effects: { calm: 0.4, energy: 0.1 } },
  garden:     { place: 'garden',  label: 'tending the garden',    dur: 50,  effects: { calm: 0.3, joy: 0.2 } },
  snowman:    { place: 'igloo',   label: 'building a snowman',    dur: 60,  effects: { joy: 0.45, energy: -0.12 } },
  read_mail:  { place: 'plaza',   label: 'reading her mail',      dur: 22,  effects: { joy: 0.25, wonder: 0.1 } },
  wander:     { place: null,      label: 'wandering',             dur: 6,   effects: { wonder: 0.06, calm: 0.04 } },
};

export const NEEDS = ['fullness', 'energy', 'wonder', 'joy', 'calm'];

// Plan a walk from a to b that goes around obstacles. Returns the list of points to visit.
export function route(a, b) {
  const pts = [{ x: a.x, z: a.z }, { x: b.x, z: b.z }];
  const CLEAR = 1.0;
  for (let iter = 0; iter < 12; iter++) {
    let changed = false;
    for (let i = 0; i < pts.length - 1 && !changed; i++) {
      const p = pts[i], q = pts[i + 1], dx = q.x - p.x, dz = q.z - p.z, len2 = dx * dx + dz * dz;
      if (len2 < 0.01) continue;
      for (const o of OBSTACLES) {
        const t = ((o.x - p.x) * dx + (o.z - p.z) * dz) / len2;
        if (t <= 0.03 || t >= 0.97) continue;
        const cx = p.x + dx * t, cz = p.z + dz * t;
        let ox = cx - o.x, oz = cz - o.z, dist = Math.hypot(ox, oz);
        if (dist >= o.r + CLEAR) continue;
        if (dist < 0.01) { const l = Math.sqrt(len2); ox = -dz / l; oz = dx / l; dist = 1; }
        pts.splice(i + 1, 0, { x: o.x + (ox / dist) * (o.r + CLEAR + 0.6), z: o.z + (oz / dist) * (o.r + CLEAR + 0.6) });
        changed = true; break;
      }
    }
    if (!changed) break;
  }
  return pts.slice(1);
}
export const blocked = (x, z, pad = 1) => OBSTACLES.some(o => Math.hypot(o.x - x, o.z - z) < o.r + pad);
