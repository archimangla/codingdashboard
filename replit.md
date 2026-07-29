# CodeHub

A universal coding dashboard that aggregates activity from multiple competitive programming and coding practice platforms (LeetCode, Codeforces, AtCoder, GeeksforGeeks, CodeChef, HackerRank, and more) into one personalized analytics dashboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/codehub run dev` — run the frontend (proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, Recharts, Wouter, TanStack Query
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/` — database schema (userProfiles, platformConnections, submissions)
- `artifacts/api-server/src/routes/` — Express route handlers (user, platforms, dashboard, activity, analytics, search, insights, export)
- `artifacts/api-server/src/lib/platforms/` — platform adapters (LeetCode GraphQL, Codeforces API, AtCoder Problems API, + stubs for others)
- `artifacts/api-server/src/lib/syncService.ts` — deduplication + sync orchestration
- `artifacts/api-server/src/lib/statsService.ts` — streak calculation + calendar heatmap data
- `artifacts/codehub/src/` — React frontend (10 pages)

## Architecture decisions

- **Single-user mode (userId=1)**: No auth in v1; all data is owned by user ID 1. Auth can be layered in later.
- **Modular adapter pattern**: Each platform lives in `src/lib/platforms/<name>.ts` implementing `PlatformAdapter`. Adding a new platform = creating one new file + registering in `index.ts`.
- **Graceful degradation**: Platforms without public APIs (CodeChef, HackerRank, SPOJ, etc.) return stubs with descriptive error messages rather than crashing — limitation is surfaced in the UI.
- **Calendar/streak computed server-side**: Streak and heatmap logic in `statsService.ts` operates on raw DB rows, avoiding frontend complexity.
- **Deduplication by (problemName, date)**: Re-syncing the same platform doesn't create duplicate submissions.

## Product

- Dashboard home with 34-day streak, 52 problems solved across 4 platforms, GitHub-style contribution calendar
- Platform sync (LeetCode via GraphQL, Codeforces via public API, AtCoder via kenkoooo community API)
- GitHub-style contribution heatmap for full year view
- Infinite-scroll timeline grouped by day
- Weekly/Monthly/Yearly analytics with Recharts charts
- Global search with filters (platform, difficulty, topic, date range)
- Auto-generated insights (streak warnings, monthly growth, topic focus, best day of week)
- CSV + JSON export
- Onboarding wizard for first-time platform setup

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- LeetCode GraphQL rate-limits aggressively; the adapter fetches last 100 accepted submissions.
- AtCoder uses the community kenkoooo API (`kenkoooo.com/atcoder`), not the official AtCoder API.
- CodeChef removed their public API; syncing returns an informational error, not a crash.
- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
