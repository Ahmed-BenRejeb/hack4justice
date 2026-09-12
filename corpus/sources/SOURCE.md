# Provenance

Downloaded 2026-09-12 from `https://alliance-tunisie.com/wp-content/uploads/2024/06/CODE-IRPP-IS-2024.pdf`, a copy of the Code de l'impot sur le revenu des personnes physiques et de l'impot sur les societes (Code de l'IRPP et de l'IS), watermarked "Imprimerie Officielle de la Republique Tunisienne" throughout (the government's own official printer, the authoritative publisher of Tunisian law). Found via a web search for the code's article on retenues a la source (withholding at source), cross-referenced against `jurisitetunisie.com` and `profiscal.com`, both of which independently describe Article 52 the same way.

This is real, current text (amendments through Loi de Finances 2024, per the footnoted amendment history within the articles themselves), not a synthetic placeholder and not a paraphrase. It has not been promoted to `verified` in `docs/facts.md`: per the root CLAUDE.md rule, that promotion is a human step (checking the file against the official source, confirming it is the current, non-superseded version) that a model performing the download cannot substitute for.

## Files

- `CODE-IRPP-IS-2024.pdf` - the source PDF, byte-for-byte as downloaded. Kept for audit; never read by application code.
- `cirppis-retenues-a-la-source.txt` - Articles 52 through 55 ("2. Retenues a la source"), extracted from the PDF with `pypdf` (the same extraction path `app/extraction/ocr.py` uses for born-digital PDFs). This is what `app/corpus/load_corpus.py` actually indexes.
- `manifest.json` - lists each source file with its `source_id` and source `url`, consumed by `load_corpus.py`.

## Known extraction artifacts

`pypdf` text extraction preserves the PDF's own page furniture inline (for example "Imprimerie Officielle de la Republique Tunisienne" and a page number appear mid-paragraph at page breaks) and occasionally emits ligature/spacing quirks (double spaces, curly quotes). These are left as extracted, not manually cleaned, the same way OCR output elsewhere in this pipeline is not silently rewritten. They do not change the legal content, only its literal-text fidelity for embedding/retrieval quality.

## What this resolves, pending human check

- `corpus/sources/` had no real content; this is the first real legal text in the corpus. `app/corpus/chunking.py`'s heading regex only matched a bare "Article N" heading; the real code uses "Article N.-" (a literal period-hyphen suffix), which is the standard heading style for Tunisian codified law, not a one-off formatting quirk of this PDF. The regex was widened accordingly; see the decision log.
- Article 52's withholding rates, and their exact conditions and exceptions, are complex and have been amended many times since 1989 (each amendment cited inline in the text itself). No compliance rule has been written against this text yet: doing so accurately is a legal-content decision, not an engineering one, and is deliberately left for a scoped follow-up rather than guessed at while sourcing the text.
