# Design

Binding, not advisory. Tokens are defined once and consumed everywhere. No raw hex values outside the token file.

## 1. Brief

A public officer's tool and an MSME's tool, sharing one visual system. The tone is administrative and trustworthy, not consumer-playful: a compliance decision is being read here, not a product being sold. Built with shadcn/ui primitives (`web/components/ui/`), themed through the token file rather than shadcn's default palette.

## 2. Colour

Colour carries status and nothing else. The three status colours never appear as decoration, branding, or in a chart that isn't reporting a status.

| Token | Meaning | Notes |
|---|---|---|
| `--status-decided` | A rule reached a finding | Distinct from any brand or neutral colour |
| `--status-abstained` | A rule could not decide, a fact is missing | Never rendered as an error/danger colour - abstention is a correct outcome, not a failure |
| `--status-flagged` | An officer flagged a file | Reserved for officer actions only |

Neutral, surface, and text tokens are defined in the token file (`web/lib/tokens.css` or equivalent, to be created in phase 5) and used everywhere; no component sets a colour value directly.

## 3. Typography

A single type family for both roles' interfaces. French interface copy uses accented characters throughout; the chosen family must have full Latin Extended coverage. Exact family and scale to be fixed in phase 5 alongside the token file; until then, components use shadcn defaults rather than inventing ad hoc values.

## 4. Layout

Officer queue: list-first, dense, scannable - an officer works many files. MSME upload/review: single-file focus, one document's findings at a time, generous spacing - an MSME owner sees one file, not a queue. Both share the same component primitives from `web/components/ui/`.

## 5. Motion

Motion explains what changed. Reduced-motion preference is respected everywhere; keyboard focus is always visible and never removed by a motion effect.

### The one orchestrated moment

A file arriving in the officer queue is the single orchestrated animation in the product: it is the moment that dramatizes "the system already did the work, the officer starts from a pre-qualified file," which is the product's core claim. Nowhere else gets this treatment.

### Motion that answers a user action

Every other transition responds directly to something the user did: expanding a finding to show its citation, an abstention revealing the missing fact, a validate/flag action confirming. No transition plays on its own outside the one orchestrated moment above.

### Forbidden

- Motion as decoration: no animation that does not answer a specific state change or a specific user action.
- Looping or ambient animation of any kind.
- Motion that delays a user from reading or acting (no animation the user must wait out before the next control is usable).
- Colour used decoratively (contradicts section 2).

## 6. Copy

Interface copy is French. Code, identifiers, comments, docs, and commit messages are English, per the root `CLAUDE.md`. Officer- and MSME-facing copy should read as administrative French (formal register), not marketing French.

## 7. Screens

To be specified in detail during phase 5 (see `docs/plan.md` section 8), against the demo moments in `docs/plan.md` section 6:

- MSME upload and extraction review
- Finding with citation (expandable to verbatim article text and source URL)
- Abstention with named missing fact
- Officer queue (list) and officer file review (validate/flag)
- Export confirmation (TEJ XML produced, XSD-validated)

## 8. Quality floor

Every screen above must be legible and usable with the reduced-motion preference on, with keyboard-only navigation, and at the type scale a public-sector workstation typically runs at (do not assume a high-DPI display).

## Change log

| Date | Author | What changed |
|---|---|---|
| 2026-09-12 | team | Regenerated design doc from description-projet-v2.md scope; typography/token specifics deferred to phase 5 |
