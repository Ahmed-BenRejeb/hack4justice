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
- Sign-in (D-054): `lib/auth-actions.ts` server actions call `/auth/*` and keep the session token in the HttpOnly `chahed_session` cookie; the proxy forwards it as `Authorization: Bearer`, and browser code never sees it. `lib/session.ts` (`getCurrentUser`, memoised per request, and `requireRole`) is server-only. Each route-group layout calls `requireRole` to send a role to its own space; layouts do not re-run on navigation within a group, so they are a convenience, and the backend's 401/403 remain the enforcement. Identity is never sent from the client: the backend records the signed-in user as filer, deciding officer and confirming person. Client components never read configuration.
- Tokens live only in `app/globals.css`. Status colours are applied through `STATUS_TONE` (`components/shared/status-badge.tsx`) or the `status-*` utilities, and only to report that status. `brand` is for brand marks only (D-058); `inverse-*` is the navy ground, and a section on it re-scopes the focus ring with `[--ring:var(--inverse-foreground)]`.
- Frames (D-058): the root layout draws none, so each screen family renders its own `<main id="contenu">`, the skip link's target: `components/shared/app-shell.tsx` for every signed-in space (the role's screens in `SPACES`, first item the dashboard; a new screen adds its item there), the home page, the `(auth)` layout, `/capture/[token]`, `not-found.tsx` and `error.tsx`. The logo's path is `LOGO_SRC` in `components/shared/logo.tsx`, today the placeholder `public/logo.svg`; the Dockerfile copies `public/`.
- Dashboards (`components/{msme,officer,admin}/*-dashboard.tsx`) compose `components/shared/dashboard.tsx` (`StatGrid`, `StatTile`, `ChartCard`) and read `GET /impact/activity` beside the existing endpoints; they do not poll, and the officer dashboard passes `QueueTable` no arrivals, so the arrival animation stays the queue screen's. Every screen carries a `PageGuide` under its title, `defaultOpen={false}` on the file reviews and the passage reader. The home page (`app/page.tsx`) states only what the product does and texts `verified` in `docs/facts.md`.
- One keyframe animation exists: `animate-queue-arrive`, the orchestrated moment. Everything else is a transition answering a user action. No looping animation anywhere, so no pulsing skeletons and no spinners.
- Interface copy uses the typographic apostrophe (’).
- Tests run under Node type stripping: a module imported by `tests/` uses only relative runtime imports and erasable TypeScript (no enums, no parameter properties).
- French question copy for an answerable fact lives in `lib/labels.ts` (`FACT_QUESTIONS`), not in the backend, which holds no interface copy (D-039). A fact the backend accepts but that has no entry there is not asked on screen.
- `components/ui/` holds shadcn primitives (radix-nova). Local edits to a primitive, such as the static `Skeleton`, carry a comment and must survive a re-add.
- The legal source surface (`components/corpus/`, routes `/textes` and `/textes/[chunkId]`, D-052) reads only `GET /corpus/*` and `GET /findings/{id}/related`, which already refuse unverified text (D-029). A chunk id that 404s reads as "not yet verified", not as a system error: today almost every indexed chunk is unverified, so that is the normal case, not the exception. Never add client-side logic that infers or labels an unverified passage from anything else in the response.
- Phone capture (D-056, D-057): `components/msme/photo-pages.tsx` holds the camera button, the page list and `usePhotoReduction` (images reduced by `lib/photos.ts` before they join a form). `/capture/[token]` is the one screen outside sign-in: its token is the permission, so it calls only `GET /capture/{token}` and `POST /capture/{token}/documents`. The laptop's QR link comes from the `createCaptureLink` server action (`lib/capture-actions.ts`), which reads `PUBLIC_WEB_URL`; the code is drawn with the constant `qr-paper` and `qr-ink` tokens so it stays dark on light in both themes.
- `components/shared/related-passages.tsx` renders nothing while its fetch is loading, on error, or with no hits, so it never flashes into view only to disappear; it is a supplementary pointer into the corpus, never a substitute for a finding's own citation.
- Charts are `recharts` directly, wrapped by `components/shared/simple-bar-chart.tsx` (neutral tone, single series, `columns` for a series over time) and `status-bar-chart.tsx` (decided/abstained, status tones), not vendored Tremor Raw source (D-053). A chart reporting decided/abstained/flagged uses that status token; every other chart uses `--chart-1` (`app/globals.css`), never a raw colour. Data shaping (aggregation, labelling) lives in `lib/charts.ts`, tested; the chart components themselves are verified by eye, per `docs/frontend-plan.md` section 4.
- `components/shared/document-viewer.tsx` renders a document's rendered page (`GET /documents/{id}/pages`, a plain `<img>`, not `next/image`: it is a locally-served render, not a remote asset to optimise) with a selected field's outline drawn over it (J3, D-055). `extraction-view.tsx`'s field table makes a located field (non-null `page`/`bbox`) selectable, keyboard included; the outline uses `border-ring`/`bg-primary`, never a status colour, since it marks a location, not a status. `lib/positions.ts` converts a pixel bounding box to a percentage-based CSS rectangle, tested, so it lines up with the image at any render size. A document with no rendered pages (predating this feature) shows the viewer's own empty state, not a broken image.

## Change Log

| Date | Author | What changed |
|---|---|---|
| 2026-09-12 | team | Initial web guide: commands, proxy boundary, tokens, motion, test constraints |
| 2026-09-12 | team | Integrated with api/: contract mirrors Pydantic models, OFFICER_ID via server page, Docker image (D-024) |
| 2026-09-13 | team | Abstentions answered in place with the person named in the trace (D-047); impact panel at /agent/mesures (D-048) |
| 2026-09-13 | team | Legal source surface: search, passage reader, related passages, corpus verification queue (D-052) |
| 2026-09-13 | team | KPI charts on recharts directly, neutral chart ramp; MSME "Mes chiffres" section (D-053) |
| 2026-09-13 | team | Sign-in: session cookie via server actions, role-gated layouts, OFFICER_ID removed, shadcn login-03 screens (D-054) |
| 2026-09-13 | team | Document viewer with field outlines on the page (J3, D-055) |
| 2026-09-13 | team | Phone capture: camera pages, photos reduced before upload, laptop QR code and the session-less `/capture/[token]` screen, `PUBLIC_WEB_URL` (D-056, D-057) |
| 2026-09-13 | team | Chahed colours, frames and `main` per screen family, navigation column, dashboards, page guides, brochure home page, logo placeholder (D-058) |
