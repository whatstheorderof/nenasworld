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
| World | `mind/src/world.js` | Ticks at 20Hz. Position, needs (fullness, energy, wonder, joy, calm), clock (1 real hour = 1 day), weather. Decides which actions are on offer. No model involved. |
| Brain | `mind/src/brain.js` | Heartbeat of 4 to 15 seconds depending on how stirred up she is. Sense, feel, decide, speak. The model picks ONE offered action and gives a reason in her voice; rules reject anything not on offer and any third repeat in a row. Falls back to a scripted choice if there is no model. |
| Memory | `mind/src/memory.js` | Plain files in `mind/data/`: `character.md` (who she is, edit it freely), `memory.md` (24 slots that fade daily), `interests.json`, `visitors.json`, `notes.json`, `diary/day-0001.md`. When she sleeps she sorts the day and keeps up to three things. |
| Models | `mind/src/models.js` | Pluggable provider. |
| Server | `mind/src/server.js` | WebSocket for live state, plus `GET /api/now`, `/api/feed`, `/api/diary`, `/api/memory`, `/api/facts` and `POST /api/notes`. |
| Island | `web/src/town.js`, `web/src/nena.js` | three.js, built from primitives. Bright and flat-shaded by day, glowing windows and signs at night. |
| Places | `shared/world.js` | Where things are (house, fish stall, pond, library, studio, cinema, lookout, igloo, garden, river, beach), what each of her 15 actions does to her needs, and the route planner that walks her around buildings. Shared by mind and web. |

## Not built yet

- Models are made in code, not Blender. Blender was not reachable when this was built.
- Storage is local files. For Vercel, the web folder deploys as a static Vite site
  (set `VITE_MIND_URL`; `vercel.json` is included). The mind needs an always-on host
  with a persistent disk mounted at `/data`; the `Dockerfile` builds it.
- No web browsing, shop, jobs or coin.
