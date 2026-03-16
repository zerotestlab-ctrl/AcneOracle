# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (AI routes for AcneOracle)
│   └── acne-oracle/        # React Native Expo iOS app
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas
│   ├── db/                 # Drizzle ORM schema + DB connection
│   └── integrations-openai-ai-server/  # OpenAI server SDK wrapper
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## AcneOracle App (artifacts/acne-oracle)

React Native Expo iOS app for AI-powered acne analysis.

### Features
- Guided camera skin selfies via ImagePicker
- AI acne type detection (comedonal/inflammatory/cystic/hormonal) + severity scoring 1-5
- Product spending log with category tracking and budget progress bar
- Weekly dashboard with severity trend chart, photo timeline, smart swaps
- AI chat coach with SSE streaming (expo/fetch)
- Before/after skin simulation (gpt-image-1)
- RevenueCat subscription paywall ($5.99/mo) — gracefully disabled without API key
- Dark mode only (#080B10 background, #FF6B6B coral accent, #00C9A7 teal)

### Key Files
- `app/_layout.tsx` — root layout with all providers
- `app/(tabs)/index.tsx` — Home screen (stats, scan CTA, tips)
- `app/(tabs)/log.tsx` — Product log with add modal
- `app/(tabs)/dashboard.tsx` — Progress charts, photo timeline, spending breakdown
- `app/(tabs)/community.tsx` — AI chat coach with SSE streaming
- `app/camera.tsx` — Camera/image picker + analysis flow
- `app/results.tsx` — Analysis history sidebar + detail view + simulation
- `app/paywall.tsx` — RevenueCat subscription paywall
- `context/AppContext.tsx` — Global state (AsyncStorage: analyses, products, chat, streak)
- `lib/revenuecat.tsx` — SubscriptionProvider, gracefully disabled without key
- `constants/colors.ts` — Dark theme colors

### IDs
Use `Date.now().toString() + Math.random().toString(36).slice(2,7)` for IDs (no uuid package).

### Bundle identifier
`com.acneoracle.app`

## API Server (artifacts/api-server)

Express 5 API server. Mounts at `/api`.

### Routes
- `GET /api/health` — health check
- `POST /api/acne/analyze` — gpt-5.2 vision acne analysis (returns JSON)
- `POST /api/acne/simulate` — gpt-image-1 before/after simulation (returns b64)
- `POST /api/acne/chat` — SSE streaming chat coach

Depends on: `@workspace/integrations-openai-ai-server`

## RevenueCat Setup (pending)
- Connector: `connector:ccfg_revenuecat_01KED80FZSMH99H5FHQWSX7D4M`
- Entitlement: `premium`
- Price: $5.99/mo
- Env vars needed: `EXPO_PUBLIC_REVENUECAT_TEST_API_KEY`, `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; acne routes at `src/routes/acne/index.ts`
- Depends on: `@workspace/db`, `@workspace/api-zod`, `@workspace/integrations-openai-ai-server`

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`).

### `scripts` (`@workspace/scripts`)

Utility scripts package.
