// Split the exported island model into what the home island needs (island.glb, loaded first) and the far
// islands (far.glb, streamed in after the home island is showing).
// Run from a folder with @gltf-transform/core, @gltf-transform/extensions, @gltf-transform/functions and meshoptimizer:
//   node split-glb.mjs island-full.glb island.glb far.glb
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune, dedup } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
const [src, outMain, outFar] = process.argv.slice(2);
const FAR = /^Island(Pompom|Plaza|Ruin|Wood|Ring|Ember|Glass|Bloom|Rock|Cottage|Pavilion)$/;
await MeshoptDecoder.ready; await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
for (const [out, keepFar] of [[outMain, false], [outFar, true]]) {
  const doc = await io.read(src), scene = doc.getRoot().listScenes()[0];
  for (const n of [...scene.listChildren()]) if (FAR.test(n.getName()) !== keepFar) n.traverse(c => c.dispose());
  await doc.transform(prune(), dedup());
  await io.write(out, doc);
  console.log(out, scene.listChildren().length, 'roots');
}
