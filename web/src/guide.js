// A short welcome tour for first-time visitors: who Nena is, the sea chart, and how to leave her something.
// Shown once per browser (localStorage 'nena-guide'), and again from Settings.
const STEPS = [
  { sel: '#status', title: 'This is Nena',
    text: 'A small penguin with her own floating island. Nobody plays her: she decides what to do, keeps a diary and remembers who visits. This card shows what she is up to and how she feels.' },
  { sel: '#map-btn', title: 'The sea chart',
    text: 'Open the chart to see her island and the others she sails or flies to. Tap a square to learn about it. The camera button next to it lets you roam about yourself.' },
  { sel: '#nav [data-panel=leave]', title: 'Leave her something',
    text: 'Leave a note or a little gift and she will find it. You can also chat, read her diary and look through what she has made.' },
];

let open = null;
export function showGuide(onDone) {
  if (open) return;
  let i = 0;
  const wrap = document.createElement('div'); wrap.id = 'guide'; wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true'); wrap.setAttribute('aria-labelledby', 'guide-title');
  wrap.innerHTML = `<div class="g-ring"></div><div class="g-card card"><p class="g-step"></p><h2 id="guide-title"></h2><p class="g-text"></p>
    <div class="g-row"><button type="button" class="g-skip">Skip</button><button type="button" class="g-next">Next</button></div></div>`;
  document.body.append(wrap); open = wrap;
  const ring = wrap.querySelector('.g-ring'), card = wrap.querySelector('.g-card'), next = wrap.querySelector('.g-next');
  const finish = () => { try { localStorage.setItem('nena-guide', 'seen'); } catch {} removeEventListener('resize', place); removeEventListener('keydown', key); wrap.remove(); open = null; onDone?.(); };
  const key = e => { if (e.key === 'Escape') finish(); else if (e.key === 'ArrowRight' || e.key === 'Enter') go(1); else if (e.key === 'ArrowLeft') go(-1); };
  function place() {
    const s = STEPS[i], el = document.querySelector(s.sel); const r = el?.getBoundingClientRect();
    if (!r || !r.width) { ring.style.opacity = 0; card.style.left = '50%'; card.style.top = '50%'; card.style.transform = 'translate(-50%,-50%)'; return; }
    el.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    const pad = 6; Object.assign(ring.style, { opacity: 1, left: `${r.left - pad}px`, top: `${r.top - pad}px`, width: `${r.width + pad * 2}px`, height: `${r.height + pad * 2}px` });
    const W = innerWidth, H = innerHeight, cw = Math.min(330, W - 24), ch = card.offsetHeight || 180;
    let x = Math.min(Math.max(12, r.left + r.width / 2 - cw / 2), W - cw - 12), y = r.bottom + 16;
    if (y + ch > H - 12) y = r.top - ch - 16;
    if (y < 12) { y = Math.max(12, (H - ch) / 2); x = r.right + 16 + cw < W ? r.right + 16 : Math.max(12, r.left - cw - 16); }
    Object.assign(card.style, { width: `${cw}px`, left: `${x}px`, top: `${y}px`, transform: 'none' });
  }
  function go(d) {
    i += d; if (i < 0) i = 0; if (i >= STEPS.length) return finish();
    const s = STEPS[i];
    wrap.querySelector('.g-step').textContent = `${i + 1} of ${STEPS.length}`;
    wrap.querySelector('h2').textContent = s.title; wrap.querySelector('.g-text').textContent = s.text;
    next.textContent = i === STEPS.length - 1 ? 'Say hello' : 'Next';
    place(); requestAnimationFrame(place); next.focus();
  }
  wrap.querySelector('.g-skip').onclick = finish; next.onclick = () => go(1);
  wrap.addEventListener('click', e => { if (e.target === wrap) go(1); });
  addEventListener('resize', place); addEventListener('keydown', key);
  go(0);
}

export const guideSeen = () => { try { return localStorage.getItem('nena-guide') === 'seen'; } catch { return true; } };
