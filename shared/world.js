// Shared between the mind (server) and the web client.
// x/z are ground coordinates in metres. Each place's x/z is where Nena STANDS to use it;
// the thing itself (building, pond...) sits `d` metres further out from the island centre
// and blocks a circle of radius `r`, which she walks around.
// K stretches the whole layout: buildings stay the same size, the island and the gaps between things grow.
export const K = 2.0;
// The scale each saved layout was drawn at, so her things can be moved out when the island grows.
export const LAYOUT_K = { 1: 1, 2: 1.35, 3: 1.35, 4: 1.35, 5: 1.65, 6: 1.65, 7: 1.65, 8: 2.0, 9: 2.0 };
export const SQUARE = 12;   // radius of the round pebble town square
export const WORLD = { size: 88, radius: 30 * K, name: "Nena's World", layout: 9 };
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
  lighthouse: { label: 'Lighthouse', x: -17.1, z: -17.1, d: 5.0, r: 2.6 },
  camp:    { label: 'Campsite',     x: 20.54, z: 3.25,  d: 5.5, r: 2.0 },   // where she stands is a couple of metres back from the fire, never on it
  garden:  { label: 'Garden',       x: 7,     z: -3,    d: 0,   r: 0   },
  orchard: { label: 'Orchard',      x: 3.6,   z: -9.4,  d: 0,   r: 0   },
  rock:    { label: 'Big Rock',     x: -8.6,  z: 2.6,   d: 0,   r: 0   },
  river:   { label: 'River',        x: -9,    z: 16.2,  d: 0,   r: 0   },
  beach:   { label: 'Beach',        x: 14.2,  z: 19.9,  d: 0,   r: 0   },
  cookie:  { label: 'Cookie Shop',  x: -19.7, z: -7.2,  d: 4.6, r: 3.0 },
  bigtree: { label: 'The Big Tree', x: -10.6, z: 22.7,  d: 3.6, r: 3.2 },
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
  { name: 'Odo', kind: 'otter', home: 'fountain', from: 'Fountain, the town with the pool in the middle', says: 'i swim the pool every morning. twice if nobody is looking.' },
  { name: 'Mirren', kind: 'hare', home: 'gable', from: 'Gable, two cottages and a tower', says: 'there are only four of us. we take turns raising the flag.' },
  { name: 'Tuck', kind: 'owl', home: 'hoop', from: 'the spire on Hoopstead', says: 'the trick is to like the dark first. the hole in the middle helps.' },
  { name: 'Fen', kind: 'walrus', home: 'snowcap', from: 'Snowcap, the stone house under the snow', says: 'your pond is a good size. i checked.' },
  { name: 'Lark', kind: 'hare', home: 'hoop', from: 'Hoopstead, the town built round a hole in the sky', says: 'you can walk all the way round and end up home. we do it for fun.' },
  { name: 'Bryn', kind: 'fox', home: 'gable', from: 'Gable, by the windmill', says: 'i mind the windmill. mostly i mind it going round.' },
  { name: 'Pip', kind: 'puffin', home: 'fountain', from: 'Fountain, the stall with the stripy roof', says: 'market day is every day if you have enough jam.' },
  { name: 'Sorrel', kind: 'seal', home: 'snowcap', from: 'Snowcap, out by the frozen pond', says: 'i skate. badly. it is still skating.' },
  { name: 'Hob', kind: 'badger', home: 'gable', from: 'Gable, the vegetable beds', says: 'carrots take ages. i talk to them. it does not help but i like it.' },
  { name: 'Prickle', kind: 'hedgehog', home: 'fountain', from: 'Fountain, under the café umbrellas', says: 'i only came for the cake. and the view. mostly the cake.' },
  { name: 'Rook', kind: 'raccoon', home: 'hoop', from: 'Hoopstead, the lanterns over the hole', says: 'i light the lanterns at dusk. someone has to and i have the hands.' },
  { name: 'Mossy', kind: 'frog', home: 'fountain', from: 'Fountain, the pool in the middle', says: 'your pond is nice. not as nice as mine. but nice.' },
  { name: 'Dabble', kind: 'duck', home: 'gable', from: 'Gable, the duck pond', says: 'i sailed a leaf all the way across the pond once. i am a sailor now.' },
  { name: 'Willow', kind: 'deer', home: 'snowcap', from: 'Snowcap, between the snowy pines', says: 'it is quiet up there. you can hear the snow land.' },
  { name: 'Barnaby', kind: 'bear', home: 'snowcap', from: 'Snowcap, the stone house', says: 'i stacked the wood pile. it took all week. i am proud of it.' },
];
// Neighbouring islands with towns on them, near enough to see from hers. The travellers who
// pitch up at her campsite come from these. Models are in art/island.blend.
export const TOWN_ISLANDS = [
  { id: 'gable', name: 'Gable', model: 'IslandCottage', a: 1.15, r: 300, y: 4, scale: 2.3, about: 'Two cottages and a tower with a flag, inside a picket fence.' },
  { id: 'snowcap', name: 'Snowcap', model: 'IslandRock', a: 3.15, r: 290, y: -3, scale: 2.3, about: 'A great stone house under a cap of snow, a dome tower and a red cottage.' },
  { id: 'fountain', name: 'Fountain', model: 'IslandPlaza', a: 5.95, r: 330, y: 6, scale: 2.1, about: 'A round town square with a pool in the middle, houses all round it and topiary outside the fence.' },
  { id: 'hoop', name: 'Hoopstead', model: 'IslandRing', a: 4.45, r: 320, y: 12, scale: 2.1, about: 'A town built in a ring round a hole in the sky, with a tall slate spire.' },
];
// A small island of rolling blue flower hills with a marbled gold-and-teal river, where goats roam.
// Model: art/island.blend IslandBloom (radius 12 in model units). hills: [x, y, half-width x, half-width y, top] in model units.
export const BLOOM_ISLE = { id: 'bloom', name: 'Bluebell', a: 5.6, r: 180, y: 3, scale: 3.0, size: 36,
  about: 'A small island of rolling blue flower hills with a marbled gold and teal river running through it. Old stone terraces of bluebells climb to snowy pines. Goats live there.', resources: ['bluebells', 'goat wool'],
  spots: { pad: [0, -10.4], goats: [-5.8, 4.9, { does: 'sitting in the flowers with the goats', draw: 'the goats on Bluebell', food: 'goat cheese' }], flowers: [4.0, 2.5, { does: 'picking bluebells', find: 'bluebells' }],
    river: [-8.9, -0.1, { does: 'drawing the gold river', draw: 'the gold river through the blue flowers' }], wool: [0.6, -6.2, { does: 'collecting tufts of goat wool off the flowers', find: 'goat wool' }],
    terraces: [-1.28, 6.3, { does: 'sitting by the pool under the bluebell terraces', draw: 'the stone terraces of bluebells and the snowy pines' }] },
  hills: [[-7.84,5.35,1.92,1.76,0.56],[-2.93,7.07,1.53,1.4,0.45],[-0.96,-2.76,1.54,1.41,0.45],[2.34,-5.34,1.86,1.7,0.54],[-2.46,3.78,1.32,1.21,0.39],[-2.82,-3.38,2.0,1.83,0.59],[9.37,-3.26,2.19,2.0,0.64],[-2.5,9.42,2.41,2.21,0.71],[-0.64,-7.15,1.33,1.22,0.39],[-2.61,-6.49,2.13,1.95,0.62],[-7.45,-5.89,2.36,2.16,0.69],[-4.71,3.12,1.82,1.66,0.53],[6.53,-6.65,2.56,2.34,0.75],[-0.48,-5.01,1.49,1.36,0.44],[1.9,-3.03,1.39,1.27,0.41],[-4.93,-4.9,1.79,1.63,0.52],[2.76,-9.72,1.93,1.77,0.57],[4.45,-4.09,1.61,1.47,0.47]],
  // the bluebell terraces: dry-stone steps round a centre; step i reaches out to r0 - i*dr and stands (i+1)*h high. Snowy pines on top, a still pool at the foot.
  terraces: { c: [5.0, 8.0], r0: 6.0, dr: 0.95, h: 0.5, n: 6 },
  // the river's centre line (model x, y) from the far bank to the falls; the goats keep out of it
  river: [[-11.6, -3.2], [-8, -2.2], [-4.5, -0.2], [-1, 1.6], [2.5, 0.6], [5.5, -1.2], [8.5, 0.4], [11.7, 2.3]],
  // things the goats walk round (model x, y, radius): the shepherd's hut, the goat shelter, the cairn, the bench
  props: [[9.4, 3.9, 1.7], [-8.6, 2.7, 1.6], [-3.2, -8.3, 0.7], [-5.4, -7.1, 0.9]] };
export const townPos = t => ({ x: Math.cos(t.a) * t.r, z: Math.sin(t.a) * t.r });
// Little islands out past the foam that she rows to.
export const ISLETS = [
  { name: 'Blossom Islet', a: 0.3, r: 30 * K + 24, gives: ['blossom petals', 'fruit', 'stick'] },
  { name: 'Stone Islet', a: 0.95, r: 30 * K + 28, gives: ['stone', 'ore', 'clay'] },
  { name: 'Mushroom Islet', a: 1.6, r: 30 * K + 24, gives: ['mushroom', 'sea glass', 'hum seed'] },
];
// Other sky islands, far off. For now they are only shapes in the haze; one day she will get to them.
// Names are working titles until the lore is settled.
// The three big far islands, the biomes. She flies the balloon from the lookout to one of them
// for wild food, rarer finds and things to draw. Models: art/island.blend (IslandEmber / IslandWood /
// IslandGlass), radius 36 in model units, shown at `scale`; each one faces her island.
// spots are in model units (x, y on the model, front = the landing pad side, toward her island).
// An old hotel standing empty on its own island, a slab of round windows with faded olive awnings,
// the far end fallen in and ivy climbing the rest. One window is always lit. Model: IslandRuin (radius 12), front faces her island.
export const RUIN_ISLE = { id: 'ruin', name: 'Hotel Isle', a: 0.55, r: 230, y: -1, scale: 2.4, size: 30,
  about: 'A tall old hotel with rows of round windows and faded green awnings, standing empty on its own island. The far end has fallen in and ivy climbs the rest. One window is always lit.',
  resources: ['old room key', 'hotel postcard', 'brass bell'],
  spots: { pad: [3.2, -9.4], doors: [-0.5, -5.2, { does: 'peering in through the hotel doors', find: 'old room key' }], rubble: [8.6, -3.2, { does: 'picking through the fallen end of the hotel', find: 'brass bell' }],
    pool: [2.6, 6.8, { does: 'poking about the drained swimming pool', find: 'hotel postcard', draw: 'the old hotel with its round windows' }],
    brambles: [5.6, -6.8, { does: 'picking blackberries off the brambles by the gate', food: 'blackberries' }], jetty: [-10.4, -2.4, { does: 'sitting on the old jetty, watching the gulls', draw: 'the one lit window in the old hotel' }] } };
// Islands that stand on their own (not towns, not the three big ones). EVERY island goes on the sea chart:
// add a new one here (or to ISLETS / TOWN_ISLANDS / SKY_ISLANDS) and shared/chart.js features() picks it up.
// `chart` is the ink colour it gets on the chart.
// A field of lime-green pom-pom flowers on tall ribbed stalks, one giant towering over them all. Model: IslandPompom (radius 12).
export const POMPOM_ISLE = { id: 'pompom', name: 'Pompom', a: 2.5, r: 230, y: 2, scale: 2.4, size: 30,
  about: 'A meadow of fluffy lime-green pom-pom flowers on tall stalks, with one giant pom-pom towering over them all. The sun shines through them.',
  resources: ['pom-pom fluff', 'giant seed'],
  spots: { pad: [0, -9.8], giant: [0.6, -0.6, { does: 'lying under the giant pom-pom, looking up through it', draw: 'looking up at the giant pom-pom flower' }],
    fluff: [3.4, -5.2, { does: 'gathering pom-pom fluff', find: 'pom-pom fluff' }], seeds: [-3.6, -3.4, { does: 'hunting for a fallen seed', find: 'giant seed' }],
    nectar: [-5.4, 1.8, { does: 'sipping nectar from the low pom-poms', food: 'pom nectar' }], meadow: [5.2, 2.6, { does: 'wandering among the tall stalks', draw: 'a meadow of glowing green pom-poms' }] } };
// A quarry island with one building on it: a travertine box on slim columns, its whole front glass, glowing orange inside. Model: IslandPavilion (radius 12).
export const PAVILION_ISLE = { id: 'pavilion', name: 'Quarry Isle', a: 1.75, r: 245, y: -2, scale: 2.4, size: 30,
  about: 'A quarry island with a single house: a pale stone box lifted on thin columns, its front all glass, glowing orange inside, with a round chair, a daybed and a lamp.',
  resources: ['travertine chip', 'quartz crystal'],
  spots: { pad: [0, -9.6], glass: [0.4, -5.2, { does: 'looking in through the big glass windows', draw: 'the glowing orange room in the quarry' }],
    wall: [-7.6, -3.0, { does: 'tapping at the quarry wall', find: 'travertine chip' }], blocks: [7.4, -5.0, { does: 'turning over the fallen blocks', find: 'quartz crystal' }],
    fig: [-5.6, -7.0, { does: 'picking figs from the little tree in the quarry', food: 'figs' }], cliff: [5.6, 1.0, { does: 'sitting under the cliffs in the quiet', draw: 'the stone house on its columns' }] } };
export const GROVE_ISLE = { id: 'grove', name: 'Lantern Isle', a: 4.2, r: 240, y: 0, scale: 1.6, size: 30,
  about: 'A dark island of great bare trees with fireflies on every branch, so they shine like fairy lights at night, little glowing firs, and a tall black monolith standing in the fog at its heart.',
  resources: ['night glass', 'lantern seed'],
  spots: { pad: [0, -24], monolith: [0.5, -1.4, { does: 'standing at the foot of the monolith', draw: 'the dark monolith in the fog' }],
    lights: [-7, -3, { does: 'walking under the trees full of lights', draw: 'the trees full of firefly lights' }], firs: [6, -7, { does: 'counting the little glowing fir trees', find: 'lantern seed' }],
    stone: [5, 6, { does: 'looking for glassy black stones near the monolith', find: 'night glass' }], hush: [-11, 9, { does: 'sitting quietly in the fog', draw: 'fog between the lit trees' }] } };
export const LONE_ISLES = [{ ...BLOOM_ISLE, chart: '#9aa6e8' }, { ...RUIN_ISLE, chart: '#efe4cc' }, { ...POMPOM_ISLE, chart: '#b6e43c' }, { ...PAVILION_ISLE, chart: '#ff8a3a' }, { ...GROVE_ISLE, chart: '#3d4a5c' }];
export const SKY_ISLANDS = [
  { id: 'ember', name: 'Ember Isle', theme: 'volcano and desert', a: 3.75, r: 405, y: -6, scale: 1.6, size: 58, resources: ['obsidian', 'fire opal', 'sand glass', 'cactus fruit'],
    spots: { pad: [0, -31], oasis: [12.5, -12, { does: 'picking dates by the oasis', food: 'dates' }], cactus: [-14, -12, { does: 'picking prickly pears (carefully)', food: 'cactus fruit' }],
      obsidian: [-19, 7, { does: 'hunting for obsidian', find: 'obsidian' }], volcano: [0, -4, { does: 'drawing the volcano from its foot', draw: 'the smoking volcano from its foot' }],
      opal: [18, 6, { does: 'digging for fire opals', find: 'fire opal' }], village: [6, -21, { does: 'visiting the little dome huts', draw: 'the dome huts in the sand', find: 'sand glass' }] } },
  { id: 'wood', name: 'Elderwood', theme: 'ancient fairy forest', a: 5.25, r: 410, y: 4, scale: 1.6, size: 58, resources: ['glow moss', 'silver bark', 'fairy dust', 'giant acorn'],
    spots: { pad: [0, -31], door: [0, 5, { does: 'knocking on the door in the giant tree', draw: 'the door in the giant tree', find: 'silver bark' }], berries: [-14, -12, { does: 'picking wild berries', food: 'wild berries' }],
      hive: [14, -11, { does: 'taking a little honeycomb (the bees allowed it)', food: 'honeycomb' }], mushrooms: [-17, 8, { does: 'gathering mushrooms in the glade', food: 'mushroom', find: 'glow moss' }],
      ring: [15, 12, { does: 'sitting very still in the fairy ring', draw: 'the fairy ring at dusk', find: 'fairy dust' }], acorns: [5, -20, { does: 'rolling a giant acorn', find: 'giant acorn' }] } },
  { id: 'glass', name: 'Frost Isle', theme: 'ice crust over water, with drowned ruins below', a: 2.2, r: 400, y: -2, scale: 1.6, size: 58, resources: ['clear ice', 'old coins', 'pearl', 'sunken tile'],
    spots: { pad: [0, -31], fishing: [9.5, -14.5, { does: 'ice fishing by the little hut', food: 'ice fish' }], ruins: [-12, 5, { does: 'drawing the drowned ruins', draw: 'the drowned ruins poking through the ice', find: 'old coins' }],
      spires: [15, 9, { does: 'chipping clear ice from the spires', find: 'clear ice' }], clams: [-14, -14, { does: 'looking for pearls in the clam beds', find: 'pearl' }],
      berries: [3, 18, { does: 'picking snow berries', food: 'snow berries' }], hole: [0, -6, { does: 'peering into the big hole in the ice', draw: 'the light under the ice', find: 'sunken tile' }] } },
];
// wild food she can find out there (and bring home)
export const FORAGE = ['dates', 'cactus fruit', 'wild berries', 'honeycomb', 'mushroom', 'ice fish', 'snow berries', 'goat cheese', 'blackberries', 'pom nectar', 'figs'];
// a big island's turn (so its landing pad faces her island) and where a spot is in the world
export const isleTurn = isl => Math.atan2(-Math.cos(isl.a), -Math.sin(isl.a));
export const islePos = isl => ({ x: Math.cos(isl.a) * isl.r, y: isl.y, z: Math.sin(isl.a) * isl.r });
// everywhere the balloon can take her
export const TRIP_ISLES = [...SKY_ISLANDS, BLOOM_ISLE, RUIN_ISLE, POMPOM_ISLE, PAVILION_ISLE, GROVE_ISLE];
export function isleSpot(isl, key) {
  const [bx, by] = isl.spots[key], s = isl.scale, th = isleTurn(isl), lx = bx * s, lz = -by * s, c = islePos(isl);
  return { x: c.x + lx * Math.cos(th) + lz * Math.sin(th), y: c.y + (key === 'pad' ? 0.4 : 0), z: c.z - lx * Math.sin(th) + lz * Math.cos(th) };
}
// where the balloon waits on her island: just outside the lookout
export const BALLOON = (() => { const l = PLACES.lookout, d = Math.hypot(l.x, l.z); return { x: Math.round(l.x / d * (d + 6.5) * 10) / 10, z: Math.round(l.z / d * (d + 6.5) * 10) / 10 }; })();
export const isletPos = i => ({ x: Math.cos(ISLETS[i].a) * ISLETS[i].r, z: Math.sin(ISLETS[i].a) * ISLETS[i].r });
export const ORCHARD_TREES = [[-0.6, 2.4], [2.2, -1.4], [-2.2, -2.4]].map(([x, z]) => [PLACES.orchard.x + x, PLACES.orchard.z + z]);
// the woodlot by the orchard: the trees she chops for wood. A felled one leaves a stump and grows back.
export const WOODLOT = [[4.6, 2.6], [-4.8, 1.0], [1.4, 5.6], [4.2, -4.6]].map(([x, z]) => [PLACES.orchard.x + x, PLACES.orchard.z + z]);
export const BIG_ROCK = { x: PLACES.rock.x - 2, z: PLACES.rock.z };
export const CLOCK = { x: 3.4, z: SQUARE + 2.6 };   // the clocktower, just off the square
export const BOARD = { x: 9.2, z: 2.3 };            // the noticeboard, on the square

// Benches and flower planters round the edge of the square, kept clear of every path that comes in.
export const SQUARE_SEATS = (() => {
  const spokes = [45, 135, 225, 315].map(d => d * Math.PI / 180).concat(Object.entries(PLACES).filter(([k, p]) => k !== 'plaza' && Math.hypot(p.x, p.z) < 12 * K - 3).map(([, p]) => Math.atan2(p.z, p.x)));
  const out = [];
  for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2 + 0.17, x = Math.cos(a) * (SQUARE - 1.6), z = Math.sin(a) * (SQUARE - 1.6);
    if (spokes.some(b => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b))) < 0.3)) continue;
    if ([CLOCK, BOARD, { x: 1.5, z: -0.6 }].some(o => Math.hypot(o.x - x, o.z - z) < 3.4)) continue;
    out.push({ x: Math.round(x * 10) / 10, z: Math.round(z * 10) / 10, a, kind: out.length % 2 ? 'bench' : 'planter' }); }
  return out;
})();

// Things she cannot walk through.
export const OBSTACLES = [
  ...Object.keys(PLACES).filter(k => PLACES[k].r > 0).map(k => ({ key: k, ...site(k) })),
  { key: 'mailbox', x: 1.5, z: -0.6, r: 0.6 },
  { key: 'bigrock', ...BIG_ROCK, r: 1.3 },
  { key: 'clock', ...CLOCK, r: 1.5 },
  { key: 'board', ...BOARD, r: 0.9 },
  { key: 'balloon', ...BALLOON, r: 4.4 },
  ...SQUARE_SEATS.map(q => ({ key: q.kind, x: q.x, z: q.z, r: 0.8 })),
  ...ORCHARD_TREES.map(([x, z]) => ({ key: 'tree', x, z, r: 0.9 })),
  ...WOODLOT.map(([x, z]) => ({ key: 'tree', x, z, r: 0.8 })),
  ...NEIGHBOURS.map(n => ({ key: 'tent', x: n.home.x, z: n.home.z, r: 1.9 })),
];

// The river runs from the pond to a waterfall on the west rim.
export const RIVER = [[-4.5, 19.2], [-9, 18.6], [-14, 19.6], [-19, 19.0], [-23.4, 18.6]].map(([x, z]) => [x * K, z + DZ]);
{ const [x, z] = RIVER[RIVER.length - 1], l = Math.hypot(x, z), out = (30 * K - 0.2) / l; RIVER.push([Math.round(x * out * 10) / 10, Math.round(z * out * 10) / 10]); }   // ...and on to the rim, where it falls
// The beach is the sandy sector of the rim between these angles (atan2(z, x)).
export const BEACH = { from: 0.55, to: 1.35, inner: 21 * K };
export const inBeach = (x, z) => { const a = Math.atan2(z, x); return a > BEACH.from && a < BEACH.to && Math.hypot(x, z) > BEACH.inner; };
// The stream: water comes in from the lagoon through a gap in the rim and runs down into the pond.
export const STREAM = [[-9.0, 61.0], [-7.2, 55.0], [-3.6, 49.5], [-4.2, 43.5], [-2.2, 38.4]];
export const STREAM_A = Math.atan2(STREAM[0][1], STREAM[0][0]);   // where it comes through the rim
const segDist = (x, z, [ax, az], [bx, bz]) => { const vx = bx - ax, vz = bz - az, u = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz || 1))); return Math.hypot(ax + vx * u - x, az + vz * u - z); };
// close to the river (wider now, and wider still near the falls) or the stream
export const nearRiver = (x, z, pad) => (z > 19 + DZ - pad - (x < -36 ? 4.6 : 3.1) && z < 19 + DZ + pad + (x < -36 ? 4.6 : 3.1) && x < -4 && x > -WORLD.radius)
  || STREAM.some((p, i) => i && segDist(x, z, STREAM[i - 1], p) < pad + 1.9);

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
