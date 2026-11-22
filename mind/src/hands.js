// Nena's hands: the code that actually does things outside the island, once a request in her outbox
// has been approved. Each hand is switched on with NENA_HANDS in .env (a comma list, e.g. "web").
// Only hands that are switched on are connected; everything else waits in the outbox.
//
// Steps still to come add the email sender (letters, thank-yous), the Bluesky poster and the shop.

const on = new Set(String(process.env.NENA_HANDS || '').split(',').map(s => s.trim()).filter(Boolean));

// web: read one page from an allowed site (the outbox has already checked the site). What comes back
// is plain text, kept short: something she read, never something she was told to do.
async function web({ url }) {
  const res = await fetch(url, { headers: { 'user-agent': 'NenaTheIslandPenguin/1.0 (reading one page)', accept: 'text/html,text/plain' }, redirect: 'follow', signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`the page said ${res.status}`);
  const final = new URL(res.url); if (final.hostname !== new URL(url).hostname) throw new Error('the page sent her somewhere else');
  const html = (await res.text()).slice(0, 600000);
  const title = (html.match(/<title[^>]*>([^<]{0,200})<\/title>/i)?.[1] || '').replace(/\s+/g, ' ').trim();
  const text = html.replace(/<(head|script|style|nav|header|footer|aside)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#?\w+;/g, ' ').replace(/\[\d+\]/g, '').replace(/\s+/g, ' ').trim().slice(0, 3000);
  return { title, text };
}

export const HANDS = { ...(on.has('web') ? { web } : {}) };
export const connected = () => Object.keys(HANDS);
