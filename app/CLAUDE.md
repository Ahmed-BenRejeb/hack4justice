# CLAUDE.md - app/

Routes and API handlers. Three route groups, one per audience.

| Group | Audience | Density |
|---|---|---|
| `(msme)` | Business owner and invited accountant | Calm. More whitespace, one primary action per screen, sequential progression. |
| `(officer)` | Public agent | Dense. Tight rows, hairline separators, maximum legible information without scrolling. |
| `(admin)` | Platform admin, and the jury during the demo | Plain. Registry browser and benefit parameters. |

The density asymmetry is a deliberate product decision and is stated in the pitch. Do not normalise the two toward each other.

## Rules

- Every route checks its role server-side. A client-side guard is not a guard.
- The officer cannot edit a file. No route, handler, or component in `(officer)` may write to extracted fields or re-run analysis. The officer annotates, flags, validates, or returns the file for correction. This mirrors administrative process and keeps responsibility for the file with the business.
- Route handlers stay thin: validate input, call `lib/`, shape the response. No business logic here.
- Interface copy is French, in sentence case, active voice. An action keeps the same name through the whole flow.
- Empty states say what to do next. Errors state what happened and how to fix it, in the interface's voice.

## Change Log

| Date | Author | What changed |
|---|---|---|
| 2026-09-12 | team | Initial local rules |
