// The world diary: a record of each day on the island for Nena's creator to look back on
// and give feedback about. Both minds feed it (the server and the stand-in in a browser).
// Her own diary is her voice; this is the plain record of what happened.
//
// Each day keeps: the weather and her mood hour by hour, where she went, what she did (with
// counts), what came of it (best and worst moments by how much they lifted her), stamps,
// coins, visitors, chats, notes, events, and the season. Feedback is stored separately so the
// running world can never overwrite it.

const KEEP_DAYS = 120, KEEP_EVENTS = 160;

export class WorldLog {
  constructor({ load, save }) {
    this.saveFn = save;
    const s = load() || {};
    this.days = s.days || {};
    this.dirty = false;
  }
  day(view) {
    const d = view.day;
    if (!this.days[d]) {
      this.days[d] = { day: d, season: view.season, dayOfSeason: view.dayOfSeason, startedAt: Date.now(), coins: { start: view.coins ?? null, end: view.coins ?? null },
        hours: {}, weather: {}, moods: {}, places: {}, did: {}, results: [], stamps: [], visitors: [], chats: 0, notes: 0, events: [], made: 0, outside: [] };
      const keys = Object.keys(this.days).map(Number).sort((a, b) => a - b);
      while (keys.length > KEEP_DAYS) delete this.days[keys.shift()];
    }
    return this.days[d];
  }
  // once a world hour or so: weather, mood, where she is, coins
  sample(view, place = null) {
    const d = this.day(view), h = Math.floor(view.hour);
    if (d.hours[h]) return;
    const act = view.activity;
    d.hours[h] = { weather: view.weather, mood: view.mood, doing: act?.label || null };
    d.weather[view.weather] = (d.weather[view.weather] || 0) + 1;
    d.moods[view.mood] = (d.moods[view.mood] || 0) + 1;
    if (place) d.places[place] = (d.places[place] || 0) + 1;
    if (view.coins != null) d.coins.end = view.coins;
    if (view.event && !d.events.includes(view.event.name)) d.events.push(view.event.name);
    this.dirty = true;
  }
  // every feed item: what she chose and what came of it
  feed(item, view) {
    const d = this.day({ ...view, day: item.day ?? view.day });
    if (item.action === 'stamp') { d.stamps.push(item.label); }
    else if (item.result) {
      d.results.push({ h: Math.floor(item.hour ?? view.hour), a: item.action, text: item.label, lift: Math.round((item.lift || 0) * 100) / 100 });
      if (d.results.length > KEEP_EVENTS) d.results.shift();
      if (/^(made|built|painted|drew|wrote|baked|crafted|sewed)/.test(item.label)) d.made++;
    } else if (item.action) {
      d.did[item.action] = (d.did[item.action] || 0) + 1;
      if (item.action === 'read_mail') d.notes++;
    }
    this.dirty = true;
  }
  chat(item, view) {
    const d = this.day({ ...view, day: item.day ?? view.day });
    if (item.kind === 'visitor') { d.chats++; if (item.name && !d.visitors.includes(item.name)) d.visitors.push(item.name); }
    this.dirty = true;
  }
  // what she asked to do outside the island, and what became of it (one line per request, updated as it moves)
  outside(it, view) {
    const d = this.day({ ...view, day: it.day || view.day }); d.outside ||= [];
    const line = { id: it.id, h: Math.floor(view.hour), kind: it.kind, status: it.status, what: outsideWhat(it), note: it.note || '' };
    const i = d.outside.findIndex(o => o.id === it.id); if (i >= 0) d.outside[i] = { ...d.outside[i], status: line.status, note: line.note }; else d.outside.push(line);
    if (d.outside.length > 60) d.outside.shift();
    this.dirty = true;
  }
  flush() { if (this.dirty) { this.dirty = false; this.saveFn({ days: this.days }); } }
  // newest first, each with its best and worst moments worked out
  list(limit = 30) {
    return Object.values(this.days).sort((a, b) => b.day - a.day).slice(0, limit).map(d => {
      const byLift = [...d.results].sort((a, b) => b.lift - a.lift);
      return { ...d, best: byLift.filter(r => r.lift > 0).slice(0, 3), worst: byLift.filter(r => r.lift < 0).slice(-3).reverse(), actions: Object.values(d.did).reduce((a, b) => a + b, 0) };
    });
  }
}

// The day as plain text: for copying into a message, or for a future mind to read.
export function outsideWhat(it) {
  const p = it.payload || {};
  return it.kind === 'letter' ? `a letter: "${p.subject || ''}"` : it.kind === 'post' ? `a post: "${p.text || ''}"` : it.kind === 'browse' ? `reading ${p.topic || p.url || 'a page'}`
    : it.kind === 'thank' ? 'a thank-you' : it.kind === 'sell' ? `a print of ${p.art || 'a drawing'}` : it.kind === 'publish_code' ? `a code change: ${p.message || ''}` : it.kind;
}
export function dayText(d, fb) {
  const top = (o, n = 3) => Object.entries(o || {}).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${k} (${v})`).join(', ') || 'none';
  const lines = [`## Day ${d.day} · ${d.season} ${d.dayOfSeason}/7`,
    `- weather: ${top(d.weather)}`, `- mood: ${top(d.moods)}`, `- mostly at: ${top(d.places)}`, `- did most: ${top(d.did, 5)}`,
    `- coins: ${d.coins.start ?? '?'} → ${d.coins.end ?? '?'}`, `- visitors: ${d.visitors.length ? d.visitors.join(', ') : 'none'} · chats: ${d.chats} · notes read: ${d.notes}`];
  if (d.events?.length) lines.push(`- events: ${d.events.join(', ')}`);
  if (d.stamps?.length) lines.push(`- stamps: ${d.stamps.join(', ')}`);
  if (d.outside?.length) lines.push(`- outside the island: ${d.outside.map(o => `${o.what} (${o.status})`).join('; ')}`);
  if (d.best?.length) lines.push(`- best moments: ${d.best.map(r => r.text).join('; ')}`);
  if (d.worst?.length) lines.push(`- low moments: ${d.worst.map(r => r.text).join('; ')}`);
  if (d.diary) lines.push(`- her diary: ${d.diary.replace(/\s+/g, ' ').slice(0, 600)}`);
  if (fb) lines.push(`- **feedback** (${'♥'.repeat(fb.rating || 0)}${fb.tags?.length ? ' · ' + fb.tags.join(', ') : ''}): ${fb.note || ''}`);
  return lines.join('\n');
}
export const FEEDBACK_TAGS = ['lovely moment', 'in character', 'out of character', 'too repetitive', 'too quiet', 'too busy', 'felt off', 'looks wrong', 'bug'];
