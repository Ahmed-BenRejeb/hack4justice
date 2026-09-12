# CLAUDE.md - components/

| Folder | Contents |
|---|---|
| `ui/` | Primitives: button, field, table, panel, pill, skeleton. No domain knowledge. |
| `msme/` | Business-side components |
| `officer/` | Officer console components |
| `shared/` | Used by both, for example the citation panel and the document viewer |

## Rules

- Tokens only. No raw hex, no arbitrary pixel values for anything the token scale covers. If a value is missing from the scale, add it to the scale.
- Status colour is reserved. A component may not use `--cachet`, `--amber`, or `--verified` for anything other than the status it names.
- Structure with hairlines and spacing, not with a wrapper card. Elevation is reserved for things that genuinely float: the citation panel, modals, dropdowns.
- Numbers use tabular figures. Amounts, identifiers, dates, confidence values.
- Every interactive element has a visible keyboard focus state.
- Motion follows docs/design.md. The forbidden list is enforced in review: no load-time fade-up on sections, no hover lift on cards, no scroll reveals, nothing over 400ms outside the orchestrated queue moment.
- Loading shows skeleton content shaped like the real content, never a spinner on a blank area.

## The two components that carry the demo

`shared/CitationPanel` and `officer/QueueTable`. The citation panel is the product's credibility in visual form; the queue table holds the one orchestrated motion moment. Both get more review than anything else here.

## Change Log

| Date | Author | What changed |
|---|---|---|
| 2026-09-12 | team | Initial local rules |
