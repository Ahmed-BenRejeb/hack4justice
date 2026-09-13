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

## Change Log

| Date | Author | What changed |
|---|---|---|
| 2026-09-12 | team | Initial web guide: commands, proxy boundary, tokens, motion, test constraints |
| 2026-09-12 | team | Integrated with api/: contract mirrors Pydantic models, OFFICER_ID via server page, Docker image (D-024) |
| 2026-09-13 | team | Abstentions answered in place with the person named in the trace (D-047); impact panel at /agent/mesures (D-048) |
