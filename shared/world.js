// Shared between the mind (server) and the web client.
// x/z are ground coordinates in metres. Each place's x/z is where Nena STANDS to use it;
// the thing itself (building, pond...) sits `d` metres further out from the island centre
// and blocks a circle of radius `r`, which she walks around.
export const WORLD = { size: 64, radius: 30, name: "Nena's World" };

export const PLACES = {
  home:    { label: 'House',        x: -13,   z: -9,    d: 4.7, r: 3.1 },
  fish:    { label: 'Fish Stall',   x: 10,    z: -11,   d: 3.2, r: 2.2 },
  pond:    { label: 'Ice Pond',     x: 0,     z: 12,    d: 7.2, r: 6.0 },
  library: { label: 'Library',      x: -15,   z: 9,     d: 4.9, r: 3.3 },
  studio:  { label: 'Studio',       x: 15,    z: 8,     d: 4.6, r: 3.0 },
  plaza:   { label: 'Mailbox',      x: 0,     z: 0,     d: 0,   r: 0   },
  lookout: { label: 'Lookout',      x: 17,    z: -15,   d: 3.4, r: 2.2 },
  cinema:  { label: 'Cinema',       x: -2,    z: -17,   d: 5.6, r: 4.0 },
  museum:  { label: 'Museum',       x: -9.6,  z: -16.7, d: 4.9, r: 3.3 },
  shop:    { label: 'Shop',         x: 20,    z: -3,    d: 4.6, r: 3.0 },
  igloo:   { label: 'Igloo',        x: -20,   z: -1,    d: 5.4, r: 3.3 },
  garden:  { label: 'Garden',       x: 7,     z: -3,    d: 0,   r: 0   },
  orchard: { label: 'Orchard',      x: 3.6,   z: -9.4,  d: 0,   r: 0   },
  rock:    { label: 'Big Rock',     x: -8.6,  z: 2.6,   d: 0,   r: 0   },
  river:   { label: 'River',        x: -9,    z: 16.2,  d: 0,   r: 0   },
  beach:   { label: 'Beach',        x: 14.2,  z: 19.9,  d: 0,   r: 0   },
};

// Where the building for a place actually sits, and which way it faces (towards the centre).
export function site(key) {
  const p = PLACES[key], len = Math.hypot(p.x, p.z) || 1;
  return { x: p.x + (p.x / len) * p.d, z: p.z + (p.z / len) * p.d, ry: Math.atan2(-p.x, -p.z), r: p.r };
}

// Her neighbours and where their tents are pitched.
export const NEIGHBOURS = [
  { name: 'Bo',   kind: 'seal',   home: { x: 8.5,   z: 24 },   says: ['the tide was loud last night.', 'i found a warm rock. it is mine now.', 'you smell like fish. that is a compliment.'] },
  { name: 'Pip',  kind: 'puffin', home: { x: 10,    z: -22 },  says: ['i counted the fence planks again. still a lot.', 'have you seen the sky from the tower?', 'i am collecting interesting sticks.'] },
  { name: 'Suvi', kind: 'fox',    home: { x: -25.5, z: 6.5 },  says: ['the snow by the igloo squeaks. did you notice?', 'i heard something in the river. probably a fish.', 'i like your scarf.'] },
];
export const ORCHARD_TREES = [[3, -7.2], [5.6, -10.6], [1.6, -11.6]];

// Things she cannot walk through.
export const OBSTACLES = [
  ...Object.keys(PLACES).filter(k => PLACES[k].r > 0).map(k => ({ key: k, ...site(k) })),
  { key: 'mailbox', x: 1.5, z: -0.6, r: 0.6 },
  { key: 'bigrock', x: -10.6, z: 2.6, r: 1.3 },
  ...ORCHARD_TREES.map(([x, z]) => ({ key: 'tree', x, z, r: 0.9 })),
  ...NEIGHBOURS.map(n => ({ key: 'tent', x: n.home.x, z: n.home.z, r: 1.9 })),
];

// The river runs from the pond to a waterfall on the west rim.
export const RIVER = [[-4.5, 19.2], [-9, 18.6], [-14, 19.6], [-19, 19.0], [-23.4, 18.6]];
// The beach is the sandy sector of the rim between these angles (atan2(z, x)).
export const BEACH = { from: 0.55, to: 1.35, inner: 21 };
export const inBeach = (x, z) => { const a = Math.atan2(z, x); return a > BEACH.from && a < BEACH.to && Math.hypot(x, z) > BEACH.inner; };
export const nearRiver = (x, z, pad) => z > 19 - pad - 1 && z < 19 + pad + 1 && x < -3 && x > -26;

export const NEEDS = ['fullness', 'energy', 'wonder', 'joy', 'calm'];

// Plan a walk from a to b that goes around obstacles. Returns the list of points to visit.
export function route(a, b) {
  const pts = [{ x: a.x, z: a.z }, { x: b.x, z: b.z }];
  const CLEAR = 1.0;
  for (let iter = 0; iter < 14; iter++) {
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
// An open bit of grass: on the island, off the beach and river, clear of buildings and of `others`.
export function freeSpot(others = [], gap = 2.6, rand = Math.random) {
  for (let i = 0; i < 80; i++) {
    const a = rand() * Math.PI * 2, r = 5 + rand() * 21, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (blocked(x, z, 1.8) || inBeach(x, z) || nearRiver(x, z, 2.5)) continue;
    if (Object.values(PLACES).some(p => Math.hypot(p.x - x, p.z - z) < 2.6)) continue;
    if (others.some(o => Math.hypot(o.x - x, o.z - z) < gap)) continue;
    return { x: Math.round(x * 10) / 10, z: Math.round(z * 10) / 10 };
  }
  return null;
}
