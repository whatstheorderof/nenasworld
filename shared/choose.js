// The scripted stand-in mind: picks from what is on offer by how much each thing would
// help what she is short of, with some whim, and avoids repeating herself.
import { ACTIONS } from './data.js';

const pick = a => a[Math.floor(Math.random() * a.length)];
const TOPICS = ['how ice forms', 'what fish dream about', 'why the sky glows green', 'boats', 'the far side of the sea', 'how snowflakes get their shapes', 'lighthouses', 'whales', 'maps', 'fossils', 'how seeds know which way is up'];
const DRAWINGS = ['a fish with very long whiskers', 'the pond from above', 'my house at night', 'a boat i have never seen', 'the lamp by the mailbox', 'someone waving', 'Bo asleep on a rock'];
const FILMS = ['The Long Slide', 'A Fish Called Sunday', 'Night Train to the Ice', 'Two Lamps', 'The Lighthouse Keeper Sleeps'];

// guide: gentle nudges from her creator's feedback (shared/guidance.js); optional
export function chooseFallback(options, needs, recent, interests = [], guide = null) {
  const vary = guide?.variety || 0;
  const last = recent[recent.length - 1];
  let best = null, bestScore = -1e9;
  for (const o of options) {
    const def = ACTIONS[o.action];
    let s = 0.15 + Math.random() * 0.4;
    for (const [k, v] of Object.entries(def.effects)) if (v > 0) s += v * (1 - needs[k]) * 1.4;
    if (o.action === 'sleep') s += (1 - needs.energy) * 1.2;
    if (o.action === 'eat' || o.action === 'cook') s += needs.fullness < 0.3 ? 0.8 : 0;
    if (['event', 'read_mail', 'pop_balloon', 'open_bottle', 'wish', 'donate', 'sell_turnips', 'decorate', 'pick_coins', 'harvest', 'buy_art', 'trade_pearl', 'bury_coins', 'visit_camper', 'greet_visitors'].includes(o.action)) s += 0.7;   // things that will not wait
    if (['puddle_jump', 'chase_rainbow', 'fly_kite', 'watch_storm', 'ice_lolly', 'observe', 'buy_clothes', 'join_hobby', 'water_flowers', 'dig_fossil', 'craft', 'buy_turnips', 'pay_home', 'give_gift'].includes(o.action)) s += 0.3;
    if (o.action === 'wander') s -= 0.25;
    if (o.action === 'voyage') s += 0.75;    // the far islands are worth the trip: she should go and see them
    if (o.action === 'boat_trip') s += 0.3;
    if (o.action === last) s -= 0.8 + 0.4 * vary;
    if (recent.includes(o.action)) s -= 0.3 + 0.35 * vary;   // 'too repetitive' feedback widens the gap between repeats
    s += guide?.boost?.[o.action] || 0;                     // 'more fishing', 'less reading'
    if (s > bestScore) { bestScore = s; best = o; }
  }
  const action = best.action;
  const detail = action === 'read' ? pick([...interests.slice(0, 3), ...TOPICS]) : action === 'draw' ? pick(DRAWINGS) : action === 'watch_film' ? pick(FILMS) : '';
  const why = pick(ACTIONS[action].why);
  return { action, detail, reason: why, say: Math.random() < 0.25 ? why : '' };
}
