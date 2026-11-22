// Nena's outbox. Everything she would do outside her island (write to her creator, post a drawing,
// read a web page, thank a donor...) is a request that waits here first. Rules in this file, not the
// model, decide whether a request may go ahead:
//
//   1. only Nena's own mind can ask (visitors never steer her hands)
//   2. the off switch stops everything
//   3. each kind of request is off, "ask me" (her creator approves each one) or automatic
//   4. what she may send, and where, is checked against fixed shapes and allowlists
//   5. daily caps per kind, a spend ceiling, and no sending the same thing twice
//
// Approved requests are carried out by "hands" (an email sender, a Bluesky poster...). Until a hand
// is connected, approved requests simply wait, marked as not connected yet. What comes back (a
// reply, a sale, a page she read) is handed to her mind as something that happened to her.

export const KINDS = {
  letter: { label: 'Write you a letter', hands: 'email', cap: 1, about: 'A letter to you about her day.' },
  post: { label: 'Post a drawing online', hands: 'bluesky', cap: 3, about: 'A drawing with a short caption, on her own account, labelled as made by an AI.' },
  browse: { label: 'Read a web page', hands: 'web', cap: 12, about: 'Reading one page on an allowed site. What she reads is something she read, never an order.' },
  thank: { label: 'Thank a donor', hands: 'email', cap: 10, about: 'A short thank-you to someone who gave to her.' },
  publish_code: { label: 'Publish to her code repo', hands: 'github', cap: 2, about: 'A small change to her own repository.' },
  sell: { label: 'Offer a drawing as a print', hands: 'shop', cap: 2, about: 'Listing one of her drawings in her shop.' },
};
export const MODES = ['off', 'ask', 'auto'];
const OPEN = ['pending', 'approved', 'sending'];

export const DEFAULT_SETTINGS = {
  paused: false,                                   // the off switch
  modes: Object.fromEntries(Object.keys(KINDS).map(k => [k, 'ask'])),
  caps: Object.fromEntries(Object.entries(KINDS).map(([k, v]) => [k, v.cap])),
  spendCeiling: 0,                                 // pence a day she may spend; nothing until you raise it
  allowWeb: ['en.wikipedia.org', 'simple.wikipedia.org', 'www.gutenberg.org', 'www.nasa.gov'],
};

const clean = (s, n) => String(s ?? '').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, ' ').replace(/[ \t]+/g, ' ').trim().slice(0, n);
const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return (h >>> 0).toString(36); };
const LINKY = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|co|uk|app|dev|xyz)\b|@\w)/i;

// The shape of each kind of request. Returns the cleaned payload, or a reason it can't go.
function shape(kind, p, settings) {
  p = p || {};
  if (kind === 'letter') {
    if (p.to !== 'creator') return { error: 'Letters only go to her creator.' };
    const subject = clean(p.subject, 80), body = clean(p.body, 3000);
    if (!subject || !body) return { error: 'A letter needs a subject and some words.' };
    return { payload: { to: 'creator', subject, body } };
  }
  if (kind === 'post') {
    const text = clean(p.text, 280), art = clean(p.art, 80);
    if (!text) return { error: 'A post needs a caption.' };
    if (LINKY.test(text)) return { error: 'Her posts carry no links and mention nobody.' };
    return { payload: { text, art: art || null, label: 'made by an AI' } };
  }
  if (kind === 'browse') {
    let u; try { u = new URL(String(p.url)); } catch { return { error: 'Not a web address.' }; }
    if (u.protocol !== 'https:') return { error: 'Only https pages.' };
    if (!(settings.allowWeb || []).includes(u.hostname)) return { error: `${u.hostname} is not on the list of sites she may read.` };
    u.hash = ''; return { payload: { url: u.toString(), topic: clean(p.topic, 60) } };
  }
  if (kind === 'thank') {
    const donation = clean(p.donation, 40), text = clean(p.text, 400);
    if (!donation || !text) return { error: 'A thank-you needs the gift it is for and some words.' };
    if (LINKY.test(text)) return { error: 'A thank-you carries no links.' };
    return { payload: { donation, text } };
  }
  if (kind === 'publish_code') {
    const message = clean(p.message, 120), files = Array.isArray(p.files) ? p.files.slice(0, 5).map(f => ({ path: clean(f.path, 120), text: String(f.text ?? '').slice(0, 20000) })) : [];
    if (!message || !files.length || files.some(f => !f.path || f.path.includes('..') || f.path.startsWith('/'))) return { error: 'A change needs a message and files inside her repo.' };
    return { payload: { message, files } };
  }
  if (kind === 'sell') {
    const art = clean(p.art, 80), price = Math.round(Number(p.price));
    if (!art || !(price >= 100 && price <= 10000)) return { error: 'A print needs a drawing and a price between £1 and £100.' };
    return { payload: { art, price } };
  }
  return { error: 'Not something she can ask for.' };
}

export class Outbox {
  constructor({ load, save, onResult = () => {}, now = () => Date.now() }) {
    const s = load() || {};
    this.items = s.items || [];
    this.settings = { ...DEFAULT_SETTINGS, ...(s.settings || {}), modes: { ...DEFAULT_SETTINGS.modes, ...(s.settings?.modes || {}) }, caps: { ...DEFAULT_SETTINGS.caps, ...(s.settings?.caps || {}) } };
    this.spent = s.spent || {};                    // pence spent, by world day
    this.saveFn = save; this.onResult = onResult; this.now = now; this.busy = false;
  }
  save() { this.saveFn({ items: this.items.slice(-400), settings: this.settings, spent: this.spent }); }

  // Nena asks for something to happen. `from` must be 'nena': anything else is refused outright.
  propose(kind, payload, { why = '', day = 0, from = 'nena', cost = 0 } = {}) {
    const k = KINDS[kind], at = this.now();
    const item = { id: at.toString(36) + Math.random().toString(36).slice(2, 6), kind, at, day, why: clean(why, 200), payload: null, status: 'blocked', note: '' };
    const refuse = note => { item.note = note; this.items.push(item); this.save(); return item; };
    if (from !== 'nena') return refuse('Only Nena can ask for things to happen outside the island.');
    if (!k) return refuse('Not something she can ask for.');
    const shaped = shape(kind, payload, this.settings);
    if (shaped.error) return refuse(shaped.error);
    item.payload = shaped.payload;
    if (this.settings.paused) return refuse('Everything outside the island is switched off.');
    const mode = this.settings.modes[kind] || 'off';
    if (mode === 'off') return refuse(`${k.label} is switched off.`);
    const today = this.items.filter(i => i.kind === kind && i.day === day && i.status !== 'blocked' && i.status !== 'rejected').length;
    if (today >= (this.settings.caps[kind] ?? k.cap)) return refuse(`Already ${today} today, the most allowed.`);
    cost = Math.max(0, Math.round(Number(cost) || 0));
    if (cost && (this.spent[day] || 0) + cost > this.settings.spendCeiling) return refuse('That would go over the spending limit.');
    const sig = hash(kind + JSON.stringify(item.payload));
    if (this.items.some(i => i.sig === sig && i.status !== 'blocked' && i.status !== 'rejected' && at - i.at < 7 * 86400e3)) return refuse('She asked for exactly this already.');
    Object.assign(item, { sig, cost, status: mode === 'auto' ? 'approved' : 'pending', note: mode === 'auto' ? 'went ahead automatically' : 'waiting for you' });
    this.items.push(item); this.save(); return item;
  }

  // her creator's answer to a request that is waiting
  decide(id, approve, note = '') {
    const it = this.items.find(i => i.id === id);
    if (!it) return { error: 'No such request.' };
    if (it.status !== 'pending') return { error: `It is already ${it.status}.` };
    if (approve && this.settings.paused) return { error: 'Everything is switched off. Switch it back on first.' };
    it.status = approve ? 'approved' : 'rejected'; it.note = clean(note, 200) || (approve ? 'you said yes' : 'you said no'); it.decidedAt = this.now();
    this.save(); return { item: it };
  }

  setSettings(s = {}) {
    const st = this.settings;
    if ('paused' in s) st.paused = !!s.paused;
    for (const [k, m] of Object.entries(s.modes || {})) if (KINDS[k] && MODES.includes(m)) st.modes[k] = m;
    for (const [k, c] of Object.entries(s.caps || {})) if (KINDS[k]) st.caps[k] = Math.max(0, Math.min(100, Math.floor(Number(c) || 0)));
    if ('spendCeiling' in s) st.spendCeiling = Math.max(0, Math.min(10000, Math.floor(Number(s.spendCeiling) || 0)));
    if (Array.isArray(s.allowWeb)) st.allowWeb = [...new Set(s.allowWeb.map(h => clean(h, 80).toLowerCase()).filter(h => /^[a-z0-9.-]+\.[a-z]{2,}$/.test(h)))].slice(0, 40);
    this.save(); return st;
  }

  // Old requests nobody answered lapse after three days.
  expire() {
    const t = this.now(); let n = 0;
    for (const i of this.items) if (i.status === 'pending' && t - i.at > 3 * 86400e3) { i.status = 'expired'; i.note = 'nobody answered in three days'; n++; }
    if (n) this.save();
  }

  // Carry out approved requests with whatever hands are connected. hands: { email: async payload => result, ... }
  async dispatch(hands = {}) {
    if (this.busy || this.settings.paused) return;
    this.busy = true;
    try {
      for (const it of this.items.filter(i => i.status === 'approved')) {
        const hand = hands[KINDS[it.kind]?.hands];
        if (!hand) { if (it.note !== 'not connected yet') { it.note = 'not connected yet'; this.save(); } continue; }
        it.status = 'sending'; this.save();
        try {
          const result = await hand(it.payload, it);
          it.status = 'done'; it.doneAt = this.now(); it.result = result ?? null; it.note = 'done';
          if (it.cost) this.spent[it.day] = (this.spent[it.day] || 0) + it.cost;
          this.save(); this.onResult(it);
        } catch (e) {
          it.tries = (it.tries || 0) + 1; it.note = clean(e?.message || e, 200);
          it.status = it.tries >= 3 ? 'failed' : 'approved'; this.save();
          if (it.status === 'failed') this.onResult(it);
        }
      }
    } finally { this.busy = false; }
  }

  view(limit = 100) {
    return { items: this.items.slice(-limit).reverse(), settings: this.settings, kinds: KINDS, waiting: this.items.filter(i => i.status === 'pending').length, open: this.items.filter(i => OPEN.includes(i.status)).length };
  }
}
