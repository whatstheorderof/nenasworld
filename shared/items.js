// Everything that can be caught, found, made, bought or placed on the island.
// Pure data, shared by the mind and the web client.

export const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
export const SEASON_DAYS = 3;                 // days per season, so a year is 12 Nena-days
export const YEAR_DAYS = SEASON_DAYS * 4;
export function calendar(day) {
  const doy = (day - 1) % YEAR_DAYS;
  return { year: Math.floor((day - 1) / YEAR_DAYS) + 1, dayOfYear: doy + 1, season: SEASONS[Math.floor(doy / SEASON_DAYS)] };
}

// Events by day of the year. `night` events start at dusk.
export const EVENTS = {
  2:  { key: 'blossom',   name: 'Blossom Picnic' },
  5:  { key: 'derby',     name: 'River Derby',       about: 'whoever lands the most fish wins a trophy' },
  6:  { key: 'fireworks', name: 'Fireworks Night',   night: true, fireworks: true },
  8:  { key: 'bugcount',  name: 'Great Bug Count',   about: 'whoever nets the most bugs wins a trophy' },
  9:  { key: 'feast',     name: 'Harvest Feast' },
  11: { key: 'lanterns',  name: 'Lantern Night',     night: true },
  12: { key: 'countdown', name: 'Year-End Countdown', night: true, fireworks: true },
};
export const CONCERT_EVERY = 4;               // a busker plays in the plaza every 4th evening

const A = SEASONS;
// w = how common (default 10). time: 'day' | 'night' | undefined for any.
export const FISH = [
  { name: 'trout', where: 'river', value: 90 }, { name: 'stickleback', where: 'river', value: 40, w: 14 },
  { name: 'pike', where: 'river', value: 220, w: 4 }, { name: 'crayfish', where: 'river', value: 120, seasons: ['spring', 'summer'] },
  { name: 'salmon', where: 'river', value: 300, seasons: ['autumn'], w: 6 }, { name: 'arctic char', where: 'river', value: 260, seasons: ['winter', 'autumn'], w: 5 },
  { name: 'carp', where: 'pond', value: 110 }, { name: 'goldfish', where: 'pond', value: 180, w: 4 },
  { name: 'frog', where: 'pond', value: 70, seasons: ['spring', 'summer'] }, { name: 'ice smelt', where: 'pond', value: 150, seasons: ['winter'] },
  { name: 'mackerel', where: 'sea', value: 60, w: 14 }, { name: 'herring', where: 'sea', value: 50, w: 12 },
  { name: 'cod', where: 'sea', value: 130 }, { name: 'flounder', where: 'sea', value: 160, w: 6 },
  { name: 'squid', where: 'sea', value: 200, time: 'night', w: 6 }, { name: 'sea bass', where: 'sea', value: 240, w: 5 },
  { name: 'sunfish', where: 'sea', value: 600, seasons: ['summer'], w: 2 }, { name: 'anglerfish', where: 'sea', value: 700, seasons: ['winter'], time: 'night', w: 2 },
];
export const BUGS = [
  { name: 'butterfly', value: 60, seasons: ['spring', 'summer'], time: 'day', w: 14 }, { name: 'ladybird', value: 50, seasons: ['spring', 'summer', 'autumn'], time: 'day' },
  { name: 'honeybee', value: 80, seasons: ['spring', 'summer'], time: 'day' }, { name: 'dragonfly', value: 140, seasons: ['summer'], time: 'day', w: 6 },
  { name: 'cicada', value: 110, seasons: ['summer'], time: 'day' }, { name: 'firefly', value: 160, seasons: ['summer'], time: 'night', w: 6 },
  { name: 'stag beetle', value: 400, seasons: ['summer'], time: 'night', w: 2 }, { name: 'cricket', value: 90, seasons: ['autumn'], time: 'night' },
  { name: 'mantis', value: 200, seasons: ['autumn', 'summer'], time: 'day', w: 5 }, { name: 'moth', value: 70, time: 'night' },
  { name: 'snail', value: 100, w: 5 }, { name: 'snow flea', value: 120, seasons: ['winter'] }, { name: 'pill bug', value: 40, w: 12 },
];
export const SEA = [
  { name: 'scallop', value: 180 }, { name: 'sea star', value: 120, w: 12 }, { name: 'sea urchin', value: 200 }, { name: 'crab', value: 220, w: 6 },
  { name: 'seaweed', value: 50, w: 14 }, { name: 'octopus', value: 450, w: 3 }, { name: 'pearl', value: 900, w: 1 },
];
export const FOSSILS = ['ammonite', 'trilobite', 'amber', 'fern fossil', 'shark tooth', 'great skull', 'great ribs', 'great tail', 'mammoth tusk', 'ancient penguin bone'].map(name => ({ name, value: 350 }));
export const SHELLS = [{ name: 'cowrie', value: 40 }, { name: 'conch', value: 120, w: 5 }, { name: 'sand dollar', value: 80 }, { name: 'coral', value: 150, w: 4 }, { name: 'cockle', value: 30, w: 14 }];
export const FRUIT = [{ name: 'apple', value: 60 }, { name: 'pear', value: 60 }, { name: 'cherry', value: 80 }];
export const MATERIALS = [{ name: 'wood', value: 15 }, { name: 'stone', value: 20 }, { name: 'iron nugget', value: 90 }, { name: 'clay', value: 30 }, { name: 'weeds', value: 5 }, { name: 'star fragment', value: 400 }, { name: 'flower seeds', value: 30 }, { name: 'sapling', value: 100 }, { name: 'snowberries', value: 0 }];

export const TOOLS = { rod: 'fishing rod', net: 'bug net', shovel: 'shovel', axe: 'axe' };
export const TOOL_USES = 25;

// makes: 'tool' (key in TOOLS), 'decor' (an outdoor thing she can place), 'meal' (eaten on the spot).
export const RECIPES = [
  { name: 'fishing rod', makes: 'tool', tool: 'rod', needs: { wood: 5 } },
  { name: 'bug net', makes: 'tool', tool: 'net', needs: { wood: 5 } },
  { name: 'shovel', makes: 'tool', tool: 'shovel', needs: { wood: 5, stone: 1 } },
  { name: 'axe', makes: 'tool', tool: 'axe', needs: { wood: 4, stone: 2 } },
  { name: 'log stool', makes: 'decor', needs: { wood: 4 } },
  { name: 'wooden bench', makes: 'decor', needs: { wood: 8 } },
  { name: 'signpost', makes: 'decor', needs: { wood: 4 } },
  { name: 'campfire', makes: 'decor', needs: { wood: 3, stone: 3 } },
  { name: 'scarecrow', makes: 'decor', needs: { wood: 4, weeds: 3 }, learn: true },
  { name: 'bird bath', makes: 'decor', needs: { stone: 6 }, learn: true },
  { name: 'stone lantern', makes: 'decor', needs: { stone: 5, 'iron nugget': 1 }, learn: true },
  { name: 'clay pot', makes: 'decor', needs: { clay: 4 }, learn: true },
  { name: 'star lamp', makes: 'decor', needs: { 'star fragment': 2, 'iron nugget': 1 }, learn: true },
  { name: 'shell arch', makes: 'decor', needs: { cowrie: 2, cockle: 3, conch: 1 }, learn: true },
  { name: 'grilled fish', makes: 'meal', needs: { anyFish: 1 } },
  { name: 'fruit salad', makes: 'meal', needs: { anyFruit: 2 } },
  { name: 'fish stew', makes: 'meal', needs: { anyFish: 2, anyFruit: 1 }, learn: true },
];
export const STARTING_RECIPES = RECIPES.filter(r => !r.learn).map(r => r.name);

// The shop always has seeds and saplings, plus two rotating things a day.
export const SHOP_DECOR = [{ name: 'garden gnome', price: 400 }, { name: 'parasol', price: 600 }, { name: 'lamp post', price: 800 }, { name: 'picnic blanket', price: 350 }, { name: 'flag', price: 300 }, { name: 'potted pine', price: 450 }, { name: 'snow globe', price: 700 }, { name: 'weather vane', price: 650 }];
export const SCARVES = { teal: 0x2fc6b3, red: 0xe8452c, yellow: 0xffd93b, violet: 0x6a2fc4, pink: 0xff7fa3, white: 0xfffaf0, navy: 0x2a3f8f };
export const HATS = ['bobble hat', 'straw hat', 'flower crown', 'party hat'];
export const PRICES = { 'flower seeds': 60, sapling: 200, scarf: 300, hat: 450, recipe: 500 };
export const HOUSE_LOANS = [0, 3000, 9000];   // cost to reach house level 2, then 3

export const NEIGHBOURS = {
  momo:  { name: 'Momo',  kind: 'bear',  home: 'momo',  birthday: 3,  vibe: 'a sleepy, gentle polar bear cub who thinks about snacks a lot and speaks slowly' },
  fenna: { name: 'Fenna', kind: 'fox',   home: 'fenna', birthday: 7,  vibe: 'a sharp, dry-humoured arctic fox who collects shiny things and pretends not to care' },
  juni:  { name: 'Juni',  kind: 'hare',  home: 'juni',  birthday: 10, vibe: 'an excitable snow hare who runs everywhere and has a new plan every day' },
};
export const NENA_BIRTHDAY = 4;

// name -> { cat, value } for everything that can sit in her pockets
export const ITEMS = {};
for (const [cat, list] of Object.entries({ fish: FISH, bug: BUGS, sea: SEA, fossil: FOSSILS, shell: SHELLS, fruit: FRUIT, material: MATERIALS })) for (const i of list) ITEMS[i.name] = { cat, value: i.value };
for (const r of RECIPES) if (r.makes === 'decor') ITEMS[r.name] = { cat: 'decor', value: 150 };
for (const d of SHOP_DECOR) ITEMS[d.name] = { cat: 'decor', value: Math.round(d.price / 4) };
for (const t of ['derby trophy', 'bug trophy', 'birthday cake', 'festival lantern', 'photo of Momo', 'photo of Fenna', 'photo of Juni', 'present box']) ITEMS[t] = { cat: 'decor', value: 300 };
export const MUSEUM = { fish: FISH.length, bug: BUGS.length, sea: SEA.length, fossil: FOSSILS.length };

export function pickFrom(list, season, night, where) {
  const ok = list.filter(i => (!where || i.where === where) && (!i.seasons || i.seasons.includes(season)) && (!i.time || (i.time === 'night') === night));
  if (!ok.length) return null;
  let total = ok.reduce((s, i) => s + (i.w || 10), 0), r = Math.random() * total;
  for (const i of ok) { r -= i.w || 10; if (r <= 0) return i; }
  return ok[0];
}
