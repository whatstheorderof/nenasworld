// What Nena's face and body show, worked out from her mood, the weather, what she's doing
// and what just happened. Every feeling is a set of numbers for nena.setFeeling().
export const EMO = {
  neutral:   {},
  content:   { happy: 0.25, blush: 0.3 },
  happy:     { happy: 0.7, blush: 0.55, beak: 0.15, browUp: 0.2 },
  delighted: { happy: 1, blush: 0.85, beak: 0.45, browUp: 0.4, bounce: 1, emote: 'sparkle' },
  love:      { happy: 1, blush: 1, beak: 0.1, tilt: 0.12, emote: 'heart' },
  curious:   { wide: 0.18, browUp: 0.6, tilt: 0.14, lookX: 0.6, emote: 'question' },
  sleepy:    { blink: 0.55, browTilt: 0.2, droop: 0.08, emote: 'zzz' },
  asleep:    { blink: 1, droop: 0.05 },
  hungry:    { sad: 0.3, browTilt: 0.3, beak: 0.15, emote: 'food' },
  cross:     { squint: 0.85, browTilt: -0.8, browUp: -0.3, blush: 0.4, emote: 'anger' },
  bored:     { blink: 0.35, lookX: -0.7, droop: 0.04, emote: 'dots' },
  sad:       { sad: 0.8, browTilt: 0.8, droop: 0.18, lookY: -0.6, emote: 'gloom' },
  crying:    { sad: 1, browTilt: 1, droop: 0.22, beak: 0.2, lookY: -0.6, emote: 'tear' },
  worried:   { sad: 0.4, browTilt: 0.7, browUp: 0.3, lookX: 0.5, emote: 'sweat' },
  scared:    { wide: 0.35, browTilt: 0.9, browUp: 0.6, shiver: 1, beak: 0.3, emote: 'exclaim' },
  surprised: { wide: 0.4, browUp: 0.8, beak: 0.6, emote: 'exclaim' },
  awe:       { wide: 0.3, browUp: 0.7, beak: 0.25, lookY: 1, emote: 'sparkle' },
  cold:      { squint: 0.3, shiver: 0.8, blush: 0.9, browTilt: 0.3 },
  hot:       { blink: 0.4, beak: 0.35, blush: 0.7, emote: 'sweat' },
  musical:   { happy: 0.8, blush: 0.5, tilt: 0.1, bounce: 0.5, emote: 'music' },
  focused:   { squint: 0.25, lookY: -0.8, browUp: -0.1 },
};

const FROM_MOOD = { content: 'content', happy: 'happy', delighted: 'delighted', curious: 'curious', sleepy: 'sleepy', asleep: 'asleep', hungry: 'hungry', 'put out': 'cross', restless: 'bored', 'a little flat': 'sad', unsettled: 'worried' };
const LOOK_UP = ['stargaze', 'watch_sky', 'watch_beam', 'gaze_far', 'cloud_shapes', 'watch_storm', 'chase_rainbow', 'watch_rain'];
const MUSIC = ['play_record', 'sing', 'play_music', 'hum'];

export function makeFeelings() {
  let pulse = null;   // { name, until } — something that just happened beats her mood for a moment
  const feel = (name, secs = 4) => { if (EMO[name]) pulse = { name, until: performance.now() / 1000 + secs }; };

  // Which feeling, by priority: a moment > a storm > what she's doing > the heat or cold > her mood.
  function pick(n, t) {
    if (!n) return 'content';
    const a = n.activity || {}, doing = a.phase === 'doing', inside = doing && a.anim === 'inside', w = n.weather;
    if (pulse && t < pulse.until) return pulse.name;
    if (doing && a.action === 'sleep') return 'asleep';
    if (w === 'storm' && !inside && a.action !== 'watch_storm') return 'scared';
    if (doing) {
      if (a.anim === 'read') return 'focused';
      if (LOOK_UP.includes(a.action) || a.anim === 'lookup') return 'awe';
      if (MUSIC.includes(a.action) || n.event?.show === 'music') return 'musical';
      if (a.action === 'give_gift') return 'love';
      if (['puddle_jump', 'fly_kite', 'ice_lolly'].includes(a.action)) return 'delighted';
    }
    if (n.event && !inside) return 'delighted';
    if (!inside && w === 'heat') return 'hot';
    if (!inside && w === 'snow') return 'cold';
    return FROM_MOOD[n.mood] || 'content';
  }

  return {
    feel,
    // `now` is the world view; t is seconds since the page opened.
    compute(n, t, override) {
      const name = override && EMO[override] ? override : pick(n, performance.now() / 1000);
      const f = { ...EMO[name] };
      // a mood's symbol only shows now and then, so she doesn't wear a sign all day
      if (!override && !(pulse && performance.now() / 1000 < pulse.until) && f.emote && (t % 11) > 3) delete f.emote;
      if (n?.say && n.sayUntil > Date.now()) f.talk = true;
      return { name, ...f };
    },
    // things that just happened, from her feed
    fromFeed(item) {
      if (!item?.result) return;
      const l = item.lift || 0, label = item.label || '';
      if (/bees/.test(label)) return feel('scared', 5);
      if (item.action === 'stamp') return feel('delighted', 5);
      if (/photo of/.test(label)) return feel('love', 4);
      if (item.action === 'read_mail') { if (/liked|lovely|nice/.test(label)) return feel('love'); if (/didn'?t like|odd|strange/.test(label)) return feel('sad'); return feel('curious'); }
      if (l >= 0.35) return feel('delighted', 4);
      if (l >= 0.15) return feel('happy', 3);
      if (l <= -0.25) return feel(Math.random() < 0.5 ? 'cross' : 'sad', 5);
    },
  };
}
