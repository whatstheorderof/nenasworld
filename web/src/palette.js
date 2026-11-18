// Nena's World is pastel (see art/STYLE.md). Older colours in the code were bright and saturated,
// so every island colour passes through here: saturation comes down and light colours lift
// towards a soft pastel, while deep accent colours (navy, chocolate) stay deep so things read.
import * as THREE from 'three';
const c = new THREE.Color(), hsl = {};
const cache = new Map();
export function pastel(hex) {
  if (typeof hex !== 'number') return hex;
  if (cache.has(hex)) return cache.get(hex);
  c.set(hex).getHSL(hsl);
  let { h, s, l } = hsl;
  if (l > 0.28) { s *= 0.62; l += (0.78 - l) * 0.42; }   // soften and lift
  else s *= 0.8;                                           // dark accents stay dark
  const out = c.setHSL(h, s, Math.min(0.96, l)).getHex();
  cache.set(hex, out); return out;
}
