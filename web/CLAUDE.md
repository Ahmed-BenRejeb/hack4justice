@AGENTS.md

# CLAUDE.md - web/

Local rules for the Next.js app. Repo-wide rules live in the root CLAUDE.md and are not repeated here.

## Commands

| Command | What it does |
|---|---|
| `pnpm install` | Install dependencies |
| `pnpm dev` | Dev server on port 3000; needs `.env` (copy `.env.example`) |
| `pnpm build` | Production build, includes type checking |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | Route type generation, then `tsc` |
| `pnpm test` | Unit tests for `lib/` with the Node test runner |
| `docker compose up --build web` | Production image, from the repo root (see `README.md`) |

## Local rules

- The browser never calls the backend directly. `lib/api-client.ts` calls `/api/v1/*`; `app/api/v1/[...path]/route.ts` forwards it to `API_BASE_URL` and holds no logic.
- Wire types live only in `lib/api-types.ts` and mirror the Pydantic models in `api/app/api/v1/` (D-024). A contract change touches both sides in the same commit.
- `OFFICER_ID` is read by the officer review page on the server (`lib/env.ts`) and passed down as a prop; client components never read configuration.
- Tokens live only in `app/globals.css`. Status colours are applied through `STATUS_TONE` (`components/shared/status-badge.tsx`) or the `status-*` utilities, and only to report that status.
- One keyframe animation exists: `animate-queue-arrive`, the orchestrated moment. Everything else is a transition answering a user action. No looping animation anywhere, so no pulsing skeletons and no spinners.
- Interface copy uses the typographic apostrophe (’).
- Tests run under Node type stripping: a module imported by `tests/` uses only relative runtime imports and erasable TypeScript (no enums, no parameter properties).
- French question copy for an answerable fact lives in `lib/labels.ts` (`FACT_QUESTIONS`), not in the backend, which holds no interface copy (D-039). A fact the backend accepts but that has no entry there is not asked on screen.
- `components/ui/` holds shadcn primitives (radix-nova). Local edits to a primitive, such as the static `Skeleton`, carry a comment and must survive a re-add.
- The legal source surface (`components/corpus/`, routes `/textes` and `/textes/[chunkId]`, D-052) reads only `GET /corpus/*` and `GET /findings/{id}/related`, which already refuse unverified text (D-029). A chunk id that 404s reads as "not yet verified", not as a system error: today almost every indexed chunk is unverified, so that is the normal case, not the exception. Never add client-side logic that infers or labels an unverified passage from anything else in the response.
- `components/shared/related-passages.tsx` renders nothing while its fetch is loading, on error, or with no hits, so it never flashes into view only to disappear; it is a supplementary pointer into the corpus, never a substitute for a finding's own citation.
- Charts are `recharts` directly, wrapped by `components/shared/simple-bar-chart.tsx` (neutral tone, single series) and `status-bar-chart.tsx` (decided/abstained, status tones), not vendored Tremor Raw source (D-053). A chart reporting decided/abstained/flagged uses that status token; every other chart uses `--chart-1` (`app/globals.css`), never a raw colour. Data shaping (aggregation, labelling) lives in `lib/charts.ts`, tested; the chart components themselves are verified by eye, per `docs/frontend-plan.md` section 4.
- `components/shared/document-viewer.tsx` renders a document's rendered page (`GET /documents/{id}/pages`, a plain `<img>`, not `next/image`: it is a locally-served render, not a remote asset to optimise) with a selected field's outline drawn over it (J3, D-055). `extraction-view.tsx`'s field table makes a located field (non-null `page`/`bbox`) selectable, keyboard included; the outline uses `border-ring`/`bg-primary`, never a status colour, since it marks a location, not a status. `lib/positions.ts` converts a pixel bounding box to a percentage-based CSS rectangle, tested, so it lines up with the image at any render size. A document with no rendered pages (predating this feature) shows the viewer's own empty state, not a broken image.

## Change Log

| Date | Author | What changed |
|---|---|---|
| 2026-09-12 | team | Initial web guide: commands, proxy boundary, tokens, motion, test constraints |
| 2026-09-12 | team | Integrated with api/: contract mirrors Pydantic models, OFFICER_ID via server page, Docker image (D-024) |
| 2026-09-13 | team | Abstentions answered in place with the person named in the trace (D-047); impact panel at /agent/mesures (D-048) |
| 2026-09-13 | team | Legal source surface: search, passage reader, related passages, corpus verification queue (D-052) |
| 2026-09-13 | team | KPI charts on recharts directly, neutral chart ramp; MSME "Mes chiffres" section (D-053) |
| 2026-09-13 | team | Document viewer with field outlines on the page (J3, D-055) |
