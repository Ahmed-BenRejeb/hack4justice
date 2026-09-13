# Design

Binding, not advisory. Tokens are defined once and consumed everywhere. No raw hex values outside the token file.

## 1. Brief

A public officer's tool and an MSME's tool, sharing one visual system. The tone is administrative and trustworthy, not consumer-playful: a compliance decision is being read here, not a product being sold. Built with shadcn/ui primitives (`web/components/ui/`), themed through the token file rather than shadcn's default palette.

## 2. Colour

Colour carries status and nothing else. The three status colours never appear as decoration, branding, or in a chart that isn't reporting a status.

| Token | Meaning | Notes |
|---|---|---|
| `--status-decided` | A rule reached a finding | Green; distinct from any brand or neutral colour |
| `--status-abstained` | A rule could not decide, a fact is missing | Ochre; never rendered as an error/danger colour - abstention is a correct outcome, not a failure |
| `--status-flagged` | An officer flagged a file | Magenta; reserved for officer actions only |

The token file is `web/app/globals.css`. It holds a light and a dark set of cool administrative neutrals, the three status tokens, the Chahed navy (`--primary`) reserved for interaction: links, primary buttons, focus, and the Chahed brick (`--brand`) reserved for brand marks: the active navigation marker, section eyebrows and the home page's step rule (D-058). `--brand` never reports a status, never marks a destructive action and never colours a chart; its hue sits next to `--destructive`'s, so it stays a thin mark, never a filled control. The navy `--inverse` ground carries the navigation column of every space and the home page's lead and closing bands; keyboard focus on it uses the light ring its section re-scopes. System errors (a backend that cannot be reached) use `--destructive`, which is not a status colour. No component sets a colour value directly.

A chart reporting decided, abstained or flagged uses the matching status token. Every other chart uses the neutral chart ramp (`--chart-1` through `--chart-n`, extended only when a real chart needs another series), derived from the same cool-neutral hue as the rest of the token file, never a status colour or `--primary`.

## 3. Typography

IBM Plex Sans (Latin and Latin Extended subsets) for all interface text in both roles; IBM Plex Mono for withholding codes, identifiers, and file references. Both are self-hosted at build time through `next/font`, so no font request leaves the workstation at runtime. Components use the shadcn type scale (`text-sm` body in dense views, `text-2xl` page titles) rather than ad hoc sizes.

## 4. Layout

Officer queue: list-first, dense, scannable - an officer works many files; the whole row opens the file. MSME upload/review: single-file focus, one document's findings at a time, generous spacing - an MSME owner sees one file, not a queue. Both share the same component primitives from `web/components/ui/`.

File review (both roles) is answer first (D-023, D-024): a result banner states the proposed code, the missing facts and the number of rules applied before any detail. The main column holds the cited findings, then the extracted text; once a file is validated, the TEJ declaration form leads the officer's main column. A side rail holds the officer's decision, the export result and progress as a vertical step list. Below the `lg` breakpoint the rail follows the main column.

Signed-in spaces (D-058): a navigation column lists the screens the role may use, then the account and the theme switch; below the `lg` breakpoint it becomes a top bar whose menu opens on demand. Each space opens on its dashboard: four key figures, the charts, then a list of files. Every screen starts with its title, then a numbered "Mode d’emploi" guide, closed by default on the file reviews and the passage reader so the answer stays first.

Home page: a brochure open to everyone, a header with section anchors, a lead band, then services, method with the texts covered, steps, audiences, a closing band and the footer. It states what the product does and texts marked `verified` in `docs/facts.md`, never a figure, a client count or a testimonial.

## 5. Motion

Motion explains what changed. Reduced-motion preference is respected everywhere; keyboard focus is always visible and never removed by a motion effect.

### The one orchestrated moment

A file arriving in the officer queue is the single orchestrated animation in the product: it is the moment that dramatizes "the system already did the work, the officer starts from a pre-qualified file," which is the product's core claim. Nowhere else gets this treatment.

### Motion that answers a user action

Every other transition responds directly to something the user did: expanding a finding to show its citation, an abstention revealing the missing fact, a validate/flag action confirming. No transition plays on its own outside the one orchestrated moment above.

### Forbidden

- Motion as decoration: no animation that does not answer a specific state change or a specific user action.
- Looping or ambient animation of any kind, including pulsing loading skeletons and spinners: loading states are static.
- Motion that delays a user from reading or acting (no animation the user must wait out before the next control is usable).
- Colour used decoratively (contradicts section 2).

## 6. Copy

Interface copy is French. Code, identifiers, comments, docs, and commit messages are English, per the root `CLAUDE.md`. Officer- and MSME-facing copy should read as administrative French (formal register), not marketing French.

## 7. Screens

Specified against the demo moments in `docs/plan.md` section 6. First implementation in `web/`:

| Screen | Route |
|---|---|
| Sign-in, one centered card on a muted ground (shadcn `login-03`) | `/connexion` |
| Business sign-up: organisation name, matricule fiscal, email, password (same layout) | `/inscription` |
| Home page brochure: services, method, steps, audiences | `/` |
| MSME dashboard: key figures, filings per day, decided against abstained, missing facts, latest files | `/entreprise` |
| MSME upload | `/entreprise/deposer` |
| MSME extraction review, findings with citation, abstention with named missing fact | `/entreprise/dossiers/[id]` |
| Officer dashboard: waiting files, decisions, declarations, filings per day, what blocks files | `/agent` |
| Officer queue (list) | `/agent/dossiers` |
| Officer file review (validate/flag) and export confirmation (TEJ XML produced, XSD-validated) | `/agent/dossiers/[id]` |
| Officer measures and benefit calculation | `/agent/mesures` |
| Admin dashboard: registry size, sources, verified passages | `/admin` |
| Admin rule registry (read-only) | `/admin/regles` |
| Admin corpus verification queue | `/admin/corpus` |
| Legal search, verified passages only (J10) | `/textes` |
| Verified passage reader: full text, neighbours, article outline, official source (J2) | `/textes/[chunkId]` |

## 8. Quality floor

Every screen above must be legible and usable with the reduced-motion preference on, with keyboard-only navigation, and at the type scale a public-sector workstation typically runs at (do not assume a high-DPI display).

## Change log

| Date | Author | What changed |
|---|---|---|
| 2026-09-12 | team | Regenerated design doc from description-projet-v2.md scope; typography/token specifics deferred to phase 5 |
| 2026-09-12 | team | Fixed token file location, status hues, IBM Plex typography; static loading states; screen-to-route table (D-022) |
| 2026-09-12 | team | Section 4: answer-first file review with a side rail, clickable queue rows (D-023) |
| 2026-09-12 | team | Section 4: review adapted to the real backend, RNE removed, TEJ form placement (D-024) |
| 2026-09-13 | team | Section 7: added the legal search and passage reader screens, admin now also hosts the corpus verification queue (D-052) |
| 2026-09-13 | team | Section 2: recorded the neutral chart ramp rule (D-053) |
| 2026-09-13 | team | Section 7: added the sign-in and sign-up screens (D-054) |
| 2026-09-13 | team | Sections 2, 4, 7: Chahed navy and brick, inverse ground, navigation column, dashboards, page guides, brochure home page, moved routes (D-058) |
