# CLAUDE.md - lib/

Domain logic. No React, no JSX, no framework imports in this tree. Anything here must be callable from a script and testable without a browser.

## Module boundaries

| Module | Owns | Must not |
|---|---|---|
| `extraction/` | Reading documents into structured fields with confidence and page coordinates | Judge compliance |
| `rules/` | Loading the registry, executing checks, producing findings and escalations | Call a model directly |
| `corpus/` | Chunking legal texts by article, retrieval, returning citations | Paraphrase a legal text |
| `counterparty/` | RNE lookups, registry-grounded risk findings | Consult non-legal sources |
| `export/` | Building the TEJ file and validating it against the XSD | Invent a field the schema does not define |
| `db/` | Persistence | Contain business rules |
| `auth/` | Sessions and role checks | Be bypassed anywhere |

## Provider isolation

`extraction/provider.ts` is the only file allowed to import a model vendor SDK or name a vendor model. Everything else calls the local interface. Swapping providers must be a one-file change.

## Confidence discipline

Every extracted value carries a confidence. Below the threshold in `config.ts`, the value is marked `needs_confirmation` and no rule may consume it until a human confirms it. Rules never run on unconfirmed values, and the system never silently substitutes a best guess.

## Caching

Model and lookup responses are cached by content hash from phase 4 onward, not added at the end. The demo must run with the network disconnected. A cache miss in safe demo mode is a loud error, never a silent live call.

## Corpus integrity

Chunks are one article each, with source, article number, text date, and URL. Retrieval returns the chunk, never a summary. If a chunk's source cannot be verified, the chunk does not enter the corpus.

## Change Log

| Date | Author | What changed |
|---|---|---|
| 2026-09-12 | team | Initial local rules |
