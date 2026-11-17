// The model is pluggable. With no key set, ask() returns null and Nena's
// scripted fallback takes over, so the world always keeps running.
const env = process.env;

export function provider() {
  if (env.ANTHROPIC_API_KEY) return { kind: 'anthropic', model: env.NENA_MODEL || 'claude-haiku-4-5' };
  if (env.OPENAI_BASE_URL || env.OPENAI_API_KEY) return { kind: 'openai', model: env.NENA_MODEL || 'gpt-4o-mini' };
  return { kind: 'none', model: null };
}

export const usage = { calls: 0, failures: 0, inputTokens: 0, outputTokens: 0 };

async function post(url, headers, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

// Returns a parsed JSON object from the model, or null if there is no model or it failed.
export async function ask(system, user, maxTokens = 300) {
  const p = provider();
  if (p.kind === 'none') return null;
  try {
    usage.calls++;
    let text;
    if (p.kind === 'anthropic') {
      const r = await post('https://api.anthropic.com/v1/messages',
        { 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        { model: p.model, max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }] });
      text = r.content?.map(c => c.text || '').join('') || '';
      usage.inputTokens += r.usage?.input_tokens || 0;
      usage.outputTokens += r.usage?.output_tokens || 0;
    } else {
      const base = (env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
      const r = await post(`${base}/chat/completions`,
        { authorization: `Bearer ${env.OPENAI_API_KEY || 'none'}` },
        { model: p.model, max_tokens: maxTokens, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] });
      text = r.choices?.[0]?.message?.content || '';
      usage.inputTokens += r.usage?.prompt_tokens || 0;
      usage.outputTokens += r.usage?.completion_tokens || 0;
    }
    const a = text.indexOf('{'), b = text.lastIndexOf('}');
    if (a < 0 || b <= a) throw new Error('no JSON in reply');
    return JSON.parse(text.slice(a, b + 1));
  } catch (err) {
    usage.failures++;
    console.warn('[model]', err.message);
    return null;
  }
}
