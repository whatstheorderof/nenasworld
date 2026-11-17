// The island's life beyond Nena's body: her pockets, tools, the museum, the shop,
// her neighbours, what she has planted and placed, the seasons and the calendar.
// All rules are code. The brain only chooses which offered action to take.
import { PLACES, ACTIONS, route, blocked, freeSpot, site, inBeach } from '../../shared/world.js';
import { calendar, EVENTS, CONCERT_EVERY, FISH, BUGS, SEA, FOSSILS, SHELLS, FRUIT, ITEMS, RECIPES, STARTING_RECIPES, TOOLS, TOOL_USES,
  SHOP_DECOR, SCARVES, HATS, PRICES, HOUSE_LOANS, NEIGHBOURS, NENA_BIRTHDAY, MUSEUM, pickFrom } from '../../shared/items.js';

const pick = a => a[Math.floor(Math.random() * a.length)];
const chance = p => Math.random() < p;
const an = w => (/^[aeiou]/i.test(w) ? `an ${w}` : `a ${w}`);
const HANGOUTS = ['plaza', 'pond', 'beach', 'garden', 'river', 'orchard', 'fish', 'seat', 'shop', 'museum'];

export class Island {
  constructor(memory, world) {
    this.memory = memory; this.world = world;
    const fresh = { coins: 300, bag: { wood: 3 }, tools: { rod: TOOL_USES, net: TOOL_USES }, recipes: [...STARTING_RECIPES], museum: [],
      decor: [], plants: [], weeds: [], digs: [], fruitDay: 0, house: 1, paid: 0, outfit: { scarf: 'teal', hat: null }, wardrobe: { scarves: ['teal'], hats: [] },
      friends: {}, stamps: [], berries: { count: 0, paid: 0, day: 0 }, berryPrice: 100, score: { fish: 0, bugs: 0 }, shop: [], album: [],
      earned: 0, lastDay: 0, snowmen: 0, meteor: false, balloon: null, starOnBeach: false, joined: 0 };
    this.s = { ...fresh, ...memory.readJson('island.json', {}) };
    for (const k of Object.keys(NEIGHBOURS)) this.s.friends[k] ??= { level: 0.1, lastChat: 0, lastGift: 0, gave: 0 };
    this.version = 1;
    // neighbours live in the world too: they wander, stop to talk, and go in at night
    this.folk = Object.entries(NEIGHBOURS).map(([key, n]) => ({ key, ...n, pos: { x: PLACES[n.home].x, z: PLACES[n.home].z }, heading: 0, path: [], waitUntil: 0, held: 0, inside: false, say: null, sayUntil: 0 }));
    if (this.s.lastDay !== world.day) this.newDay(world.day);
  }
  save() { this.memory.writeJson('island.json', this.s); }
  touch() { this.version++; this.save(); }

  // ---- calendar ----------------------------------------------------------
  get cal() { return calendar(this.world.day); }
  get event() {
    const e = EVENTS[this.cal.dayOfYear]; if (!e) return null;
    const h = this.world.hour; return (e.night ? h >= 18 : h >= 7 && h < 21) ? e : null;
  }
  get birthday() { const d = this.cal.dayOfYear; if (d === NENA_BIRTHDAY) return { who: 'Nena', key: null }; const k = Object.keys(NEIGHBOURS).find(k => NEIGHBOURS[k].birthday === d); return k ? { who: NEIGHBOURS[k].name, key: k } : null; }
  get concert() { return this.world.day % CONCERT_EVERY === 0 && this.world.hour >= 18 && this.world.hour < 23; }
  get marketDay() { return this.world.day % 6 === 1; }

  newDay(day) {
    const s = this.s, prev = calendar(Math.max(1, day - 1)), prevEvent = EVENTS[prev.dayOfYear];
    // yesterday's contests
    if (prevEvent?.key === 'derby' && s.score.fish >= 3) { this.add('derby trophy'); this.memory.remember(day, `i won the River Derby with ${s.score.fish} fish`, 0.9); }
    if (prevEvent?.key === 'bugcount' && s.score.bugs >= 3) { this.add('bug trophy'); this.memory.remember(day, `i won the Great Bug Count with ${s.score.bugs} bugs`, 0.9); }
    s.score = { fish: 0, bugs: 0 }; s.joined = 0; s.lastDay = day; s.fruitDay = day;
    // weeds creep in, three new dig spots, saplings grow
    for (let i = 0; i < 2 && s.weeds.length < 8; i++) { const p = freeSpot([...s.weeds, ...s.decor, ...s.plants]); if (p) s.weeds.push(p); }
    s.digs = []; for (let i = 0; i < 3; i++) { const p = freeSpot([...s.digs, ...s.decor, ...s.plants]); if (p) s.digs.push(p); }
    for (const p of s.plants) if (p.kind === 'tree') p.age = Math.min(3, (p.age || 0) + 1);
    // today's shop shelf, snowberry price, sky
    const d1 = pick(SHOP_DECOR); let d2 = pick(SHOP_DECOR); if (d2 === d1) d2 = SHOP_DECOR[(SHOP_DECOR.indexOf(d1) + 1) % SHOP_DECOR.length];
    const scarf = pick(Object.keys(SCARVES).filter(c => !s.wardrobe.scarves.includes(c))), hat = pick(HATS.filter(h => !s.wardrobe.hats.includes(h)));
    const unknown = RECIPES.filter(r => r.learn && !s.recipes.includes(r.name));
    s.shop = [{ name: d1.name, price: d1.price, kind: 'decor' }, { name: d2.name, price: d2.price, kind: 'decor' }];
    if (scarf) s.shop.push({ name: `${scarf} scarf`, price: PRICES.scarf, kind: 'scarf', scarf });
    if (hat && day % 2 === 0) s.shop.push({ name: hat, price: PRICES.hat, kind: 'hat' });
    if (unknown.length && day % 2 === 1) s.shop.push({ name: `recipe for ${an(pick(unknown).name)}`, price: PRICES.recipe, kind: 'recipe' });
    s.berryPrice = this.marketDay ? 90 + Math.floor(Math.random() * 20) : Math.max(40, Math.round(s.berryPrice * (0.7 + Math.random() * 0.75)));
    if (s.berries.count && day - s.berries.day >= 6) { s.berries = { count: 0, paid: 0, day: 0 }; this.memory.remember(day, 'my snowberries went bad before i sold them', 0.7); }
    s.meteor = chance(0.3); s.balloon = null;
    this.touch();
  }

  // ---- pockets -------------------------------------------------------------
  has(name, n = 1) { return (this.s.bag[name] || 0) >= n; }
  add(name, n = 1) { this.s.bag[name] = (this.s.bag[name] || 0) + n; }
  take(name, n = 1) { if (!this.has(name, n)) return false; this.s.bag[name] -= n; if (this.s.bag[name] <= 0) delete this.s.bag[name]; return true; }
  held(cat) { return Object.keys(this.s.bag).filter(k => ITEMS[k]?.cat === cat); }
  useTool(t) { if (--this.s.tools[t] <= 0) { delete this.s.tools[t]; return ` my ${TOOLS[t]} broke.`; } return ''; }
  undonated() { return Object.keys(this.s.bag).filter(k => MUSEUM[ITEMS[k]?.cat] && !this.s.museum.includes(k)); }
  sellable() { return Object.keys(this.s.bag).filter(k => ['fish', 'bug', 'sea', 'fossil', 'shell', 'fruit'].includes(ITEMS[k]?.cat) && !this.undonated().includes(k)); }
  saleValue() { const s = this.s; return this.sellable().reduce((t, k) => t + ITEMS[k].value * Math.max(0, s.bag[k] - (ITEMS[k].cat === 'fruit' || ITEMS[k].cat === 'fish' ? 1 : 0)), 0) + (this.sellBerries() ? s.berries.count * s.berryPrice : 0); }
  sellBerries() { const b = this.s.berries; return b.count > 0 && (this.s.berryPrice >= b.paid * 1.25 || this.world.day - b.day >= 5); }
  canMake(r) {
    const fish = this.held('fish').reduce((t, k) => t + this.s.bag[k], 0), fruit = this.held('fruit').reduce((t, k) => t + this.s.bag[k], 0);
    return Object.entries(r.needs).every(([k, n]) => (k === 'anyFish' ? fish >= n : k === 'anyFruit' ? fruit >= n : this.has(k, n)));
  }
  craftable() { return RECIPES.filter(r => r.makes !== 'meal' && this.s.recipes.includes(r.name) && this.canMake(r) && !(r.makes === 'tool' && this.s.tools[r.tool])); }
  cookable() { return RECIPES.filter(r => r.makes === 'meal' && this.s.recipes.includes(r.name) && this.canMake(r)); }
  spend(r) { for (const [k, n] of Object.entries(r.needs)) { if (k === 'anyFish' || k === 'anyFruit') { let left = n; for (const f of this.held(k === 'anyFish' ? 'fish' : 'fruit')) while (left > 0 && this.take(f)) left--; } else this.take(k, n); } }
  affordable() { return [...this.s.shop, { name: 'flower seeds', price: PRICES['flower seeds'], kind: 'seeds' }, { name: 'sapling', price: PRICES.sapling, kind: 'sapling' }].filter(i => i.price <= this.s.coins); }
  taken() { return [...this.s.decor, ...this.s.plants, ...this.s.weeds, ...this.s.digs]; }
  obstacles() { return [...this.s.decor.map(d => ({ x: d.x, z: d.z, r: 0.7 })), ...this.s.plants.filter(p => p.kind === 'tree').map(p => ({ x: p.x, z: p.z, r: 0.5 }))]; }
  awake() { return this.folk.filter(f => !f.inside); }

  // ---- what is on offer right now: action -> the reason shown to the brain ----
  offers() {
    const s = this.s, w = this.world, n = w.needs, day = !w.isNight, season = this.cal.season, out = {};
    const tool = t => s.tools[t] > 0;
    if (tool('rod')) { out.go_fishing = 'the river has fish'; out.sea_fishing = 'cast from the beach'; if (season !== 'winter') out.pond_fishing = 'the pond is still'; }
    if (tool('net')) out.catch_bugs = w.isNight ? 'night bugs are out' : 'bugs around the flowers';
    if (tool('shovel') && s.digs.length) out.dig_fossil = `${s.digs.length} star-shaped crack${s.digs.length > 1 ? 's' : ''} in the ground`;
    if (tool('shovel')) out.hit_rock = 'stone, clay, maybe iron';
    if (tool('axe')) out.chop_wood = 'wood for crafting';
    out.shake_trees = s.fruitDay ? 'fruit is ripe, branches too' : 'branches fall for crafting';
    if (season !== 'winter' && n.energy > 0.3) out.dive = 'things live on the sea bed';
    if (n.energy > 0.25) out.beachcomb = s.starOnBeach ? 'something is glinting on the sand' : 'the tide leaves shells';
    if (s.weeds.length) out.pull_weeds = `${s.weeds.length} weed${s.weeds.length > 1 ? 's' : ''} have come up`;
    if (s.balloon) out.chase_balloon = 'a balloon with a present is drifting over';
    const und = this.undonated(); if (und.length) out.donate = `the museum has never seen ${und.slice(0, 3).join(', ')}`;
    if (s.museum.length >= 3) out.visit_museum = `${s.museum.length} things on show`;
    if (this.saleValue() > 0) out.sell = `pockets worth about ${this.saleValue()} pebbles`;
    const buyable = this.affordable(); if (buyable.length && day) out.buy = `has ${s.coins} pebbles; on the shelf: ${buyable.map(i => i.name).slice(0, 5).join(', ')}${this.marketDay ? '; snowberries on sale today' : ''}`;
    const owed = (HOUSE_LOANS[s.house] || 0) - s.paid; if (s.house < 3 && s.coins >= 500 && day) out.pay_loan = `${owed} pebbles to go for a bigger house`;
    const cr = this.craftable(); if (cr.length) out.craft = `can make: ${cr.map(r => r.name).join(', ')}`;
    const ck = this.cookable(); if (ck.length && n.fullness < 0.8) out.cook = `can cook: ${ck.map(r => r.name).join(', ')}`;
    const around = this.awake();
    if (around.length) { out.chat = `${around.map(f => f.name).join(', ')} ${around.length > 1 ? 'are' : 'is'} out and about`; const g = this.giftable(); if (g.length) out.give_gift = `could give away ${g.slice(0, 3).join(', ')}`; }
    const bd = this.birthday; if (bd && day && s.joined < 1) out.party = `it is ${bd.who === 'Nena' ? 'her own' : bd.who + "'s"} birthday`;
    if (this.held('decor').length) out.decorate = `has ${this.held('decor').slice(0, 3).join(', ')} to put out`;
    if (this.has('flower seeds') && s.plants.filter(p => p.kind === 'flower').length < 40) out.plant_flowers = 'seeds in her pocket';
    if (this.has('sapling') && s.plants.filter(p => p.kind === 'tree').length < 12) out.plant_tree = 'a sapling in her pocket';
    if (day) out.garden = 'the flowers want water';
    if (n.energy > 0.3 && (season === 'winter' || w.weather === 'snow')) out.snowman = 'the snow is the packing kind';
    if (s.wardrobe.scarves.length + s.wardrobe.hats.length > 1) out.change_outfit = 'something different today';
    if (s.meteor && w.isNight && w.weather !== 'mist') out.wish_on_star = 'shooting stars tonight';
    if (day && w.weather === 'clear' && season !== 'winter') out.sunbathe = 'the sand is warm';
    out.sit_bench = 'watch the plaza go by'; out.take_photo = 'something worth remembering';
    if (w.hour >= 6 && w.hour < 9) out.stretch = 'morning stretches in the plaza';
    if (this.concert) out.listen_music = 'the busker is playing in the plaza tonight';
    const e = this.event; if (e && s.joined < 2) out.join_event = `${e.name} is on in the plaza${e.about ? `: ${e.about}` : ''}`;
    return out;
  }
  giftable() { return Object.keys(this.s.bag).filter(k => ['fruit', 'shell', 'decor', 'sea'].includes(ITEMS[k]?.cat) || (ITEMS[k]?.cat === 'fish' && this.s.museum.includes(k))); }

  // ---- where an action happens when it is not at a fixed place -----------------
  target(action, detail) {
    const s = this.s, pos = this.world.pos, near = list => list.slice().sort((a, b) => Math.hypot(a.x - pos.x, a.z - pos.z) - Math.hypot(b.x - pos.x, b.z - pos.z))[0];
    const beside = (p, gap = 1.3) => { const l = Math.hypot(p.x, p.z) || 1; return { x: p.x - (p.x / l) * gap, z: p.z - (p.z / l) * gap, ref: p }; };
    const at = ACTIONS[action].at;
    if (at === 'dig') return s.digs.length ? beside(near(s.digs), 0.9) : null;
    if (at === 'weed') return s.weeds.length ? beside(near(s.weeds), 0.8) : null;
    if (at === 'balloon') return s.balloon ? { x: s.balloon.x, z: s.balloon.z } : null;
    if (at === 'neighbour') {
      const around = this.awake(); if (!around.length) return null;
      const want = String(detail || '').toLowerCase(), f = around.find(f => want.includes(f.name.toLowerCase())) || (action === 'chat' ? around.slice().sort((a, b) => this.s.friends[a.key].lastChat - this.s.friends[b.key].lastChat)[0] : pick(around));
      f.held = this.world.now() + 90000; f.path = [];
      const dx = pos.x - f.pos.x, dz = pos.z - f.pos.z, l = Math.hypot(dx, dz) || 1;
      return { x: f.pos.x + (dx / l) * 1.6, z: f.pos.z + (dz / l) * 1.6, who: f.key };
    }
    if (action === 'wander' || action === 'take_photo') { for (let i = 0; i < 20; i++) { const a = Math.random() * 6.28, r = 4 + Math.random() * 16, p = { x: Math.cos(a) * r, z: Math.sin(a) * r }; if (!blocked(p.x, p.z, 1.5, this.obstacles())) return p; } return { x: 0, z: 0 }; }
    const spot = freeSpot(this.taken()); return spot ? beside(spot, 1.3) : null;   // decorate, plant
  }

  // ---- what actually happens when she finishes an action ----------------------
  // Returns { result: 'a line for her diary', bump: mood push, keep: 'worth remembering' }
  finish(a) {
    const s = this.s, w = this.world, season = this.cal.season, night = w.isNight, day = w.day, action = a.action;
    const out = { result: '', bump: 0 }, m = this.memory;
    const caught = (item, kind) => {
      if (!item) { out.result = 'nothing bit.'; return; }
      this.add(item.name); const first = !s.museum.includes(item.name) && s.bag[item.name] === 1;
      out.result = `caught ${an(item.name)}${first ? '. never seen one before!' : '.'}`; out.bump = first ? 0.25 : 0.08; a.detail = item.name;
      if (kind === 'fish' && EVENTS[this.cal.dayOfYear]?.key === 'derby') s.score.fish++;
      if (kind === 'bug' && EVENTS[this.cal.dayOfYear]?.key === 'bugcount') s.score.bugs++;
    };
    if (action === 'go_fishing' || action === 'sea_fishing' || action === 'pond_fishing') {
      caught(chance(0.85) ? pickFrom(FISH, season, night, action === 'go_fishing' ? 'river' : action === 'sea_fishing' ? 'sea' : 'pond') : null, 'fish'); out.result += this.useTool('rod');
    } else if (action === 'catch_bugs') { caught(chance(0.8) ? pickFrom(BUGS, season, night) : null, 'bug'); if (!out.result.startsWith('caught')) out.result = 'it got away.'; out.result += this.useTool('net');
    } else if (action === 'dive') { caught(chance(0.8) ? pickFrom(SEA, season, night) : null, 'sea'); if (!out.result.startsWith('caught')) out.result = 'came up with nothing but cold toes.';
    } else if (action === 'dig_fossil') {
      const i = s.digs.indexOf(a.target?.ref); if (i >= 0) s.digs.splice(i, 1); else s.digs.shift();
      const missing = FOSSILS.filter(f => !s.museum.includes(f.name) && !this.has(f.name)), f = chance(0.7) && missing.length ? pick(missing) : pick(FOSSILS);
      this.add(f.name); a.detail = f.name; out.result = `dug up ${an(f.name)}.` + this.useTool('shovel'); out.bump = 0.2;
    } else if (action === 'beachcomb') {
      if (s.starOnBeach) { s.starOnBeach = false; this.add('star fragment'); a.detail = 'a star fragment'; out.result = 'found a star fragment on the sand. my wish landed.'; out.bump = 0.3; out.keep = 'a star i wished on washed up on the beach'; }
      else if (chance(0.12)) { const r = pick(RECIPES.filter(r => r.learn && !s.recipes.includes(r.name)) || []); if (r) { s.recipes.push(r.name); a.detail = 'a message in a bottle'; out.result = `found a bottle with a note inside: how to make ${an(r.name)}.`; out.bump = 0.25; } }
      if (!out.result) { const sh = pickFrom(SHELLS, season, night); this.add(sh.name); a.detail = an(sh.name); out.result = `picked up ${an(sh.name)}.`; out.bump = 0.05; }
    } else if (action === 'shake_trees') {
      const wood = 2 + Math.floor(Math.random() * 2); this.add('wood', wood); out.result = `${wood} branches came down`;
      if (s.fruitDay) { const f = pick(FRUIT), n = 2 + Math.floor(Math.random() * 2); this.add(f.name, n); s.fruitDay = 0; out.result += `, and ${n} ${f.name === 'cherry' ? 'cherries' : f.name + 's'}`; }
      if (chance(0.12)) { const c = 50 + Math.floor(Math.random() * 150); s.coins += c; out.result += `, and ${c} pebbles someone hid up there`; }
      if (chance(0.06)) { out.result += '. also wasps. i ran'; out.bump = -0.3; w.needs.calm = Math.max(0, w.needs.calm - 0.25); } out.result += '.';
    } else if (action === 'chop_wood') { const n = 3 + Math.floor(Math.random() * 2); this.add('wood', n); out.result = `${n} pieces of wood.` + this.useTool('axe');
    } else if (action === 'hit_rock') {
      const got = []; const n = 2 + Math.floor(Math.random() * 2); this.add('stone', n); got.push(`${n} stone`);
      if (chance(0.4)) { this.add('clay', 2); got.push('2 clay'); } if (chance(0.35)) { this.add('iron nugget'); got.push('an iron nugget'); }
      out.result = `${got.join(', ')}.` + this.useTool('shovel');
    } else if (action === 'pull_weeds') { const i = s.weeds.indexOf(a.target?.ref); s.weeds.splice(i >= 0 ? i : 0, 1); this.add('weeds'); out.result = s.weeds.length ? `one less. ${s.weeds.length} to go.` : 'that was the last weed. tidy.';
    } else if (action === 'chase_balloon') { s.balloon = null; const prize = chance(0.5) ? pick(SHOP_DECOR).name : 'present box'; if (chance(0.3)) { s.coins += 300; out.result = 'the present had 300 pebbles in it.'; } else { this.add(prize); out.result = `the present had ${an(prize)} in it.`; } out.bump = 0.3;
    } else if (action === 'donate') {
      const und = this.undonated(); for (const k of und) { this.take(k); s.museum.push(k); }
      out.result = und.length ? `gave the museum ${und.join(', ')}. ${s.museum.length} things on show now.` : 'nothing new to give today.'; out.bump = 0.2 * Math.min(2, und.length);
      if (und.length) out.keep = `the museum has my ${und[0]} on show`;
    } else if (action === 'visit_museum') { const k = pick(s.museum); a.detail = k; out.result = `stood in front of the ${k} for a long time.`;
    } else if (action === 'sell') {
      let total = 0; const sold = [];
      for (const k of this.sellable()) { const keep = ITEMS[k].cat === 'fruit' || ITEMS[k].cat === 'fish' ? 1 : 0, n = s.bag[k] - keep; if (n > 0) { this.take(k, n); total += n * ITEMS[k].value; sold.push(`${n} ${k}`); } }
      if (this.sellBerries()) { const b = s.berries, got = b.count * s.berryPrice; total += got; sold.push(`${b.count} snowberries at ${s.berryPrice} each (${got >= b.count * b.paid ? 'profit' : 'a loss'})`); s.berries = { count: 0, paid: 0, day: 0 }; }
      s.coins += total; s.earned += total; out.result = total ? `sold ${sold.slice(0, 4).join(', ')}${sold.length > 4 ? ' and more' : ''} for ${total} pebbles.` : 'nothing to sell after all.'; out.bump = total > 500 ? 0.2 : 0.05;
    } else if (action === 'buy') {
      const opts = this.affordable(), want = String(a.detail || '').toLowerCase();
      let item = opts.find(i => want && (want.includes(i.name) || i.name.includes(want)));
      if (!item && this.marketDay && !s.berries.count && s.coins >= 600 && chance(0.6)) { const n = Math.floor((s.coins * 0.5) / s.berryPrice); s.coins -= n * s.berryPrice; s.berries = { count: n, paid: s.berryPrice, day }; this.add('snowberries', 0); a.detail = 'snowberries'; out.result = `bought ${n} snowberries at ${s.berryPrice} each. they say the price changes every day.`; }
      else { item ||= opts.find(i => i.kind === 'recipe') || (chance(0.5) ? opts.find(i => i.kind === 'seeds') : null) || pick(opts);
        if (!item) out.result = 'could not afford anything today.';
        else { s.coins -= item.price; a.detail = item.name;
          if (item.kind === 'decor') this.add(item.name); if (item.kind === 'seeds') this.add('flower seeds', 3); if (item.kind === 'sapling') this.add('sapling');
          if (item.kind === 'scarf') s.wardrobe.scarves.push(item.scarf); if (item.kind === 'hat') s.wardrobe.hats.push(item.name);
          if (item.kind === 'recipe') s.recipes.push(RECIPES.find(r => item.name.endsWith(r.name)).name);
          s.shop = s.shop.filter(i => i !== item && i.name !== item.name); out.result = `bought ${item.kind === 'seeds' ? 'three bags of flower seeds' : an(item.name)} for ${item.price} pebbles.`; out.bump = 0.15; } }
    } else if (action === 'pay_loan') {
      const cost = HOUSE_LOANS[s.house], pay = Math.min(s.coins, cost - s.paid); s.coins -= pay; s.paid += pay;
      if (s.paid >= cost) { s.house++; s.paid = 0; out.result = `paid the last ${pay} pebbles. the house is getting bigger!`; out.bump = 0.5; out.keep = `i paid for my house to be made bigger (now size ${s.house})`; }
      else out.result = `paid ${pay} pebbles towards a bigger house. ${cost - s.paid} to go.`;
    } else if (action === 'craft') {
      const opts = this.craftable(), want = String(a.detail || '').toLowerCase(), r = opts.find(r => want.includes(r.name)) || opts.find(r => r.makes === 'tool') || pick(opts);
      if (!r) out.result = 'did not have the parts after all.';
      else { this.spend(r); a.detail = r.name; if (r.makes === 'tool') s.tools[r.tool] = TOOL_USES; else this.add(r.name); out.result = `made ${an(r.name)}.`; out.bump = 0.15; }
    } else if (action === 'cook') {
      const opts = this.cookable(), want = String(a.detail || '').toLowerCase(), r = opts.find(r => want.includes(r.name)) || opts[opts.length - 1];
      if (!r) { out.result = 'the cupboard was bare.'; w.needs.fullness = Math.max(0, w.needs.fullness - 0.5); } else { this.spend(r); a.detail = r.name; out.result = `cooked ${r.name} and ate all of it.`; out.bump = 0.1; }
    } else if (action === 'chat' || action === 'give_gift') {
      const f = this.folk.find(f => f.key === a.target?.who); if (!f) { out.result = 'they had already gone.'; return out; }
      const fr = s.friends[f.key]; f.held = w.now() + 6000; out.who = f;
      if (action === 'give_gift') { const g = this.giftable(), want = String(a.detail || '').toLowerCase(), item = g.find(k => want.includes(k)) || pick(g);
        if (item) { this.take(item); fr.level = Math.min(1, fr.level + (fr.lastGift === day ? 0.03 : 0.12)); fr.lastGift = day; out.gift = item; out.result = `gave ${f.name} ${an(item)}.`; out.bump = 0.2; } else out.result = `had nothing to give ${f.name}.`;
      } else { fr.level = Math.min(1, fr.level + (fr.lastChat === day ? 0.02 : 0.07)); fr.lastChat = day; out.result = `talked with ${f.name}.`; out.bump = 0.1; }
      // friends give things back
      const tier = Math.floor(fr.level * 5); if (tier > fr.gave) { fr.gave = tier; const r = pick(RECIPES.filter(r => r.learn && !s.recipes.includes(r.name)));
        if (tier === 4) { this.add(`photo of ${f.name}`); out.result += ` ${f.name} gave me a photo of themself. we are proper friends.`; out.keep = `${f.name} gave me their photo`; }
        else if (r) { s.recipes.push(r.name); out.result += ` ${f.name} showed me how to make ${an(r.name)}.`; } else { const fr2 = pick(FRUIT).name; this.add(fr2, 2); out.result += ` ${f.name} gave me some ${fr2}.`; } }
    } else if (action === 'party') { s.joined = 1; const bd = this.birthday; out.result = bd?.key ? `${bd.who}'s birthday. there was cake.` : 'my own birthday. everyone came. there was cake.'; out.bump = 0.4;
      if (bd?.key) s.friends[bd.key].level = Math.min(1, s.friends[bd.key].level + 0.1); else this.add('birthday cake'); out.keep = bd?.key ? `i went to ${bd.who}'s birthday party` : 'everyone came to my birthday';
    } else if (action === 'decorate') {
      const have = this.held('decor'), want = String(a.detail || '').toLowerCase(), item = have.find(k => want.includes(k)) || pick(have), p = a.target?.ref;
      if (item && p) { this.take(item); s.decor.push({ item, x: p.x, z: p.z, ry: Math.round(Math.random() * 628) / 100 }); a.detail = item; out.result = `put the ${item} out. it looks right there.`; out.bump = 0.15; } else out.result = 'could not find a good spot.';
    } else if (action === 'plant_flowers') { const p = a.target?.ref; if (p && this.take('flower seeds')) { s.plants.push({ kind: 'flower', x: p.x, z: p.z, c: Math.floor(Math.random() * 4) }); out.result = 'planted flowers.'; } else out.result = 'no room for flowers there.';
    } else if (action === 'plant_tree') { const p = a.target?.ref; if (p && this.take('sapling')) { s.plants.push({ kind: 'tree', x: p.x, z: p.z, age: 0 }); out.result = 'planted a sapling. it will take a few days.'; out.keep = 'i planted a tree'; } else out.result = 'no room for a tree there.';
    } else if (action === 'snowman') { s.snowmen++; out.result = chance(0.3) ? 'a perfect snowman. he looks pleased.' : 'a slightly lopsided snowman.';
    } else if (action === 'change_outfit') { const sc = pick(s.wardrobe.scarves), hat = s.wardrobe.hats.length && chance(0.7) ? pick(s.wardrobe.hats) : null; s.outfit = { scarf: sc, hat }; a.detail = `${sc} scarf${hat ? ` and ${hat}` : ''}`; out.result = `wearing the ${a.detail} now.`;
    } else if (action === 'wish_on_star') { s.starOnBeach = true; out.result = 'made a wish on three of them.'; out.bump = 0.2;
    } else if (action === 'take_photo') { const subj = pick(['the pond', 'the sea', 'my house', 'the lamps', 'the sky', ...this.awake().map(f => f.name), ...s.decor.slice(-2).map(d => `the ${d.item}`)]); a.detail = subj; s.album.push({ day, of: subj }); if (s.album.length > 40) s.album.shift(); out.result = `took a photo of ${subj}.`;
    } else if (action === 'join_event') { s.joined = 2; const e = this.event || EVENTS[this.cal.dayOfYear]; a.detail = e?.name; out.bump = 0.35; out.keep = `i went to the ${e?.name}`;
      out.result = { blossom: 'sat under the blossom with everyone and ate too much.', derby: 'signed up for the derby. now to catch fish.', fireworks: 'watched the fireworks. the whole sky.', bugcount: 'signed up for the bug count. now to catch bugs.', feast: 'brought what i had to the feast. everyone ate.', lanterns: 'lit a lantern and let it sit by the plaza.', countdown: 'counted down with everyone. a new year.' }[e?.key] || 'joined in.';
      if (e?.key === 'lanterns') this.add('festival lantern');
    } else if (action === 'listen_music') { out.result = pick(['the busker played the slow one. i knew it somehow.', 'a new song tonight. i hummed it home.', 'sat right at the front.']); out.bump = 0.15; }
    if (chance(0.04) && !s.balloon) { const p = freeSpot(this.taken()); if (p) s.balloon = p; }
    this.stamps(); this.touch();
    return out;
  }

  stamps() {
    const s = this.s, add = t => { if (!s.stamps.includes(t)) { s.stamps.push(t); this.memory.remember(this.world.day, `i earned a stamp: ${t}`, 0.6); } };
    if (s.museum.length >= 1) add('first donation'); if (s.museum.length >= 10) add('ten things in the museum'); if (s.museum.length >= 30) add('thirty things in the museum');
    if (FOSSILS.every(f => s.museum.includes(f.name))) add('every fossil found');
    if (s.decor.length >= 5) add('five things put out'); if (s.plants.length >= 10) add('green flippers');
    if (s.earned >= 5000) add('earned 5,000 pebbles'); if (s.house >= 2) add('a bigger house'); if (s.house >= 3) add('the biggest house');
    if (Object.values(s.friends).every(f => f.level >= 0.5)) add('friends with everyone'); if (this.cal.year >= 2) add('a whole year on the island');
  }

  // ---- neighbours wander on their own ---------------------------------------------
  tick(dt) {
    const w = this.world, now = w.now();
    for (const f of this.folk) {
      const home = PLACES[f.home];
      if (w.isNight && !this.event && !this.concert) { if (!f.inside && !f.path.length && now > f.held) { if (Math.hypot(f.pos.x - home.x, f.pos.z - home.z) < 0.5) f.inside = true; else f.path = route(f.pos, home, this.obstacles()); } }
      else if (f.inside) { f.inside = false; f.waitUntil = now + Math.random() * 20000; }
      if (f.inside || now < f.held) continue;
      if (!f.path.length && now > f.waitUntil) {
        const gather = this.event || this.concert || (this.birthday && !w.isNight), key = gather && chance(0.7) ? 'plaza' : chance(0.25) ? f.home : pick(HANGOUTS), p = PLACES[key];
        const t = { x: p.x + (Math.random() - 0.5) * 5, z: p.z + (Math.random() - 0.5) * 5 };
        if (!blocked(t.x, t.z, 1.2, this.obstacles()) && !inBeach(t.x * 1.15, t.z * 1.15) && Math.hypot(t.x, t.z) < 27) f.path = route(f.pos, t, this.obstacles());
        f.waitUntil = now + 20000 + Math.random() * 50000;
      }
      const next = f.path[0]; if (!next) continue;
      const dx = next.x - f.pos.x, dz = next.z - f.pos.z, dist = Math.hypot(dx, dz);
      if (dist < 0.15) { f.path.shift(); if (!f.path.length) f.waitUntil = now + 15000 + Math.random() * 45000; continue; }
      const step = Math.min(dist, 1.5 * dt); f.pos.x += (dx / dist) * step; f.pos.z += (dz / dist) * step; f.heading = Math.atan2(dx, dz);
    }
  }

  // ---- views ---------------------------------------------------------------------
  folkNow() { const now = this.world.now(); return this.folk.map(f => ({ key: f.key, name: f.name, kind: f.kind, x: f.pos.x, z: f.pos.z, h: f.heading, inside: f.inside, moving: f.path.length > 0 && now >= f.held, say: now < f.sayUntil ? f.say : null })); }
  snapshot() { const s = this.s, c = this.cal; return { version: this.version, season: c.season, year: c.year, dayOfYear: c.dayOfYear, decor: s.decor, plants: s.plants, weeds: s.weeds, digs: s.digs, balloon: s.balloon, house: s.house, outfit: s.outfit, snowmen: s.snowmen, fruit: !!s.fruitDay }; }
  details() { const s = this.s; return { coins: s.coins, bag: s.bag, tools: s.tools, recipes: s.recipes, museum: s.museum, museumTotals: MUSEUM, friends: Object.fromEntries(Object.entries(s.friends).map(([k, f]) => [NEIGHBOURS[k].name, f.level])), stamps: s.stamps, house: s.house, loan: s.house < 3 ? HOUSE_LOANS[s.house] - s.paid : 0, shop: s.shop, berries: s.berries, berryPrice: s.berryPrice, album: s.album.slice(-8), calendar: this.cal, upcoming: Object.entries(EVENTS).map(([d, e]) => ({ day: Number(d), name: e.name })) }; }
  summary() { const s = this.s, bag = Object.entries(s.bag).filter(([, n]) => n > 0).map(([k, n]) => (n > 1 ? `${n} ${k}` : k)).join(', ');
    return `Season: ${this.cal.season} (day ${this.cal.dayOfYear} of 12, year ${this.cal.year}). She has ${s.coins} pebbles. Tools: ${Object.keys(s.tools).map(t => TOOLS[t]).join(', ') || 'none'}. Pockets: ${bag || 'empty'}. Museum: ${s.museum.length} donated. Neighbours: ${Object.entries(s.friends).map(([k, f]) => `${NEIGHBOURS[k].name} (${f.level < 0.3 ? 'barely knows her' : f.level < 0.6 ? 'friendly' : 'close friend'})`).join(', ')}.`; }
}
