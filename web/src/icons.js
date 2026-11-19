// Item icons, drawn in the island's style: flat colours, a navy outline, a little shine.
// Your own pictures win: put a PNG/SVG in web/public/icons/ named after the item's slug
// (e.g. "fire-opal.png") and list it in web/public/icons/manifest.json. Anything not listed
// uses the drawn icon below.
const L = '#1d2545';
const st = `stroke="${L}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"`;
const shine = (x, y, r = 2.2) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.6}" fill="#fff" opacity=".75" transform="rotate(-30 ${x} ${y})"/>`;
const path = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${st} ${extra}/>`;
const circ = (x, y, r, fill, extra = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${st} ${extra}/>`;
const ell = (x, y, rx, ry, fill, extra = '') => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${st} ${extra}/>`;
const rect = (x, y, w, h, fill, rx = 3, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${st} ${extra}/>`;
const dot = (x, y, r, fill = L) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
const line = (d, w = 2.4, col = L) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

// ---- templates -------------------------------------------------------------------------
const fish = (body, fin, { stripe, long, flat, gold } = {}) => {
  const rx = long ? 17 : flat ? 15 : 13, ry = long ? 6.5 : flat ? 10 : 8.5;
  return path(`M${24 + rx - 2} 24 L${45} ${16} L${43} 24 L${45} 32 Z`, fin) + ell(22, 24, rx, ry, body) +
    (stripe ? line(`M${20} ${24 - ry + 2} Q${17} 24 ${20} ${24 + ry - 2}`, 2.2, stripe) : '') + path(`M18 ${24 - ry + 1} Q22 ${24 - ry - 6} 27 ${24 - ry + 1}`, fin) +
    dot(13, 22, 2.2) + shine(17, 19) + (gold ? `<path d="M30 14 l1.5 -4 l1.5 4 l4 1.5 l-4 1.5 l-1.5 4 l-1.5 -4 l-4 -1.5 z" fill="#fff6c0"/>` : '');
};
const bug = (shell, { spots, wings, legs = true, long, glow } = {}) =>
  (legs ? line('M14 22 L7 18 M14 28 L6 30 M34 22 L41 18 M34 28 L42 30', 2.2) : '') + (wings ? path('M24 22 C10 6 4 20 12 28 C16 32 22 28 24 26 Z', wings) + path('M24 22 C38 6 44 20 36 28 C32 32 26 28 24 26 Z', wings) : '') +
  (long ? ell(24, 26, 4, 15, shell) : ell(24, 27, 11, 12, shell)) + circ(24, 13, 5, L) + line('M22 9 L18 4 M26 9 L30 4', 2) + (spots ? dot(19, 24, 2.4) + dot(28, 22, 2.4) + dot(22, 32, 2.2) + dot(29, 31, 2.2) + line('M24 16 L24 38', 2) : '') +
  (glow ? `<circle cx="24" cy="38" r="7" fill="#fff36b" opacity=".6"/>` + circ(24, 36, 4, '#ffe14a') : '') + shine(20, 21);
const gem = (fill, edge = '#fff') => path('M12 18 L19 10 L29 10 L36 18 L24 40 Z', fill) + line('M12 18 L36 18 M19 10 L22 18 L24 40 M29 10 L26 18', 1.8) + `<path d="M19 12 L21 17 L15 17 Z" fill="${edge}" opacity=".7"/>`;
const round = (fill, r = 13) => circ(24, 25, r, fill) + shine(19, 19, 3);
const berries = (a, b) => line('M24 10 L24 16 M24 14 L31 9', 2.2) + path('M24 12 Q33 6 36 12 Q30 16 24 12 Z', '#6fbf5f') + circ(18, 27, 7, a) + circ(30, 27, 7, b) + circ(24, 36, 7, a) + shine(16, 25, 1.6) + shine(28, 25, 1.6);
const frame = (sky, ground, sun) => rect(7, 9, 34, 30, '#d9b15c', 2) + `<rect x="11" y="13" width="26" height="22" fill="${sky}"/>` + `<path d="M11 28 Q20 24 28 29 T37 27 V35 H11 Z" fill="${ground}"/>` + dot(30, 19, 3.2, sun) + `<rect x="11" y="13" width="26" height="22" fill="none" stroke="${L}" stroke-width="1.8"/>`;
const hat = (crown, band) => ell(24, 33, 19, 5, crown) + path('M13 32 C13 16 35 16 35 32 Z', crown) + `<path d="M13.5 28 C16 26 32 26 34.5 28 L35 31 C30 29 18 29 13 31 Z" fill="${band}"/>` + shine(19, 23);
const plate = food => ell(24, 30, 19, 8, '#ffffff') + ell(24, 29, 13, 5, '#f3eee4') + food;

// ---- the icons ------------------------------------------------------------------------
const I = {
  // fish
  minnow: () => fish('#9fb4c8', '#7f97ad'), trout: () => fish('#c7a77a', '#a8825a', { stripe: '#e26a7a' }), pike: () => fish('#8fae6a', '#6f8f50', { long: true }), salmon: () => fish('#f29a7a', '#d9705a'),
  herring: () => fish('#c9d6e6', '#9fb0c8'), mackerel: () => fish('#7fb0d8', '#5a8fba', { stripe: '#2f5f8a' }), flounder: () => fish('#d8c49a', '#b8a070', { flat: true }), 'golden trout': () => fish('#ffd24a', '#f5a623', { gold: true }),
  lanternfish: () => fish('#4a4f8a', '#363a6b') + line('M11 18 Q8 8 15 6', 2) + `<circle cx="15" cy="6" r="4.5" fill="#fff36b" opacity=".6"/>` + circ(15, 6, 2.6, '#ffe14a'),
  'moon ray': () => path('M24 12 C36 14 44 22 44 26 C36 26 30 30 24 36 C18 30 12 26 4 26 C4 22 12 14 24 12 Z', '#9aa3d8') + line('M24 36 Q26 42 32 44', 2.2) + dot(20, 22, 1.8) + dot(28, 22, 1.8) + shine(18, 18),
  squid: () => path('M24 4 C33 10 33 22 30 26 L18 26 C15 22 15 10 24 4 Z', '#ff9db0') + line('M18 26 Q15 34 18 42 M22 26 Q21 36 23 44 M26 26 Q27 36 25 44 M30 26 Q33 34 30 42', 2.4, '#e2708a') + dot(21, 18, 2) + dot(27, 18, 2) + shine(21, 11),
  // bugs
  ladybird: () => bug('#e8452c', { spots: true }), 'blue butterfly': () => bug('#3a3f6b', { wings: '#7fc8ff', legs: false, long: true }), cricket: () => bug('#7fc15a', { long: true }) + line('M20 34 L12 44 M28 34 L36 44', 2.4),
  'stag beetle': () => bug('#8a5a3a') + path('M19 10 Q14 2 19 2 M29 10 Q34 2 29 2', 'none'), firefly: () => bug('#5a5f8a', { wings: '#e9f0ff', long: true, legs: false, glow: true }),
  'snow moth': () => bug('#d8d4e8', { wings: '#f4f2ff', legs: false, long: true }), 'pond skater': () => line('M24 24 L6 14 M24 24 L42 14 M24 28 L4 40 M24 28 L44 40', 2) + ell(24, 26, 4, 10, '#6a6f94') + circ(24, 15, 3.5, L),
  'emerald dragonfly': () => path('M24 18 C8 10 2 16 6 20 C10 24 20 22 24 20 Z', '#d9f6ff') + path('M24 18 C40 10 46 16 42 20 C38 24 28 22 24 20 Z', '#d9f6ff') + path('M24 22 C14 22 6 28 10 30 C14 32 20 26 24 24 Z', '#d9f6ff') + path('M24 22 C34 22 42 28 38 30 C34 32 28 26 24 24 Z', '#d9f6ff') + ell(24, 30, 3.2, 14, '#2fbf7a') + circ(24, 14, 4.5, '#2fbf7a'),
  // sea creatures
  'sea star': () => path('M24 5 L29 18 L43 18 L32 27 L36 41 L24 33 L12 41 L16 27 L5 18 L19 18 Z', '#ff9a5a') + dot(24, 22, 1.6, '#fff') + dot(20, 26, 1.3, '#fff') + dot(28, 26, 1.3, '#fff'),
  urchin: () => Array.from({ length: 16 }, (_, i) => { const a = i / 16 * 6.283; return line(`M${24 + Math.cos(a) * 10} ${26 + Math.sin(a) * 9} L${24 + Math.cos(a) * 19} ${26 + Math.sin(a) * 17}`, 2.2, '#6a3f8a'); }).join('') + ell(24, 26, 12, 11, '#8a5ab8') + shine(20, 21),
  scallop: () => path('M24 40 L8 20 C10 8 38 8 40 20 Z', '#ffb7c4') + line('M24 40 L14 14 M24 40 L20 11 M24 40 L28 11 M24 40 L34 14', 1.8) + rect(18, 37, 12, 6, '#ff9db0', 2),
  'sea cucumber': () => path('M8 30 C8 18 40 16 41 26 C42 34 10 40 8 30 Z', '#d97a5a') + dot(16, 26, 1.6, '#ffd2b0') + dot(23, 23, 1.6, '#ffd2b0') + dot(31, 23, 1.6, '#ffd2b0') + dot(20, 31, 1.6, '#ffd2b0') + dot(29, 30, 1.6, '#ffd2b0'),
  'pearl oyster': () => path('M6 30 C10 16 38 16 42 30 Z', '#8a90a8') + path('M6 30 C12 40 36 40 42 30 Z', '#b8bdd0') + round('#fbf8ff', 6).replace('cy="25"', 'cy="29"').replace('cx="24"', 'cx="24"'),
  // fossils
  ammonite: () => circ(24, 25, 16, '#d9c49a') + line('M24 25 m0 0 a3 3 0 1 1 3 3 a6 6 0 1 1 -6 -6 a9 9 0 1 1 9 9 a12 12 0 1 1 -12 -12', 2) + shine(16, 16),
  trilobite: () => ell(24, 25, 12, 17, '#b8a888') + line('M12 18 L36 18 M12 24 L36 24 M12 30 L36 30 M13 36 L35 36 M24 8 L24 42', 1.8) + path('M14 12 Q24 4 34 12', 'none'),
  'fern imprint': () => path('M6 28 C6 12 42 10 42 26 C42 40 6 42 6 28 Z', '#b9b4aa') + line('M14 36 L34 14 M18 32 L15 26 M18 32 L24 33 M23 26 L20 20 M23 26 L29 27 M28 21 L26 16 M28 21 L33 21', 2, '#7f7a70'),
  'old tooth': () => path('M12 12 C12 4 36 4 36 12 C36 20 32 24 31 32 C30 42 27 42 26 34 C25 28 23 28 22 34 C21 42 18 42 17 32 C16 24 12 20 12 12 Z', '#fbf6e8') + shine(18, 11),
  'giant feather': () => path('M38 6 C20 10 10 26 10 40 C24 38 38 26 38 6 Z', '#8fc8e8') + line('M38 6 L8 42 M30 14 L20 13 M26 20 L15 20 M22 26 L13 27 M32 18 L30 26 M27 25 L25 32', 1.8),
  'tiny skull': () => path('M10 22 C10 6 38 6 38 22 C38 28 34 30 33 34 L15 34 C14 30 10 28 10 22 Z', '#f4f0e4') + circ(18, 21, 4, L) + circ(30, 21, 4, L) + line('M20 34 L20 39 M24 34 L24 39 M28 34 L28 39', 2.2),
  // paintings
  'Pond at Dusk': () => frame('#ffc89a', '#58b7e8', '#ff7a2a'), 'Fence, Forty Planks': () => frame('#bfe8ff', '#7cc15a', '#ffd93b') + line('M13 30 L13 24 M17 30 L17 24 M21 30 L21 24 M25 30 L25 24 M29 30 L29 24 M33 30 L33 24 M12 26 L34 26', 1.4, '#8a5a3a'),
  'Portrait of a Fish': () => frame('#fff1d6', '#fff1d6', '#fff1d6') + `<g transform="translate(11 13) scale(.54)">${fish('#ff9a5a', '#e8743a')}</g>`, 'The Long Night': () => frame('#2a3263', '#3a4a8a', '#ffe14a') + dot(16, 17, 1, '#fff') + dot(22, 20, 1, '#fff') + dot(19, 15, 0.8, '#fff'),
  'Two Tents': () => frame('#bfe8ff', '#7cc15a', '#ffd93b') + path('M13 31 L17 23 L21 31 Z', '#e8584a') + path('M23 31 L28 22 L33 31 Z', '#5a8fd8'), 'Sea, Mostly': () => frame('#e6f6ff', '#2f7f9a', '#fff') + line('M12 27 Q15 25 18 27 T24 27 T30 27 T36 27', 1.4, '#fff'),
  // materials
  shell: () => path('M10 38 C10 20 22 8 34 10 C40 18 38 34 24 40 Z', '#ffd2b8') + line('M14 34 Q22 22 32 13 M18 37 Q26 27 35 18 M12 30 Q18 20 28 11', 1.6) + shine(28, 16),
  'sea glass': () => path('M12 20 C14 10 34 8 38 18 C42 30 30 40 20 38 C10 36 10 28 12 20 Z', '#7fd8c8', 'fill-opacity=".9"') + shine(20, 17, 3),
  stick: () => line('M8 40 L40 8', 6, '#8a5a3a') + line('M8 40 L40 8', 2.2, '#a8784c') + line('M26 22 L34 24', 3, '#8a5a3a'),
  stone: () => path('M8 32 C6 20 18 12 28 14 C38 16 44 26 40 34 C36 40 12 40 8 32 Z', '#b4bcc8') + shine(18, 20, 3),
  ore: () => path('M8 32 C6 20 18 12 28 14 C38 16 44 26 40 34 C36 40 12 40 8 32 Z', '#8a8f9e') + `<path d="M18 24 l3 -3 l3 3 l-3 3 z M28 30 l2.5 -2.5 l2.5 2.5 l-2.5 2.5 z M29 20 l2 -2 l2 2 l-2 2 z" fill="#ffd24a"/>`,
  clay: () => path('M8 34 C6 24 14 16 24 16 C34 16 42 24 40 34 C38 40 10 40 8 34 Z', '#c8865a') + line('M16 28 Q24 24 32 28', 1.8, '#a8683e') + shine(17, 22),
  wood: () => rect(6, 20, 30, 16, '#a8784c', 8) + ell(36, 28, 7, 8, '#e6c08a') + `<ellipse cx="36" cy="28" rx="3.5" ry="4" fill="none" stroke="#a8784c" stroke-width="1.6"/>` + line('M12 24 L28 24 M12 32 L26 32', 1.6, '#8a5a3a'),
  weeds: () => line('M14 40 Q12 26 6 18 M20 40 Q20 24 16 10 M26 40 Q28 26 34 14 M32 40 Q34 30 42 24', 3, '#5fa64f') + line('M10 40 L38 40', 2.4),
  'blossom petals': () => [[16, 18, -30], [30, 16, 20], [22, 30, 60], [34, 30, -10]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="4.5" fill="#ffb7d0" ${st} transform="rotate(${r} ${x} ${y})"/>`).join(''),
  snowflake: () => line('M24 6 L24 42 M8 15 L40 33 M8 33 L40 15', 3, '#7fc8ff') + line('M20 9 L24 13 L28 9 M20 39 L24 35 L28 39 M8 20 L13 21 L11 16 M40 28 L35 27 L37 32', 2.2, '#7fc8ff'),
  mushroom: () => rect(19, 24, 10, 16, '#f3e6cf', 4) + path('M6 26 C6 10 42 10 42 26 Z', '#e0564a') + dot(16, 18, 2.6, '#fff') + dot(27, 15, 2.4, '#fff') + dot(34, 22, 2, '#fff'),
  fruit: () => line('M24 12 Q24 6 28 4', 2.4) + path('M25 9 Q34 4 36 10 Q30 13 25 9 Z', '#6fbf5f') + path('M24 12 C10 6 4 22 10 32 C14 40 20 42 24 40 C28 42 34 40 38 32 C44 22 38 6 24 12 Z', '#e8452c') + shine(15, 20, 3),
  veg: () => path('M20 14 L30 14 L26 44 Z', '#ff8a2a') + line('M22 22 L26 22 M23 30 L26 30', 1.6) + line('M25 14 Q20 4 16 6 M25 14 Q26 2 30 4 M25 14 Q32 6 35 10', 2.4, '#4fae52'),
  gift: () => rect(9, 18, 30, 22, '#ff7fa3', 3) + rect(7, 13, 34, 8, '#ff9dbb', 2) + `<rect x="21" y="13" width="6" height="27" fill="#ffd93b"/>` + line('M24 13 Q16 4 14 10 Q16 14 24 13 Q32 4 34 10 Q32 14 24 13', 2.2),
  sapling: () => path('M14 40 L34 40 L31 30 L17 30 Z', '#c8865a') + line('M24 30 L24 16', 2.6, '#4fae52') + path('M24 20 Q12 18 12 10 Q22 10 24 20 Z', '#7cc15a') + path('M24 17 Q34 14 36 6 Q26 6 24 17 Z', '#7cc15a'),
  'flower seeds': () => rect(11, 7, 26, 34, '#fff1d6', 3) + circ(24, 20, 6, '#ffd93b') + [0, 1, 2, 3, 4].map(i => { const a = i / 5 * 6.283; return circ(24 + Math.cos(a) * 8, 20 + Math.sin(a) * 8, 3.4, '#ff7fa3'); }).join('') + circ(24, 20, 3.2, '#c9531c') + line('M16 34 L32 34', 2),
  'hum seed': () => ell(22, 28, 10, 12, '#c58a4a') + path('M11 22 C11 12 33 12 33 22 Z', '#7a5236') + line('M36 12 L36 22 M36 12 L41 10 L41 20', 2) + dot(34, 22, 2.4) + dot(39, 20, 2.4),
  furnishing: () => rect(10, 22, 28, 9, '#7fd3c8', 3) + rect(10, 10, 28, 14, '#5fbfb2', 4) + line('M13 31 L13 41 M35 31 L35 41', 3),
  // food from the far islands
  dates: () => line('M24 6 L24 14', 2.4) + [[17, 22], [29, 21], [23, 30], [15, 34], [31, 33]].map(([x, y]) => ell(x, y, 5, 7, '#b8642a')).join('') + shine(15, 20, 1.6),
  'cactus fruit': () => path('M24 10 C36 10 38 26 36 34 C34 42 14 42 12 34 C10 26 12 10 24 10 Z', '#e0487a') + dot(18, 22, 1.4, '#ffd2e0') + dot(28, 18, 1.4, '#ffd2e0') + dot(30, 30, 1.4, '#ffd2e0') + dot(20, 33, 1.4, '#ffd2e0') + line('M20 10 L22 5 M28 10 L27 5', 2, '#6fbf5f'),
  'wild berries': () => berries('#4a5fd0', '#e0354a'), 'snow berries': () => berries('#e8445a', '#ff8a9a') + path('M10 18 Q24 10 38 18 Q24 22 10 18 Z', '#ffffff'),
  honeycomb: () => [[16, 18], [30, 18], [23, 30], [9, 30], [37, 30]].map(([x, y]) => path(`M${x - 7} ${y} L${x - 3.5} ${y - 6} L${x + 3.5} ${y - 6} L${x + 7} ${y} L${x + 3.5} ${y + 6} L${x - 3.5} ${y + 6} Z`, '#f5c84a')).join('') + path('M20 34 Q24 44 28 34 Z', '#f5a623'),
  'ice fish': () => fish('#bfe9f7', '#8fd0ea') + line('M30 12 L33 9 M36 14 L39 12', 2, '#fff'),
  // treasures
  obsidian: () => path('M10 36 L16 10 L28 6 L38 20 L32 40 Z', '#2a2236') + line('M16 10 L24 24 L32 40 M24 24 L38 20', 1.6, '#6a5f8a') + `<path d="M17 13 L21 20 L15 26 Z" fill="#8a7fb0" opacity=".8"/>`,
  'fire opal': () => gem('#ff8a5a', '#ffe0c8'), 'clear ice': () => path('M10 16 L24 8 L38 16 L38 32 L24 40 L10 32 Z', '#d9f6ff') + line('M10 16 L24 24 L38 16 M24 24 L24 40', 1.8) + shine(17, 16, 2.6),
  'sand glass': () => rect(12, 6, 24, 5, '#a8784c', 2) + rect(12, 37, 24, 5, '#a8784c', 2) + path('M15 11 L33 11 L25 24 L33 37 L15 37 L23 24 Z', '#e9f6ff') + `<path d="M18 35 L30 35 L24 29 Z M20 14 L28 14 L24 20 Z" fill="#f2cf8a"/>`,
  'glow moss': () => `<circle cx="24" cy="28" r="16" fill="#b8ff8a" opacity=".35"/>` + path('M8 36 C8 26 16 22 20 26 C22 18 32 18 32 26 C38 24 42 30 40 36 Z', '#6fd86a') + dot(16, 30, 1.6, '#eaffc8') + dot(26, 26, 1.6, '#eaffc8') + dot(34, 32, 1.6, '#eaffc8'),
  'silver bark': () => path('M10 12 C22 6 36 14 38 24 C40 34 30 42 18 38 C24 32 26 22 10 12 Z', '#c9d3e6') + line('M18 18 Q26 22 28 30 M14 14 Q20 16 22 20', 1.6, '#8a94a8') + shine(30, 20),
  'fairy dust': () => path('M16 16 L32 16 L34 40 L14 40 Z', '#e9f0ff', 'fill-opacity=".85"') + rect(15, 9, 18, 8, '#c58a4a', 2) + `<path d="M24 24 l1.6 -4 l1.6 4 l4 1.6 l-4 1.6 l-1.6 4 l-1.6 -4 l-4 -1.6 z M19 33 l1 -2.5 l1 2.5 l2.5 1 l-2.5 1 l-1 2.5 l-1 -2.5 l-2.5 -1 z" fill="#ffd93b"/>`,
  'giant acorn': () => ell(24, 29, 12, 13, '#c58a4a') + path('M10 24 C10 12 38 12 38 24 Z', '#7a5236') + line('M24 13 L26 6', 3, '#7a5236') + shine(18, 30),
  'old coins': () => ell(22, 34, 13, 5, '#f5c84a') + ell(22, 29, 13, 5, '#f5c84a') + ell(26, 22, 13, 5, '#ffd95a') + line('M26 20 L26 24', 1.8),
  pearl: () => `<circle cx="24" cy="25" r="16" fill="#e9e4ff" opacity=".5"/>` + round('#fbf8ff', 12), 'sunken tile': () => rect(8, 8, 32, 32, '#5fa8cf', 3) + path('M24 12 L36 24 L24 36 L12 24 Z', '#f5c84a') + circ(24, 24, 4, '#e8584a'),
  // things she builds (Creations > Built & planted)
  bench: () => rect(6, 20, 36, 6, '#a8784c', 2) + rect(6, 12, 36, 5, '#c49866', 2) + line('M10 26 L10 38 M38 26 L38 38', 3.4), lantern: () => line('M24 4 L24 10', 2.4) + rect(16, 10, 16, 6, '#3a3f6b', 2) + rect(17, 16, 14, 18, '#ffd95a', 2) + rect(15, 34, 18, 5, '#3a3f6b', 2) + `<circle cx="24" cy="25" r="11" fill="#ffe14a" opacity=".3"/>`,
  cairn: () => ell(24, 38, 15, 5, '#a9b2bc') + ell(24, 29, 11, 5, '#c9c2b4') + ell(24, 21, 8, 4.5, '#b4bfcb') + ell(24, 13, 5, 3.6, '#d9d0bf'), 'shell arch': () => path('M8 40 L8 24 C8 6 40 6 40 24 L40 40 L33 40 L33 24 C33 14 15 14 15 24 L15 40 Z', '#ffd2b8') + dot(12, 20, 2, '#ff9db0') + dot(24, 9, 2, '#ff9db0') + dot(36, 20, 2, '#ff9db0'),
  birdbath: () => ell(24, 16, 17, 5, '#c9c2b4') + ell(24, 15, 12, 3, '#7fc8ff') + rect(20, 18, 8, 18, '#c9c2b4', 2) + rect(14, 36, 20, 5, '#b4aca0', 2), scarecrow: () => line('M24 14 L24 44 M10 22 L38 22', 3.4, '#8a5a3a') + circ(24, 12, 6, '#f3dc9b') + path('M15 10 L33 10 L28 4 L20 4 Z', '#a8784c') + rect(17, 19, 14, 14, '#7fb0d8', 2),
  signpost: () => line('M24 8 L24 44', 3.6, '#8a5a3a') + path('M8 12 L34 12 L40 17 L34 22 L8 22 Z', '#c49866') + path('M40 26 L14 26 L8 31 L14 36 L40 36 Z', '#a8784c'), campfire: () => line('M10 40 L38 32 M10 32 L38 40', 4, '#8a5a3a') + path('M24 8 C32 16 34 24 30 32 L18 32 C14 24 18 18 24 8 Z', '#ff7a2a') + path('M24 18 C28 22 28 28 26 32 L22 32 C20 28 21 24 24 18 Z', '#ffd93b'),
  'wind chime': () => line('M10 8 L38 8 M14 8 L14 26 M22 8 L22 32 M30 8 L30 28 M36 8 L36 22', 2) + rect(11, 24, 6, 8, '#bfe8ff', 2) + rect(19, 30, 6, 10, '#ffd2b8', 2) + rect(27, 26, 6, 8, '#bfe8ff', 2) + rect(33, 20, 6, 8, '#ffd2b8', 2),
  'log stool': () => rect(10, 18, 28, 20, '#a8784c', 4) + ell(24, 18, 14, 5, '#e6c08a') + `<ellipse cx="24" cy="18" rx="7" ry="2.5" fill="none" stroke="#a8784c" stroke-width="1.6"/>`, 'stepping stones': () => ell(12, 36, 7, 4, '#b4bcc8') + ell(24, 26, 7, 4, '#c9c2b4') + ell(35, 15, 7, 4, '#b4bcc8'),
  'clay pot': () => path('M12 14 L36 14 L32 40 L16 40 Z', '#c8865a') + rect(10, 10, 28, 6, '#d9966a', 2) + line('M15 24 L33 24', 1.8, '#a8683e'), 'stick fence': () => line('M10 12 L10 42 M20 10 L20 42 M30 12 L30 42 M40 10 L40 42', 3.4, '#8a5a3a') + line('M6 22 L44 20 M6 32 L44 30', 2.6, '#a8784c'),
  'blossom wreath': () => `<circle cx="24" cy="24" r="14" fill="none" stroke="#6fbf5f" stroke-width="6"/>` + Array.from({ length: 8 }, (_, i) => { const a = i / 8 * 6.283; return circ(24 + Math.cos(a) * 14, 24 + Math.sin(a) * 14, 3.4, i % 2 ? '#ffb7d0' : '#fff'); }).join(''),
  'mushroom stool': () => rect(18, 24, 12, 16, '#f3e6cf', 4) + path('M6 26 C6 12 42 12 42 26 Z', '#e0564a') + dot(18, 19, 2.4, '#fff') + dot(30, 18, 2.4, '#fff'), 'snow globe': () => rect(12, 36, 24, 7, '#a8784c', 2) + circ(24, 22, 15, '#d9f6ff') + path('M17 32 L24 22 L31 32 Z', '#4fae63') + dot(18, 15, 1.4, '#fff') + dot(28, 13, 1.4, '#fff') + dot(31, 21, 1.4, '#fff') + shine(17, 14, 3),
  'pearl lamp': () => line('M24 18 L24 40', 3, '#8a90a8') + rect(16, 40, 16, 4, '#8a90a8', 2) + `<circle cx="24" cy="13" r="12" fill="#fbf8ff" opacity=".5"/>` + round('#fbf8ff', 8).replace('cy="25"', 'cy="13"'), 'gold trophy': () => path('M14 8 L34 8 L32 22 C30 28 18 28 16 22 Z', '#ffd24a') + line('M14 12 Q6 12 10 20 M34 12 Q42 12 38 20', 2.4) + rect(21, 27, 6, 8, '#ffd24a', 1) + rect(14, 35, 20, 6, '#c8902e', 2) + shine(20, 13),
  flowers: () => [[14, 24, '#ff7fa3'], [26, 18, '#ffd93b'], [34, 28, '#a98cff']].map(([x, y, c]) => line(`M${x} ${y} L${x} 42`, 2.2, '#4fae52') + [0, 1, 2, 3, 4].map(i => { const a = i / 5 * 6.283; return circ(x + Math.cos(a) * 4, y + Math.sin(a) * 4, 2.8, c); }).join('') + dot(x, y, 2.2, '#c9531c')).join(''),
  tree: () => rect(21, 26, 6, 16, '#8a5a3a', 2) + circ(24, 18, 13, '#7cc15a') + circ(16, 22, 7, '#5fae55') + shine(19, 12, 3), 'coin tree': () => rect(21, 26, 6, 16, '#8a5a3a', 2) + circ(24, 18, 13, '#7cc15a') + circ(17, 16, 3.4, '#ffd24a') + circ(29, 13, 3.4, '#ffd24a') + circ(28, 23, 3.4, '#ffd24a'),
  'singing stone': () => path('M10 38 C8 26 16 14 26 14 C36 14 42 26 38 38 Z', '#a9b2bc') + line('M34 6 L34 14 M34 6 L40 5 L40 12', 2) + dot(32, 14, 2.4) + dot(38, 12, 2.4),
  // golden tools
  'golden rod': () => line('M8 42 L38 8', 3.4, '#f5c84a') + line('M38 8 Q44 20 40 30', 1.4) + circ(40, 31, 2.4, '#e8452c'), 'golden net': () => line('M8 42 L26 22', 3.4, '#f5c84a') + circ(32, 16, 11, '#fff8e0') + line('M25 10 L39 22 M23 17 L37 9 M28 26 L41 14', 1.4),
  // little pictures used around the panels
  coin: () => circ(24, 24, 15, '#ffd24a') + `<circle cx="24" cy="24" r="10" fill="none" stroke="#c8902e" stroke-width="2.2"/>` + line('M24 18 L24 30', 2.6, '#c8902e') + shine(18, 17, 3),
  cosiness: () => rect(6, 22, 36, 14, '#ff9dbb', 5) + rect(10, 14, 28, 12, '#ffb7d0', 5) + line('M10 36 L10 41 M38 36 L38 41', 3), outside: () => path('M14 40 L34 40 L31 30 L17 30 Z', '#c8865a') + circ(18, 22, 6, '#7cc15a') + circ(28, 18, 7, '#5fae55') + circ(24, 26, 5, '#8fd06a'),
  photos: () => rect(6, 14, 36, 24, '#3a3f6b', 5) + rect(16, 9, 12, 6, '#3a3f6b', 2) + circ(24, 26, 8, '#bfe8ff') + dot(36, 19, 2, '#ffd93b'), rides: () => rect(12, 12, 24, 18, '#bfe8ff', 6) + dot(19, 20, 2.4) + dot(29, 20, 2.4) + line('M24 12 L24 6', 2.4) + circ(24, 5, 2.4, '#ff7a2a') + rect(10, 32, 28, 8, '#7f8fa6', 4),
  stamps: () => path('M10 8 h28 v32 h-28 z', '#fff1d6', 'stroke-dasharray="3 2.4"') + circ(24, 22, 7, '#ff7fa3') + line('M16 33 L32 33', 2),
  house: () => path('M8 22 L24 8 L40 22 Z', '#e4705a') + rect(12, 21, 24, 19, '#fff1d6', 2) + rect(21, 29, 7, 11, '#8a5a3a', 2) + rect(14, 24, 5, 5, '#bfe8ff', 1),
  ember: () => path('M4 40 L18 14 L30 14 L44 40 Z', '#c8664a') + path('M18 14 L21 18 L24 14 L27 18 L30 14', 'none') + line('M22 16 L19 30 M26 16 L29 28', 2.6, '#ff7a2a') + circ(28, 7, 4, '#cfcfd8'),
  wood_isle: () => rect(20, 26, 8, 16, '#8a5a3a', 2) + circ(24, 18, 15, '#5fb35a') + circ(14, 22, 7, '#4f9e52') + circ(34, 22, 7, '#4f9e52') + path('M21 42 L21 35 Q24 31 27 35 L27 42 Z', '#4f7fbf'),
  glass: () => path('M6 34 L42 34 L36 42 L12 42 Z', '#bfe9f7') + path('M14 34 L18 10 L22 34 Z', '#d9f6ff') + path('M24 34 L29 16 L33 34 Z', '#8fd0ea') + path('M32 34 L35 22 L38 34 Z', '#d9f6ff'),
  islet: () => ell(24, 36, 18, 6, '#58b7e8') + path('M10 34 C12 26 36 26 38 34 Z', '#f2cf8a') + line('M24 30 Q22 18 26 10', 3, '#8a5a3a') + path('M26 10 Q16 6 12 12 M26 10 Q34 4 38 10 M26 10 Q24 2 18 4', 'none', 'stroke="#4fae52"'),
  otter: () => circ(24, 26, 15, '#a8784c') + ell(24, 31, 9, 7, '#e6c08a') + circ(11, 15, 4, '#a8784c') + circ(37, 15, 4, '#a8784c') + dot(18, 24, 2.2) + dot(30, 24, 2.2) + ell(24, 29, 3.4, 2.4, L) + line('M14 32 L6 30 M14 35 L7 37 M34 32 L42 30 M34 35 L41 37', 1.4),
  hare: () => ell(18, 10, 4, 10, '#e9e4dc') + ell(30, 10, 4, 10, '#e9e4dc') + circ(24, 28, 13, '#e9e4dc') + dot(19, 26, 2.2) + dot(29, 26, 2.2) + path('M22 31 L26 31 L24 33 Z', '#ff9db0'),
  owl: () => ell(24, 26, 15, 16, '#8a6a4a') + path('M10 14 L16 18 M38 14 L32 18', 'none') + circ(18, 22, 6, '#fff6d8') + circ(30, 22, 6, '#fff6d8') + dot(18, 22, 2.6) + dot(30, 22, 2.6) + path('M22 28 L26 28 L24 32 Z', '#f5a623') + path('M9 12 L17 17 L12 20 Z M39 12 L31 17 L36 20 Z', '#8a6a4a'),
  walrus: () => circ(24, 24, 16, '#b88a6a') + ell(19, 31, 6, 5, '#d9b08a') + ell(29, 31, 6, 5, '#d9b08a') + path('M19 35 L18 44 L21 36 Z M29 35 L30 44 L27 36 Z', '#fbf6e8') + dot(18, 20, 2.2) + dot(30, 20, 2.2),
  museum: () => path('M6 18 L24 6 L42 18 Z', '#e9e4dc') + rect(8, 18, 32, 4, '#d9d0bf', 1) + line('M13 23 L13 36 M21 23 L21 36 M27 23 L27 36 M35 23 L35 36', 3.4, '#c9c2b4') + rect(6, 36, 36, 5, '#d9d0bf', 1),
  shop: () => path('M10 16 L38 16 L36 42 L12 42 Z', '#ff9a5a') + line('M17 20 Q17 6 24 6 Q31 6 31 20', 2.4), turnip: () => path('M24 14 C38 14 40 30 30 38 Q24 44 18 38 C8 30 10 14 24 14 Z', '#f4f0f8') + path('M12 26 C14 18 34 18 36 26 C30 22 18 22 12 26 Z', '#b07ad8') + line('M24 14 Q18 4 14 6 M24 14 Q24 2 28 4 M24 14 Q32 6 34 10', 2.4, '#4fae52'),
  star: () => path('M24 5 L29 18 L43 18 L32 27 L36 41 L24 33 L12 41 L16 27 L5 18 L19 18 Z', '#ffd93b'), record: () => circ(24, 24, 17, '#3a3f6b') + `<circle cx="24" cy="24" r="11" fill="none" stroke="#6a6f94" stroke-width="1.4"/>` + circ(24, 24, 5, '#ff7fa3') + dot(24, 24, 1.4),
  pencil: () => path('M10 38 L12 30 L32 10 L38 16 L18 36 Z', '#ffd24a') + path('M10 38 L12 30 L18 36 Z', '#f3dc9b') + path('M32 10 L38 16 L40 14 C41 12 36 7 34 8 Z', '#ff9dbb'), tent: () => path('M6 40 L24 8 L42 40 Z', '#2f9a7f') + path('M24 8 L24 40 L18 40 Z', '#1f7a62') + line('M24 8 L28 3', 2.2),
  dish: () => plate(ell(24, 26, 9, 4, '#ff9a5a') + dot(20, 25, 1.6, '#e8584a') + dot(27, 25, 1.6, '#7cc15a')), cake: () => plate(path('M14 26 L34 26 L34 18 L14 18 Z', '#f3dc9b') + path('M14 18 L34 18 Q30 12 24 12 Q18 12 14 18 Z', '#ff9dbb') + circ(24, 10, 2.6, '#e8452c')),
  soup: () => path('M8 22 L40 22 C40 34 32 40 24 40 C16 40 8 34 8 22 Z', '#7fd3c8') + ell(24, 22, 16, 4, '#ff9a5a') + line('M18 14 Q20 10 18 6 M26 14 Q28 10 26 6', 2, '#b4bcc8'),
  bluebells: () => line('M16 42 Q18 26 14 12 M26 42 Q26 26 28 14 M34 42 Q32 30 36 20', 2.2, '#4fae52') + [[14, 12], [16, 20], [28, 14], [27, 23], [36, 20], [34, 28]].map(([x, y]) => path(`M${x - 4} ${y} Q${x} ${y - 7} ${x + 4} ${y} L${x + 3} ${y + 3} L${x} ${y + 1} L${x - 3} ${y + 3} Z`, '#6a7ce8')).join(''),
  'goat wool': () => circ(18, 26, 9, '#f6eedd') + circ(29, 22, 10, '#fbf5e8') + circ(30, 32, 8, '#ece0c6') + line('M10 36 Q24 40 38 34', 1.4, '#c9b89a'),
  'goat cheese': () => path('M8 32 L24 14 L40 32 L40 38 L8 38 Z', '#fff1c8') + path('M8 32 L40 32', 'none') + circ(18, 33, 2.4, '#f3dc9b') + circ(30, 30, 1.8, '#f3dc9b') + circ(25, 24, 1.6, '#f3dc9b'),
  goat: () => ell(26, 28, 13, 9, '#f4ecdc') + circ(12, 20, 7, '#f4ecdc') + line('M10 14 Q6 6 12 4 M15 14 Q14 6 20 5', 2.4, '#5a4a3e') + dot(10, 19, 1.6) + line('M18 36 L18 44 M24 37 L24 44 M30 37 L30 44 M36 35 L36 43', 2.6),
  bloom_isle: () => ell(24, 32, 20, 9, '#5a6ae6') + circ(14, 28, 7, '#7f8cf2') + circ(32, 27, 8, '#4352c8') + line('M6 33 Q20 26 30 32 T44 30', 3, '#e9c25a') + dot(12, 26, 1.2, '#fff') + dot(30, 24, 1.2, '#fff') + dot(20, 31, 1.2, '#fff'),
  unknown: () => path('M8 32 C6 20 18 12 28 14 C38 16 44 26 40 34 C36 40 12 40 8 32 Z', '#e6dcc4') + `<text x="24" y="33" text-anchor="middle" font-family="Nunito,sans-serif" font-weight="900" font-size="18" fill="${L}">?</text>`,
};
// hats and glasses come in many names; draw them from their colour words
const HAT_COL = { straw: '#f3dc9b', red: '#e8584a', blue: '#5a8fd8', green: '#5fae55', purple: '#8a5ab8', pink: '#ff9dbb', yellow: '#ffd93b', black: '#3a3f6b', white: '#f4f0e4', orange: '#ff9a5a', flower: '#ffb7d0', wool: '#e9b0c4', top: '#3a3f6b', party: '#ff7fa3', crown: '#ffd24a', sun: '#f3dc9b', bucket: '#7fb0d8', beanie: '#e8584a', beret: '#8a5ab8', cap: '#5a8fd8' };
function wearable(name) {
  const n = name.toLowerCase(), col = Object.entries(HAT_COL).find(([k]) => n.includes(k))?.[1] || '#ff9a5a';
  if (/glass|shade|specs|goggle/.test(n)) return path('M4 18 L44 18', 'none') + rect(6, 17, 15, 12, col, 6) + rect(27, 17, 15, 12, col, 6) + line('M21 21 Q24 18 27 21 M6 19 L3 16 M42 19 L45 16', 2.2) + shine(11, 21, 2) + shine(32, 21, 2);
  if (/flower crown/.test(n)) return `<circle cx="24" cy="26" r="13" fill="none" stroke="#6fbf5f" stroke-width="5"/>` + [0, 1, 2, 3, 4, 5, 6].map(i => { const a = Math.PI + i / 6 * Math.PI; return circ(24 + Math.cos(a) * 13, 26 + Math.sin(a) * 9, 3.6, ['#ff7fa3', '#ffd93b', '#fff', '#a98cff'][i % 4]); }).join('');
  if (/\bbow\b/.test(n)) return path('M24 24 L8 14 L8 34 Z', col) + path('M24 24 L40 14 L40 34 Z', col) + circ(24, 24, 5, col);
  if (/party/.test(n)) return path('M14 40 L24 6 L34 40 Z', col) + line('M17 30 L31 30 M20 20 L28 20', 2.2, '#ffd93b') + circ(24, 6, 3.4, '#ffd93b');
  if (/crown/.test(n)) return path('M8 36 L8 16 L16 24 L24 12 L32 24 L40 16 L40 36 Z', '#ffd24a') + dot(24, 28, 2.6, '#e8584a');
  if (/beanie|wool|knit/.test(n)) return path('M10 34 C10 14 38 14 38 34 Z', col) + rect(8, 30, 32, 8, '#fff1d6', 3) + circ(24, 12, 4, '#fff1d6');
  return hat(col, /flower/.test(n) ? '#ff7fa3' : '#3a3f6b');
}

export const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
let own = new Set();
fetch('/icons/manifest.json').then(r => (r.ok ? r.json() : [])).then(list => { own = new Set((list || []).map(f => f.replace(/\.(png|svg|webp|jpg)$/i, ''))); ownFiles = Object.fromEntries((list || []).map(f => [f.replace(/\.(png|svg|webp|jpg)$/i, ''), f])); }).catch(() => {});
let ownFiles = {};
// an icon as markup: your own picture if you have added one, otherwise the drawn one
export function icon(name, kind = '') {
  const k = slug(name);
  if (own.has(k)) return `<img class="ico" src="/icons/${ownFiles[k]}" alt="" loading="lazy">`;
  const f = I[name] || I[k] || (kind === 'wear' ? () => wearable(name) : null) || (/fish/.test(name) ? () => fish('#9fb4c8', '#7f97ad') : null) || I.unknown;
  return `<svg class="ico" viewBox="0 0 48 48" aria-hidden="true">${f()}</svg>`;
}
export const hasIcon = name => !!(I[name] || own.has(slug(name)));
