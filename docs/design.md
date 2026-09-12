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

The token file is `web/app/globals.css`. It holds a light and a dark set of cool administrative neutrals, the three status tokens, and one ink-blue accent (`--primary`) reserved for interaction: links, primary buttons, focus. System errors (a backend that cannot be reached) use `--destructive`, which is not a status colour. No component sets a colour value directly.

## 3. Typography

IBM Plex Sans (Latin and Latin Extended subsets) for all interface text in both roles; IBM Plex Mono for withholding codes, identifiers, and file references. Both are self-hosted at build time through `next/font`, so no font request leaves the workstation at runtime. Components use the shadcn type scale (`text-sm` body in dense views, `text-2xl` page titles) rather than ad hoc sizes.

## 4. Layout

Officer queue: list-first, dense, scannable - an officer works many files; the whole row opens the file. MSME upload/review: single-file focus, one document's findings at a time, generous spacing - an MSME owner sees one file, not a queue. Both share the same component primitives from `web/components/ui/`.

File review (both roles) is answer first (D-021): a result banner states the proposed code, the missing facts, the extracted fields and the RNE status before any detail. The main column holds the cited findings, then the extracted fields. A side rail holds the officer's decision and export, progress as a vertical step list, and the RNE check. Below the `lg` breakpoint the rail follows the main column.

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
| MSME upload | `/entreprise` |
| MSME extraction review, findings with citation, abstention with named missing fact | `/entreprise/dossiers/[id]` |
| Officer queue (list) | `/agent` |
| Officer file review (validate/flag) and export confirmation (TEJ XML produced, XSD-validated) | `/agent/dossiers/[id]` |
| Admin rule registry (read-only) | `/admin` |

## 8. Quality floor

Every screen above must be legible and usable with the reduced-motion preference on, with keyboard-only navigation, and at the type scale a public-sector workstation typically runs at (do not assume a high-DPI display).

## Change log

| Date | Author | What changed |
|---|---|---|
| 2026-09-12 | team | Regenerated design doc from description-projet-v2.md scope; typography/token specifics deferred to phase 5 |
| 2026-09-12 | team | Fixed token file location, status hues, IBM Plex typography; static loading states; screen-to-route table (D-020) |
| 2026-09-12 | team | Section 4: answer-first file review with a side rail, clickable queue rows (D-021) |
