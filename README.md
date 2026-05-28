# TravelPlan AI

AI-powered travel planner. Next.js 16 · Claude API · Postgres · Vercel-ready.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 App Router, TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | **Postgres** via Prisma 7 + `@prisma/adapter-pg` |
| Cache / Rate-limit | **Upstash Redis** (HTTP-based, serverless-friendly) |
| Auth | JWT (jose) in HttpOnly cookie + Google OAuth |
| AI | Claude Haiku 4.5 + Sonnet 4.6 |
| State | Zustand |

## Local development

### 1. Install

```bash
npm install
```

### 2. Spin up Postgres + Redis locally

```bash
docker-compose up -d postgres redis
```

This starts:
- Postgres 17 on `localhost:5432` (user `travelplan`, pass `travelplan_dev_only`, db `travelplan`)
- Redis 7 on `localhost:6379` (used as a Upstash-compatible target via REST proxy is NOT needed locally — see Upstash notes below)

### 3. Configure env

```bash
cp .env.example .env.local
```

Required:
- `JWT_SECRET` — generate via `openssl rand -base64 64`
- `ANTHROPIC_API_KEY` — get at console.anthropic.com
- `DATABASE_URL` — already wired to local postgres in `.env.example`

For rate-limiting in local dev: **leave `UPSTASH_REDIS_REST_URL` unset** — code falls back to in-memory limiter (single process is fine for dev). Don't try to point it at local Redis: Upstash uses HTTP REST API, not the standard Redis protocol.

### 4. Run migrations + seed

```bash
npx prisma migrate dev --name init
npm run db:seed
```

### 5. Start dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy to Vercel

### 1. Connect repo

Push to GitHub, then on vercel.com → New Project → Import the repo. Vercel auto-detects Next.js. **Don't deploy yet** — env vars first.

### 2. Provision Postgres + Redis

**Option A — Vercel Marketplace (recommended):**
- Project → Storage → Create Database → **Neon (Postgres)** → connect
- Project → Storage → **Upstash for Redis** → connect

Vercel auto-injects env vars: `DATABASE_URL` (Neon), `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.

**Option B — External:**
- Postgres: Supabase / Neon (free tier OK)
- Redis: Upstash console → create DB → copy `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`

Add both to Vercel → Project → Settings → Environment Variables.

### 3. Set required env vars

In Vercel Project → Settings → Environment Variables:

| Var | Value |
|---|---|
| `JWT_SECRET` | new random 64-byte string (`openssl rand -base64 64`) — **never reuse the dev one** |
| `ANTHROPIC_API_KEY` | from console.anthropic.com |
| `SERPAPI_KEY` | optional, for live flight/hotel prices |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | optional, for Google sign-in |
| `NEXT_PUBLIC_URL` | `https://your-app.vercel.app` (or custom domain) |
| `ADMIN_EMAILS` | comma-separated admin emails |
| `LOG_LEVEL` | `info` |

Mark all as **Production / Preview / Development** as appropriate. `JWT_SECRET` and `ANTHROPIC_API_KEY` should be encrypted (Vercel does this by default).

### 4. Update Google OAuth redirect URI

Google Cloud Console → OAuth client → Add Authorized redirect URI:
```
https://your-app.vercel.app/api/auth/google/callback
```

### 5. Run initial migration

After first deploy, Vercel needs to apply migrations. Easiest way:
```bash
# locally with DATABASE_URL pointing at your Neon prod DB:
DATABASE_URL="postgres://..." npx prisma migrate deploy
DATABASE_URL="postgres://..." npm run db:seed
```

Or wire migrations into the build command. `vercel.json` already runs `prisma generate && next build`. To also auto-migrate on deploy, change `buildCommand` to `prisma migrate deploy && prisma generate && next build`.

### 6. Enable Vercel Firewall

Project → Firewall → enable:
- **Attack Challenge Mode** (toggle on if under attack)
- **WAF** — built-in OWASP rules
- **Rate Limiting** — already done in code (Upstash), Vercel's is a second layer

Vercel Shield handles DDoS automatically — no config needed.

---

## Security model

This app went through a security audit covering 30+ findings. Highlights:

- **JWT** — `JWT_SECRET` required, min 32 chars, no fallback
- **CSRF** — Origin/Sec-Fetch-Site check in `src/proxy.ts` + SameSite=lax cookies
- **Rate limiting** — Upstash Redis with sliding window (15 AI / 10 auth-per-15min / 120 API per minute)
- **Prompt injection** — all user input sanitized (`lib/sanitize.ts`) and wrapped in `<user_data>` XML tags in prompts
- **Mass assignment** — zod schemas in `lib/schemas/` whitelist accepted fields
- **Password policy** — min 12 chars, blocks common passwords
- **CSP / HSTS / X-Frame-Options** — see `next.config.ts`
- **Audit log** — `AuditLog` table records login/logout/register/trip-delete (see `lib/auditLog.ts`)
- **IDOR fix** — `userId` is non-nullable, all trip/profile queries scoped to session user
- **OAuth state** — timing-safe compare

See `lib/sanitize.ts`, `lib/csrf.ts`, `lib/auditLog.ts`, `proxy.ts` for the building blocks.

## Scripts

```bash
npm run dev         # Dev server
npm run build       # Production build
npm run lint        # ESLint
npm run db:seed     # Seed mock flights/hotels/cars
npx prisma studio   # Browse DB
npx prisma migrate dev --name <name>   # Create migration
```

## Project structure

```
travel-planner/
├── prisma/
│   ├── schema.prisma          # User, Profile, Trip, MockFlight/Hotel/Car, ConnectedService, Event, AuditLog
│   └── seed.ts
├── src/
│   ├── proxy.ts               # Next.js middleware (auth + CSRF)
│   ├── instrumentation.ts     # Bootstrap hook (AWS Secrets Manager opt-in)
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/          # login, register, logout, me, google OAuth
│   │   │   ├── health/        # liveness + readiness for healthcheck
│   │   │   ├── profile/
│   │   │   ├── trips/
│   │   │   ├── ai/            # 9 AI endpoints
│   │   │   └── serp/          # flights / hotels via SerpApi
│   │   └── ...
│   └── lib/
│       ├── auth.ts            # session + JWT
│       ├── auditLog.ts        # security audit trail
│       ├── csrf.ts            # CSRF helper
│       ├── sanitize.ts        # prompt injection guard
│       ├── aiInput.ts         # <user_data> XML wrappers
│       ├── cookieOptions.ts   # centralized cookie config
│       ├── rateLimit.ts       # Upstash rate limiter
│       ├── schemas/           # zod validation
│       ├── secrets.ts         # AWS Secrets Manager (opt-in)
│       └── ai/                # Anthropic client + prompt builders
├── next.config.ts             # CSP + security headers
├── vercel.json                # Vercel function config
├── Dockerfile                 # for local Docker / non-Vercel hosting
└── docker-compose.yml         # local Postgres + Redis
```
