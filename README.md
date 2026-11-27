# Nena's World

Nena is a small penguin who lives on her own island. Nobody plays her: a mind
server runs her needs and her clock, and a brain loop decides what she does next,
writes a diary, and remembers who leaves her things.

## Run it

Needs Node 20 or newer. Two terminals:

    npm run setup      # once
    npm run mind       # her mind, on http://localhost:8787
    npm run web        # the island, on http://localhost:5173

She runs straight away on a scripted fallback mind. To give her a real model,
copy `mind/.env.example` to `mind/.env` and fill in one provider (Anthropic, or
any OpenAI-compatible endpoint such as Ollama). Restart the mind.

Preview a look without waiting: `http://localhost:5173/?hour=23&weather=aurora`
(weather: clear, snow, aurora, mist).

## How she works

| Part | File | What it does |
| --- | --- | --- |
| World | `mind/src/world.js` | Ticks at 20Hz. Position, needs (fullness, energy, wonder, joy, calm), clock, weather, her three neighbours, and the fossils, weeds, bottles and balloons that turn up. Decides which actions are on offer. No model involved. |
| Calendar, things, actions | `shared/data.js` | 12 real hours = 1 day (DAY_SECONDS), 7 days = a season, 28 days = a year. Ten events (Fishing Tourney, Bug Hunt, Fireworks Night, Harvest Feast, Lantern Night, Snow Festival, New Year's Eve, Blossom Day, Music Night, her birthday). 36 things to collect (fish, bugs, sea creatures, fossils, paintings), 18 things to craft, the shop, 22 stamps, flower colours that cross-breed, campsite travellers, three islets to row to, a clothes shop with hats, scarves and sunglasses, an observatory where she names constellations, and all 69 actions with when each is on offer. |
| Her life | `shared/life.js` | Pockets, coins, museum, what she has built and where she put it, house level and colours, scarves, friendships, turnips. What comes of each action. |
| Brain | `mind/src/brain.js` | Heartbeat of 4 to 15 seconds. The model picks ONE offered action and gives a reason in her voice; rules reject anything not on offer and any third repeat in a row. Falls back to the scripted chooser in `shared/choose.js` if there is no model. |
| Memory | `mind/src/memory.js` | Plain files in `mind/data/`: `character.md` (who she is, edit it freely), `memory.md` (24 slots that fade daily), `interests.json`, `visitors.json`, `notes.json`, `life.json`, `diary/day-0001.md`. When she sleeps she sorts the day and keeps up to three things. |
| Server | `mind/src/server.js` | WebSocket for live state, plus `GET /api/now`, `/api/feed`, `/api/diary`, `/api/memory`, `/api/life`, `/api/board`, `/api/facts` and `POST /api/notes`. Notes and her replies are public on the noticeboard. |
| Island | `web/src/town.js`, `nena.js`, `dynamic.js` | three.js, built from primitives. Seasons recolour the island; her builds, plantings and neighbours are drawn from live state. |
| Visitors | `mind/src/server.js`, `web/src/dynamic.js` | Everyone with the page open is a named gull on the island. Double-click the ground to fly yours; the Wave button waves. Nena notices and greets visitors but nobody can steer her. Needs the real mind server; the stand-in has no visitors. |
| What she makes | `web/src/art.js` | Her drawings are painted from their titles in a crayon style (the latest hangs on the studio easel); photos are rendered from where she stood; her tune plays on a bell. The "What she's made" panel lists it all, with Show me buttons that fly the camera to things she built. |
| Far islands | `web/src/far.js`, `SKY_ISLANDS` in `shared/world.js` | Three other sky islands, only silhouettes for now: a smoking volcano and desert, an ancient forest with one enormous tree, and an ice island with light coming up through a hole in its crust. Names, resources and lore are placeholders until the story is settled. From the lighthouse she looks out at them and remembers what she notices. |
| Weather | `SEASON_WEATHER` in `shared/data.js`, `setWeatherFx` in `web/src/main.js` | Clear, cloudy, rain, storms with lightning, wind, heatwaves, rainbows after rain, snow, mist, aurora and shooting stars, depending on the season. She dresses for it (umbrella hat and yellow wellies in rain, sun hat and sunglasses in a heatwave, a warm hat in snow), and some activities only happen in some weather (puddle jumping, kite flying, watching a storm from the window, walking to the end of a rainbow). In a storm she stays near a roof and the neighbours go home. |
| Chat | `shared/chat.js`, `reply()` in `mind/src/brain.js` | Visitors say things through their gull (shown in a bubble over it); Nena answers in her own time, using the model if one is connected and scripted replies if not. The Chat panel shows the whole conversation. Max 140 characters, one message per 6 seconds per visitor. |
| Stamps | `STAMPS` in `shared/data.js`, `web/src/stamps.js` | 34 stamps, each drawn as a little postage stamp with its own picture and a postmark for the day she earned it. A pop-up shows when she earns one; the Stamps panel is her stamp book. |
| Settings and sound | `web/src/sound.js`, `applySettings` in `web/src/main.js` | A Settings panel (saved in the browser): sounds and volume, the dot filter, graphics quality, lightning flashes, name tags, speech bubbles, camera follow, 12/24-hour clock, and your visitor name. All sounds are made in the browser, no audio files: rain, wind, the sea, birds by day, crickets on summer nights, thunder, and chimes for stamps and chat. Sound starts on the first tap, as browsers require. |
| Link preview | `web/index.html`, `web/public/og.png` | The image and text shown when the link is shared. Set `SITE_URL` when building (Vercel fills it in automatically) so the image address is complete. |
| Stand-in mind | `web/src/localmind.js` | If the page cannot reach the mind server it runs the same world and scripted chooser in the visitor's browser, saved in that browser only. No diary, memories or mailbox in that mode. |
| Places | `shared/world.js` | Where everything is, and the route planner that walks her around buildings. |

She rides her little robot for trips longer than 15 metres (`RIDE_OVER` in `mind/src/world.js`). The **Free camera** button lets you roam with W A S D. **Dots** toggles the dot-screen print look (a shader pass in `web/src/main.js`). The clocktower by the square shows her world's time. Clouds drift around and below the island. Pebble paths (`PATHS` in `shared/world.js`) run in a ring round the middle with a spur to each place.

The island's size is one number: `K` in `shared/world.js` stretches the whole layout.

Preview looks: `?weather=storm`, `?weather=rainbow&hour=16`, `?stamp=kite`, `?ride=1&hat=party%20hat&glasses=star%20sunglasses`, `?hour=22&show=fireworks`, `?season=winter&weather=snow`, `?weather=meteors&hour=23`.

## Not built yet

- Models are made in code, not Blender. Blender was not reachable when this was built.
- Storage is local files. For Vercel, the web folder deploys as a static Vite site
  (set `VITE_MIND_URL`; `vercel.json` is included). The mind needs an always-on host
  with a persistent disk mounted at `/data`; the `Dockerfile` builds it.
- No web browsing, print shop, jobs or crypto coin. Neighbours' lines are scripted, not model-written.
- No terraforming (she places and plants things, but does not reshape land or water).
- Visitors' gulls have no chat and no moderation beyond name clean-up and rate limits.
