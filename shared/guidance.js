// Her creator's feedback from the world diary, turned into gentle guidance for how her mind
// chooses. It nudges, it never orders: she keeps choosing for herself, and nothing here is
// something she "knows" about. Only feedback from her creator reaches this (the server needs
// CREATOR_KEY; the stand-in reads the feedback saved in that same browser).

// words in a note -> the things she does that they're about
const TOPICS = [
  [/fish/, ['go_fishing', 'sea_fishing']], [/draw|art|paint/, ['draw', 'buy_art']], [/read|book|librar/, ['read']],
  [/music|sing|song|tune|record/, ['play_record', 'compose_tune', 'plant_hum']], [/friend|neighbou?r|bo\b|pip\b|suvi/, ['chat', 'give_gift', 'write_letter', 'join_hobby']],
  [/visitor|gull/, ['greet_visitors']], [/explor|wander|walk/, ['wander', 'gaze_far', 'boat_trip', 'voyage']], [/cook|bak|cookie|food/, ['cook', 'bake_cookies', 'buy_cookie']],
  [/star|sky|observ/, ['stargaze', 'observe', 'tour_observatory', 'cloud_shapes']], [/garden|flower|plant|crop|veg/, ['garden', 'plant_flowers', 'water_flowers', 'tend_crops', 'harvest']],
  [/swim|sea|dive|beach/, ['swim', 'dive', 'beachcomb']], [/museum|fossil|bug|collect/, ['visit_museum', 'dig_fossil', 'catch_bugs', 'donate']],
  [/film|cinema|movie/, ['watch_film']], [/build|craft|decor|house|home/, ['craft', 'decorate', 'furnish_home', 'redecorate']],
  [/sleep|nap|rest/, ['sleep', 'rest']], [/cloth|outfit|hat|scarf|fashion/, ['change_outfit', 'buy_clothes', 'try_on']],
];

// feedback: { day: { rating, tags, note, at } }. Uses the five most recent days with feedback.
export function guidanceFrom(feedback) {
  const recent = Object.entries(feedback || {}).map(([d, f]) => ({ day: Number(d), ...f })).filter(f => f.at).sort((a, b) => b.day - a.day).slice(0, 5);
  const g = { variety: 0, pace: 0, boost: {}, notes: [] };
  recent.forEach((f, i) => {
    const w = 1 / (1 + i * 0.6);   // newer feedback counts more
    const tags = f.tags || [];
    if (tags.includes('too repetitive')) g.variety += 0.6 * w;
    if (tags.includes('too quiet')) g.pace += 0.5 * w;
    if (tags.includes('too busy')) g.pace -= 0.5 * w;
    const note = String(f.note || '').toLowerCase();
    // "more fishing", "less reading", "loved the baking": a phrase near a topic word leans it up or down
    for (const sentence of note.split(/[.!?\n;]+/)) {
      const down = /\b(less|fewer|not so much|too much|stop|enough|no more|bored of|tired of)\b/.test(sentence);
      const up = /\b(more|love[ds]?|liked?|lovely|great|keep|again|please)\b/.test(sentence);
      if (!up && !down) continue;
      for (const [re, actions] of TOPICS) if (re.test(sentence)) for (const a of actions) g.boost[a] = (g.boost[a] || 0) + (down ? -0.16 : 0.14) * w;
    }
    if (f.note) g.notes.push(`day ${f.day}${f.rating ? ` (${f.rating}/5)` : ''}: ${String(f.note).replace(/\s+/g, ' ').slice(0, 220)}`);
  });
  g.variety = Math.min(1, g.variety); g.pace = Math.max(-1, Math.min(1, g.pace));
  for (const k of Object.keys(g.boost)) g.boost[k] = Math.max(-0.3, Math.min(0.3, g.boost[k]));
  return g;
}
// how long between thoughts: "too quiet" makes her a little quicker to start the next thing
export const paced = (seconds, g) => seconds * (1 - 0.35 * (g?.pace || 0));
