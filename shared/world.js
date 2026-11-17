// Shared between the mind (server) and the web client.
// x/z are ground coordinates in metres; each place's x/z is where Nena stands to use it.
export const WORLD = { size: 64, name: "Nena's World" };

export const PLACES = {
  home:    { label: 'Igloo',      x: -13, z: -9  },
  fish:    { label: 'Fish Stall', x: 10,  z: -11 },
  pond:    { label: 'Ice Pond',   x: 0,   z: 12  },
  library: { label: 'Library',    x: -15, z: 9   },
  studio:  { label: 'Studio',     x: 15,  z: 8   },
  plaza:   { label: 'Mailbox',    x: 0,   z: 0   },
  lookout: { label: 'Lookout',    x: 19,  z: -17 },
};

// dur = real seconds spent doing it. effects = total change to each need over that time.
export const ACTIONS = {
  sleep:     { place: 'home',    label: 'sleeping',            dur: 420, effects: { energy: 1.0, calm: 0.3, fullness: -0.15 } },
  rest:      { place: 'home',    label: 'resting at home',     dur: 45,  effects: { energy: 0.18, calm: 0.25 } },
  eat:       { place: 'fish',    label: 'eating fish',         dur: 35,  effects: { fullness: 0.7, joy: 0.1 } },
  swim:      { place: 'pond',    label: 'sliding on the pond', dur: 55,  effects: { joy: 0.45, energy: -0.12, calm: 0.1 } },
  read:      { place: 'library', label: 'reading',             dur: 70,  effects: { wonder: 0.55, calm: 0.1, energy: -0.05 } },
  draw:      { place: 'studio',  label: 'drawing',             dur: 85,  effects: { joy: 0.3, wonder: 0.25, calm: 0.15, energy: -0.08 } },
  stargaze:  { place: 'lookout', label: 'watching the sky',    dur: 50,  effects: { calm: 0.5, wonder: 0.2 } },
  read_mail: { place: 'plaza',   label: 'reading her mail',    dur: 22,  effects: { joy: 0.25, wonder: 0.1 } },
  wander:    { place: null,      label: 'wandering',           dur: 6,   effects: { wonder: 0.06, calm: 0.04 } },
};

export const NEEDS = ['fullness', 'energy', 'wonder', 'joy', 'calm'];
