# Provenance

Downloaded 2026-09-13 from `https://jibaya.tn/wp-content/uploads/2026/03/11.pdf`, linked from `https://jibaya.tn/docs/code-de-lirpp-et-is-2026/`: the Code de l'impot sur le revenu des personnes physiques et de l'impot sur les societes (Code de l'IRPP et de l'IS), 2026 edition, published by the Direction Generale des Impots on its own portal (the same site `schemas/tej/` comes from). PDF created 2026-03-02, 125 pages, sha256 `49f6e72cb4d6066a3f3723c2d9de091bd552fe94008f72dec182b1b61ceb4b7f`.

It replaces the 2024 copy previously held here, downloaded from `alliance-tunisie.com` (a private re-host), per D-026. Article 52, paragraphe I, a) was compared across that copy, the DGI 2025 edition (`https://jibaya.tn/wp-content/uploads/2025/07/code-IS-et-IRPP-francais-1.pdf`) and this one: identical in 2025 and 2026; the 2024 copy differs only in its footnote marker and one missing "du".

## Files

- `code-irpp-is-2026.pdf` - the source PDF, byte-for-byte as downloaded. `app/corpus/load_corpus.py` reads Articles 52 through 55 from it directly ("2. RETENUES A LA SOURCE", PDF pages 84 to 98; page 99 starts "ARTICLE 56"), page by page with `pypdf`, so every chunk carries the PDF page it starts on (D-031). Its sha256 is stored with the source row.
- `manifest.json` - lists each source with its `source_id`, PDF `file`, `pages` range, `title`, `edition`, `publisher`, `language` and source `url`, consumed by `load_corpus.py`.

The plain-text extract previously kept here (`cirppis-retenues-a-la-source.txt`) was removed on 2026-09-13: it could not carry page numbers, and the loader now reads the PDF.

## Known extraction artifacts

`pypdf` keeps footnotes inline at page breaks, inserts stray spaces inside words and amendment references (for example "Art 69 -1 LF 2004 -90", "vigueu r"), and keeps curly apostrophes. These are left as extracted, not cleaned, the same way OCR output elsewhere in this pipeline is not silently rewritten. They change literal-text fidelity for retrieval, not legal content. The chunker does two things only: it drops the printed page number that opens each PDF page, and it collapses PDF line wrapping inside a paragraph (blank-line paragraph breaks are kept). Rule citations do not come from the corpus: each `rules/*.json` carries its own verbatim text, checked against the PDF.

## Verification status

Article 52, paragraphe I, a) is `verified` in `docs/facts.md` (checked by team, 2026-09-13) and grounds rule `CIRPPIS-ART52-I-A`. Everything else in Articles 52 to 55, every rate included, is not verified and must not be stated on screen or on a slide. Passage-level verification of the indexed chunks lives in `corpus/verified-passages.json` (D-032); a new edition of this PDF changes its sha256 and returns every passage to unverified.
