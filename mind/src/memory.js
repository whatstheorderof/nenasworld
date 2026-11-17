// Nena's memory is plain files you can open and read:
//   character.md   who she is (seeded once, she may add to "Things I have learned about myself")
//   memory.md      up to 24 memories, each with a strength that fades every day
//   interests.json topics she cares about, also fading
//   visitors.json  who has left her something
//   notes.json     the things visitors left
//   diary/day-0001.md  what she did and thought, one file per day
//   state.json     her body: needs, position, clock
import fs from 'node:fs';
import path from 'node:path';

const SLOTS = 24;
const DAILY_DECAY = 0.85;

export class Memory {
  constructor(dir) {
    this.dir = dir;
    fs.mkdirSync(path.join(dir, 'diary'), { recursive: true });
    this.memories = this.#parseMemories();
    this.interests = this.readJson('interests.json', { fish: 0.6, stars: 0.5, 'the edge of the ice': 0.5 });
    this.visitors = this.readJson('visitors.json', {});
    this.notes = this.readJson('notes.json', []);
  }

  file(name) { return path.join(this.dir, name); }
  readJson(name, fallback) {
    try { return JSON.parse(fs.readFileSync(this.file(name), 'utf8')); } catch { return fallback; }
  }
  writeJson(name, value) {
    const tmp = this.file(name + '.tmp');
    fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
    fs.renameSync(tmp, this.file(name));
  }
  character() {
    try { return fs.readFileSync(this.file('character.md'), 'utf8'); } catch { return '# Nena\nA small penguin.'; }
  }

  // ---- memory.md -------------------------------------------------------
  #parseMemories() {
    let text = '';
    try { text = fs.readFileSync(this.file('memory.md'), 'utf8'); } catch { return []; }
    const out = [];
    for (const line of text.split('\n')) {
      const m = line.match(/^- \[(\d\.\d+)\] day (\d+): (.*)$/);
      if (m) out.push({ strength: Number(m[1]), day: Number(m[2]), text: m[3] });
    }
    return out;
  }
  #saveMemories() {
    this.memories.sort((a, b) => b.strength - a.strength);
    const lines = this.memories.map(m => `- [${m.strength.toFixed(2)}] day ${m.day}: ${m.text}`);
    fs.writeFileSync(this.file('memory.md'),
      `# What Nena is carrying\n\n${SLOTS} slots. The number is how strongly she holds each one; it fades every day.\n\n${lines.join('\n')}\n`);
  }
  remember(day, text, strength = 1) {
    text = String(text).replace(/\s+/g, ' ').trim().slice(0, 200);
    if (!text) return;
    const same = this.memories.find(m => m.text.toLowerCase() === text.toLowerCase());
    if (same) same.strength = Math.min(1, same.strength + 0.3);
    else this.memories.push({ strength, day, text });
    this.memories.sort((a, b) => b.strength - a.strength);
    this.memories.length = Math.min(this.memories.length, SLOTS); // weakest fall out
    this.#saveMemories();
  }
  fade() {
    for (const m of this.memories) m.strength *= DAILY_DECAY;
    this.memories = this.memories.filter(m => m.strength >= 0.08);
    this.#saveMemories();
    for (const k of Object.keys(this.interests)) {
      this.interests[k] *= 0.9;
      if (this.interests[k] < 0.08) delete this.interests[k];
    }
    this.writeJson('interests.json', this.interests);
  }
  strongest(n = 8) { return this.memories.slice(0, n); }

  // ---- interests -------------------------------------------------------
  bumpInterest(topic, by = 0.25) {
    topic = String(topic || '').toLowerCase().replace(/[^\p{L}\p{N} '-]/gu, '').trim().slice(0, 40);
    if (!topic) return;
    this.interests[topic] = Math.min(1, (this.interests[topic] || 0) + by);
    const top = Object.entries(this.interests).sort((a, b) => b[1] - a[1]).slice(0, 16);
    this.interests = Object.fromEntries(top);
    this.writeJson('interests.json', this.interests);
  }
  topInterests(n = 6) {
    return Object.entries(this.interests).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);
  }

  // ---- visitors and what they leave -------------------------------------
  addNote(name, text) {
    const note = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, text, at: Date.now(), read: false, reply: null };
    this.notes.push(note);
    if (this.notes.length > 500) this.notes = this.notes.slice(-500);
    this.writeJson('notes.json', this.notes);
    return note;
  }
  unread() { return this.notes.filter(n => !n.read); }
  markRead(note, reply, day) {
    note.read = true; note.reply = reply; note.readOnDay = day;
    this.writeJson('notes.json', this.notes);
    const v = this.visitors[note.name] || { visits: 0, firstDay: day };
    v.visits += 1; v.lastDay = day; v.lastNote = note.text;
    this.visitors[note.name] = v;
    this.writeJson('visitors.json', this.visitors);
    return v;
  }

  // ---- diary -----------------------------------------------------------
  diaryPath(day) { return path.join(this.dir, 'diary', `day-${String(day).padStart(4, '0')}.md`); }
  diaryLine(day, hour, text) {
    const p = this.diaryPath(day);
    if (!fs.existsSync(p)) fs.writeFileSync(p, `# Day ${day}\n\n`);
    const hh = String(Math.floor(hour)).padStart(2, '0');
    const mm = String(Math.floor((hour % 1) * 60)).padStart(2, '0');
    fs.appendFileSync(p, `- ${hh}:${mm} ${text}\n`);
  }
  diarySummary(day, text) {
    const p = this.diaryPath(day);
    if (!fs.existsSync(p)) fs.writeFileSync(p, `# Day ${day}\n\n`);
    fs.appendFileSync(p, `\n## Before sleep\n\n${text}\n`);
  }
  diaryDays(limit = 7) {
    const dir = path.join(this.dir, 'diary');
    return fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort().reverse().slice(0, limit)
      .map(f => ({ day: Number(f.match(/\d+/)[0]), text: fs.readFileSync(path.join(dir, f), 'utf8') }));
  }
  today(day) { try { return fs.readFileSync(this.diaryPath(day), 'utf8'); } catch { return ''; } }
}
