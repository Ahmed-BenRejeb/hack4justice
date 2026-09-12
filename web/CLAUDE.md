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

## Local rules

- The browser never calls the backend directly. `lib/api-client.ts` calls `/api/v1/*`; `app/api/v1/[...path]/route.ts` forwards it to `API_BASE_URL` and holds no logic.
- Wire types live only in `lib/api-types.ts`. Shapes not fixed by docs/architecture.md are the assumptions listed in docs/decision-log.md D-020; change both together.
- Tokens live only in `app/globals.css`. Status colours are applied through `STATUS_TONE` (`components/shared/status-badge.tsx`) or the `status-*` utilities, and only to report that status.
- Two animations exist: `animate-queue-arrive` (the orchestrated moment) and `animate-field-in` (answers an upload). No looping animation anywhere, so no pulsing skeletons and no spinners.
- Interface copy uses the typographic apostrophe (’).
- Tests run under Node type stripping: a module imported by `tests/` uses only relative runtime imports and erasable TypeScript (no enums, no parameter properties).
- `components/ui/` holds shadcn primitives (radix-nova). Local edits to a primitive, such as the static `Skeleton`, carry a comment and must survive a re-add.

## Change Log

| Date | Author | What changed |
|---|---|---|
| 2026-09-12 | team | Initial web guide: commands, proxy boundary, tokens, motion, test constraints |
