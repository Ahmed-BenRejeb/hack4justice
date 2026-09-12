# CLAUDE.md - corpus/

The legal texts the product cites. Small, curated, and exact beats large and noisy.

`sources/` holds the raw texts as downloaded, unmodified, with the URL and retrieval date recorded. `chunks/` holds the article-level chunks used for retrieval.

## Rules

- One article, one chunk. Never chunk by fixed size. A chunk that spans two articles cannot produce a clean citation.
- Required metadata on every chunk: source, article number, date of the text, URL, retrieval date.
- Verbatim only. Never store a paraphrase, a translation, or a model-generated summary in this tree.
- A text whose official source cannot be reached does not enter the corpus. Substitute another text rather than citing something unverifiable.
- When a chunk backs a rule or a slide, its article number is recorded in docs/facts.md and checked by a person.

## Known trap

Article numbers in secondary sources are frequently wrong, including in professional commentary. An earlier draft of our plan cited the wrong article for a registry obligation. Read the article number off the text itself, in the official source.

## Change Log

| Date | Author | What changed |
|---|---|---|
| 2026-09-12 | team | Initial local rules |
