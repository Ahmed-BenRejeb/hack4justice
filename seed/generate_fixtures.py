"""Generates the five hero documents used to seed and rehearse the demo.

Deterministic and offline: each invoice is built from plain data below, laid
out as a born-digital PDF (a real text layer, read by pypdf's text-layer path
in app/extraction/ocr.py, not OCR). Run from the repository root:

    api/.venv/bin/python seed/generate_fixtures.py

Output goes to fixtures/hero/, which is tracked in git (the fixtures are the
demo, not a build artifact); fixtures/generated/ (background volume, seed_demo_data.py)
stays git-ignored.

Each invoice below is designed to land on one demo moment or Q&A backup
(docs/plan.md section 6, docs/feature-research.md section 6.5):

- hero-01: decides cleanly. Article 52 mention present, RS2_000002 proposed,
  Article 55 complete and coherent, matricule well formed. Moments 1 and 2,
  and the document exported end to end for moment 5.
- hero-02: the supplier's fiscal regime is never stated, so the code
  proposal abstains naming beneficiary_fiscal_regime. Moment 3.
- hero-03: a second invoice from hero-02's own supplier, regime still
  unstated in the text. Answering hero-02 once must be enough (J11): this
  file should decide without asking again.
- hero-04: the supplier's matricule fiscal is malformed. TEJ_MATRICULE_INVALID,
  an intercepted error, for the impact panel and Q&A.
- hero-05: montant_net does not equal montant_brut minus montant_retenue.
  ART55_NET_INCOHERENT, the other intercepted-error family.

The two amounts on each invoice are picked so the arithmetic a rule actually
checks (montant_net = montant_brut - montant_retenue, at the amount_incl_tax/
withholding_amount/amount_net_paid fields) is exactly right except where the
file is deliberately built to fail it (hero-05). No rate is asserted between
HT and the withholding: docs/decision-log.md D-044 leaves that base
unresolved, and these invoices state amounts directly rather than implying
one.
"""

from dataclasses import dataclass
from pathlib import Path

from fpdf import FPDF

FIXTURES_DIR = Path(__file__).resolve().parent.parent / "fixtures" / "hero"

CLIENT_NAME = "Nexsol Consulting SARL"
CLIENT_TAX_ID = "1122334M"
CLIENT_ADDRESS = "Rue du Lac Windermere, Les Berges du Lac, Tunis 1053"


@dataclass(frozen=True)
class Invoice:
    filename: str
    reference: str
    date: str
    supplier_name: str
    supplier_tax_id: str
    supplier_address: str
    service_description: str
    amount_excl_tax: str
    amount_vat: str
    amount_incl_tax: str
    withholding_rate: str
    withholding_amount: str
    amount_net_paid: str
    state_regime: str | None  # "reel", "forfait", or None to leave unstated


INVOICES = [
    Invoice(
        filename="hero-01-honoraires-clean.pdf",
        reference="FA-2026-0142",
        date="15/01/2026",
        supplier_name="Cabinet Fiscal Ben Ammar",
        supplier_tax_id="5566778A",
        supplier_address="12 Rue de Marseille, Tunis 1000",
        service_description=(
            "Honoraires de conseil fiscal et comptable pour l'exercice 2026"
        ),
        amount_excl_tax="1000.000",
        amount_vat="190.000",
        amount_incl_tax="1190.000",
        withholding_rate="15%",
        withholding_amount="150.000",
        amount_net_paid="1040.000",
        state_regime="reel",
    ),
    Invoice(
        filename="hero-02-honoraires-abstain.pdf",
        reference="FA-2026-0201",
        date="20/01/2026",
        supplier_name="Bureau d'Etudes Cherif",
        supplier_tax_id="6677889B",
        supplier_address="45 Avenue Habib Bourguiba, Sousse 4000",
        service_description="Honoraires d'expertise technique",
        amount_excl_tax="800.000",
        amount_vat="152.000",
        amount_incl_tax="952.000",
        withholding_rate="15%",
        withholding_amount="120.000",
        amount_net_paid="832.000",
        state_regime=None,
    ),
    Invoice(
        filename="hero-03-honoraires-same-supplier.pdf",
        reference="FA-2026-0245",
        date="05/02/2026",
        supplier_name="Bureau d'Etudes Cherif",
        supplier_tax_id="6677889B",
        supplier_address="45 Avenue Habib Bourguiba, Sousse 4000",
        service_description="Honoraires de consultation complementaire",
        amount_excl_tax="600.000",
        amount_vat="114.000",
        amount_incl_tax="714.000",
        withholding_rate="15%",
        withholding_amount="90.000",
        amount_net_paid="624.000",
        state_regime=None,
    ),
    Invoice(
        filename="hero-04-matricule-invalide.pdf",
        reference="FA-2026-0310",
        date="02/02/2026",
        supplier_name="Consulting Al Amal",
        supplier_tax_id="445566AB",
        supplier_address="8 Rue Ibn Khaldoun, Sfax 3000",
        service_description="Honoraires de conseil en organisation",
        amount_excl_tax="500.000",
        amount_vat="95.000",
        amount_incl_tax="595.000",
        withholding_rate="15%",
        withholding_amount="75.000",
        amount_net_paid="520.000",
        state_regime="reel",
    ),
    Invoice(
        filename="hero-05-net-incoherent.pdf",
        reference="FA-2026-0388",
        date="10/02/2026",
        supplier_name="Groupe Fiscalia",
        supplier_tax_id="9988776D",
        supplier_address="21 Avenue de la Liberte, Ariana 2080",
        service_description="Honoraires d'audit comptable",
        amount_excl_tax="700.000",
        amount_vat="133.000",
        amount_incl_tax="833.000",
        withholding_rate="15%",
        withholding_amount="100.000",
        # Deliberately wrong: 833.000 - 100.000 = 733.000, not 700.000.
        amount_net_paid="700.000",
        state_regime="reel",
    ),
]

REGIME_LINE = {
    "reel": "Le prestataire declare relever du regime reel d'imposition.",
    "forfait": "Le prestataire declare relever du regime forfaitaire d'imposition.",
}


def _build_pdf(invoice: Invoice) -> FPDF:
    pdf = FPDF(format="A4", unit="mm")
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, "FACTURE", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 11)
    pdf.ln(2)

    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 6, invoice.supplier_name, new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 6, f"Matricule fiscal : {invoice.supplier_tax_id}", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, f"Adresse : {invoice.supplier_address}", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    pdf.cell(0, 6, f"Facture N : {invoice.reference}", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, f"Date : {invoice.date}", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 6, "Client", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 6, CLIENT_NAME, new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, f"Matricule fiscal : {CLIENT_TAX_ID}", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, f"Adresse : {CLIENT_ADDRESS}", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 6, "Objet de la prestation", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 11)
    pdf.multi_cell(0, 6, invoice.service_description)
    pdf.ln(4)

    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 6, "Montants", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 11)
    rows = [
        ("Montant HT (TND)", invoice.amount_excl_tax),
        ("TVA 19% (TND)", invoice.amount_vat),
        ("Montant TTC (TND)", invoice.amount_incl_tax),
        ("Taux de retenue a la source", invoice.withholding_rate),
        ("Montant de la retenue a la source (TND)", invoice.withholding_amount),
        ("Montant net servi (TND)", invoice.amount_net_paid),
    ]
    for label, value in rows:
        pdf.cell(110, 6, label, new_x="LMARGIN", new_y="NEXT")
        pdf.set_xy(pdf.get_x() + 110, pdf.get_y() - 6)
        pdf.cell(0, 6, value, new_x="LMARGIN", new_y="NEXT")

    if invoice.state_regime is not None:
        pdf.ln(4)
        pdf.multi_cell(0, 6, REGIME_LINE[invoice.state_regime])

    return pdf


def generate_all() -> list[Path]:
    """Write every hero invoice to fixtures/hero/, return the paths written."""
    FIXTURES_DIR.mkdir(parents=True, exist_ok=True)
    written = []
    for invoice in INVOICES:
        pdf = _build_pdf(invoice)
        path = FIXTURES_DIR / invoice.filename
        pdf.output(str(path))
        written.append(path)
    return written


if __name__ == "__main__":
    for path in generate_all():
        print(f"wrote {path}")
