# Your own item pictures

Every item in Belongings and Creations has a drawn icon (web/src/icons.js). To use your own picture instead:

1. Save it here as a square PNG, SVG or WebP, named after the item in lower case with dashes:
   `fire-opal.png`, `wild-berries.png`, `golden-trout.svg`, `minnow.png`, `bench.png`, `sun-hat.png` …
2. Add the file name to `manifest.json` in this folder, e.g. `["fire-opal.png", "minnow.png"]`.

Anything listed in the manifest replaces the drawn icon everywhere; everything else keeps its drawn one.
About 96×96 px with a transparent background looks best.
