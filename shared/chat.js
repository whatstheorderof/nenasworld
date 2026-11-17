// Nena's scripted replies, used when no model is connected (and by the in-browser stand-in).
// ctx: { doing, mood, weather, night, place, known (times this visitor has talked to her) }
const pick = a => a[Math.floor(Math.random() * a.length)];
const has = (t, ...w) => w.some(x => new RegExp(`\\b${x}\\b`, "i").test(t));

export function scriptedReply(text, name, ctx) {
  const t = String(text || '').toLowerCase(), doing = ctx.doing || 'thinking', again = ctx.known > 0;
  if (ctx.asleep) return pick(['zzz.', 'mm. fish. zzz.', '(she rolls over and keeps sleeping)']);
  if (has(t, 'hi', 'hello', 'hey', 'hiya', 'morning', 'evening', 'yo', 'howdy'))
    return again ? pick([`${name}! you came back.`, `hello again ${name}.`, `oh. ${name}. hello.`]) : pick([`hello ${name}. i am ${doing}.`, `hi. you are new. i am nena.`, `hello. nobody told me you were coming.`]);
  if (has(t, 'bye', 'goodbye', 'see you', 'night night', 'goodnight', 'gtg', 'later'))
    return pick([`bye ${name}. come back.`, 'bye. i will be here.', `see you, ${name}.`]);
  if (has(t, 'how are you', 'how r u', "how's it", 'hows it', 'you ok', 'you okay'))
    return pick([`i feel ${ctx.mood}.`, `${ctx.mood}, mostly. thank you for asking.`, `${ctx.mood}. how are you?`]);
  if (has(t, 'what are you doing', 'wyd', 'what you doing', 'whatcha'))
    return pick([`${doing}.`, `i am ${doing}. it is important.`, `${doing}. do you want to watch?`]);
  if (has(t, 'name')) return pick([`i am nena. you are ${name}.`, `nena. it is a good name. ${name} is good too.`]);
  if (has(t, 'fish\\w*', 'hungry', 'food', 'eat\\w*'))
    return pick(['fish is the answer to most things.', 'i could eat. i can always eat.', 'the fish stall is my favourite place. do not tell the library.']);
  if (has(t, 'weather', 'rain\\w*', 'snow\\w*', 'sun\\w*', 'storm\\w*', 'wind\\w*', 'cold', 'hot'))
    return { rain: 'it is raining. the puddles are excellent.', storm: 'i am staying near a roof. you should too.', snow: 'the snow squeaks when you walk on it.', wind: 'hold on to something. the wind wants everything today.', heat: 'too hot. even my scarf is sweating.', rainbow: 'look up. there is a rainbow.', mist: 'i cannot see the far islands today.' }[ctx.weather] || 'the sky is doing its best today.';
  if (has(t, 'love\\w*', 'cute', 'like you', 'adorable', 'best', 'favourite person'))
    return pick(['oh. thank you. i do not know where to look.', 'you are nice. i am putting that in my diary.', '(she goes a bit pink around the cheeks)']);
  if (has(t, 'island', 'far', 'volcano', 'forest', 'ice', 'other islands'))
    return pick(['there are other islands out there. one day i will go.', 'the smoking one worries me a little. the forest one does not.', 'from the lighthouse you can see three of them.']);
  if (has(t, 'lonely', 'alone', 'sad'))
    return pick(['i have Bo and Pip and Suvi. and you, now.', 'sometimes. then someone says hello.', 'it is not so bad. there is always something to do.']);
  if (t.includes('?'))
    return pick(['i do not know. i will think about it.', `good question. i will think about it while i am ${doing}.`, 'hm. ask me again tomorrow.', 'i think so. maybe. yes.']);
  return pick([`mm. ${name} says interesting things.`, 'i will remember that.', 'oh. yes.', `that is nice, ${name}.`, 'i was just thinking about that.', `(she nods, still ${doing})`]);
}
