// Nena's belongings and what comes of the things she does: pockets, coins, the museum,
// what she has built and where she put it, her house, her scarves, her friendships.
// Pure logic with an injected store, so the same code runs on the server and in the browser.
import { SPECIES, MATERIAL_VALUE, RECIPES, SHOP, SCARVES, HOUSE_LOOKS, HOUSE_LOAN, SEASON_FIND, SONGS, STAMPS, FLAGS, catchOne, calendar } from './data.js';
import { NEIGHBOURS, freeSpot } from './world.js';

const pick = a => a[Math.floor(Math.random() * a.length)];
const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const an = w => (/^[aeiou]/.test(w) ? `an ${w}` : `a ${w}`);
const DEFAULT = () => ({
  coins: 0, items: {}, museum: { fish: [], bug: [], sea: [], fossil: [], art: [] }, decor: [], songs: [], stamps: [], n: {}, golden: {}, fakes: {}, cosy: 0, crops: 0, rides: 0, tune: null, hot: 'shell',
  look: { scarf: 0, scarves: [0], house: 0 }, house: { level: 1, paid: 0 },
  friends: Object.fromEntries(NEIGHBOURS.map(n => [n.name, 0])),
  turnips: { n: 0, paid: 0 }, turnipPrice: 100, shaken: 0, photos: 0, version: 0,
});

export class Life {
  constructor(store) { this.store = store; const d = DEFAULT(), l = store.load() || {}; this.s = { ...d, ...l, museum: { ...d.museum, ...l.museum }, look: { ...d.look, ...l.look } }; }
  save() { this.s.version++; this.store.save(this.s); }

  // ---- pockets -----------------------------------------------------------
  count(k) { return this.s.items[k] || 0; }
  add(k, n = 1) { this.s.items[k] = this.count(k) + n; if (this.s.items[k] <= 0) delete this.s.items[k]; }
  food() { return this.count('fruit') + this.count('veg') + Object.keys(this.s.items).filter(k => SPECIES[k]?.cat === 'fish').length; }
  has(species) { return this.s.museum[SPECIES[species].cat].includes(species); }
  newFinds() { return Object.keys(this.s.items).filter(k => SPECIES[k] && !this.has(k)); }
  museumCount() { return Object.values(this.s.museum).reduce((t, a) => t + a.length, 0); }
  // spare finds (museum already has one) plus spare materials
  spare() {
    const out = [];
    for (const [k, n] of Object.entries(this.s.items)) {
      if (SPECIES[k]) { const keep = this.has(k) ? 0 : 1; if (n > keep) out.push([k, n - keep, SPECIES[k].v]); }
      else if (k === 'shell' && n > 4) out.push([k, n - 4, MATERIAL_VALUE.shell]);
      else if (k === 'fruit' && n > 3) out.push([k, n - 3, MATERIAL_VALUE.fruit]);
      else if (k === 'weeds' && n > 2) out.push([k, n - 2, MATERIAL_VALUE.weeds]);
      else if (k === 'ore' && n > 3) out.push([k, n - 3, MATERIAL_VALUE.ore]);
      else if (MATERIAL_VALUE[k] && !['shell', 'fruit', 'weeds', 'ore', 'wood', 'stone'].includes(k) && n > 4) out.push([k, n - 4, MATERIAL_VALUE[k]]);
    }
    return out.map(([k, n, v]) => [k, n, k === this.s.hot ? v * 2 : v]);   // today's hot item sells for double
  }
  sellable() { return this.spare().reduce((t, [, n, v]) => t + n * v, 0); }
  craftable() { return Object.entries(RECIPES).filter(([, need]) => Object.entries(need).every(([k, n]) => this.count(k) >= n)).map(([k]) => k); }
  decorHeld() { return Object.keys(RECIPES).filter(k => this.count(k) > 0); }
  giftable() { return this.count('gift') > 0 || this.count('fruit') > 0 || this.count('shell') > 0; }
  fruitReady(day) { return this.s.shaken !== day; }
  ripe(day) { return this.s.decor.find(d => d.kind === 'coin tree' && day - d.day >= 3) || null; }
  newDay(day) { this.s.turnipPrice = rint(45, 190); this.s.hot = pick(['shell', 'fruit', 'ore', 'clay', 'veg', 'mushroom', 'sea glass']); if (calendar(day).weekday === 0 && this.s.turnips.n) { this.s.turnips = { n: 0, paid: 0 }; } this.save(); }
  place(kind, at, day) { this.s.decor.push({ kind, x: at.x, z: at.z, day }); if (this.s.decor.length > 45) this.s.decor.shift(); }

  // ---- what comes of an action. Returns { text, say?, remember?, lift? } or null -----------
  finish(action, a, w) {
    const s = this.s, r = this.outcome(action, a, w);
    s.n[action] = (s.n[action] || 0) + 1;
    if (a.ride) s.rides++;
    const extra = [];
    for (const st of STAMPS) if (!s.stamps.includes(st.id) && st.test(s)) { s.stamps.push(st.id); s.coins += st.coins; if (st.gold) s.golden[st.gold] = true; extra.push(`earned the stamp "${st.name}" (+${st.coins} coins${st.gold ? `, and a golden ${st.gold}` : ''})`); }
    for (const [name, v] of Object.entries(s.friends)) if (v >= 10 && !this.count(`photo of ${name}`)) { this.add(`photo of ${name}`); s.cosy++; extra.push(`${name} gave her a framed photo`); }
    if (!extra.length) return r;
    return { ...(r || {}), text: [r?.text, ...extra].filter(Boolean).join('. '), lift: (r?.lift || 0) + 0.3, say: r?.say || 'a stamp!' };
  }
  outcome(action, a, w) {
    const s = this.s, day = w.day, season = calendar(day).season;
    const caught = (cat, where) => {
      const name = catchOne(cat, where, season, cat === 'fish' ? s.golden.rod : cat === 'bug' ? s.golden.net : false), first = !this.has(name) && !this.count(name);
      this.add(name);
      return { text: `caught ${an(name)}${SPECIES[name].rare ? ' (rare!)' : ''}`, say: first ? `${an(name)}! never seen one before.` : null, remember: SPECIES[name].rare ? `i caught ${an(name)}. they are very rare.` : null, lift: SPECIES[name].rare ? 0.5 : first ? 0.25 : 0.08 };
    };
    switch (action) {
      case 'go_fishing': return Math.random() < 0.8 ? caught('fish', 'river') : { text: 'caught nothing. the fish won today', lift: -0.05 };
      case 'sea_fishing': return Math.random() < 0.75 ? caught('fish', 'sea') : { text: 'something big took the bait and left', lift: -0.05 };
      case 'dive': return Math.random() < 0.85 ? caught('sea') : { text: 'dived and found only sand' };
      case 'catch_bugs': return Math.random() < 0.8 ? caught('bug') : { text: 'chased a bug. it was faster' };
      case 'beachcomb': { const n = rint(1, 3); this.add('shell', n); return { text: `picked up ${n} shell${n > 1 ? 's' : ''}` }; }
      case 'shake_tree': { s.shaken = day; if (Math.random() < 0.12) return { text: 'shook a tree and bees came out. ran', say: 'bees. bees!', lift: -0.3 };
        const n = rint(2, 4); this.add('fruit', n); if (Math.random() < 0.6) this.add('stick', rint(1, 2)); const coins = Math.random() < 0.2 ? rint(20, 80) : 0; s.coins += coins; return { text: `shook down ${n} fruit${coins ? ` and ${coins} coins` : ''}`, lift: 0.1 }; }
      case 'chop_wood': { const n = rint(2, 3); this.add('wood', n); this.add('stick'); return { text: `chopped ${n} wood` }; }
      case 'mine_rock': { const st = rint(1, 3), ore = Math.random() < 0.45 ? 1 : 0, coins = Math.random() < 0.15 ? rint(50, 200) : 0; this.add('stone', st); if (ore) this.add('ore'); s.coins += coins; if (Math.random() < 0.5) this.add('clay'); if (Math.random() < 0.04) { this.add('gold nugget'); return { text: 'chipped a gold nugget out of the rock', say: 'gold. actual gold.', remember: 'i found a gold nugget in the big rock', lift: 0.5 }; }
        return { text: `chipped off ${st} stone${ore ? ' and a lump of ore' : ''}${coins ? ` and ${coins} coins fell out` : ''}`, lift: coins ? 0.3 : 0.05 }; }
      case 'dig_fossil': { w.takeSpot(a.ref); return caught('fossil'); }
      case 'pull_weeds': { w.takeSpot(a.ref); this.add('weeds'); return { text: 'pulled up a weed' }; }
      case 'open_bottle': { w.takeSpot(a.ref); if (Math.random() < 0.5) { const c = rint(40, 160); s.coins += c; return { text: `opened a bottle from the sea: ${c} coins inside`, lift: 0.3 }; }
        if (Math.random() < 0.4) { this.add('hum seed'); return { text: 'opened a bottle from the sea. inside, a seed that hums', remember: 'a seed came out of a bottle. it hums when i hold it.', lift: 0.35 }; }
        const k = pick(Object.keys(RECIPES)); this.add(k); return { text: `opened a bottle from the sea. inside, a little ${k}, already made`, remember: `a bottle washed up with a ${k} in it. someone out there made it.`, lift: 0.35 }; }
      case 'pop_balloon': { w.takeSpot(a.ref); const k = pick(['gift', 'sapling', 'flower seeds', 'ore']); this.add(k); return { text: `caught a balloon's present: ${k}`, say: 'got it!', lift: 0.35 }; }
      case 'donate': { let finds = this.newFinds(); const fakes = finds.filter(k => s.fakes[k]); for (const k of fakes) { this.add(k, -1); delete s.fakes[k]; this.add('furnishing'); } finds = finds.filter(k => !fakes.includes(k));
        if (!finds.length) return { text: `took ${fakes.join(', ')} to the museum. it was a copy. she is hanging it at home anyway`, say: 'that painter.', remember: 'the painter sold me a copy. look closer next time.', lift: -0.2 };
        for (const k of finds) { s.museum[SPECIES[k].cat].push(k); this.add(k, -1); }
        return { text: `gave the museum ${finds.join(', ')} (${this.museumCount()} of ${Object.keys(SPECIES).length} now)`, remember: finds.length > 1 ? `the museum has ${this.museumCount()} of my finds now` : null, lift: 0.3 }; }
      case 'visit_museum': return { text: `walked round all ${this.museumCount()} things in the museum` };
      case 'sell': { let total = 0; for (const [k, n, v] of this.spare()) { total += n * v; this.add(k, -n); } s.coins += total; return { text: `sold spare things for ${total} coins`, lift: 0.15 }; }
      case 'buy': { const can = Object.entries(SHOP).filter(([k, c]) => c <= s.coins && !(k === 'scarf' && s.look.scarves.length >= SCARVES.length)); if (!can.length) return { text: 'looked round the shop and bought nothing' };
        const wanted = can.filter(([k]) => this.count(k) < 2); const [k, c] = pick(wanted.length ? wanted : can); s.coins -= c; s.shopDay = day;
        if (k === 'scarf') { const fresh = SCARVES.map((_, i) => i).filter(i => !s.look.scarves.includes(i)); s.look.scarves.push(pick(fresh)); return { text: `bought a new scarf for ${c} coins`, say: 'new scarf.', lift: 0.3 }; }
        this.add(k); return { text: `bought ${k === 'furnishing' ? 'something for the house' : k} for ${c} coins`, lift: 0.15 }; }
      case 'buy_turnips': { const price = rint(90, 110), n = Math.floor(Math.min(s.coins, 600) / price); if (!n) return null; s.coins -= n * price; s.turnips = { n, paid: price }; return { text: `bought ${n} turnips at ${price} coins each`, remember: `i bought turnips at ${price}. sell them before the week ends.` }; }
      case 'sell_turnips': { const t = s.turnips, got = t.n * s.turnipPrice, diff = got - t.n * t.paid; s.coins += got; s.turnips = { n: 0, paid: 0 };
        return { text: `sold ${t.n} turnips at ${s.turnipPrice} each, ${diff >= 0 ? `${diff} coins up` : `${-diff} coins down`}`, say: diff >= 0 ? 'turnips paid off.' : 'never trust a turnip.', lift: diff >= 0 ? 0.4 : -0.3 }; }
      case 'craft': { const can = this.craftable(); if (!can.length) return null; const k = pick(can); for (const [m, n] of Object.entries(RECIPES[k])) this.add(m, -n); this.add(k); return { text: `built ${an(k)}`, say: `${an(k)}. i made that.`, lift: 0.25 }; }
      case 'decorate': { const k = this.decorHeld()[0]; if (!k || !a.at) return null; this.add(k, -1); this.place(k, a.at, day); return { text: `put the ${k} out on the island`, remember: `i put ${an(k)} out where everyone can see it`, lift: 0.2 }; }
      case 'plant_flowers': { if (!a.at) return null; this.add('flower seeds', -1); this.place('flowers', a.at, day); return { text: 'planted a patch of flowers' }; }
      case 'plant_tree': { if (!a.at) return null; this.add('sapling', -1); this.place('tree', a.at, day); return { text: 'planted a tree. it will take a few days', remember: `i planted a tree on day ${day}` }; }
      case 'cook': { const fish = Object.keys(s.items).find(k => SPECIES[k]?.cat === 'fish' && (this.has(k) || s.items[k] > 1)) || Object.keys(s.items).find(k => SPECIES[k]?.cat === 'fish');
        if (this.count('veg') && (fish || this.count('fruit'))) { this.add('veg', -1); if (fish) this.add(fish, -1); else this.add('fruit', -1); return { text: fish ? `made ${fish} and vegetable stew` : 'made a vegetable and fruit pie', lift: 0.15 }; }
        if (fish && (this.has(fish) || !this.count('fruit'))) { this.add(fish, -1); return { text: `cooked the ${fish}` }; } if (this.count('fruit')) { this.add('fruit', -1); return { text: 'made a fruit bake' }; } this.add('veg', -1); return { text: 'made vegetable soup' }; }
      case 'redecorate': { s.coins -= 60; s.look.house = (s.look.house + rint(1, HOUSE_LOOKS.length - 1)) % HOUSE_LOOKS.length; s.look.painted = day; return { text: 'repainted the house', say: 'better.', lift: 0.2 }; }
      case 'change_outfit': { s.look.scarf = pick(s.look.scarves.filter(i => i !== s.look.scarf)); s.look.changed = day; return { text: 'changed her scarf' }; }
      case 'pay_home': { const need = HOUSE_LOAN[s.house.level] - s.house.paid, pay = Math.min(need, s.coins); s.coins -= pay; s.house.paid += pay;
        if (s.house.paid >= HOUSE_LOAN[s.house.level]) { s.house.level++; s.house.paid = 0; return { text: 'paid for the house to be made bigger', say: 'more house!', remember: `my house got bigger on day ${day}`, lift: 0.5 }; }
        return { text: `put ${pay} coins toward a bigger house (${need - pay} to go)` }; }
      case 'chat': { const n = NEIGHBOURS.find(x => x.name === a.ref); if (!n) return null; s.chats = s.chats?.[0] === day ? [day, s.chats[1] + 1] : [day, 1]; s.friends[n.name] = Math.min(10, s.friends[n.name] + 0.5);
        return { text: `talked with ${n.name}. ${n.name} said: "${pick(n.says)}"`, remember: Math.random() < 0.25 ? `${n.name} the ${n.kind} told me: "${pick(n.says)}"` : null, lift: 0.15 }; }
      case 'give_gift': { const n = NEIGHBOURS.find(x => x.name === a.ref); if (!n) return null; const k = ['gift', 'fruit', 'shell'].find(x => this.count(x) > 0); if (!k) return null; this.add(k, -1); s.friends[n.name] = Math.min(10, s.friends[n.name] + (k === 'gift' ? 2 : 1)); s.giftDay = day;
        return { text: `gave ${n.name} ${k === 'gift' ? 'a wrapped present' : an(k)}`, remember: `i gave ${n.name} ${an(k)}. ${n.name} looked pleased.`, lift: 0.3 }; }
      case 'write_letter': { const n = pick(NEIGHBOURS); s.friends[n.name] = Math.min(10, s.friends[n.name] + 0.5); return { text: `wrote ${n.name} a letter` }; }
      case 'forage': { const k = SEASON_FIND[season], n = rint(1, 2); this.add(k, n); return { text: `found ${n} ${k}` }; }
      case 'drink_cocoa': { s.coins = Math.max(0, s.coins - 5); return Math.random() < 0.3 ? { text: `had a cocoa. ${pick(NEIGHBOURS).name} was at the cart too`, lift: 0.15 } : { text: 'had a cocoa and watched the square' }; }
      case 'daily_board': { s.boardDay = day; if (Math.random() < 0.5) { const c = rint(30, 120); s.coins += c; return { text: `checked the noticeboard: ${c} coins for being here today. the shop pays double for ${s.hot} today` }; }
        const k = pick(['wood', 'stone', 'flower seeds', 'clay', 'stick']); this.add(k); return { text: `found ${k} in the lost-property box. the shop pays double for ${s.hot} today` }; }
      case 'trade_pearl': { this.add('scallop', -1); this.add('pearl'); s.friends.Bo = Math.min(10, s.friends.Bo + 1); return { text: 'swapped a scallop with Bo for a pearl', say: 'a pearl!', lift: 0.3 }; }
      case 'bury_coins': { w.takeSpot(a.ref); s.coins -= 100; const sp = a.at || { x: w.pos.x - 0.9, z: w.pos.z - 0.3 }; this.place('coin tree', sp, day); return { text: 'planted 100 coins where the ground glowed', remember: `i planted coins on day ${day}. three days, they say.` }; }
      case 'pick_coins': { const d = this.ripe(day); if (!d) return null; s.decor = s.decor.filter(x => x !== d); s.coins += 300; return { text: 'picked 300 coins off her coin tree', say: 'it worked!', lift: 0.45 }; }
      case 'plant_hum': { if (!a.at) return null; this.add('hum seed', -1); this.place('singing stone', a.at, day); return { text: 'planted the humming seed', remember: `i planted a seed that hums on day ${day}` }; }
      case 'tend_crops': { s.crops = day; return { text: 'sowed the vegetable patch' }; }
      case 'harvest': { s.crops = 0; const n = rint(3, 5); this.add('veg', n); return { text: `harvested ${n} vegetables`, lift: 0.2 }; }
      case 'buy_art': { s.artDay = day; const left = Object.keys(SPECIES).filter(k => SPECIES[k].cat === 'art' && !this.has(k) && !this.count(k)); if (!left.length) return { text: "looked over the painter's boat. nothing she has not got" };
        const k = pick(left); s.coins -= 250; this.add(k); if (Math.random() < 0.35) s.fakes[k] = true; return { text: `bought the painting "${k}" from the painter's boat for 250 coins`, remember: `i bought "${k}" from the painter. the museum will know if it is real.`, lift: 0.2 }; }
      case 'play_record': return { text: `played "${pick(s.songs)}"` };
      case 'furnish_home': { this.add('furnishing', -1); s.cosy++; return { text: `found a place for it. the house feels cosier (cosiness ${s.cosy})` }; }
      case 'design_flag': { s.look.flag = ((s.look.flag || 0) + rint(1, FLAGS.length - 1)) % FLAGS.length; s.look.flagDay = day; return { text: 'designed a new flag for the square', say: 'that is our flag now.', lift: 0.2 }; }
      case 'compose_tune': { const syl = ['do', 'la', 'pip', 'bo', 'su', 'mi', 'na', 'ne', 'fa', 'lo']; s.tune = Array.from({ length: 6 }, () => pick(syl)).join('-'); s.tuneDay = day; return { text: `made up a new island tune: ${s.tune}`, remember: `the island tune goes ${s.tune}` }; }
      case 'boat_trip': { s.boatDay = day; const finds = [pick(['shell', 'sea glass', 'stick', 'clay']), pick(['fruit', 'stone', 'ore', 'hum seed'])]; for (const k of finds) this.add(k, rint(1, 2));
        const saw = pick(['a rock shaped like a sleeping whale', 'an islet with one tree and nobody on it', 'a buoy with a bell that nobody rings', 'the island from far away. it is small', 'something large under the boat, going the other way']);
        return { text: `rowed out and came back with ${finds.join(' and ')}. she saw ${saw}`, remember: `out in the boat i saw ${saw}`, lift: 0.35 }; }
      case 'take_photo': { s.photos++; return { text: 'took a photo of the view' }; }
      case 'wish': return { text: 'wished on a shooting star', remember: 'i made a wish on a falling star. i am not saying what.', lift: 0.3 };
      case 'event': { const e = a.event; if (!e) return null; let extra = ''; s.eventDone = `${day}:${e.id}`;
        if (e.prize === 'fish') { const k = catchOne('fish', 'river', season); this.add(k); const c = rint(150, 400); s.coins += c; extra = `, landed ${an(k)} and won ${c} coins`; }
        if (e.prize === 'bug') { const k = catchOne('bug', null, season); this.add(k); const c = rint(150, 400); s.coins += c; extra = `, netted ${an(k)} and won ${c} coins`; }
        if (e.prize === 'gift') { this.add('gift'); extra = ' and came home with a present'; }
        if (e.id === 'music') { const left = SONGS.filter(x => !s.songs.includes(x)); if (left.length) { const song = pick(left); s.songs.push(song); extra = ` and took home the record "${song}"`; } }
        for (const n of NEIGHBOURS) s.friends[n.name] = Math.min(10, s.friends[n.name] + 0.5);
        return { text: `went to ${e.name}${extra}`, remember: `${e.name}, day ${day}. everyone was there.`, lift: 0.5 }; }
    }
    return null;
  }

  summary() {
    const s = this.s;
    return { coins: s.coins, items: s.items, museum: s.museum, total: Object.keys(SPECIES).length, decor: s.decor.length, house: s.house, loan: HOUSE_LOAN[s.house.level] || null, friends: s.friends, turnips: s.turnips, turnipPrice: s.turnipPrice, photos: s.photos, shaken: s.shaken, songs: s.songs, stamps: s.stamps, cosy: s.cosy, tune: s.tune, hot: s.hot, golden: s.golden, rides: s.rides };
  }
  freeSpot() { return freeSpot(this.s.decor); }
}
