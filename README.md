# TravelPlan AI

AI-powered travel planner built with Next.js 16, Claude API, and SQLite.

## Features

- **Tourist profile wizard** — 9 steps: travelers, health & dietary, vacation style, accommodation, budget, flights, documents, loyalty programs, cuisine & languages
- **Trip planning wizard** — origin, destinations, dates, parallel AI visa & health checks, AI recommendations
- **Flight scoring** — direct, layover, and overnight stopover routes with MCT calculation and Schengen transit check
- **Accommodation & car rental** — mock data filtered by destination, multi-select, cross-border car flag
- **AI chat assistant** — floating SSE streaming panel powered by Claude Haiku

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.2.6 App Router, TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | SQLite via Prisma 7 + `@prisma/adapter-libsql` |
| AI | `@anthropic-ai/sdk` — Claude Haiku 4.5 / Sonnet 4.6 |
| State | Zustand |

## Getting started

### 1. Install dependencies

```bash
cd travel-planner
npm install
```

### 2. Set up environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Get a key at [console.anthropic.com](https://console.anthropic.com).

### 3. Set up the database

```bash
npx prisma migrate dev --name init
npm run db:seed
```

This creates `dev.db` with 17 mock flights (Cyprus → Italy routes including stopover via Istanbul), 25 hotels (Florence, Tuscany, Lake Como, Milan, Istanbul), and 13 rental cars.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage flow

1. **Create your profile** — click Profile in the navbar, fill all 9 steps, save
2. **Plan a trip** — click New Trip, enter origin (e.g. `Limassol, CY`), add destinations (Florence + Lake Como), set dates
3. **AI checks** — on step 4, click "Run AI checks" to get visa & vaccination requirements
4. **Choose flights** — on the trip detail page, open Flights → AI Optimize
5. **Book accommodation** — open Accommodation, select hotels for each destination
6. **Add car rental** — open Car Rental, filter by cross-border if visiting multiple countries

## Project structure

```
travel-planner/
├── prisma/
│   ├── schema.prisma          # 5 models: Profile, Trip, MockFlight, MockHotel, MockCar
│   └── seed.ts                # 17 flights, 25 hotels, 13 cars
├── src/
│   ├── app/
│   │   ├── page.tsx           # Dashboard
│   │   ├── profile/page.tsx   # 9-step profile wizard
│   │   ├── trips/
│   │   │   ├── page.tsx       # Trip list
│   │   │   ├── new/page.tsx   # New trip wizard (5 steps)
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # Trip detail
│   │   │       ├── route/page.tsx    # Flight selection
│   │   │       ├── accommodation/    # Hotel selection
│   │   │       └── car-rental/       # Car selection
│   │   └── api/
│   │       ├── profile/       # CRUD profile
│   │       ├── trips/         # CRUD trips
│   │       ├── mock/          # flights / hotels / cars
│   │       └── ai/            # visa-check, health-check, recommendations, route-optimize, chat
│   └── lib/
│       ├── ai/                # Anthropic client + prompt builders
│       ├── data/              # transitRules.json, airports.json, entryRequirements.json
│       ├── types/             # profile.ts, trip.ts
│       └── utils/             # flightScoring.ts, mct.ts, transitCheck.ts
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes (for AI features) | Your Anthropic API key |

## Scripts

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run db:seed    # Seed mock data into SQLite
npx prisma studio  # Browse database in browser
```
