# Frontend plan

What the web app still needs before the demo, in order, and the design direction it is built under. Binding visual rules stay in `docs/design.md`; this document is the work plan, not a second design system.

## 1. Where the front end stands

Built and wired: 44 components over five routes (`/entreprise`, `/entreprise/dossiers/[id]`, `/agent`, `/agent/dossiers/[id]`, `/agent/mesures`, `/admin`), tokens applied from `web/app/globals.css`, one keyframe animation, French copy, dark and light sets.

Every backend feature is surfaced except one, and two things are missing outright:

| Gap | Detail |
|---|---|
| The corpus API has no interface | `GET /corpus/search`, `/corpus/chunks/{id}`, `/corpus/sources`, `/corpus/verification-queue` and `GET /findings/{id}/related` are built, tested and serving 78 indexed chunks. Nothing in `web/` calls any of them; the wire types sit unused in `web/lib/api-types.ts`. This is J2, J6 and J10, and it is the pitch's own centrepiece |
| No charts | No chart library, no KPI view beyond the counts already on `/agent/mesures` |
| No data behind the screens | No `seed/`, no `fixtures/`, so a fresh database renders empty screens (tracked separately, not a front-end task) |

## 2. Design direction

**Decision: stay on shadcn/ui with Radix primitives, add Tremor for charts only, adopt no block library.** Recorded as `docs/decision-log.md` D-050.

The design system is already written, binding and austere on purpose. What the screens lack is a missing surface and real data, not more components. Any library adopted here would be judged against `docs/design.md` section 2 (colour carries status and nothing else) and section 5 (one orchestrated moment, everything else answers a user action), which most component kits are built to violate.

Alternatives considered:

| Option | What it is | Verdict |
|---|---|---|
| shadcn/ui, current base | Radix primitives, copy-paste, already the stack, official chart components wrapping Recharts | Keep. No migration, no runtime dependency |
| [Tremor](https://www.tremor.so/) | Free and open source, copy-paste, Tailwind and Radix, about 35 components purpose-built for dashboards and KPI cards, backed by Vercel | Adopt for charts only. Same primitives as the existing stack, so tokens carry over |
| [Origin UI](https://originui.com/), [ReUI](https://reui.io/) | Large free shadcn-compatible component sets | Mine for patterns when a specific screen needs one. No adoption decision required, since the model is copy-paste |
| [Beste UI](https://ui.beste.co/), shadcnblocks | Block libraries, freemium and paid, oriented to marketing pages: hero sections, pricing, ecommerce, price tickers | No. The catalogue is landing-page surface for a public-administration tool, and the premium tier buys blocks this product does not have screens for |
| [Tailwind Plus / Catalyst](https://tailwindcss.com/plus/ui-blocks) | One-time purchase, roughly 299 USD for the bundle or 149 USD for Catalyst alone; the highest-quality application UI kit for dense admin screens | Only worth it if the team decides to rebuild the visual layer wholesale and has the budget. It conflicts with nothing, it simply is not needed to close the gaps above |
| Aceternity UI, Magic UI | Animated component collections built on Framer Motion | Rejected. Their value is motion decoration, which `docs/design.md` section 5 forbids by name |

The honest summary: the visual quality gap on this product is not solved by a component library. It is solved by having something on the screens worth looking at, which is work items 1 and 2.

## 3. Work items, in order

### 3.1 The legal source surface (J2, J6, J10)

The highest-value front-end work in the repository: an entire tested backend with no interface, serving the argument the whole product rests on.

- A source reader at `/textes/[chunkId]`, reached from any citation, showing the verified passage with its source, article, paragraph and page, and a link to the official PDF. `GET /corpus/chunks/{id}`.
- Related passages under a finding, from `GET /findings/{id}/related`.
- A legal search screen, `GET /corpus/search`, returning verified passages only.
- The verification queue on `/admin`, from `GET /corpus/verification-queue`, showing references only.

Binding constraint, D-029: an unverified passage never reaches the screen, not even labelled. The register currently holds one verified passage against 78 indexed chunks, so every one of these screens must read correctly when almost everything is unverified. Design the empty and partial states first, not last: "this passage is awaiting verification" is the normal case today, not an error.

### 3.2 KPI charts for both roles

`GET /impact` already returns everything needed and accepts an `organisation_id` filter, so the MSME side reuses it scoped to that organisation. No new endpoint.

Officer, extending `/agent/mesures`:
- decided against abstained, from `findings_decided` and `findings_abstained`
- errors intercepted per rule, labelled by article, from `by_rule`
- the facts most often missing, from `abstentions_by_missing_fact`, which is the queue's own backlog in one view
- the benefit calculation already on the page, kept as written-out arithmetic with its inputs labelled as estimates

MSME, on `/entreprise`:
- their own files: analysed, decided, abstained
- errors caught before filing, so the number the business avoided paying for
- which facts they keep failing to supply, which is the only actionable chart on this side
- no benefit calculation: the hours figure is an argument made to the administration, not to the business

### 3.3 Chart tokens

`web/app/globals.css` has no chart tokens today, and `docs/design.md` section 2 allows the status colours in a chart only when that chart reports a status. So:

- a chart reporting decided, abstained or flagged uses the existing status tokens
- every other chart uses a neutral ramp, to be added as `--chart-1` through `--chart-n` in the token file, derived from the existing cool neutrals
- `docs/design.md` section 2 gains one line recording the ramp, since the token file is not the place to decide policy

### 3.4 Polish pass

Against `docs/design.md` section 8, on a normal-DPI display: reduced motion on, keyboard only, and the type scale a public-sector workstation runs at. This is a review pass with fixes, not a redesign.

## 4. Verification

`pnpm typecheck`, `pnpm lint`, `pnpm test` for every item. Tests for `lib/` only, under Node type stripping, so any module a test imports stays on relative runtime imports and erasable TypeScript. Charts are verified by eye against the quality floor; their data shaping goes in `lib/` where it can be tested.

## Change log

| Date | Author | What changed |
|---|---|---|
| 2026-09-13 | team | Initial front-end plan: design direction (D-050), the legal source surface, KPI charts for both roles, chart tokens, polish pass |
| 2026-09-13 | team | Section 3.1 done: search, passage reader, related passages under a finding, admin verification queue (D-052) |
