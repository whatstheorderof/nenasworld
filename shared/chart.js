// The sea chart: the sky around Nena's island split into a 7 × 7 grid of squares.
// Shared so the mind can one day know which square she is in, and which ones she has charted.
// Map x is world x; map "down" is world +z, so north (up on the chart) is world −z.
import { WORLD, ISLETS, SKY_ISLANDS, TOWN_ISLANDS, CAMPERS, isletPos, townPos } from './world.js';

export const GRID = 7;                       // squares across
export const CELL = 140;                     // metres per square
export const EXTENT = GRID * CELL;           // the whole chart, edge to edge
export const COLS = 'ABCDEFG';

// which square a world point is in: { col: 0..6, row: 0..6 } or null when off the chart
export function squareAt(x, z) {
  const col = Math.floor((x + EXTENT / 2) / CELL), row = Math.floor((z + EXTENT / 2) / CELL);
  return col >= 0 && col < GRID && row >= 0 && row < GRID ? { col, row } : null;
}
export const squareKey = (col, row) => `${COLS[col]}${row + 1}`;

// what is drawn on the chart
export function features() {
  const out = [{ id: 'home', kind: 'home', name: WORLD.name, x: 0, z: 0, r: WORLD.radius, about: 'Her home island: the town square, the pond and the river, the beach and the big tree.' }];
  ISLETS.forEach((isl, i) => { const p = isletPos(i); out.push({ id: `islet${i}`, kind: 'islet', name: isl.name, x: p.x, z: p.z, r: 7, about: `A little islet she rows to. Finds: ${isl.gives.join(', ')}.` }); });
  for (const t of TOWN_ISLANDS) { const p = townPos(t), folk = CAMPERS.filter(c => c.home === t.id);
    out.push({ id: t.id, kind: 'town', name: t.name, x: p.x, z: p.z, r: (t.id === 'fountain' || t.id === 'hoop' ? 13 : 10) * t.scale, model: t.model,
      about: t.about + (folk.length ? ` Home of ${folk.map(c => `${c.name} the ${c.kind}`).join(' and ')}, who sometimes camp on her island.` : '') }); }
  for (const s of SKY_ISLANDS) out.push({ id: s.id, kind: 'sky', name: s.name, theme: s.theme, resources: s.resources, x: Math.cos(s.a) * s.r, z: Math.sin(s.a) * s.r, r: s.size,
    about: `Only a shape in the haze so far: ${s.theme}. One day she will get there.` });
  return out;
}

// Open-sky squares get a name of their own, so every square on the chart is somewhere.
const A = ['Breezy', 'Gull', 'Drifting', 'Quiet', 'Blue', 'Lantern', 'Feather', 'Puffin', 'Cloudy', 'Starling', 'Kite', 'Whistling', 'Pebble', 'Moonlit', 'Silver', 'Copper'];
const B = ['Reach', 'Shallows', 'Narrows', 'Expanse', 'Drift', 'Hollow', 'Current', 'Crossing', 'Sound', 'Haze', 'Gap', 'Run'];
export function squareName(col, row) {
  const cx = (col + 0.5) * CELL - EXTENT / 2, cz = (row + 0.5) * CELL - EXTENT / 2;
  for (const f of features()) if (f.kind !== 'islet' && Math.abs(f.x - cx) <= CELL / 2 && Math.abs(f.z - cz) <= CELL / 2) return f.name;
  if (features().some(f => f.kind === 'islet' && Math.abs(f.x - cx) <= CELL / 2 && Math.abs(f.z - cz) <= CELL / 2)) return 'Islet Waters';
  const h = (col * 7 + row * 13 + col * row * 3) % (A.length * B.length);
  return `${A[h % A.length]} ${B[Math.floor(h / A.length) % B.length]}`;
}
