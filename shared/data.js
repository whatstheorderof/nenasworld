// What there is to find, make and celebrate on the island, and everything Nena can do.

// ---- calendar: 1 real hour = 1 day, 7 days = a season, 28 days = a year ----------
export const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
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
  ammonite: { cat: 'fossil', v: 150 }, trilobite: { cat: 'fossil', v: 160 }, 'fern imprint': { cat: 'fossil', v: 120 }, 'old tooth': { cat: 'fossil', v: 180 }, 'giant feather': { cat: 'fossil', v: 220 }, 'tiny skull': { cat: 'fossil', v: 260 },
};
export const CATS = { fish: 'Fish', bug: 'Bugs', sea: 'Sea creatures', fossil: 'Fossils' };
export function catchOne(cat, where, season, rand = Math.random) {
  const pool = Object.entries(SPECIES).filter(([, s]) => s.cat === cat && (!where || s.where === where) && (!s.s || s.s.includes(season)));
  const total = pool.reduce((t, [, s]) => t + (s.rare ? 0.12 : 1), 0);
  let r = rand() * total;
  for (const [name, s] of pool) { r -= s.rare ? 0.12 : 1; if (r <= 0) return name; }
  return pool[0][0];
}
export const MATERIAL_VALUE = { shell: 15, fruit: 12, weeds: 3, wood: 8, stone: 10, ore: 40, dish: 30 };

// ---- crafting: what she can build and put out on the island --------------------------
export const RECIPES = {
  bench: { wood: 3 }, lantern: { wood: 1, ore: 1 }, cairn: { stone: 3 }, 'shell arch': { shell: 4 }, birdbath: { stone: 2, ore: 1 },
  scarecrow: { wood: 2, weeds: 2 }, signpost: { wood: 2 }, campfire: { wood: 2, stone: 2 }, 'wind chime': { shell: 2, wood: 1 }, 'log stool': { wood: 1 },
};
export const SHOP = { 'flower seeds': 40, sapling: 60, gift: 80, scarf: 150 };
export const SCARVES = [0x2fc6b3, 0xe8452c, 0xffd93b, 0x6a2fc4, 0xff7fa3, 0xfffaf0, 0x2f7f9a];
export const HOUSE_LOOKS = [{ wall: 0xfff1d6, roof: 0xe8452c }, { wall: 0xcfe6f7, roof: 0x2f7f9a }, { wall: 0xffd9de, roof: 0x6a2fc4 }, { wall: 0xfff3c4, roof: 0x2f8f7a }, { wall: 0xf7b34a, roof: 0x1d2545 }];
export const HOUSE_LOAN = [0, 1200, 3500];   // coins to reach level 2, then level 3

// ---- everything she can do --------------------------------------------------------------
// place: where she goes (or target: something that moves or appears: npc, a spot kind, 'free' grass)
// dur: real seconds. effects: total change to needs. anim: how she moves while doing it.
// ok(c): is it on offer right now? c = { n: needs, day, night, weather, cal, event, life, has(spotKind), npc }
// why: things she might think when the scripted mind picks it.
const A = (label, where, dur, effects, anim, ok, offer, why) => ({ label, ...(where.startsWith('@') ? { target: where.slice(1) } : { place: where || null }), dur, effects, anim, ok, offer, why });
const any = () => true;
export const ACTIONS = {
  // everyday
  sleep:      A('sleeping', 'home', 420, { energy: 1.0, calm: 0.3, fullness: -0.15 }, 'inside', c => c.n.energy < 0.3 || (c.night && c.n.energy < 0.75), 'tired', ['eyes heavy. home.', 'the day is full enough. sleep now.']),
  rest:       A('resting at home', 'home', 45, { energy: 0.18, calm: 0.25 }, 'sit', c => c.n.energy < 0.6 || c.n.calm < 0.4, 'a quiet sit at home', ['sit a while. nothing has to happen.']),
  eat:        A('eating fish', 'fish', 35, { fullness: 0.7, joy: 0.1 }, 'peck', c => c.n.fullness < 0.75, 'the fish stall', ['belly says fish.', 'i can smell the stall from here.']),
  cook:       A('cooking at home', 'home', 50, { fullness: 0.6, joy: 0.2, calm: 0.1 }, 'inside', c => c.n.fullness < 0.8 && c.life.food() > 0, 'cook something she caught or picked', ['i caught it. i should cook it.', 'the kitchen has been quiet too long.']),
  swim:       A('sliding on the pond', 'pond', 55, { joy: 0.45, energy: -0.12, calm: 0.1 }, 'swim', c => c.n.energy > 0.25, 'the pond is good for sliding', ['the ice looks fast today.', 'one slide. maybe six.']),
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
  dive:       A('diving off the beach', 'beach', 55, { joy: 0.3, wonder: 0.25, energy: -0.15 }, 'dive', c => c.n.energy > 0.35 && c.cal.season !== 3, 'things live on the sea floor', ['i am built for this, actually.']),
  catch_bugs: A('catching bugs', 'garden', 45, { joy: 0.25, wonder: 0.2, energy: -0.08 }, 'flap', c => c.n.energy > 0.25, 'the garden is full of small things', ['something small just flew past.']),
  beachcomb:  A('combing the beach', 'beach', 45, { wonder: 0.3, joy: 0.12, energy: -0.06 }, 'peck', c => c.n.energy > 0.2, 'the tide leaves shells', ['the sea always leaves something.']),
  shake_tree: A('shaking the fruit trees', 'orchard', 30, { joy: 0.2, energy: -0.05 }, 'flap', c => c.cal.season !== 3 && c.life.fruitReady(c.dayN), 'the trees look heavy with fruit', ['if i shake it, things fall out. good system.']),
  chop_wood:  A('chopping wood', 'orchard', 40, { energy: -0.12, calm: 0.15 }, 'flap', c => c.n.energy > 0.35 && c.life.count('wood') < 8, 'wood for building things', ['i need wood if i am going to make anything.']),
  mine_rock:  A('chipping at the big rock', 'rock', 35, { energy: -0.1, wonder: 0.12 }, 'peck', c => c.n.energy > 0.3 && c.life.count('stone') < 8, 'stone and maybe something shiny', ['there is something shiny in that rock.']),
  dig_fossil: A('digging something up', '@fossil', 30, { wonder: 0.4, energy: -0.08 }, 'peck', c => c.has('fossil'), 'a crack in the ground with something under it', ['the ground has a crack shaped like a star.']),
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
  plant_tree: A('planting a tree', '@free', 35, { calm: 0.25, joy: 0.2 }, 'peck', c => c.life.count('sapling') > 0 && c.cal.season !== 3, 'she has a sapling', ['a tree here. it will take a while.']),
  garden:     A('watering the garden', 'garden', 45, { calm: 0.3, joy: 0.2 }, 'peck', c => c.day && c.weather !== 'snow', 'the flowers want water', ['the yellow one looked thirsty.']),
  redecorate: A('repainting her house', 'home', 60, { joy: 0.35, energy: -0.08 }, 'flap', c => c.day && c.life.s.coins >= 60 && c.dayN - (c.life.s.look.painted || -9) > 6, 'the house could be a different colour', ['i am tired of this roof colour.']),
  change_outfit: A('changing her scarf', 'home', 25, { joy: 0.25 }, 'inside', c => c.life.s.look.scarves.length > 1 && c.dayN !== c.life.s.look.changed, 'she owns more than one scarf', ['different scarf today.']),
  pay_home:   A('putting coins toward a bigger house', 'home', 25, { calm: 0.2, joy: 0.15 }, 'stand', c => c.life.s.house.level < 3 && c.life.s.coins >= 300, 'she has savings and the house is small', ['a bigger house costs coins. i have coins.']),
  // neighbours
  chat:       A('chatting with a neighbour', '@npc', 30, { joy: 0.3, calm: 0.1 }, 'stand', c => !!c.npc && (c.life.s.chats?.[0] !== c.dayN || c.life.s.chats[1] < 4), 'a neighbour is out and about', ['someone to talk to.']),
  give_gift:  A('giving a neighbour a present', '@npc', 30, { joy: 0.4 }, 'flap', c => !!c.npc && c.life.giftable() && c.life.s.giftDay !== c.dayN, 'she has something a neighbour would like', ['i think they would like this.']),
  write_letter: A('writing a letter', 'home', 40, { calm: 0.25, joy: 0.15 }, 'sit', c => c.n.energy > 0.2, 'write to a neighbour', ['i have been meaning to write.']),
  // skies and seasons
  wish:       A('wishing on shooting stars', 'lookout', 40, { wonder: 0.5, joy: 0.2 }, 'lookup', c => c.weather === 'meteors', 'shooting stars tonight', ['a star fell. quick. wish.']),
  event:      A('at the event', '', 80, { joy: 0.5, wonder: 0.2 }, 'flap', c => !!c.event && c.life.s.eventDone !== `${c.dayN}:${c.event.id}`, 'something is on today', ['i am not missing this.']),
};
