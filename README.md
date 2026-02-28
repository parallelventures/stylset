# StyleSet — Autonomous Hairstyle Variation Engine

Internal tool that **autonomously generates hairstyle-variation image sets** daily. An agent/orchestrator creates **5 sets/day × 6 slides/set = 30 images/day** using Gemini `gemini-3-pro-image-preview`.

## Quick Setup (< 5 minutes)

```bash
# 1. Install
npm install

# 2. Set your Gemini API key in .env
GEMINI_API_KEY="your-key-here"

# 3. Initialize DB + seed (30 presets, 1 template, cron job)
npx prisma db push
npm run db:seed

# 4. Start
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## How It Works

### The Agent (Core Feature)

The agent at `src/agent/dailyOrchestrator.ts` runs autonomously:

1. **Loads config** — subject, template, preset pool
2. **Generates 5 sets per run**, each with 6 unique hairstyles
3. **Smart preset selection** — avoids duplicates within a set, reduces repeats across days (7-day history)
4. **Composes prompts** with hard identity-lock instructions + hairstyle variation
5. **Retry with backoff** — up to 2 retries per slide, exponential backoff (3s → 6s → 12s)
6. **Concurrency control** — max 2 simultaneous Gemini calls
7. **Outputs**: images + `manifest.json` + ZIP per set

### Workflow

1. **Upload a Subject** (`/subjects`) — reference photo(s) + locked attributes
2. **Go to Agent** (`/agent`) — click **"⚡ Run Now"** — generates 5×6=30 images
3. **View Sets** (`/sets`) — auto-refreshing progress, download manifest/ZIP
4. **Schedule** (`/cron`) — default: daily at 09:00

### Three Ways to Trigger

```bash
# 1. UI — click "Run Now" on /agent page
# 2. API — POST /api/agent
curl -X POST http://localhost:3000/api/agent

# 3. CLI — for external cron
npm run agent:run

# System cron example (every day at 9am):
0 9 * * * cd /path/to/styleset && npm run agent:run

# Alternative: spread across day (every 3 hours, 1 set each):
AGENT_SCHEDULE="0 */3 * * *"
```

## Architecture

```
src/
├── agent/
│   ├── dailyOrchestrator.ts  ← CORE: autonomous agent
│   └── scheduler.ts          ← in-app node-cron
├── app/
│   ├── api/
│   │   ├── agent/             POST = run agent
│   │   ├── subjects/[id]/generate/  one-click per subject
│   │   ├── subjects/          CRUD + upload
│   │   ├── presets/           CRUD
│   │   ├── templates/         CRUD
│   │   ├── sets/              CRUD + generate
│   │   ├── cronjobs/          CRUD + run-once
│   │   └── assets/            static file serving
│   ├── agent/                 Agent dashboard
│   ├── subjects/              Subject management
│   ├── presets/               Preset browser
│   ├── templates/             Template editor
│   ├── sets/                  Set viewer + downloads
│   └── cron/                  Schedule config
├── lib/
│   ├── prisma.ts              Prisma singleton
│   ├── prompts.ts             Prompt composition + identity lock
│   ├── storage.ts             File utils + hashing
│   └── validation.ts          Zod schemas + safety
└── services/
    ├── geminiImage.ts          Gemini API client
    └── generator.ts            Per-set generator
```

### Data

```
data/
├── subjects/{id}/ref_0.png    Reference images (immutable)
└── sets/{id}/
    ├── images/000.png..005.png Generated hairstyles
    ├── manifest.json           Set metadata
    └── set.zip                 Downloadable archive
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GEMINI_API_KEY` | — | **Required.** Google Gemini API key |
| `DATABASE_URL` | `file:./dev.db` | SQLite database path |
| `AGENT_SCHEDULE` | `0 9 * * *` | Cron expression (9am daily) |

## Seed Data

`npm run db:seed` creates:
- **30 hairstyle presets** (bobs, pixies, braids, bangs, waves, updos, editorial styles…)
- **1 template** (Standard Lookbook — photorealistic, studio lighting)
- **1 cron job** (daily at 09:00, 5 sets × 6 slides)

## Docker

```bash
docker-compose up -d
```

## Design Decisions

- **Subject invariance**: Every prompt includes hard identity-lock instructions. Face, body, skin, wardrobe, background, lighting, camera are all explicitly preserved.
- **30 presets > 6 needed**: At 6 per set × 5 sets/day = 30/day, the full pool is cycled through once per day with variation. The selector avoids recent repeats.
- **No manual setup needed**: Upload a photo, click Run. Everything else is pre-configured.
- **SQLite**: Zero-config. Swap `provider = "postgresql"` in schema.prisma for Postgres/Supabase.
