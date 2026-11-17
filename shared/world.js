// Shared between the mind (server) and the web client.
// x/z are ground coordinates in metres. Each place's x/z is where Nena STANDS to use it;
// the thing itself (building, pond...) sits `d` metres further out from the island centre
// and blocks a circle of radius `r`, which she walks around.
// K stretches the whole layout: buildings stay the same size, the island and the gaps between things grow.
export const K = 1.65;
// The scale each saved layout was drawn at, so her things can be moved out when the island grows.
export const LAYOUT_K = { 1: 1, 2: 1.35, 3: 1.35, 4: 1.35, 5: 1.65 };
export const SQUARE = 7.5;   // radius of the round pebble town square
export const WORLD = { size: 88, radius: 30 * K, name: "Nena's World", layout: 5 };
const POND_Z = 9.7 * K + 10.3;     // centre of the pond
const DZ = POND_Z - 19.2;           // the river runs out of the pond, so it moves with it

export const PLACES = {
  home:    { label: 'House',        x: -13,   z: -9,    d: 4.7, r: 3.1 },
  fish:    { label: 'Fish Stall',   x: 10,    z: -11,   d: 3.2, r: 2.2 },
  pond:    { label: 'Ice Pond',     x: 0,     z: 9.7,   d: 10.3, r: 9.5 },
  library: { label: 'Library',      x: -15,   z: 9,     d: 4.9, r: 3.3 },
  studio:  { label: 'Studio',       x: 15,    z: 8,     d: 4.6, r: 3.0 },
  plaza:   { label: 'Mailbox',      x: 0,     z: 0,     d: 0,   r: 0   },
  lookout: { label: 'Lookout',      x: 17,    z: -15,   d: 3.4, r: 2.2 },
  cinema:  { label: 'Cinema',       x: -2,    z: -17,   d: 5.6, r: 4.0 },
  museum:  { label: 'Museum',       x: -9.6,  z: -16.7, d: 4.9, r: 3.3 },
  shop:    { label: 'Shop',         x: 20,    z: -3,    d: 4.6, r: 3.0 },
  igloo:   { label: 'Igloo',        x: -20,   z: -1,    d: 5.4, r: 3.3 },
  cafe:    { label: 'Cocoa Cart',   x: 4.6,   z: 5.2,   d: 1.9, r: 1.3 },
  tailor:  { label: 'Clothes Shop', x: 16.8,  z: -8.9,  d: 4.4, r: 2.9 },
  observatory: { label: 'Observatory', x: 3.6, z: -20.7, d: 4.8, r: 3.3 },
  camp:    { label: 'Campsite',     x: 21.5,  z: 3.4,   d: 3.6, r: 2.0 },
  garden:  { label: 'Garden',       x: 7,     z: -3,    d: 0,   r: 0   },
  orchard: { label: 'Orchard',      x: 3.6,   z: -9.4,  d: 0,   r: 0   },
  rock:    { label: 'Big Rock',     x: -8.6,  z: 2.6,   d: 0,   r: 0   },
  river:   { label: 'River',        x: -9,    z: 16.2,  d: 0,   r: 0   },
  beach:   { label: 'Beach',        x: 14.2,  z: 19.9,  d: 0,   r: 0   },
};

for (const p of Object.values(PLACES)) { p.x = Math.round(p.x * K * 10) / 10; p.z = Math.round(p.z * K * 10) / 10; }
PLACES.river.z = Math.round((16.2 + DZ) * 10) / 10;

// Where the building for a place actually sits, and which way it faces (towards the centre).
export function site(key) {
  const p = PLACES[key], len = Math.hypot(p.x, p.z) || 1;
  return { x: p.x + (p.x / len) * p.d, z: p.z + (p.z / len) * p.d, ry: Math.atan2(-p.x, -p.z), r: p.r };
}

// Her neighbours and where their tents are pitched.
// Each has hobbies: things they go and do on their own, which she can join in with.
export const NEIGHBOURS = [
  { name: 'Bo',   kind: 'seal',   home: { x: 8.5 * K,   z: 24 * K },   says: ['the tide was loud last night.', 'i found a warm rock. it is mine now.', 'you smell like fish. that is a compliment.'],
    hobbies: [{ doing: 'sunbathing', at: { x: 13 * K, z: 22.5 * K }, anim: 'lie' }, { doing: 'watching the pond', at: { x: 10.6, z: POND_Z - 6.9 }, anim: 'sit' }, { doing: 'fishing', at: { x: -12.5 * K, z: 16.3 + DZ }, anim: 'sit' }] },
  { name: 'Pip',  kind: 'puffin', home: { x: 10 * K,    z: -22 * K },  says: ['i counted the fence planks again. still a lot.', 'have you seen the sky from the tower?', 'i am collecting interesting sticks.'],
    hobbies: [{ doing: 'jogging round the square', anim: 'jog', loop: SQUARE - 1 }, { doing: 'doing star jumps', at: { x: -4.5, z: 4.5 }, anim: 'jump' }, { doing: 'collecting sticks', at: { x: 6 * K, z: -8 * K }, anim: 'peck' }] },
  { name: 'Suvi', kind: 'fox',    home: { x: -25.5 * K, z: 6.5 * K },  says: ['the snow by the igloo squeaks. did you notice?', 'i heard something in the river. probably a fish.', 'i like your scarf.'],
    hobbies: [{ doing: 'singing by the bridge', at: { x: -16.5 * K, z: 16.4 + DZ }, anim: 'sing' }, { doing: 'reading outside the library', at: { x: -12.5 * K, z: 10.5 * K }, anim: 'sit' }, { doing: 'smelling the flowers', at: { x: 5.2 * K, z: -2.2 * K }, anim: 'peck' }] },
];
// Travellers who sometimes pitch up at the campsite for a day.
export const CAMPERS = [
  { name: 'Odo', kind: 'otter', from: 'a river with too many bridges', says: 'every bridge has a troll. most of them are nice.' },
  { name: 'Mirren', kind: 'hare', from: 'a hill where the wind never stops', says: 'you get used to leaning.' },
  { name: 'Tuck', kind: 'owl', from: 'a forest that is mostly night', says: 'the trick is to like the dark first.' },
  { name: 'Fen', kind: 'walrus', from: 'an ice shelf further north than north', says: 'your pond is a good size. i checked.' },
  { name: 'Lark', kind: 'hare', from: 'a town built on a very slow tortoise', says: 'we move house without moving house.' },
];
// Little islands out past the foam that she rows to.
export const ISLETS = [
  { name: 'Blossom Islet', a: 0.3, r: 30 * K + 24, gives: ['blossom petals', 'fruit', 'stick'] },
  { name: 'Stone Islet', a: 0.95, r: 30 * K + 28, gives: ['stone', 'ore', 'clay'] },
  { name: 'Mushroom Islet', a: 1.6, r: 30 * K + 24, gives: ['mushroom', 'sea glass', 'hum seed'] },
];
export const isletPos = i => ({ x: Math.cos(ISLETS[i].a) * ISLETS[i].r, z: Math.sin(ISLETS[i].a) * ISLETS[i].r });
export const ORCHARD_TREES = [[-0.6, 2.4], [2.2, -1.4], [-2.2, -2.4]].map(([x, z]) => [PLACES.orchard.x + x, PLACES.orchard.z + z]);
export const BIG_ROCK = { x: PLACES.rock.x - 2, z: PLACES.rock.z };
export const CLOCK = { x: 3.4, z: SQUARE + 2.6 };   // the clocktower, just off the square
export const BOARD = { x: 5.6, z: 1.4 };            // the noticeboard, on the square

// Things she cannot walk through.
export const OBSTACLES = [
  ...Object.keys(PLACES).filter(k => PLACES[k].r > 0).map(k => ({ key: k, ...site(k) })),
  { key: 'mailbox', x: 1.5, z: -0.6, r: 0.6 },
  { key: 'bigrock', ...BIG_ROCK, r: 1.3 },
  { key: 'clock', ...CLOCK, r: 1.5 },
  { key: 'board', ...BOARD, r: 0.9 },
  ...ORCHARD_TREES.map(([x, z]) => ({ key: 'tree', x, z, r: 0.9 })),
  ...NEIGHBOURS.map(n => ({ key: 'tent', x: n.home.x, z: n.home.z, r: 1.9 })),
];

// The river runs from the pond to a waterfall on the west rim.
export const RIVER = [[-4.5, 19.2], [-9, 18.6], [-14, 19.6], [-19, 19.0], [-23.4, 18.6]].map(([x, z]) => [x * K, z + DZ]);
// The beach is the sandy sector of the rim between these angles (atan2(z, x)).
export const BEACH = { from: 0.55, to: 1.35, inner: 21 * K };
export const inBeach = (x, z) => { const a = Math.atan2(z, x); return a > BEACH.from && a < BEACH.to && Math.hypot(x, z) > BEACH.inner; };
export const nearRiver = (x, z, pad) => z > 19 + DZ - pad - 1 && z < 19 + DZ + pad + 1 && x < -4 && x > -WORLD.radius;

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
const openAt = (x, z, others, gap) => Math.hypot(x, z) < WORLD.radius - 3 && !onPath(x, z, 1.3) && !blocked(x, z, 1.8) && !inBeach(x, z) && !nearRiver(x, z, 2.5) && !Object.values(PLACES).some(p => Math.hypot(p.x - x, p.z - z) < 2.6) && !others.some(o => Math.hypot(o.x - x, o.z - z) < gap);
// A free spot close to a point (for things that grow next to other things).
export function freeNear(at, others = [], gap = 2.0, rand = Math.random) {
  for (let i = 0; i < 40; i++) { const a = rand() * 6.283, r = 2.2 + rand() * 2.5, x = at.x + Math.cos(a) * r, z = at.z + Math.sin(a) * r; if (openAt(x, z, others, gap)) return { x: Math.round(x * 10) / 10, z: Math.round(z * 10) / 10 }; }
  return null;
}
// Pebble paths: from the square to every place, bending around buildings.
// A ring path round the middle of the island, four paths in from the square, and a short spur
// from the ring out to each place. Every stretch is routed around buildings.
export const RING = 12 * K;
export const PATHS = (() => {
  const ring = [];
  for (let i = 0; i < 40; i++) { const a = i / 40 * 6.283, x = Math.cos(a) * RING, z = Math.sin(a) * RING; if (!blocked(x, z, 1.4)) ring.push({ x, z, a }); }
  const lines = [];
  for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length]; lines.push([a, ...route(a, b)]); }
  for (const deg of [45, 135, 225, 315]) {   // in from the square, between the main buildings
    const a = deg * Math.PI / 180, end = ring.reduce((best, r) => Math.abs(Math.atan2(Math.sin(r.a - a), Math.cos(r.a - a))) < Math.abs(Math.atan2(Math.sin(best.a - a), Math.cos(best.a - a))) ? r : best);
    const start = { x: Math.cos(end.a) * (SQUARE - 0.2), z: Math.sin(end.a) * (SQUARE - 0.2) }; lines.push([start, ...route(start, end)]);
  }
  for (const [k, p] of Object.entries(PLACES)) {
    if (k === 'plaza') continue;
    const d = Math.hypot(p.x, p.z);
    if (d < RING - 3) { const a = Math.atan2(p.z, p.x), start = { x: Math.cos(a) * (SQUARE - 0.2), z: Math.sin(a) * (SQUARE - 0.2) }; lines.push([start, ...route(start, p)]); continue; }   // close in: straight from the square
    const a = Math.atan2(p.z, p.x), from = ring.reduce((best, r) => Math.hypot(r.x - p.x, r.z - p.z) < Math.hypot(best.x - p.x, best.z - p.z) ? r : best);
    void a; lines.push([from, ...route(from, p)]);
  }
  return lines;
})();
export function onPath(x, z, pad = 1.2) {
  for (const line of PATHS) for (let i = 0; i < line.length - 1; i++) {
    const a = line[i], b = line[i + 1], dx = b.x - a.x, dz = b.z - a.z, l2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / l2));
    if (Math.hypot(a.x + dx * t - x, a.z + dz * t - z) < pad) return true;
  }
  return Math.hypot(x, z) < SQUARE + pad - 1;   // the round pebble square
}
// An open bit of grass: on the island, off the beach and river, clear of buildings and of `others`.
export function freeSpot(others = [], gap = 2.6, rand = Math.random) {
  for (let i = 0; i < 80; i++) {
    const a = rand() * Math.PI * 2, r = 5 + rand() * (WORLD.radius - 9), x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (blocked(x, z, 1.8) || inBeach(x, z) || nearRiver(x, z, 2.5) || onPath(x, z, 1.3)) continue;
    if (Object.values(PLACES).some(p => Math.hypot(p.x - x, p.z - z) < 2.6)) continue;
    if (others.some(o => Math.hypot(o.x - x, o.z - z) < gap)) continue;
    return { x: Math.round(x * 10) / 10, z: Math.round(z * 10) / 10 };
  }
  return null;
}
