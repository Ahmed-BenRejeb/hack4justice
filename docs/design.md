# Design

Binding, not advisory. Tokens are defined once and consumed everywhere. No raw hex values outside the token file.

## 1. Brief

A public officer's tool and an MSME's tool, sharing one visual system. The tone is administrative and trustworthy, not consumer-playful: a compliance decision is being read here, not a product being sold. Built with shadcn/ui primitives (`web/components/ui/`), themed through the token file rather than shadcn's default palette.

## 2. Colour

The palette is deliberately tight: a white ground, one green brand accent, a warm yellow chart ramp, and the three status colours. Resist adding a fifth family (D-055).

**Status still carries meaning and nothing else.** The three status colours never appear as decoration or branding, and never in a chart that is not reporting that status.

| Token | Meaning | Notes |
|---|---|---|
| `--status-decided` | A rule reached a finding | Teal, moved off green so it cannot be read as the brand accent |
| `--status-abstained` | A rule could not decide, a fact is missing | Ochre; never rendered as an error/danger colour - abstention is a correct outcome, not a failure |
| `--status-flagged` | An officer flagged a file | Magenta; reserved for officer actions only |

The token file is `web/app/globals.css`. It holds a light and a dark set, the three status tokens, and the green brand accent (`--primary`, `#5EA832`) reserved for interaction: links, primary buttons, focus rings, checkmarks. `--accent-light` is that accent at tint strength, for badge and checklist backgrounds. System errors (a backend that cannot be reached) use `--destructive`, which is not a status colour. No component sets a colour value directly, and no raw hex appears outside this file.

A chart reporting decided, abstained or flagged uses the matching status token. **Every other chart uses the warm yellow ramp (`--chart-1`, `--chart-2`), which is independent of the brand accent on purpose: the accent green never appears in a data visualisation.**

## 3. Typography

Two families, never mixed within a role (D-055):

- **Headings are the serif.** Playfair Display, weight 700 to 800, through the `font-heading` token. Page titles, section titles, and any display number a screen leads with. The serif is the product's single strongest identity marker: sans-serif headings make every screen read as a generic template.
- **Everything else is the sans.** Inter, weight 400 to 600, through `font-sans`. Navigation, body copy, cards, buttons, labels, table cells.
- **Codes stay monospaced.** IBM Plex Mono, through `font-mono`, for withholding codes, identifiers and file references. This is functional, not stylistic: those strings are compared character by character.

All three are self-hosted at build time through `next/font` with the Latin and Latin Extended subsets, so every accented character in the French interface is covered and no font request leaves the workstation at runtime. Components use the shadcn type scale (`text-sm` body in dense views, `text-2xl` page titles) rather than ad hoc sizes.

## 4. Layout

Officer queue: list-first, dense, scannable - an officer works many files; the whole row opens the file. MSME upload/review: single-file focus, one document's findings at a time, generous spacing - an MSME owner sees one file, not a queue. Both share the same component primitives from `web/components/ui/`.

File review (both roles) is answer first (D-023, D-024): a result banner states the proposed code, the missing facts and the number of rules applied before any detail. The main column holds the cited findings, then the extracted text; once a file is validated, the TEJ declaration form leads the officer's main column. A side rail holds the officer's decision, the export result and progress as a vertical step list. Below the `lg` breakpoint the rail follows the main column.

## 5. Motion

Motion explains what changed. Reduced-motion preference is respected everywhere; keyboard focus is always visible and never removed by a motion effect.

### The one orchestrated moment

A file arriving in the officer queue is the single orchestrated animation in the product: it is the moment that dramatizes "the system already did the work, the officer starts from a pre-qualified file," which is the product's core claim. Nowhere else gets this treatment.

### Motion that answers a user action

Every other transition on a working screen responds directly to something the user did: expanding a finding to show its citation, an abstention revealing the missing fact, a validate/flag action confirming.

### Ambient motion, marketing surfaces only

D-055 admits a narrow class of ambient motion, and only on the entry screen (`/`), which is a pitch surface rather than a working one: a slow float on the hero cards, a pulsing dot on the announcement badge, and scroll-reveal on sections entering the viewport. These exist to make the entry screen read as a finished product.

They are confined to `/`. **No ambient motion appears on any screen that reports a finding, a status or a number an officer acts on**, because motion there competes with the reading of a compliance decision.

### Forbidden

- Ambient motion anywhere outside the entry screen, in particular on `/agent`, `/entreprise`, either review screen, `/admin` and `/textes`.
- Pulsing loading skeletons and spinners: loading states stay static everywhere, including on `/`.
- Motion that delays a user from reading or acting (no animation the user must wait out before the next control is usable).
- Motion that survives `prefers-reduced-motion: reduce`. The global rule in the token file collapses every animation and transition; nothing may opt out of it.
- Colour used decoratively, and any status colour used for anything but its status (contradicts section 2).

## 6. Copy

Interface copy is French. Code, identifiers, comments, docs, and commit messages are English, per the root `CLAUDE.md`. Officer- and MSME-facing copy should read as administrative French (formal register), not marketing French.

## 7. Screens

Specified against the demo moments in `docs/plan.md` section 6. First implementation in `web/`:

| Screen | Route |
|---|---|
| Sign-in, one centered card on a muted ground (shadcn `login-03`) | `/connexion` |
| Business sign-up: organisation name, matricule fiscal, email, password (same layout) | `/inscription` |
| MSME upload | `/entreprise` |
| MSME extraction review, findings with citation, abstention with named missing fact | `/entreprise/dossiers/[id]` |
| Officer queue (list) | `/agent` |
| Officer file review (validate/flag) and export confirmation (TEJ XML produced, XSD-validated) | `/agent/dossiers/[id]` |
| Admin rule registry (read-only) and corpus verification queue | `/admin` |
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
| 2026-09-13 | team | Sections 2, 3 and 5 rewritten for the modern-SaaS direction: green brand accent, warm yellow chart ramp, serif headings, ambient motion confined to the entry screen (D-055) |
