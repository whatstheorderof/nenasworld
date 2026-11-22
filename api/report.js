// Error reports from visitors' browsers. Each one is written to the function log, so they show up under
// Logs in the Vercel project (filter by "[nena-error]"). Nothing is stored and nothing is sent anywhere else.
export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).end(); return; }
  try {
    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body);
    if (!body || typeof body !== 'object') throw new Error('empty');
    const clip = (v, n) => String(v ?? '').slice(0, n);
    const report = { msg: clip(body.msg, 300), where: clip(body.where, 200), stack: clip(body.stack, 1500), page: clip(body.page, 200),
      ua: clip(req.headers['user-agent'], 200), build: clip(body.build, 40), gpu: clip(body.gpu, 120), at: new Date().toISOString() };
    console.error('[nena-error]', JSON.stringify(report));
  } catch { /* a malformed report is dropped */ }
  res.status(204).end();
}
