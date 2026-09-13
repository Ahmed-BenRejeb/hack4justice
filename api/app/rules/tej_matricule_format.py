"""Deterministic rule: does the supplier's matricule fiscal match the format
the DGI TEJ schema requires (TypeMatriculeFiscal, schemas/tej/TEJDeclarationRS_v1.0.xsd)?

Grounded in the published XSD, not a legal article: a real, checkable,
verbatim citation, but a different kind of ground than the other rules in
this registry (docs/decision-log.md D-044). It fires at upload, on the
supplier matricule read off the invoice, well before XSD validation would
catch the same problem at export time.
"""

import re

from app.rules.engine import Abstention, Decision, Facts, RuleOutcome

# TypeMatriculeFiscal's xs:pattern in schemas/tej/TEJDeclarationRS_v1.0.xsd.
MATRICULE_PATTERN = re.compile(r"^\d{7}[A-Z]$")


def decide_matricule_fiscal_format(facts: Facts) -> RuleOutcome:
    """Decide whether the extracted supplier matricule fiscal is well-formed.

    Facts required: "supplier_tax_id". Abstains naming it if extraction
    could not read one. The trace carries the value read and its confidence (J1).
    """
    step = facts.step("supplier_tax_id")
    trace = (step,)
    supplier_tax_id = str(step.value or "").strip()
    if not supplier_tax_id:
        return Abstention(missing_fact="supplier_tax_id", trace=trace)

    if MATRICULE_PATTERN.match(supplier_tax_id.upper()):
        return Decision(code="TEJ_MATRICULE_VALID", trace=trace)
    return Decision(code="TEJ_MATRICULE_INVALID", trace=trace)
