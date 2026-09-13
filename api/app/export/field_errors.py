"""Places each refused export value on the request field it came from (J7, C3).

The schema names an XML element; the officer typed a request field. This module
maps one to the other and adds the arithmetic the schema cannot check
(docs/feature-research.md C3). Each error has FastAPI's own validation shape
(loc, msg, type) with a loc relative to the export request body, so the web
places schema, arithmetic and request validation errors on the same fields.
"""

import re
from dataclasses import dataclass

from app.export.tej import Certificat
from app.export.xsd import SchemaError


@dataclass(frozen=True)
class FieldError:
    """A refused value: its request field (empty when none matches), message and type."""

    loc: tuple[str | int, ...]
    msg: str
    type: str


_DECLARATION_FIELDS = {
    "Declarant/Identifiant": "declarant_matricule_fiscal",
    "Declarant/CategorieContribuable": "declarant_categorie",
    "ReferenceDeclaration/ActeDepot": "acte_depot",
    "ReferenceDeclaration/AnneeDepot": "annee_depot",
    "ReferenceDeclaration/MoisDepot": "mois_depot",
}
_CERTIFICAT_FIELDS: dict[str, tuple[str, ...]] = {
    "Beneficiaire/IdTaxpayer/MatriculeFiscal/Identifiant": (
        "beneficiaire",
        "matricule_fiscal",
    ),
    "Beneficiaire/IdTaxpayer/MatriculeFiscal/CategorieContribuable": (
        "beneficiaire",
        "categorie",
    ),
    "Beneficiaire/Resident": ("beneficiaire", "resident"),
    "Beneficiaire/NometprenonOuRaisonsociale": (
        "beneficiaire",
        "nom_ou_raison_sociale",
    ),
    "Beneficiaire/Adresse": ("beneficiaire", "adresse"),
    "Beneficiaire/InfosContact/AdresseMail": ("beneficiaire", "email"),
    "Beneficiaire/InfosContact/NumTel": ("beneficiaire", "telephone"),
    "DatePayement": ("date_payement",),
    "Ref_certif_chez_declarant": ("reference",),
}
_OPERATION_FIELDS = {
    "AnneeFacturation": "annee_facturation",
    "CNPC": "cnpc",
    "P_Charge": "p_charge",
    "MontantHT": "montant_ht",
    "TauxRS": "taux_rs",
    "TauxTVA": "taux_tva",
    "MontantTVA": "montant_tva",
    "MontantTTC": "montant_ttc",
    "MontantRS": "montant_rs",
    "MontantNetServi": "montant_net_servi",
}

# lxml adds a 1-based [n] to an element only when its parent holds several of that name.
_CERTIFICAT_PATH = re.compile(
    r"^/DeclarationsRS/AjouterCertificats/Certificat(?:\[(\d+)\])?(?:/(.*))?$"
)
_OPERATION_PATH = re.compile(r"^ListeOperations/Operation(?:\[(\d+)\])?(?:/(.*))?$")
_ROOT = "/DeclarationsRS/"


def _index(position: str | None) -> int:
    return int(position) - 1 if position else 0


def _field_loc(error: SchemaError) -> tuple[str | int, ...]:
    certificat = _CERTIFICAT_PATH.match(error.path)
    if certificat is None:
        field = _DECLARATION_FIELDS.get(error.path.removeprefix(_ROOT))
        return (field,) if field else ()

    certificat_loc = ("certificats", _index(certificat.group(1)))
    within_certificat = certificat.group(2) or ""
    operation = _OPERATION_PATH.match(within_certificat)
    if operation is None:
        fields = _CERTIFICAT_FIELDS.get(within_certificat)
        return certificat_loc + fields if fields else ()

    operation_loc = certificat_loc + ("operations", _index(operation.group(1)))
    child = operation.group(2)
    if child is None:
        # The code is the Operation's IdTypeOperation attribute, so its error names
        # the Operation element; any other error there (a missing child) has no field.
        return operation_loc + ("code",) if "IdTypeOperation" in error.message else ()
    field = _OPERATION_FIELDS.get(child)
    return operation_loc + (field,) if field else ()


def schema_field_errors(errors: list[SchemaError]) -> list[FieldError]:
    """Each schema refusal on the request field whose value the schema refused."""
    return [
        FieldError(
            loc=_field_loc(error), msg=error.message, type=f"xsd.{error.type_name}"
        )
        for error in errors
    ]


def arithmetic_field_errors(certificats: list[Certificat]) -> list[FieldError]:
    """Operations whose amounts do not add up: HT + VAT = TTC, and withheld + net paid = TTC.

    Compared in integer millimes, so there is no rounding tolerance. Rates are
    never recomputed: a withholding rate comes from a cited rule, not arithmetic.
    Certificate totals are summed from the operations by app/export/tej.py, so
    they cannot disagree and are not checked here.
    """
    errors: list[FieldError] = []
    for certificat_index, certificat in enumerate(certificats):
        for operation_index, operation in enumerate(certificat.operations):
            loc = ("certificats", certificat_index, "operations", operation_index)
            ht_plus_tva = operation.montant_ht + operation.montant_tva
            if ht_plus_tva != operation.montant_ttc:
                errors.append(
                    FieldError(
                        loc=loc + ("montant_ttc",),
                        msg=f"MontantHT + MontantTVA = {ht_plus_tva}, MontantTTC = {operation.montant_ttc}",
                        type="arithmetic.ht_plus_tva",
                    )
                )
            rs_plus_net = operation.montant_rs + operation.montant_net_servi
            if rs_plus_net != operation.montant_ttc:
                errors.append(
                    FieldError(
                        loc=loc + ("montant_net_servi",),
                        msg=f"MontantRS + MontantNetServi = {rs_plus_net}, MontantTTC = {operation.montant_ttc}",
                        type="arithmetic.rs_plus_net",
                    )
                )
    return errors
