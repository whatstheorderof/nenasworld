// What there is to find, make and celebrate on the island, and everything Nena can do.

// ---- calendar: 1 real hour = 1 day, 7 days = a season, 28 days = a year ----------
export const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
// What the sky does in each season (picked at random every few game-hours).
export const SEASON_WEATHER = [
  ['clear', 'clear', 'clear', 'rain', 'rain', 'cloudy', 'wind', 'mist'],
  ['clear', 'clear', 'clear', 'heat', 'heat', 'storm', 'rain', 'cloudy'],
  ['clear', 'wind', 'wind', 'rain', 'rain', 'mist', 'cloudy', 'storm'],
  ['clear', 'snow', 'snow', 'snow', 'cloudy', 'mist', 'wind', 'clear'],
];
export const WEATHER_WORDS = { clear: 'clear', cloudy: 'cloudy', rain: 'raining', storm: 'stormy', wind: 'windy', heat: 'heatwave', rainbow: 'rainbow', snow: 'snowing', mist: 'misty', aurora: 'aurora', meteors: 'shooting stars' };
// In a storm she only goes where there is a roof.
export const STORM_SAFE = ['home', 'cinema', 'museum', 'shop', 'tailor', 'library', 'observatory', 'cafe', 'studio', 'cookie'];
export function calendar(day) {
  const d = (day - 1) % 28;
  return { season: Math.floor(d / 7), seasonName: SEASONS[Math.floor(d / 7)], dayOfSeason: (d % 7) + 1, weekday: (day - 1) % 7, year: Math.floor((day - 1) / 28) + 1, dayOfYear: d + 1 };
}
// Events: when they run, where she goes, and what the island puts on for them.
export const EVENTS = [
  { id: 'birthday',  name: "Nena's birthday",   when: c => c.dayOfYear === 1 && c.year > 1, hours: [10, 22], place: 'plaza',   label: 'at her birthday party',      show: 'festival', prize: 'gift' },
  { id: 'tourney',   name: 'Fishing Tourney',   when: c => c.season === 0 && c.dayOfSeason === 3, hours: [8, 18],  place: 'river',   label: 'fishing in the tourney',     show: 'festival', prize: 'fish' },
  { id: 'blossom',   name: 'Blossom Day',       when: c => c.season === 0 && c.dayOfSeason === 5, hours: [9, 19],  place: 'orchard', label: 'picnicking under the blossom', show: 'festival' },
  { id: 'bughunt',   name: 'Bug Hunt',          when: c => c.season === 1 && c.dayOfSeason === 3, hours: [8, 18],  place: 'garden',  label: 'chasing bugs in the Bug Hunt', show: 'festival', prize: 'bug' },
  { id: 'fireworks', name: 'Fireworks Night',   when: c => c.season === 1 && c.dayOfSeason === 6, hours: [19, 24], place: 'beach',   label: 'watching the fireworks',     show: 'fireworks' },
  { id: 'feast',     name: 'Harvest Feast',     when: c => c.season === 2 && c.dayOfSeason === 5, hours: [11, 20], place: 'plaza',   label: 'eating at the Harvest Feast', show: 'festival', prize: 'food' },
  { id: 'lanterns',  name: 'Lantern Night',     when: c => c.season === 2 && c.dayOfSeason === 7, hours: [18, 24], place: 'plaza',   label: 'carrying a lantern round the island', show: 'lanterns', prize: 'gift' },
  { id: 'snowday',   name: 'Snow Festival',     when: c => c.season === 3 && c.dayOfSeason === 4, hours: [9, 20],  place: 'igloo',   label: 'swapping presents at the Snow Festival', show: 'festival', prize: 'gift' },
  { id: 'newyear',   name: "New Year's Eve",    when: c => c.season === 3 && c.dayOfSeason === 7, hours: [20, 24], place: 'plaza',   label: 'counting down to the new year', show: 'fireworks' },
  { id: 'music',     name: 'Music Night',       when: c => c.weekday === 6, hours: [19, 23], place: 'plaza', label: 'listening to the music', show: 'festival' },
];
export function currentEvent(day, hour) {
  const c = calendar(day);
  return EVENTS.find(e => e.when(c) && hour >= e.hours[0] && hour < e.hours[1]) || null;
}
export const todaysEvent = day => { const c = calendar(day); return EVENTS.find(e => e.when(c)) || null; };

// ---- things to collect. cat: fish | bug | sea | fossil. s = seasons it appears in (all if absent)
export const SPECIES = {
  minnow: { cat: 'fish', where: 'river', v: 20 }, trout: { cat: 'fish', where: 'river', v: 45 }, pike: { cat: 'fish', where: 'river', v: 70 },
  salmon: { cat: 'fish', where: 'river', v: 90, s: [2] }, 'golden trout': { cat: 'fish', where: 'river', v: 400, rare: 1 },
  herring: { cat: 'fish', where: 'sea', v: 25 }, mackerel: { cat: 'fish', where: 'sea', v: 40 }, flounder: { cat: 'fish', where: 'sea', v: 60 },
  squid: { cat: 'fish', where: 'sea', v: 80, s: [3, 0] }, lanternfish: { cat: 'fish', where: 'sea', v: 120, s: [2, 3] }, 'moon ray': { cat: 'fish', where: 'sea', v: 500, rare: 1 },
  ladybird: { cat: 'bug', v: 20, s: [0, 1] }, 'blue butterfly': { cat: 'bug', v: 50, s: [0, 1] }, cricket: { cat: 'bug', v: 30, s: [1, 2] }, 'stag beetle': { cat: 'bug', v: 110, s: [1] },
  firefly: { cat: 'bug', v: 60, s: [1] }, 'snow moth': { cat: 'bug', v: 70, s: [3] }, 'pond skater': { cat: 'bug', v: 35 }, 'emerald dragonfly': { cat: 'bug', v: 350, rare: 1 },
  'sea star': { cat: 'sea', v: 30 }, urchin: { cat: 'sea', v: 45 }, scallop: { cat: 'sea', v: 60 }, 'sea cucumber': { cat: 'sea', v: 40 }, 'pearl oyster': { cat: 'sea', v: 450, rare: 1 },
  'Pond at Dusk': { cat: 'art', v: 300 }, 'Fence, Forty Planks': { cat: 'art', v: 300 }, 'Portrait of a Fish': { cat: 'art', v: 300 }, 'The Long Night': { cat: 'art', v: 300 }, 'Two Tents': { cat: 'art', v: 300 }, 'Sea, Mostly': { cat: 'art', v: 300 },
  ammonite: { cat: 'fossil', v: 150 }, trilobite: { cat: 'fossil', v: 160 }, 'fern imprint': { cat: 'fossil', v: 120 }, 'old tooth': { cat: 'fossil', v: 180 }, 'giant feather': { cat: 'fossil', v: 220 }, 'tiny skull': { cat: 'fossil', v: 260 },
};
export const CATS = { fish: 'Fish', bug: 'Bugs', sea: 'Sea creatures', fossil: 'Fossils', art: 'Paintings' };
export const SEASON_FIND = ['blossom petals', 'sea glass', 'mushroom', 'snowflake'];
// Flowers: three colours come from seed. Patches of different colours growing near each
// other can cross when watered, and the crosses can cross again.
export const BLOOMS = { red: 0xe8452c, yellow: 0xffd93b, white: 0xfffaf0, orange: 0xff8a1f, pink: 0xff7fa3, mint: 0x9fe0c8, purple: 0x6a2fc4, blue: 0x58b7e8, black: 0x2a2a3a, gold: 0xffc400 };
const CROSS = { 'red+yellow': 'orange', 'red+white': 'pink', 'white+yellow': 'mint', 'orange+pink': 'purple', 'mint+pink': 'blue', 'mint+orange': 'black', 'blue+purple': 'gold', 'black+purple': 'gold', 'black+blue': 'gold' };
export const crossBloom = (a, b) => CROSS[[a, b].sort().join('+')] || null;
export const SONGS = ['Slow Tide', 'Lamp Post Waltz', 'Fish Stall Shuffle', 'Snow Squeak', 'Two Left Flippers', 'Aurora Hum', 'Bo Is Asleep', 'Long Way Round'];
// The painter's boat calls on these weekdays. Some of what he sells is not what he says it is.
export const painterIn = (cal, hour) => (cal.weekday === 2 || cal.weekday === 5) && hour >= 8 && hour < 19;
// Stamps: small goals she ticks off just by living. Each pays a few coins; two give her a lucky golden tool.
// Stamps: small goals she ticks off just by living. hint is shown before she has it.
export const STAMPS = [
  { id: 'first', name: 'First Catch', hint: 'catch a first fish', coins: 50, test: s => (s.n.go_fishing || 0) + (s.n.sea_fishing || 0) >= 1 },
  { id: 'angler', name: 'Patient Angler', hint: 'go fishing 20 times', coins: 300, gold: 'rod', test: s => (s.n.go_fishing || 0) + (s.n.sea_fishing || 0) >= 20 },
  { id: 'bugs', name: 'Friend of Small Things', hint: 'catch 15 bugs', coins: 300, gold: 'net', test: s => (s.n.catch_bugs || 0) >= 15 },
  { id: 'diver', name: 'Deep Breath', hint: 'dive 10 times', coins: 200, test: s => (s.n.dive || 0) >= 10 },
  { id: 'curator', name: 'Junior Curator', hint: 'give the museum 10 things', coins: 500, test: s => Object.values(s.museum).reduce((t, a) => t + a.length, 0) >= 10 },
  { id: 'fullmuseum', name: 'Nothing Left To Find', hint: 'fill the whole museum', coins: 3000, test: s => Object.values(s.museum).reduce((t, a) => t + a.length, 0) >= Object.keys(SPECIES).length },
  { id: 'maker', name: 'Maker', hint: 'build 5 things', coins: 200, test: s => (s.n.craft || 0) >= 5 },
  { id: 'designer', name: 'Island Designer', hint: 'put 10 things out on the island', coins: 300, test: s => (s.n.decorate || 0) >= 10 },
  { id: 'green', name: 'Green Flippers', hint: 'plant and grow 6 times', coins: 200, test: s => (s.n.plant_tree || 0) + (s.n.plant_flowers || 0) + (s.n.harvest || 0) >= 6 },
  { id: 'neighbour', name: 'Good Neighbour', hint: 'be good friends with every neighbour', coins: 300, test: s => Object.values(s.friends).every(v => v >= 5) },
  { id: 'best', name: 'Best Friends', hint: 'have a best friend', coins: 500, test: s => Object.values(s.friends).some(v => v >= 10) },
  { id: 'home', name: 'Room To Waddle', hint: 'make the house as big as it goes', coins: 500, test: s => s.house.level >= 3 },
  { id: 'cocoa', name: 'Regular', hint: 'have 10 cocoas', coins: 150, test: s => (s.n.drink_cocoa || 0) >= 10 },
  { id: 'flyer', name: 'Far Flyer', hint: 'fly the balloon to all three big islands', coins: 500, test: s => ['ember', 'wood', 'glass'].every(k => s.farVisited?.[k]) },
  { id: 'skyhopper', name: 'Sky Hopper', hint: 'fly the balloon to every island', coins: 600, test: s => ['ember', 'wood', 'glass', 'bloom', 'ruin', 'pompom', 'pavilion'].every(k => s.farVisited?.[k]) },
  { id: 'goats', name: 'Goat Friend', hint: 'fly to Bluebell Isle and sit with the goats', coins: 150, test: s => !!s.farVisited?.bloom },
  { id: 'sailor', name: 'Sea Legs', hint: 'row out 5 times', coins: 300, test: s => (s.n.boat_trip || 0) >= 5 },
  { id: 'songs', name: 'Record Collection', hint: 'collect 5 records', coins: 300, test: s => s.songs.length >= 5 },
  { id: 'party', name: 'Never Misses A Party', hint: 'go to 5 events', coins: 300, test: s => (s.n.event || 0) >= 5 },
  { id: 'breeder', name: 'Flower Breeder', hint: 'grow 6 flower colours', coins: 400, test: s => s.blooms.length >= 6 },
  { id: 'goldbloom', name: 'The Gold One', hint: 'grow a gold flower', coins: 1000, test: s => s.blooms.includes('gold') },
  { id: 'host', name: 'Good Host', hint: 'meet 4 campers', coins: 300, test: s => s.metCampers.length >= 4 },
  { id: 'everyone', name: 'Friend of Everyone', hint: 'meet all fifteen travellers', coins: 800, test: s => s.metCampers.length >= 15 },
  { id: 'traveller', name: 'Seen Them All', hint: 'row to all 3 islets', coins: 400, test: s => s.islets.length >= 3 },
  { id: 'joiner', name: 'Joins In', hint: 'join in with neighbours 8 times', coins: 200, test: s => (s.n.join_hobby || 0) >= 8 },
  { id: 'wardrobe', name: 'Full Wardrobe', hint: 'own 5 hats', coins: 300, test: s => (s.look.hats || []).length >= 5 },
  { id: 'shades', name: 'Throwing Shade', hint: 'own 4 pairs of sunglasses', coins: 200, test: s => (s.look.glasses_owned || []).length >= 4 },
  { id: 'starchart', name: 'Star Chart', hint: 'name 6 star shapes', coins: 400, test: s => (s.sky || []).length >= 6 },
  { id: 'comet', name: 'Saw Something Rare', hint: 'see something rare in the sky', coins: 500, test: s => (s.sky || []).some(x => SKY_RARE.includes(x)) },
  { id: 'puddles', name: 'Puddle Jumper', hint: 'jump in puddles 5 times', coins: 200, test: s => (s.n.puddle_jump || 0) >= 5 },
  { id: 'rainbow', name: 'End of the Rainbow', hint: 'walk to where a rainbow lands', coins: 300, test: s => (s.n.chase_rainbow || 0) >= 1 },
  { id: 'kite', name: 'Kite Flyer', hint: 'fly a kite 3 times', coins: 200, test: s => (s.n.fly_kite || 0) >= 3 },
  { id: 'storm', name: 'Storm Watcher', hint: 'sit out 2 storms', coins: 200, test: s => (s.n.watch_storm || 0) >= 2 },
  { id: 'keeper', name: 'Keeper of the Light', hint: 'watch the lighthouse beam 5 times', coins: 200, test: s => (s.n.watch_beam || 0) >= 5 },
  { id: 'farsight', name: 'Far Sighted', hint: 'look at all 3 far islands', coins: 300, test: s => Object.keys(s.farSeen || {}).length >= 3 },
  { id: 'chatter', name: 'Chatterbox', hint: 'talk with visitors 10 times', coins: 200, test: s => (s.n.visitor_chat || 0) >= 10 },
  { id: 'regulars', name: 'Knows Everyone', hint: 'talk with 10 different visitors', coins: 400, test: s => (s.chatNames || []).length >= 10 },
  { id: 'rider', name: 'Robot Rider', hint: 'ride the robot 20 times', coins: 100, test: s => (s.rides || 0) >= 20 },
];
// How far along each stamp is, as [have, need], for the hints in the stamp book.
const nn = (s, ...ks) => ks.reduce((t, k) => t + (s.n?.[k] || 0), 0), inMuseum = s => Object.values(s.museum || {}).reduce((t, a) => t + a.length, 0);
const visited = (s, ks) => ks.filter(k => s.farVisited?.[k]).length, friendsAt = (s, v) => Object.values(s.friends || {}).filter(x => x >= v).length;
export const STAMP_PROGRESS = {
  first: s => [nn(s, 'go_fishing', 'sea_fishing'), 1], angler: s => [nn(s, 'go_fishing', 'sea_fishing'), 20], bugs: s => [nn(s, 'catch_bugs'), 15], diver: s => [nn(s, 'dive'), 10],
  curator: s => [inMuseum(s), 10], fullmuseum: s => [inMuseum(s), Object.keys(SPECIES).length], maker: s => [nn(s, 'craft'), 5], designer: s => [nn(s, 'decorate'), 10],
  green: s => [nn(s, 'plant_tree', 'plant_flowers', 'harvest'), 6], neighbour: s => [friendsAt(s, 5), Object.keys(s.friends || {}).length], home: s => [s.house?.level || 0, 3],
  cocoa: s => [nn(s, 'drink_cocoa'), 10], flyer: s => [visited(s, ['ember', 'wood', 'glass']), 3], skyhopper: s => [visited(s, ['ember', 'wood', 'glass', 'bloom', 'ruin', 'pompom', 'pavilion']), 7],
  sailor: s => [nn(s, 'boat_trip'), 5], songs: s => [(s.songs || []).length, 5], party: s => [nn(s, 'event'), 5], breeder: s => [(s.blooms || []).length, 6],
  host: s => [(s.metCampers || []).length, 4], everyone: s => [(s.metCampers || []).length, 15], traveller: s => [(s.islets || []).length, 3], joiner: s => [nn(s, 'join_hobby'), 8],
  wardrobe: s => [(s.look?.hats || []).length, 5], shades: s => [(s.look?.glasses_owned || []).length, 4], starchart: s => [(s.sky || []).length, 6], puddles: s => [nn(s, 'puddle_jump'), 5],
  kite: s => [nn(s, 'fly_kite'), 3], storm: s => [nn(s, 'watch_storm'), 2], keeper: s => [nn(s, 'watch_beam'), 5], farsight: s => [Object.keys(s.farSeen || {}).length, 3],
  chatter: s => [nn(s, 'visitor_chat'), 10], regulars: s => [(s.chatNames || []).length, 10], rider: s => [s.rides || 0, 20],
};
export function catchOne(cat, where, season, lucky = false, rand = Math.random) {
  const pool = Object.entries(SPECIES).filter(([, s]) => s.cat === cat && (!where || s.where === where) && (!s.s || s.s.includes(season)));
  const total = pool.reduce((t, [, s]) => t + (s.rare ? (lucky ? 0.4 : 0.12) : 1), 0);
  let r = rand() * total;
  for (const [name, s] of pool) { r -= s.rare ? (lucky ? 0.4 : 0.12) : 1; if (r <= 0) return name; }
  return pool[0][0];
}
export const MATERIAL_VALUE = { shell: 15, fruit: 12, weeds: 3, wood: 8, stone: 10, ore: 40, clay: 12, stick: 4, veg: 20, 'blossom petals': 18, 'sea glass': 22, mushroom: 25, snowflake: 20 };

// ---- crafting: what she can build and put out on the island --------------------------
export const RECIPES = {
  bench: { wood: 3 }, lantern: { wood: 1, ore: 1 }, cairn: { stone: 3 }, 'shell arch': { shell: 4 }, birdbath: { stone: 2, ore: 1 },
  scarecrow: { wood: 2, weeds: 2 }, signpost: { wood: 2 }, campfire: { wood: 2, stone: 2 }, 'wind chime': { shell: 2, wood: 1 }, 'log stool': { wood: 1 },
  'stepping stones': { stone: 2 }, 'clay pot': { clay: 2 }, 'stick fence': { stick: 4 }, 'blossom wreath': { 'blossom petals': 3 }, 'mushroom stool': { mushroom: 3 },
  'snow globe': { snowflake: 3, 'sea glass': 1 }, 'pearl lamp': { pearl: 1, ore: 1 }, 'gold trophy': { 'gold nugget': 1 },
};
export const SHOP = { 'flower seeds': 40, sapling: 60, gift: 80, furnishing: 120 };
export const FLAGS = [0xe8452c, 0x2fc6b3, 0xffd93b, 0x6a2fc4, 0xff7fa3, 0x2f7f9a];
// Hats she can own. 0 is none.
export const HATS = ['none', 'beanie', 'sun hat', 'bow', 'flower crown', 'beret', 'bucket hat', 'party hat', 'pom-pom hat'];
export const GLASSES = ['none', 'round sunglasses', 'heart sunglasses', 'star sunglasses', 'cat-eye sunglasses', 'visor shades'];
export const CLOTHES_PRICE = { scarf: 150, hat: 180, glasses: 160 };
// What she can find through the telescope. Named by her, not by anyone else.
export const SKY = ['the Sleeping Fish', 'the Kettle', 'the Long Scarf', 'Two Lamps', 'the Penguin Who Waits', 'the Ladder', 'the Broken Oar', 'the Snail', 'the Open Door', 'the Little Boat'];
export const SKY_RARE = ['a comet with a green tail', 'a ringed planet', 'a red planet', 'a star that blinked twice'];
export const SCARVES = [0x2fc6b3, 0xe8452c, 0xffd93b, 0x6a2fc4, 0xff7fa3, 0xfffaf0, 0x2f7f9a];
export const HOUSE_LOOKS = [{ wall: 0xfff1d6, roof: 0xe58fa8 }, { wall: 0xcfe6f7, roof: 0x2f7f9a }, { wall: 0xffd9de, roof: 0x6a2fc4 }, { wall: 0xfff3c4, roof: 0x2f8f7a }, { wall: 0xf7b34a, roof: 0x1d2545 }];
export const HOUSE_LOAN = [0, 1200, 3500];   // coins to reach level 2, then level 3

// ---- everything she can do --------------------------------------------------------------
// place: where she goes (or target: something that moves or appears: npc, a spot kind, 'free' grass)
// dur: real seconds. effects: total change to needs. anim: how she moves while doing it.
// ok(c): is it on offer right now? c = { n: needs, day, night, weather, cal, event, life, has(spotKind), npc }
// why: things she might think when the scripted mind picks it.
const A = (label, where, dur, effects, anim, ok, offer, why) => ({ label, ...(where.startsWith('@') ? { target: where.slice(1).split(':')[0], who: where.split(':')[1] || null } : { place: where || null }), dur, effects, anim, ok, offer, why });
const any = () => true;
const wet = c => c.weather === 'rain' || c.weather === 'storm';
export const ACTIONS = {
  // everyday
  sleep:      A('sleeping', 'home', 420, { energy: 1.0, calm: 0.3, fullness: -0.15 }, 'inside', c => c.n.energy < 0.3 || (c.night && c.n.energy < 0.75), 'tired', ['eyes heavy. home.', 'the day is full enough. sleep now.']),
  rest:       A('resting at home', 'home', 45, { energy: 0.18, calm: 0.25 }, 'sit', c => c.n.energy < 0.6 || c.n.calm < 0.4, 'a quiet sit at home', ['sit a while. nothing has to happen.']),
  eat:        A('eating fish', 'fish', 35, { fullness: 0.7, joy: 0.1 }, 'peck', c => c.n.fullness < 0.75, 'the fish stall', ['belly says fish.', 'i can smell the stall from here.']),
  cook:       A('cooking at home', 'home', 50, { fullness: 0.6, joy: 0.2, calm: 0.1 }, 'inside', c => c.n.fullness < 0.8 && c.life.food() > 0, 'cook something she caught or picked', ['i caught it. i should cook it.', 'the kitchen has been quiet too long.']),
  swim:       A('sliding on the pond', 'pond', 55, { joy: 0.45, energy: -0.12, calm: 0.1 }, 'swim', c => c.n.energy > 0.25 && !wet(c), 'the pond is good for sliding', ['the ice looks fast today.', 'one slide. maybe six.']),
  read:       A('reading', 'library', 70, { wonder: 0.55, calm: 0.1, energy: -0.05 }, 'read', c => c.n.energy > 0.2, 'something new to learn', ['there is a thing i do not know yet.']),
  draw:       A('drawing', 'studio', 85, { joy: 0.3, wonder: 0.25, calm: 0.15, energy: -0.08 }, 'flap', c => c.n.energy > 0.2, 'make a picture', ['a picture is stuck in my head. get it out.']),
  stargaze:   A('watching the sky', 'lookout', 50, { calm: 0.5, wonder: 0.2 }, 'lookup', any, 'look at the sky', ['i want to see how far up it goes.']),
  watch_film: A('watching a film', 'cinema', 90, { joy: 0.4, wonder: 0.3, energy: -0.05 }, 'inside', c => c.n.energy > 0.2, 'something is showing', ['i want to sit in the dark and watch something.']),
  sunbathe:   A('lying on the sand', 'beach', 45, { calm: 0.4, energy: 0.1 }, 'lie', c => c.day && c.weather === 'clear' && c.cal.season !== 3, 'the sand is warm', ['warm sand. that is the whole plan.']),
  snowman:    A('building a snowman', 'igloo', 60, { joy: 0.45, energy: -0.12 }, 'flap', c => c.n.energy > 0.3, 'there is always snow by the igloo', ['the snow is the packing kind.']),
  stretch:    A('doing morning stretches', 'plaza', 30, { energy: 0.12, joy: 0.12, calm: 0.1 }, 'flap', c => c.day && c.hour < 10, 'morning stretches in the square', ['arms up. well. flippers up.']),
  take_photo: A('taking a photo', '@free', 18, { wonder: 0.12, joy: 0.1 }, 'stand', c => c.day, 'find a nice view and keep it', ['i want to remember how this looks.']),
  read_mail:  A('reading her mail', 'plaza', 22, { joy: 0.25, wonder: 0.1 }, 'peck', c => c.mail > 0, 'something is waiting in the mailbox', ['someone left me something!', 'the mailbox flag is up.']),
  wander:     A('wandering', '', 6, { wonder: 0.06, calm: 0.04 }, 'stand', any, 'no plan', ['no plan. just feet.', 'see what is over there.']),
  // collecting
  go_fishing: A('fishing in the river', 'river', 60, { calm: 0.3, joy: 0.12 }, 'fish', any, 'see what is in the river', ['the river is loud today. good for fish.']),
  sea_fishing: A('fishing off the beach', 'beach', 60, { calm: 0.28, wonder: 0.12 }, 'fish', any, 'cast into the sea', ['the sea has bigger things in it.']),
  dive:       A('diving off the beach', 'beach', 55, { joy: 0.3, wonder: 0.25, energy: -0.15 }, 'dive', c => c.n.energy > 0.35 && c.cal.season !== 3 && !wet(c), 'things live on the sea floor', ['i am built for this, actually.']),
  catch_bugs: A('catching bugs', 'garden', 45, { joy: 0.25, wonder: 0.2, energy: -0.08 }, 'flap', c => c.n.energy > 0.25 && !wet(c) && c.weather !== 'wind', 'the garden is full of small things', ['something small just flew past.']),
  beachcomb:  A('combing the beach', 'beach', 45, { wonder: 0.3, joy: 0.12, energy: -0.06 }, 'peck', c => c.n.energy > 0.2, 'the tide leaves shells', ['the sea always leaves something.']),
  shake_tree: A('shaking the fruit trees', 'orchard', 30, { joy: 0.2, energy: -0.05 }, 'flap', c => c.cal.season !== 3 && c.life.fruitReady(c.dayN), 'the trees look heavy with fruit', ['if i shake it, things fall out. good system.']),
  chop_wood:  A('chopping wood', 'orchard', 40, { energy: -0.12, calm: 0.15 }, 'chop', c => c.n.energy > 0.35 && c.life.count('wood') < 8, 'wood for building things', ['i need wood if i am going to make anything.']),
  mine_rock:  A('chipping at the big rock', 'rock', 35, { energy: -0.1, wonder: 0.12 }, 'peck', c => c.n.energy > 0.3 && c.life.count('stone') < 8, 'stone and maybe something shiny', ['there is something shiny in that rock.']),
  dig_fossil: A('digging something up', '@fossil', 30, { wonder: 0.4, energy: -0.08 }, 'dig', c => c.has('fossil'), 'a crack in the ground with something under it', ['the ground has a crack shaped like a star.']),
  pull_weeds: A('pulling weeds', '@weed', 20, { calm: 0.2, energy: -0.04 }, 'peck', c => c.has('weed'), 'weeds have come up', ['the island looks better without these.']),
  open_bottle: A('opening a bottle from the sea', '@bottle', 20, { wonder: 0.35, joy: 0.15 }, 'peck', c => c.has('bottle'), 'a bottle has washed up', ['a bottle! with something in it.']),
  pop_balloon: A('chasing a balloon', '@balloon', 25, { joy: 0.35, energy: -0.08 }, 'lookup', c => c.has('balloon'), 'a balloon is drifting over with a present', ['there is a present tied to that balloon.']),
  // museum and shop
  donate:     A('giving finds to the museum', 'museum', 40, { wonder: 0.3, joy: 0.3 }, 'stand', c => c.life.newFinds().length > 0, 'she is carrying things the museum has not got', ['the museum does not have this one yet.']),
  visit_museum: A('looking round the museum', 'museum', 60, { wonder: 0.4, calm: 0.2 }, 'inside', c => c.life.museumCount() > 2, 'see the collection so far', ['i want to look at what i found.']),
  sell:       A('selling things at the shop', 'shop', 30, { joy: 0.15 }, 'stand', c => c.life.sellable() >= 60, 'her pockets are full of things to sell', ['my pockets are full.']),
  buy:        A('shopping', 'shop', 35, { joy: 0.25, wonder: 0.1 }, 'stand', c => c.life.s.coins >= 80 && c.life.s.shopDay !== c.dayN, 'she has coins to spend', ['i have coins. the shop has things.']),
  buy_turnips: A('buying turnips', 'shop', 25, { wonder: 0.15 }, 'stand', c => c.cal.weekday === 0 && c.hour < 12 && c.life.s.coins >= 100 && !c.life.s.turnips.n, 'the turnip seller is here this morning', ['turnips. everyone says buy low.']),
  sell_turnips: A('selling her turnips', 'shop', 25, { joy: 0.3 }, 'stand', c => c.life.s.turnips.n > 0 && (c.life.s.turnipPrice > c.life.s.turnips.paid * 1.15 || c.cal.weekday === 6), 'turnip prices look good (or they are about to spoil)', ['the turnip price is up. now.']),
  // making and island design
  craft:      A('building something at the workbench', 'shop', 55, { joy: 0.3, calm: 0.15, energy: -0.08 }, 'flap', c => c.life.craftable().length > 0, 'she has enough materials to build something', ['i have the pieces. time to make it.']),
  decorate:   A('putting something out on the island', '@free', 30, { joy: 0.35, calm: 0.1 }, 'flap', c => c.life.decorHeld().length > 0, 'she is carrying something she built', ['this spot needs something.']),
  plant_flowers: A('planting flowers', '@free', 30, { calm: 0.3, joy: 0.15 }, 'peck', c => c.life.count('flower seeds') > 0 && c.cal.season !== 3, 'she has seeds', ['seeds do nothing in a pocket.']),
  plant_tree: A('planting a tree', '@free', 35, { calm: 0.25, joy: 0.2 }, 'dig', c => c.life.count('sapling') > 0 && c.cal.season !== 3, 'she has a sapling', ['a tree here. it will take a while.']),
  garden:     A('watering the garden', 'garden', 45, { calm: 0.3, joy: 0.2 }, 'peck', c => c.day && !['snow', 'rain', 'storm'].includes(c.weather), 'the flowers want water', ['the yellow one looked thirsty.']),
  redecorate: A('repainting her house', 'home', 60, { joy: 0.35, energy: -0.08 }, 'flap', c => c.day && c.life.s.coins >= 60 && c.dayN - (c.life.s.look.painted || -9) > 6, 'the house could be a different colour', ['i am tired of this roof colour.']),
  change_outfit: A('changing her outfit', 'home', 25, { joy: 0.25 }, 'inside', c => (c.life.s.look.scarves.length > 1 || (c.life.s.look.hats || []).length > 1) && c.dayN !== c.life.s.look.changed, 'she has more than one thing to wear', ['different look today.']),
  buy_clothes: A('buying clothes', 'tailor', 40, { joy: 0.35 }, 'stand', c => c.day && c.life.s.coins >= 150 && c.life.s.clothesDay !== c.dayN && c.life.unownedClothes() > 0, 'the clothes shop has things she has not got', ['there was a hat in the window. i keep thinking about it.']),
  try_on:     A('trying things on at the clothes shop', 'tailor', 35, { joy: 0.3, calm: 0.1 }, 'flap', c => c.day && c.life.s.tryDay !== c.dayN, 'trying things on costs nothing', ['i am only looking. probably.']),
  observe:    A('looking through the telescope', 'observatory', 70, { wonder: 0.6, calm: 0.25, energy: -0.05 }, 'lookup', c => c.night && ['clear', 'aurora', 'meteors', 'wind'].includes(c.weather) && c.life.s.observeDay !== c.dayN, 'the observatory is open and the sky is clear', ['the sky is clear. the telescope is waiting.']),
  tour_observatory: A('looking round the observatory', 'observatory', 45, { wonder: 0.3, calm: 0.15 }, 'stand', c => c.day && (c.life.s.sky || []).length > 0, 'see her star charts in daylight', ['i want to look at my star chart again.']),
  pay_home:   A('putting coins toward a bigger house', 'home', 25, { calm: 0.2, joy: 0.15 }, 'stand', c => c.life.s.house.level < 3 && c.life.s.coins >= 300, 'she has savings and the house is small', ['a bigger house costs coins. i have coins.']),
  // neighbours
  chat:       A('chatting with a neighbour', '@npc', 30, { joy: 0.3, calm: 0.1 }, 'stand', c => !!c.npc && (c.life.s.chats?.[0] !== c.dayN || c.life.s.chats[1] < 4), 'a neighbour is out and about', ['someone to talk to.']),
  give_gift:  A('giving a neighbour a present', '@npc', 30, { joy: 0.4 }, 'flap', c => !!c.npc && c.life.giftable() && c.life.s.giftDay !== c.dayN, 'she has something a neighbour would like', ['i think they would like this.']),
  write_letter: A('writing a letter', 'home', 40, { calm: 0.25, joy: 0.15 }, 'sit', c => c.n.energy > 0.2, 'write to a neighbour', ['i have been meaning to write.']),
  // more of island life
  forage:     A('foraging', '@free', 30, { wonder: 0.2, calm: 0.15 }, 'peck', c => c.day, 'the season leaves things lying about', ['there is always something on the ground if you look.']),
  drink_cocoa: A('having a cocoa', 'cafe', 40, { calm: 0.35, energy: 0.12, joy: 0.12 }, 'sit', c => c.day || c.hour < 23, 'the cocoa cart is open', ['something warm. sit. watch the square.']),
  daily_board: A('checking the noticeboard', 'plaza', 15, { wonder: 0.1, joy: 0.1 }, 'stand', c => c.day && c.life.s.boardDay !== c.dayN, 'the noticeboard and lost-property box change every day', ['see what the board says today.']),
  trade_pearl: A('trading a scallop with Bo', '@npc:Bo', 30, { joy: 0.35 }, 'flap', c => c.life.count('scallop') > 0 && c.out('Bo'), 'Bo swaps scallops for pearls', ['Bo wants scallops. i want what Bo has.']),
  bury_coins: A('planting coins in the glowing spot', '@glow', 25, { wonder: 0.25 }, 'dig', c => c.has('glow') && c.life.s.coins >= 150, 'the ground is glowing somewhere', ['the ground is glowing. coins go in. apparently.']),
  pick_coins: A('picking her coin tree', '@ripe', 25, { joy: 0.45 }, 'flap', c => !!c.life.ripe(c.dayN), 'the coin tree has grown', ['the coin tree is ready!']),
  plant_hum:  A('planting a humming seed', '@free', 25, { wonder: 0.3 }, 'dig', c => c.life.count('hum seed') > 0, 'she has a seed that hums', ['it hums. i am going to plant it and see.']),
  tend_crops: A('sowing the vegetable patch', 'garden', 40, { calm: 0.3 }, 'dig', c => c.day && c.cal.season !== 3 && !c.life.s.crops, 'the vegetable patch is empty', ['the patch is bare. that will not do.']),
  harvest:    A('harvesting vegetables', 'garden', 35, { joy: 0.3, calm: 0.15 }, 'peck', c => c.life.s.crops && c.dayN - c.life.s.crops >= 2, 'the vegetables are ready', ['they are ready. i grew those.']),
  buy_art:    A("looking at the painter's boat", 'beach', 40, { wonder: 0.35 }, 'stand', c => c.painter && c.life.s.coins >= 250 && c.life.s.artDay !== c.dayN, "the painter's boat is in", ['the painter is back. i never know if he is honest.']),
  play_record: A('playing a record at home', 'home', 50, { joy: 0.35, calm: 0.2 }, 'inside', c => c.life.s.songs.length > 0, 'she has records', ['i want to hear that one again.']),
  furnish_home: A('arranging her house', 'home', 45, { calm: 0.3, joy: 0.2 }, 'inside', c => c.life.count('furnishing') > 0, 'she has something new for the house', ['this goes by the window. no. there.']),
  design_flag: A('designing the island flag', 'studio', 60, { joy: 0.3, wonder: 0.15 }, 'flap', c => c.dayN - (c.life.s.look.flagDay || -9) > 5, 'the flag in the square could change', ['the flag should look like how the island feels.']),
  compose_tune: A('making up the island tune', 'home', 50, { joy: 0.3, wonder: 0.2 }, 'inside', c => c.dayN - (c.life.s.tuneDay || -9) > 7, 'the island could have a new tune', ['there is a tune in my head and it belongs to nobody else.']),
  voyage:     A('flying the balloon to a far island', 'lookout', 260, { wonder: 0.85, joy: 0.35, fullness: 0.35, energy: -0.45 }, 'voyage', c => c.day && c.hour >= 7 && c.hour < 12 && ['clear', 'wind', 'heat', 'rainbow', 'cloudy'].includes(c.weather) && c.n.energy > 0.55 && c.dayN - (c.life.s.voyDay ?? -9) >= 3, 'the balloon at the lookout can take her to the big islands, or to Bluebell Isle to see the goats: wild food, rarer finds and new things to draw', ['the balloon is ready. i want to see the big islands up close.', 'i need something new to draw. the far islands have it.']),
  boat_trip:  A('out in the rowing boat', 'beach', 110, { wonder: 0.55, joy: 0.2, energy: -0.2 }, 'sail', c => c.day && c.hour < 16 && c.weather === 'clear' && c.cal.season !== 3 && c.n.energy > 0.5 && c.life.s.boatDay !== c.dayN, 'the rowing boat is on the sand and there are little islands out there', ['i want to see what is out past the foam.']),
  water_flowers: A('watering her flower patches', '@patch', 30, { calm: 0.3, joy: 0.12 }, 'peck', c => c.life.patches().length > 0 && !['snow', 'rain', 'storm'].includes(c.weather) && c.life.s.waterDay !== c.dayN, 'the flowers she planted want water (colours growing close together sometimes cross)', ['if the red ones and the white ones are friends, something happens.']),
  visit_camper: A('visiting the campsite', 'camp', 45, { wonder: 0.4, joy: 0.25 }, 'stand', c => !!c.life.s.camper && c.day && c.life.s.campDay !== c.dayN, 'someone is camping on the island today', ['there is a new tent. someone from somewhere else.']),
  join_hobby: A('joining in with a neighbour', '@npc', 45, { joy: 0.4, energy: -0.08 }, 'flap', c => !!c.npc && !!c.npc.doing && c.life.s.joinDay !== c.dayN, 'a neighbour is busy with their hobby', ['that looks fun. i am joining in.']),
  greet_visitors: A('waving at the visitors', 'plaza', 15, { joy: 0.3 }, 'lookup', c => c.visitors.length > 0 && c.life.s.greeted !== Math.floor(c.dayN * 24 + c.hour), 'there are visitors on the island right now', ['there are gulls about. the watching kind.']),
  watch_beam: A('watching the lighthouse beam', 'lighthouse', 50, { calm: 0.4, wonder: 0.25 }, 'lookup', c => c.night && c.weather !== 'snow', 'the lighthouse is sweeping the dark', ['round and round. it never gets bored.']),
  gaze_far:   A('looking out at the far islands', 'lighthouse', 45, { wonder: 0.5, calm: 0.15 }, 'stand', c => c.day && ['clear', 'wind', 'heat', 'rainbow'].includes(c.weather) && c.dayN - (c.life.s.gazeDay ?? -9) >= 2, 'on a clear day you can see other islands from the lighthouse', ['there are other islands out there. i want to know what is on them.']),
  // weather
  puddle_jump: A('jumping in puddles', '@free', 30, { joy: 0.5, energy: -0.08 }, 'jump', c => c.weather === 'rain' && c.n.energy > 0.25, 'it is raining and there are puddles everywhere', ['puddles. big ones.', 'the rain made puddles. that is a gift.']),
  watch_rain: A('watching the rain from the window', 'home', 45, { calm: 0.45, wonder: 0.15 }, 'inside', c => wet(c), 'listen to the rain on the roof', ['the rain is doing all the talking today.']),
  watch_storm: A('watching the storm', 'home', 60, { wonder: 0.4, calm: -0.05 }, 'inside', c => c.weather === 'storm', 'there is thunder over the island', ['count after the flash. one. two.']),
  fly_kite: A('flying a kite', 'lookout', 50, { joy: 0.45, wonder: 0.2, energy: -0.08 }, 'lookup', c => c.weather === 'wind' && c.day, 'the wind is strong enough for a kite', ['the wind wants something to carry.']),
  chase_rainbow: A('walking to the end of the rainbow', '@free', 35, { wonder: 0.5, joy: 0.3 }, 'lookup', c => c.weather === 'rainbow', 'there is a rainbow over the island', ['a rainbow. i am going to find where it lands.']),
  sit_under_tree: A('sitting under the big tree', 'bigtree', 45, { calm: 0.3, wonder: 0.15, joy: 0.1, energy: 0.04 }, 'sit', c => !c.night || c.n.calm < 0.5, 'the big tree at the edge of the island', ['i like it under the big tree. the island feels very far below.', 'petals. so many petals.', 'the big tree has been here longer than me.']),
  buy_cookie: A('buying a cookie', 'cookie', 25, { fullness: 0.25, joy: 0.25 }, 'stand', c => c.hour >= 7 && c.hour < 20 && c.life.s.coins >= 10 && c.n.fullness < 0.8 && c.life.s.cookieDay !== c.dayN, 'the cookie shop smells of warm cookies', ['warm cookies. i can smell them from here.', 'one cookie. maybe two.']),
  bake_cookies: A('baking cookies at the cookie shop', 'cookie', 60, { joy: 0.3, wonder: 0.12, calm: 0.1, energy: -0.06 }, 'inside', c => c.hour >= 8 && c.hour < 18 && c.life.s.bakedDay !== c.dayN && c.dayN % 3 === 0, 'the baker lets her help in the kitchen', ['flour on my flippers. worth it.', 'i want to make something that smells this good.']),
  ice_lolly: A('eating an ice lolly', 'cafe', 25, { fullness: 0.15, joy: 0.3, energy: 0.1 }, 'sit', c => c.weather === 'heat', 'it is very hot and the cart has ice lollies', ['too hot. something cold, now.']),
  cloud_shapes: A('finding shapes in the clouds', 'beach', 35, { calm: 0.35, wonder: 0.3 }, 'lie', c => c.day && c.weather === 'cloudy' && c.cal.season !== 3, 'the clouds are low and slow', ['that one is a fish. that one is also a fish.']),
  // skies and seasons
  wish:       A('wishing on shooting stars', 'lookout', 40, { wonder: 0.5, joy: 0.2 }, 'lookup', c => c.weather === 'meteors', 'shooting stars tonight', ['a star fell. quick. wish.']),
  event:      A('at the event', '', 80, { joy: 0.5, wonder: 0.2 }, 'flap', c => !!c.event && c.life.s.eventDone !== `${c.dayN}:${c.event.id}`, 'something is on today', ['i am not missing this.']),
};
