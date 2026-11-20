# Nena's World: art style and Blender briefs

The look is taken from Zane's cookie shop reference: a **charming, low-poly, pastel storybook town**.
Every building and prop in Nena's World is redesigned to this guide. Each one has its own brief
below, written like the original cookie shop prompt, and that brief is what gets built.

## The look

- **Low-poly, softly faceted.** Shapes are simple and chunky, edges are slightly bevelled, faces
  are flat-shaded. There's no high detail and no subdivision blobs. Things should look like
  painted wooden toys.
- **Pastel first, with a few deep accents.** Walls and big shapes are pastel. Frames, sign boards
  and outlines use one deep colour (chocolate brown or deep navy) so the pastels read clearly.
- **Storefront grammar.** Almost every building is built from the same parts:
  - a low **plinth** in a contrasting pastel
  - pastel **walls** with lighter **corner pilasters**
  - a **cornice** along the top with a **scalloped trim**
  - **big display windows** with thin white frames and something charming behind the glass
  - a **door** with a small round porthole window and a step
  - a **sign board** in a dark frame, ringed with little warm bulbs
  - a **striped or scalloped awning**
  - **two planters** with round topiary either side of the door
  - one **giant "hero" object** on the roof that says what the place is (a cookie, a film reel,
    a fish, a telescope...)
- **Warm and inviting.** Windows glow warm cream at night, bulbs twinkle, light spills out onto
  the pavement in front. By day the light is soft and sunny.
- **A pavement apron.** Buildings sit on a pale grey paving-slab pad that joins the pebble paths.
- **Cosy clutter.** Small details reward a close look: cookies on window shelves, a bell over the
  door, a watering can, a cat-sized bench.

## Palette

| Use | Colour | Hex |
|---|---|---|
| Pink walls / awning stripe | blush pink | `#d9a3b4` |
| Mint trim / doors / cornice | sage mint | `#9cc9b8` |
| Lavender plinths | lavender | `#b7aede` |
| Cream / warm white | cream | `#f4eee2` |
| Butter yellow | butter | `#f3dc9b` |
| Sky blue walls | powder blue | `#a9cbe6` |
| Peach walls / planters | peach | `#ecc3a4` |
| Sign text / accents | raspberry | `#c45a7a` |
| Frames, sign boards, chocolate | chocolate | `#4a2f28` |
| Cookie / wood | biscuit brown | `#a8794a` |
| Window glow (night) | warm cream | `#fff1cf` |
| Paving | soft grey | `#cfd2d6` |
| Grass | soft green | `#a8d58e` |
| Darker grass / bushes | sage | `#86bf7c` |
| Pines | teal green | `#5fa596` |
| Rocks | blue grey | `#a9b8c9` |
| Water | pastel blue | `#8fc4e8` |

Nena keeps her own colours (navy coat, orange beak, teal scarf). She's meant to stand out from her world.

## Technical rules (so models drop straight into the site)

- Blender scene is Z-up. **The front faces -Y.** One unit = one metre; Nena is about 1.5 tall,
  a doorway is about 1.7, a one-storey shop is about 3.5 to 4.5.
- Each asset has one **root empty** at its centre on the ground, named after the asset
  (`CookieShop`, `Cinema`...). Footprints must fit the place's circle in `shared/world.js`.
- **Material names are the contract with the code:**
  - `glow_*`: lights up at night (window glass, bulbs, lanterns)
  - `sign_*`: part of the sign board
  - `house_wall` / `house_roof`: recolourable by the owner
  - `isl_*`: shared kit colours
- **Empties the code looks for:** `SignAnchor` (where the canvas text goes, so the sign stays
  crisp and can be renamed), `Hero` (the rooftop object, which can spin or bob), `Door`.
- Keep it light: up to about 3k triangles for a building and 500 for a prop.
  Flat shading, no textures unless needed.
- Export: `web/public/models/<file>.glb`, Y-up, apply modifiers. Sources live in `art/*.blend`.

## Briefs

Each brief is the prompt the model is built from.

### Cookie Shop *(new)*
Create a colorful, stylized 3D cookie shop in Blender. Give it a pastel-pink exterior with
cream pilasters and a lavender plinth, large display windows with trays of cookies on the sills,
a pink-and-white striped scalloped awning, a mint door with a round porthole window, a dark
framed sign that says "Cookie Shop" ringed with warm bulbs, and a giant chocolate chip cookie
above the entrance. Add a mint cornice with a scalloped trim, two planters with round topiary,
and a paved pavement apron. Warm, inviting light in the windows. Charming low-poly style.

### Nena's House
Create a cosy, stylized 3D cottage for a little penguin in Blender. Give it cream walls with
sage-mint pilasters and a lavender plinth, a blush-pink gable roof with a scalloped bargeboard,
a round attic window, a mint front door with a porthole window and a step, two square paned
windows with flower boxes, a chimney, and a small sign above the door that reads "NENA". Add a
doormat, a mailbox and a pavement apron. A side room and an upstairs can be added later and must
match. Warm light in the windows. Charming low-poly style.

### Cinema
Create a colorful, stylized 3D small-town cinema in Blender. Give it a lavender exterior with
cream pilasters, a deep-navy marquee sign that says "CINEMA" ringed with chasing bulbs, two
poster cases either side of double mint doors, a little ticket booth window, a scalloped
butter-yellow canopy over the entrance, and a giant film reel on the roof. Add a red carpet
strip and a pavement apron. Warm, inviting light. Charming low-poly style.

### Museum
Create a stylized 3D little museum in Blender. Give it powder-blue walls, cream columns at the
front, a cream triangular pediment with a scalloped edge, wide steps, tall arched windows showing
a fossil and a framed painting, a dark sign that says "MUSEUM", and a giant golden fossil shell
on the roof. Pavement apron and two topiary planters. Charming low-poly style.

### General Shop and Workbench
Create a colorful, stylized 3D corner shop in Blender. Give it a butter-yellow exterior with mint
trim, big display windows full of jars, tools and seed packets, a mint-and-white striped awning,
a dark sign that says "SHOP" with warm bulbs, crates of fruit by the door, and a giant shopping
bag on the roof. Beside it, a chunky wooden workbench with a vice and tools. Charming low-poly style.

### Clothes Shop
Create a colorful, stylized 3D boutique in Blender. Give it a blush-pink exterior with lavender
trim, big windows with little mannequins in scarves and hats, a lavender-and-white striped awning,
a dark sign that says "CLOTHES" with warm bulbs, a hat stand by the door, and a giant hat with a
bow on the roof. Charming low-poly style.

### Library
Create a stylized 3D cosy library in Blender. Give it a sage-mint exterior with cream trim, tall
windows with bookshelves visible inside, a round reading-nook bay window, a dark sign that says
"LIBRARY", a book-return box, a bench, and a giant open book on the roof. Charming low-poly style.

### Studio
Create a stylized 3D artist's studio in Blender. Give it a peach exterior with mint trim, a big
slanted skylight, an easel and paint pots outside, a dark sign that says "STUDIO", and a giant
paintbrush and palette on the roof. Charming low-poly style.

### Fish Stall
Create a stylized 3D seaside fish stall in Blender. A powder-blue wooden counter with a blue-and-
white striped scalloped canopy, crates of ice with little fish, a chalkboard price sign, hanging
lanterns, and a giant smiling fish on top. Charming low-poly style.

### Cocoa Cart
Create a stylized 3D cocoa cart in Blender. A small butter-yellow cart with big wheels, a pink-
and-white striped umbrella, steaming mugs on the counter, a chalkboard menu, and a giant mug of
cocoa with a marshmallow on top. Charming low-poly style.

### Observatory
Create a stylized 3D tiny observatory in Blender. A round lavender tower with cream bands, a
silver-blue dome with an opening slit and a telescope poking out, little star-shaped windows that
glow, and a dark sign that says "OBSERVATORY". Charming low-poly style.

### Lighthouse
Create a stylized 3D lighthouse in Blender. A tapering tower in blush-pink and cream stripes, a
mint balcony with railings, a glowing lantern room, a lavender cap with a weathervane, and a
little cottage door at the base. Charming low-poly style.

### Clocktower
Create a stylized 3D town clocktower in Blender. A slim cream tower with mint corners, a big
round clock face on each side, a blush-pink pointed roof with a scalloped trim, and a little bell.
Charming low-poly style.

### Lookout
Create a stylized 3D wooden lookout tower in Blender. Biscuit-brown legs, a mint platform with
railings, a pink-and-white striped flag, a ladder and a telescope. Charming low-poly style.

### Igloo
Create a stylized 3D igloo in Blender: chunky ice blocks in white and pale blue, a rounded
entrance tunnel, a little warm glow inside, and a snowman beside it with a mint scarf. Charming
low-poly style.

### Campsite and neighbours' tents
Create stylized 3D tents in Blender: triangular tents in pastel pink, mint and lavender with
scalloped door flaps, a log seat, a stone ring campfire with glowing embers, and bunting between
two poles. Charming low-poly style.

### Street lamps, fairy lights and small props
Stylized low-poly street props in a pastel palette: a mint lamp post with a warm globe, a
double-globe lavender lamp, a hanging lantern, a knee-high bollard light, a beach torch, a
noticeboard with a little roof, a mailbox, benches, planters and bins. Warm glowing bulbs.

### Nature kit
Stylized low-poly nature in a pastel palette: tiered teal pines with a snowy tip, round orchard
trees with fruit, sage bushes, blue-grey faceted rocks, pastel flowers, a pebble path and a
rounded plank fence. Simple chunky shapes and flat shading.

### Characters (after the island)
Bo the seal, Pip the puffin, Suvi the fox, the campers and the visiting gulls: chunky rounded
little animals with simple faces like Nena's, in soft colours that sit happily in the pastel town.

## Seasonal trees (TreeSapling, TreeYoung, TreeMature, TreeOld)
Prompt: "A set of cute low-poly deciduous trees in four growth stages: a thin sapling, a young tree, a full mature tree with roots, and a big old tree with a gnarled bulging trunk, spreading roots and a dark hollow. Chunky faceted canopy puffs, warm brown bark, a few pebbles at the base. Each has seasonal parts: pink blossom dots for spring, snow caps on branches and a snow patch for winter, scattered orange leaves for autumn."
Parts: body = bark; `LiveLeaves` (tree_leaf / tree_leaf2), `LiveBlossom` (tree_blossom), `LiveSnow` (tree_snow), `LiveFallen` (tree_fallen). Colours are set in web/src/trees.js per kind ('oak', 'cherry') and season — used on every island, and by trees Nena plants (they grow sapling → young → mature → old over 3 / 10 / 30 days).

## Neighbouring town islands (IslandCottage, IslandRock, IslandPlaza, IslandRing)
Seen in the distance; the campers come from them (TOWN_ISLANDS in shared/world.js). Shared parts: cream cottages with red or slate gable roofs, a chimney and lit windows (`glow_farwin`), a pointed picket fence, cobbled stepping-stone paths, cone trees with white dots and round fruit trees, and a rounded layered earth base.
- Little Gable (IslandCottage): "Two cosy cottages and a round tower with a red flag inside a pointed picket fence, a winding stone path, polka-dot cone trees."
- Snowcap (IslandRock): "A big tapering stone house with an arched door under a soft cap of snow, a round tower with a scalloped orange dome, a red-roofed cottage with a turret."
- Fountain Round (IslandPlaza): "A round sandy plaza with a pool in the middle and benches round it, seven cottages facing in, a fence, and a ring of round topiary outside it."
- Hoopstead (IslandRing): "A town on a ring of land round a hole in the sky: a stone inner wall, houses facing in and out, a tall slate spire, a fence round the rim."

## The rim (RimFence, RimLantern) — used round every island edge (web/src/rim.js)
Prompt: "A cosy storybook island edge: a low wall of chunky grey stone coping blocks with a pale flagstone promenade inside it; on top, a warm brown wooden fence with square posts wrapped in brass bands with rivets, a top and bottom rail, two arches between the posts and a ring in the middle holding a gold four-pointed star; a little brass lantern on every few posts, glowing at night; green vines with small white flowers trailing over the wall and down the brown earth below."

## Sunflower
Prompt: "A tall cartoon sunflower: a slightly curving green stem with paired leaves, a heavy head tilted forward, a dark brown seed centre dotted with darker seeds, and two rings of golden-yellow and orange petals." In town it grows in patches, faces east, is small in spring, bronze in autumn and gone in winter.

## Far islands: kits and assembled islands (art/island.blend, far_helpers text block)
Every prop is its own root so it can be reused when Nena visits; each island is assembled from linked copies (place()), radius 10 in model units, scaled to size/10 in game (web/src/far.js).
- The smoking island (IslandEmber): Ember_Volcano (terraced red-rock cone, lava streaks, glowing crater), Ember_Cactus (saguaro with a pink flower), Ember_Basalt (hexagonal columns), Ember_Obsidian (shiny black-purple shards), Ember_FireOpal (glowing orange-pink crystals on a rock), Ember_LavaPool, Ember_Dune, Ember_Hut (adobe dome hut with a red awning and pots). "A sandy desert island with a terraced red volcano, lava running down its sides, cacti, basalt pillars and a little adobe hut."
- The forest island (IslandWood): Wood_GiantTree (ancient tree with a round blue door, lit windows and a lantern), Wood_Tree, Wood_Toadstool (red with white spots), Wood_GlowShrooms (glowing cyan), Wood_MossLog, Wood_FairyRing, Wood_Acorn (giant), Wood_Stump. "An ancient fairy forest round one huge door-tree, giant toadstools, glowing mushrooms and mossy logs, vines hanging off the edge."
- The ice island (IslandGlass): Glass_Spire (ice crystal cluster), Glass_IceChunks, Glass_IceHole (broken ice round dark water lit from below), Glass_Column (broken fluted marble with seaweed), Glass_Arch (ruined marble arch), Glass_Chest (sunken treasure, coins glinting), Glass_Clam (with a pearl), Glass_Seaweed. "A snowy ice crust over water with crystal spires, a hole lit from beneath, and the tops of drowned marble ruins breaking through; icicles and a bulb of deep water hang underneath."

## The big islands (biomes) — places she flies to
IslandEmber / IslandWood / IslandGlass were rebuilt big: radius 36 in model units, shown at 1.6× (about 58 m across the radius), each with a Sky_Pad landing pad on its front edge facing her island. Named spots (shared/world.js SKY_ISLANDS[].spots, also in the far_spots text block) are kept clear of props, with clear walking lines between them.
- Food props: Ember_DatePalm (dates), Ember_PricklyPear (cactus fruit), Ember_Oasis; Wood_BerryBush (wild berries), Wood_HiveTree (honeycomb), toadstool glade (mushrooms); Glass_FishHut (ice fishing), Glass_SnowBerry (snow berries).
- Landmarks: Ember_RockArch, the volcano at 2.2×, the giant door-tree at 1.8×, the big ice hole at 2.4× with drowned columns and an arch.
- SkyBalloon: "A striped hot-air balloon in pink, butter yellow and sky blue with a wicker basket, ropes and a little burner flame." It waits on a pad by the lookout and carries her out and back.

## Bluebell Isle (IslandBloom) and the goats (Goat)
Prompt: "A small floating island covered in rolling, soft hills of tiny blue-violet flowers, a marbled river of gold, teal and pearl winding through and pouring off one edge, a few pale rocks, and cream goats with curved horns grazing and wandering over the hills." The flower speckle and the marbled river are shaders in web/src/far.js; the goats walk between random points, climb the hills (BLOOM_ISLE.hills in shared/world.js) and stop to graze.

**Bluebell terraces** (`IB_Ter*`, back right of the island, centre model (5, 8)): six dry-stone steps 0.5 high, each 0.95 narrower than the one below, with wobbly edges so they read as a hillside, not a cake. Each step: a grey stone wall face (`bloom_wall`, stone courses drawn by the game's shader), a pale coping line (`bloom_cope`), a thin grass lip and a band of bluebells. Dark pines with snow on their tiers stand on the top two steps. A still, dark teal pool (`bloom_pool`) sits at the foot inside a low stone edge. Reference: terraced lavender/bluebell walls over a pool, snowy woods above.

## The Old Hotel (IslandRuin)

A ruined hotel on a small island (radius 12 in model units, shown at 2.4×) with its front towards her island. It is a cream concrete slab (`ruin_wall`), eight bays wide and six floors high, with a grid of rounded-square windows: a pale frame, a dark green-teal room, a curtain drawn to one side and sometimes a little chair. Each window has a faded olive awning (`ruin_awning`, `ruin_awning_dark`); most are tilted, a few droop or hang off one side, and some are gone. Pale drips and darker stains run down from every sill. The far end has fallen in, a floor at a time, leaving slab ends, rebar and a rubble pile. A crack runs down the middle bays, ivy climbs the left side, and there is a still pond out front. One window, `glow_ruinlamp`, is always lit. Reference: a seaside hotel facade with rows of rounded windows and olive awnings.

## The four towns, detailed (town_props text block in island.blend)

New town props are built with the `town_props` helpers and merged into one mesh per material per island (`IC_X_*`, `IR_X_*`, `IP_X_*`, `IG_X_*`), so the extra detail costs only a few draw calls. Lamps and lanterns use `glow_farwin`, so they light up with the windows at night. In the game, each town gets a lighter set of hanging roots (roots.js `count`/`segs`), fitted to the model.
- **Little Gable:** a farming hamlet on a wider island. Windmill (`GableSails` turns in the game), haystacks, vegetable beds, a well, a washing line, beehives, an orchard of apple trees, a duck pond, crates and barrels, lamps along the path, flowers along the fence.
- **Snowcap:** alpine. Drifts of snow thicker at the back, snowy pines, a frozen pond (`tn_ice`) with skate marks and a red sled, two snowmen, woodpiles, snow-capped rocks, lamps.
- **Fountain Round:** market day. Six striped stalls round the square (the way in from the front kept open), a ring of bunting from house to house, café tables under umbrellas, planters by every door, flower beds between the houses, lamps.
- **Hoopstead:** a stream from the spire's foot pours over the wall into the hole (`tn_water`, `IG_Fall` with `tn_fall`). Three strings of lanterns cross the hole, ivy trails down its inside, banners hang on the spire, and there are benches looking in, lamps round the walk and planters by the doors.

## The three big islands, detailed (big_props text block)

`big_props` places new pieces with a clearance check against every existing prop and Nena's activity spots (`far_spots`), so nothing lands on them. Each island's new pieces are merged per material (`IE_X_*`, `IW_X_*`, `IG2_X_*`).
- **Volcano (Ember):** a caravan camp of two tents with a rug and a campfire (glows at night), a camel resting near the oasis, steam vents round the volcano, an old sandstone temple of columns (some fallen) on steps behind the volcano, and the half-buried bones of something enormous.
- **Fairy forest (Wood):** a stepping-stone path from the landing pad up to the giant tree's door, lined with little lanterns; a lily pond with a frog; toadstool fairy houses with round doors and lit windows; a ring of mossy standing stones; and a hollow log.
- **Ice island (Glass):** a ship caught in the ice, listing, its sail in tatters; three igloos with lit doorways; a penguin colony; and a frozen waterfall of icicles pouring over the edge.

## The Old Hotel and Bluebell Isle, detailed
- **Old Hotel (`HT_X_*`):** HOTEL in faded red letters on the roof, with the L fallen and leaning; an entrance canopy on two pillars; a cracked slab path out to stone gateposts and a rusty gate left ajar; a drained swimming pool out the back with a puddle and leaves, deckchairs and a yellow parasol; young birches growing from the fallen end; gulls along the roof edge; a jetty off the left edge with a rowing boat tied up in the sky.
- **Bluebell Isle (`BL_X_*`):** an arched stone bridge over the gold river, a green shepherd's hut on wheels with a lit window by the terraces, a goat shelter with a hay rack, a cairn on a hill, a bench looking at the river, and white and yellow wildflowers among the bluebells.
- **Ice island penguins:** white fronts and faces, eyes and flippers, all looking roughly towards the landing pad.

## More travellers (Badger, Hedgehog, Raccoon, Frog, Duck, Deer, Bear)
Built like the other animals: rounded blobs for body and head, the shared `face()` eyes and cheeks, front at -Y, about 1–1.5 tall, most with a scarf in their own colour. **Badger:** grey with a white face and two black stripes. **Hedgehog:** a round back of brown spines and a cream face. **Raccoon:** grey with a black mask and a ringed tail. **Frog:** squat and green, with big eyes on top and a wide smile. **Duck:** white, with an orange bill and feet and a little blue sailor cap. **Deer:** a fawn on long legs with white spots, big ears and antler nubs. **Bear:** a round brown cub with a cream muzzle and belly. With the fox, puffin and seal (existing models) they bring the travellers to fifteen.

## Pompom Meadow (IslandPompom)
A small island (radius 12, shown at 2.4×) in the open sky between Little Gable and Snowcap. One giant pom-pom flower stands on a 15-tall ribbed, pale sage stalk, its head about 10 across. Round it are 48 smaller pom-poms on thin ribbed stalks, taller towards the back, with a way in left clear at the front, and low leafy undergrowth beneath. Each head is a green core with hundreds of fine spikes (`pom_head`) tipped pale (`pom_tip`). In the game the heads glow softly, as if the sun were shining through them. Reference: looking up at backlit lime-green pom-pom flowers against a deep blue sky.
