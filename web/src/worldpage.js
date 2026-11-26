// The world diary page: every day on the island, for Nena's creator to read and give feedback on.
// It reads her mind server when there is one; otherwise it reads the stand-in's record kept in
// this browser. Feedback is always kept in this browser too, and also sent to the server when a
// creator key is set there.
import { WorldLog, dayText, FEEDBACK_TAGS } from '../../shared/worldlog.js';
import { guidanceFrom } from '../../shared/guidance.js';
import { inject } from '@vercel/analytics';
inject();   // Vercel Web Analytics: page views and visitors, no cookies

const MIND = (import.meta.env.VITE_MIND_URL || 'http://localhost:8787').replace(/\/$/, '');
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

const MOOD = { content: '#bfe3c9', happy: '#f3dc9b', delighted: '#f6c1cf', curious: '#b7aede', sleepy: '#c9d3e6', asleep: '#9aa3b5', hungry: '#ecc3a4', 'put out': '#e39a9a', restless: '#f2b38a', 'a little flat': '#a9b8c9', unsettled: '#d9a3b4' };
const SKY = { clear: '☀️', cloudy: '☁️', rain: '🌧️', storm: '⛈️', snow: '❄️', heat: '🔥', fog: '🌫️', wind: '🍃', aurora: '✨', rainbow: '🌈' };
const top = (o, n) => Object.entries(o || {}).sort((a, b) => b[1] - a[1]).slice(0, n);

let days = [], fromServer = false, canWrite = false, tags = FEEDBACK_TAGS;
const localFb = load('nena-world-feedback', {});

async function read() {
  const reachable = !(location.protocol === 'https:' && MIND.startsWith('http:'));
  if (reachable) try {
    const r = await fetch(`${MIND}/api/world?limit=60`); if (!r.ok) throw 0;
    const j = await r.json(); days = j.days; tags = j.tags || tags; canWrite = j.canWrite; fromServer = true;
  } catch {}
  if (!fromServer) days = new WorldLog({ load: () => load('nena-worldlog', null), save() {} }).list(60);
  $('source').textContent = fromServer
    ? `From her mind server · ${days.length} days recorded.`
    : `From the stand-in that runs in this browser · ${days.length} day${days.length === 1 ? '' : 's'} recorded. Her real mind isn't online yet, so this is only what happened while the island was open here.`;
  $('keybox').hidden = !(fromServer && canWrite);
  $('key').value = load('nena-creator-key', '');
  draw();
}

const fbFor = d => d.feedback || localFb[d.day] || null;

// what her mind is taking from the feedback right now
function drawGuide() {
  const fb = {}; for (const d of days) { const f = fbFor(d); if (f) fb[d.day] = f; }
  const g = guidanceFrom(fb), more = Object.entries(g.boost).filter(([, v]) => v > 0).map(([k]) => k.replace(/_/g, ' ')), less = Object.entries(g.boost).filter(([, v]) => v < 0).map(([k]) => k.replace(/_/g, ' '));
  const bits = [g.variety > 0.05 && 'mixing up her days more', g.pace > 0.05 && 'starting things a little sooner', g.pace < -0.05 && 'taking things a little slower',
    more.length && `leaning towards ${more.slice(0, 6).join(', ')}`, less.length && `doing less ${less.slice(0, 6).join(', ')}`].filter(Boolean);
  $('guide').hidden = !bits.length;
  $('guide').innerHTML = `<b>How your feedback is shaping her now:</b> ${bits.join('; ')}. <span class="dim">Gentle nudges from your last five days of feedback. She still chooses for herself.</span>`;
}
function draw() {
  drawGuide();
  if (!days.length) { $('days').innerHTML = `<p class="empty">Nothing recorded yet. Leave the island open for a little while and come back.</p>`; return; }
  $('days').innerHTML = days.map(d => {
    const coins = d.coins?.start != null && d.coins?.end != null ? d.coins.end - d.coins.start : null;
    const hours = Array.from({ length: 24 }, (_, h) => { const x = d.hours?.[h]; return `<span title="${h}:00${x ? ` · ${esc(x.mood)} · ${esc(x.weather)}${x.doing ? ' · ' + esc(x.doing) : ''}` : ''}" style="background:${x ? MOOD[x.mood] || '#e6e2d8' : '#efebe2'}">${x ? SKY[x.weather] || '' : ''}</span>`; }).join('');
    const did = top(d.did, 6).map(([a, n]) => `<li>${esc(a.replace(/_/g, ' '))} ×${n}</li>`).join('') || '<li>nothing yet</li>';
    const where = top(d.places, 4).map(([p, n]) => `<li>${esc(p)} (${n}h)</li>`).join('') || '<li>—</li>';
    const fb = fbFor(d) || {};
    return `<article class="day" data-day="${d.day}">
      <h2>Day ${d.day} <small>${esc(String(d.season || "").replace(/^./, c => c.toUpperCase()))} ${d.dayOfSeason}/7</small></h2>
      <div class="chips">
        ${top(d.weather, 3).map(([w, n]) => `<span class="chip">${SKY[w] || ''} ${esc(w)} ${n}h</span>`).join('')}
        ${top(d.moods, 2).map(([m, n]) => `<span class="chip" style="background:${MOOD[m] || '#eee'}">${esc(m)} ${n}h</span>`).join('')}
        ${coins != null ? `<span class="chip">🪙 ${coins >= 0 ? '+' : ''}${coins} (${d.coins.end})</span>` : ''}
        <span class="chip">💬 ${d.chats} chat${d.chats === 1 ? '' : 's'}${d.visitors?.length ? ' · ' + esc(d.visitors.slice(0, 5).join(', ')) : ''}</span>
        ${d.notes ? `<span class="chip">✉️ ${d.notes} note${d.notes === 1 ? '' : 's'} read</span>` : ''}
        ${d.stamps?.length ? `<span class="chip">🏅 ${esc(d.stamps.join(', '))}</span>` : ''}
        ${d.events?.length ? `<span class="chip">🎉 ${esc(d.events.join(', '))}</span>` : ''}
      </div>
      <div class="hours">${hours}</div><div class="legend"><span>midnight</span><span>noon</span><span>11pm</span></div>
      <div class="cols">
        <div><h3>Best moments</h3><ul class="best">${(d.best || []).map(r => `<li>${esc(r.text)}</li>`).join('') || '<li>—</li>'}</ul></div>
        <div><h3>Low moments</h3><ul class="low">${(d.worst || []).map(r => `<li>${esc(r.text)}</li>`).join('') || '<li>—</li>'}</ul></div>
        <div><h3>What she did most</h3><ul>${did}</ul></div>
        <div><h3>Where she spent her time</h3><ul>${where}</ul></div>
      </div>
      ${d.outside?.length ? `<div class="outside"><h3>Outside the island</h3><ul>${d.outside.map(o => `<li><span class="st st-${esc(o.status)}">${esc(STATUS[o.status] || o.status)}</span> ${esc(o.what)}${o.note && o.status === 'blocked' ? ` <span class="dim">(${esc(o.note)})</span>` : ''}</li>`).join('')}</ul></div>` : ''}
      ${d.diary ? `<details><summary>Her own diary for the day</summary><pre>${esc(d.diary)}</pre></details>` : ''}
      <details><summary>Everything that came of what she did (${(d.results || []).length})</summary><pre>${(d.results || []).map(r => `${String(r.h).padStart(2, '0')}:00  ${esc(r.text)}${r.lift ? `  (${r.lift > 0 ? '+' : ''}${r.lift})` : ''}`).join('\n')}</pre></details>
      <div class="fb">
        <div class="hearts">${[1, 2, 3, 4, 5].map(n => `<button data-r="${n}" class="${(fb.rating || 0) >= n ? 'on' : ''}" title="${n} of 5">♥</button>`).join('')}</div>
        <div class="tags">${tags.map(t => `<button data-t="${esc(t)}" class="${fb.tags?.includes(t) ? 'on' : ''}">${esc(t)}</button>`).join('')}</div>
        <textarea placeholder="How did the day go? What felt right, what felt off, what you'd like to see more or less of…">${esc(fb.note || '')}</textarea>
        <div class="row"><button class="save">Save feedback</button><span class="saved">${fb.at ? 'saved ' + new Date(fb.at).toLocaleString() : ''}</span></div>
      </div>
    </article>`;
  }).join('');
}

// hearts, tags and saving
$('days').addEventListener('click', async e => {
  const card = e.target.closest('.day'); if (!card) return;
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.r) card.querySelectorAll('.hearts button').forEach(h => h.classList.toggle('on', Number(h.dataset.r) <= Number(b.dataset.r)));
  if (b.dataset.t) b.classList.toggle('on');
  if (!b.classList.contains('save')) return;
  const day = Number(card.dataset.day);
  const fb = { rating: card.querySelectorAll('.hearts .on').length, tags: [...card.querySelectorAll('.tags .on')].map(t => t.dataset.t), note: card.querySelector('textarea').value.trim().slice(0, 2000), at: Date.now() };
  localFb[day] = fb; save('nena-world-feedback', localFb);
  const d = days.find(x => x.day === day); if (d) d.feedback = fb;
  let where = 'in this browser';
  if (fromServer && canWrite) {
    const key = $('key').value.trim(); save('nena-creator-key', key);
    try { const r = await fetch(`${MIND}/api/world/feedback`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-creator-key': key }, body: JSON.stringify({ day, ...fb }) });
      where = r.ok ? 'on her mind server' : `in this browser (the server said: ${(await r.json()).error || r.status})`; } catch { where = 'in this browser (the server could not be reached)'; }
  }
  card.querySelector('.saved').textContent = `saved ${where}`; drawGuide();
});

const asText = () => `# Nena's world diary\n\n${days.map(d => dayText(d, fbFor(d))).join('\n\n')}\n`;
$('copy').onclick = async () => { try { await navigator.clipboard.writeText(asText()); $('copy').textContent = 'Copied'; setTimeout(() => { $('copy').textContent = 'Copy all as text'; }, 1500); } catch { alert('Could not copy here. Use Download instead.'); } };
$('download').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([asText()], { type: 'text/markdown' })); a.download = `nena-world-diary-${new Date().toISOString().slice(0, 10)}.md`; a.click(); };

// ---- the outbox: what she has asked to do outside the island, waiting for you, and the switches ----
const STATUS = { pending: 'waiting for you', approved: 'approved', sending: 'sending', done: 'done', failed: 'failed', rejected: 'you said no', blocked: 'stopped by the rules', expired: 'lapsed' };
const MODE_WORDS = { off: 'Off', ask: 'Ask me', auto: 'Automatic' };
let ob = null;
const keyNow = () => $('key').value.trim();
async function obCall(path, data) {
  const r = await fetch(`${MIND}${path}`, data ? { method: 'POST', headers: { 'content-type': 'application/json', 'x-creator-key': keyNow() }, body: JSON.stringify(data) } : { headers: { 'x-creator-key': keyNow() } });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || r.status); return j;
}
const preview = it => { const p = it.payload || {};
  if (it.kind === 'letter') return `<b>${esc(p.subject)}</b><pre>${esc(p.body)}</pre>`;
  if (it.kind === 'post') return `<p>“${esc(p.text)}”</p><p class="dim">with her drawing ${esc(p.art || '')}, labelled “${esc(p.label)}”</p>`;
  if (it.kind === 'browse') return `<p>Read <a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">${esc(p.url)}</a></p>`;
  return `<pre>${esc(JSON.stringify(p, null, 2))}</pre>`; };
async function loadOutbox() {
  const box = $('outbox'); if (!(fromServer && canWrite)) { box.hidden = true; return; }
  box.hidden = false;
  if (!keyNow()) { box.innerHTML = `<h2>Her outbox</h2><p class="dim">Type your creator key above to see what she has asked to do outside the island.</p>`; return; }
  try { ob = await obCall('/api/outbox'); } catch (e) { box.innerHTML = `<h2>Her outbox</h2><p class="dim">${esc(e.message)}</p>`; return; }
  const S = ob.settings, waiting = ob.items.filter(i => i.status === 'pending');
  box.innerHTML = `<div class="ob-head"><h2>Her outbox</h2>
      <label class="switch"><input type="checkbox" id="ob-on" ${S.paused ? '' : 'checked'}><span>${S.paused ? 'Everything outside the island is off' : 'Outside the island: on'}</span></label></div>
    <p class="dim">Whatever she wants to do beyond her island waits here. The rules check it first; then it waits for you unless you've set that kind to automatic. Nothing goes anywhere until a connection for it is set up.</p>
    <h3>Waiting for you ${waiting.length ? `(${waiting.length})` : ''}</h3>
    ${waiting.length ? waiting.map(it => `<article class="req" data-id="${esc(it.id)}"><div class="req-top"><b>${esc(ob.kinds[it.kind]?.label || it.kind)}</b><span class="dim">day ${it.day}</span></div>
      ${it.why ? `<p class="why">“${esc(it.why)}”</p>` : ''}${preview(it)}
      <div class="row"><button class="yes">Yes, go ahead</button><button class="no">No</button></div></article>`).join('') : '<p class="dim">Nothing waiting.</p>'}
    <h3>What she may do</h3>
    <table class="kinds"><tr><th>Kind</th><th>Mode</th><th>A day</th><th></th></tr>
      ${Object.entries(ob.kinds).map(([k, v]) => `<tr data-k="${k}"><td><b>${esc(v.label)}</b><br><span class="dim">${esc(v.about)}</span></td>
        <td><div class="seg">${['off', 'ask', 'auto'].map(m => `<button data-m="${m}" class="${S.modes[k] === m ? 'on' : ''}">${MODE_WORDS[m]}</button>`).join('')}</div></td>
        <td><input type="number" min="0" max="100" value="${S.caps[k]}" class="cap"></td>
        <td class="dim">${ob.connected.includes(v.hands) ? 'connected' : 'not connected yet'}</td></tr>`).join('')}
    </table>
    <details><summary>Everything she has asked for (${ob.items.length})</summary><ul class="hist">${ob.items.map(it => `<li><span class="st st-${esc(it.status)}">${esc(STATUS[it.status] || it.status)}</span> day ${it.day} · ${esc(ob.kinds[it.kind]?.label || it.kind)}${it.note ? ` <span class="dim">· ${esc(it.note)}</span>` : ''}</li>`).join('')}</ul></details>`;
}
$('outbox').addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b) return;
  try {
    const req = b.closest('.req'); if (req) { b.disabled = true; await obCall('/api/outbox/decide', { id: req.dataset.id, approve: b.classList.contains('yes') }); return loadOutbox(); }
    const row = b.closest('tr[data-k]'); if (row && b.dataset.m) { await obCall('/api/outbox/settings', { modes: { [row.dataset.k]: b.dataset.m } }); return loadOutbox(); }
  } catch (err) { alert(err.message); }
});
$('outbox').addEventListener('change', async e => {
  try {
    if (e.target.id === 'ob-on') { await obCall('/api/outbox/settings', { paused: !e.target.checked }); return loadOutbox(); }
    const row = e.target.closest('tr[data-k]'); if (row && e.target.classList.contains('cap')) await obCall('/api/outbox/settings', { caps: { [row.dataset.k]: e.target.value } });
  } catch (err) { alert(err.message); }
});
$('key').addEventListener('change', () => { save('nena-creator-key', keyNow()); loadOutbox(); });
setInterval(() => { if (!document.hidden && ob) loadOutbox(); }, 20000);

read().then(loadOutbox);
