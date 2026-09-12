# Provenance

Downloaded 2026-09-12 from `https://jibaya.tn/wp-content/uploads/2024/05/plateforme-TEJ-shemas-xsd.zip`, linked from official DGI/TEJ platform announcements (e.g. La Presse, 2026-09-08, "Fiscalite : ce qui change sur la plateforme TEJ des septembre 2026"). `jibaya.tn` is the DGI's own tax portal domain.

This is the real schema, not a synthetic placeholder. It has not been promoted to `verified` in `docs/facts.md`: per the root CLAUDE.md rule, that promotion is a human step (checking the file against the official source, confirming it is the current version, not an outdated or draft one) that a model performing the download cannot substitute for.

## What this resolves, pending human check

- `docs/facts.md`, "Number of withholding codes": `TEJRSCodesOperations_v1.0.xsd` enumerates exactly 36 distinct codes (RS1_000001 through RS11_000001), not "more than 40". Two gaps exist in the numbering (`RS3_000002`, `RS6_000004` are absent) and there is no `RS10_*` category at all - worth asking DGI or checking the governing law about, not something to paper over.
- `docs/facts.md`, "DGI TEJ export has a published XSD schema": yes, and it is now in this repository.
- Matricule fiscal format, confirmed by `TypeMatriculeFiscal` in `TEJDeclarationRS_v1.0.xsd`: 7 digits followed by one uppercase letter (`\d{7}[A-Z]`), consistent with the real invoice tested during development (`1730424R...`).

## Files

- `TEJDeclarationRS_v1.0.xsd` - the withholding declaration structure (`DeclarationsRS`).
- `TEJRSCodesOperations_v1.0.xsd` - the withholding code enumeration, each with its administrative description. Included by the declaration schema.
- `TEJISOPaysDevises.xsd` - ISO country and currency code lists. Included by the declaration schema.
- `original/` - the three files above, byte-for-byte as downloaded, untouched. Kept for audit; never read by application code.

Note: these codes carry the DGI's administrative description, not a legal article citation (source, article number, verbatim text, url). They do not by themselves satisfy the root CLAUDE.md rule "no finding without a citation" for the rule registry; the article of the Code de l'IRPP/IS that governs each code still needs to be identified and verified separately.

## Known defect in the official file, patched in the working copy

`TEJISOPaysDevises.xsd` as published is not well-formed XML: line 1580 (right after the `IDR` currency enumeration) is a stray duplicate `</xs:enumeration>` closing tag with no matching open tag, which breaks parsing entirely (confirmed: 427 closing `</xs:enumeration>` tags against 426 opening `<xs:enumeration value=...>` tags in the original, exactly one extra). The working copy in this directory has that one line removed; `original/TEJISOPaysDevises.xsd` is untouched. This should be reported back to the DGI; it is not something to quietly work around forever.
