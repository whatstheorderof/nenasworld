// Seasonal trees, shared by every island. Four growth stages (sapling, young, mature, old)
// built in art/island.blend; each model carries Live parts the seasons switch:
//   LiveLeaves  — the canopy (hidden in winter)
//   LiveBlossom — little flowers (spring)
//   LiveSnow    — snow on the branches and the ground (winter)
//   LiveFallen  — leaves on the ground (autumn)
// Two kinds share the shapes: 'oak' (green, orange in autumn) and 'cherry' (pink in spring).
import * as THREE from 'three';
import { whenKit, kitBuilding, kitModel } from './kit.js';

export const STAGES = ['TreeSapling', 'TreeYoung', 'TreeMature', 'TreeOld'];
const lam = c => new THREE.MeshLambertMaterial({ color: c, flatShading: true });

// leaf (lower puffs), leaf2 (upper puffs), blossom dots
const LOOK = {
  oak: {
    spring: [0x9fd872, 0xc4ea92, 0xf7a9c4],
    summer: [0x86cf66, 0xa9de7c, 0xf7a9c4],
    autumn: [0xf0873a, 0xf7b447, 0xe8644f],
    winter: [0x86cf66, 0xa9de7c, 0xf7a9c4],
  },
  cherry: {
    spring: [0xf3a2c0, 0xf9c7d9, 0xfff1f6],
    summer: [0x7fc65e, 0xa2d977, 0xf7a9c4],
    autumn: [0xe5604e, 0xf08f5c, 0xf3a2c0],
    winter: [0x7fc65e, 0xa2d977, 0xf7a9c4],
  },
};
const FALLEN = { oak: 0xe9893a, cherry: 0xe06a52 };
const BUSH = { spring: 0x8fd06c, summer: 0x6db85a, autumn: 0xd9a14c, winter: 0xbcd3c6 };

const mats = {};
for (const k of Object.keys(LOOK)) mats[k] = { tree_leaf: lam(0), tree_leaf2: lam(0), tree_blossom: lam(0), tree_fallen: lam(FALLEN[k]) };
export const bushMat = lam(BUSH.summer);

const all = new Set();      // every tree, so one call changes every island
let season = 'summer';

function apply(t) {
  const p = t.parts, s = season;
  if (p.LiveLeaves) p.LiveLeaves.visible = s !== 'winter';
  if (p.LiveBlossom) p.LiveBlossom.visible = s === 'spring';
  if (p.LiveSnow) p.LiveSnow.visible = s === 'winter';
  if (p.LiveFallen) p.LiveFallen.visible = s === 'autumn';
}

export function setTreeSeason(name) {
  season = LOOK.oak[name] ? name : 'summer';
  for (const [k, m] of Object.entries(mats)) { const c = LOOK[k][season]; m.tree_leaf.color.set(c[0]); m.tree_leaf2.color.set(c[1]); m.tree_blossom.color.set(c[2]); }
  bushMat.color.set(BUSH[season]);
  all.forEach(apply);
}
setTreeSeason('summer');

// stage: 0..3 (or a model name); kind: 'oak' | 'cherry'. Returns a Group straight away;
// the model drops into it when the kit has loaded.
export function makeTree(stage = 2, kind = 'oak') {
  const g = new THREE.Group(), name = typeof stage === 'number' ? STAGES[Math.max(0, Math.min(3, stage))] : stage;
  g.userData.tree = true; g.userData.sway = Math.random() * 6.28;
  whenKit(() => {
    const b = kitBuilding(name, mats[kind] || mats.oak); if (!b) return;
    while (g.children.length) g.remove(g.children[0]);
    g.add(b.group); const t = { parts: b.parts, g }; g.userData.t = t; all.add(t); apply(t);
  });
  return g;
}
export function dropTree(g) { if (g?.userData.t) all.delete(g.userData.t); }

// a bush whose colour follows the seasons
export function makeBush() {
  const g = new THREE.Group();
  whenKit(() => { const k = kitModel('Bush', { isl_bush: bushMat }); if (k) g.add(k); });
  return g;
}

// how big a tree someone planted has grown: days since planting → stage
export function stageForAge(days) { return days < 3 ? 0 : days < 10 ? 1 : days < 30 ? 2 : 3; }

// a gentle sway in the wind
export function tickTrees(t, wind = 0.3) {
  const a = 0.006 + wind * 0.02;
  all.forEach(({ g }) => { const ph = g.userData.sway; g.rotation.z = Math.sin(t * 1.1 + ph) * a; g.rotation.x = Math.cos(t * 0.8 + ph) * a * 0.6; });
}
