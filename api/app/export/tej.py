"""Builds a DGI TEJ withholding declaration ("DeclarationsRS") XML.

Generates against the real schema in schemas/tej/ (see schemas/tej/SOURCE.md
for provenance: downloaded from the DGI's own jibaya.tn portal). This module
knows the TEJ XML structure; it does not decide amounts, codes, or whether a
certificate should be filed at all - those come from the caller (ultimately,
the officer's validated decision).
"""

from dataclasses import dataclass
from pathlib import Path

from lxml import etree

from app.config import settings
from app.export.xsd import validate

SCHEMA_PATH = Path(settings.schemas_dir) / "tej" / "TEJDeclarationRS_v1.0.xsd"


@dataclass(frozen=True)
class Declarant:
    matricule_fiscal: str
    categorie: str  # "PP" or "PM"


@dataclass(frozen=True)
class Beneficiaire:
    matricule_fiscal: str
    categorie: str  # "PP" or "PM"
    nom_ou_raison_sociale: str
    adresse: str
    email: str
    telephone: str
    resident: bool = True


@dataclass(frozen=True)
class Operation:
    code: str  # a TypeCodesOperations value, e.g. "RS7_000001"
    annee_facturation: str
    montant_ht: int
    taux_rs: str
    taux_tva: str  # two decimals, e.g. "19.00"
    montant_tva: int
    montant_ttc: int
    montant_rs: int
    montant_net_servi: int
    cnpc: bool = False
    p_charge: bool = False


@dataclass(frozen=True)
class Certificat:
    beneficiaire: Beneficiaire
    date_payement: str  # "DD/MM/YYYY"
    reference: str
    operations: list[Operation]


def _bool_tag(value: bool) -> str:
    return "1" if value else "0"


def build_declaration(
    declarant: Declarant,
    annee_depot: str,
    mois_depot: str,
    certificats: list[Certificat],
    acte_depot: str = "0",
) -> bytes:
    """Build a DeclarationsRS XML document adding the given certificates."""
    root = etree.Element("DeclarationsRS", VersionSchema="1.0")

    declarant_el = etree.SubElement(root, "Declarant")
    etree.SubElement(declarant_el, "TypeIdentifiant").text = "1"
    etree.SubElement(declarant_el, "Identifiant").text = declarant.matricule_fiscal
    etree.SubElement(declarant_el, "CategorieContribuable").text = declarant.categorie

    reference_el = etree.SubElement(root, "ReferenceDeclaration")
    etree.SubElement(reference_el, "ActeDepot").text = acte_depot
    etree.SubElement(reference_el, "AnneeDepot").text = annee_depot
    etree.SubElement(reference_el, "MoisDepot").text = mois_depot

    ajouter_el = etree.SubElement(root, "AjouterCertificats")
    for certificat in certificats:
        _add_certificat(ajouter_el, certificat)

    return etree.tostring(root, xml_declaration=True, encoding="UTF-8")


def _add_certificat(parent: etree._Element, certificat: Certificat) -> None:
    certificat_el = etree.SubElement(parent, "Certificat")

    beneficiaire_el = etree.SubElement(certificat_el, "Beneficiaire")
    id_taxpayer_el = etree.SubElement(beneficiaire_el, "IdTaxpayer")
    matricule_el = etree.SubElement(id_taxpayer_el, "MatriculeFiscal")
    etree.SubElement(matricule_el, "TypeIdentifiant").text = "1"
    etree.SubElement(
        matricule_el, "Identifiant"
    ).text = certificat.beneficiaire.matricule_fiscal
    etree.SubElement(
        matricule_el, "CategorieContribuable"
    ).text = certificat.beneficiaire.categorie
    etree.SubElement(beneficiaire_el, "Resident").text = _bool_tag(
        certificat.beneficiaire.resident
    )
    etree.SubElement(
        beneficiaire_el, "NometprenonOuRaisonsociale"
    ).text = certificat.beneficiaire.nom_ou_raison_sociale
    etree.SubElement(beneficiaire_el, "Adresse").text = certificat.beneficiaire.adresse
    contact_el = etree.SubElement(beneficiaire_el, "InfosContact")
    etree.SubElement(contact_el, "AdresseMail").text = certificat.beneficiaire.email
    etree.SubElement(contact_el, "NumTel").text = certificat.beneficiaire.telephone

    etree.SubElement(certificat_el, "DatePayement").text = certificat.date_payement
    etree.SubElement(
        certificat_el, "Ref_certif_chez_declarant"
    ).text = certificat.reference

    liste_operations_el = etree.SubElement(certificat_el, "ListeOperations")
    total_ht = total_tva = total_ttc = total_rs = total_net = 0
    for operation in certificat.operations:
        _add_operation(liste_operations_el, operation)
        total_ht += operation.montant_ht
        total_tva += operation.montant_tva
        total_ttc += operation.montant_ttc
        total_rs += operation.montant_rs
        total_net += operation.montant_net_servi

    total_el = etree.SubElement(certificat_el, "TotalPayement")
    etree.SubElement(total_el, "TotalMontantHT").text = str(total_ht)
    etree.SubElement(total_el, "TotalMontantTVA").text = str(total_tva)
    etree.SubElement(total_el, "TotalMontantTTC").text = str(total_ttc)
    etree.SubElement(total_el, "TotalMontantRS").text = str(total_rs)
    etree.SubElement(total_el, "TotalMontantNetServi").text = str(total_net)


def _add_operation(parent: etree._Element, operation: Operation) -> None:
    operation_el = etree.SubElement(parent, "Operation", IdTypeOperation=operation.code)
    etree.SubElement(
        operation_el, "AnneeFacturation"
    ).text = operation.annee_facturation
    etree.SubElement(operation_el, "CNPC").text = _bool_tag(operation.cnpc)
    etree.SubElement(operation_el, "P_Charge").text = _bool_tag(operation.p_charge)
    etree.SubElement(operation_el, "MontantHT").text = str(operation.montant_ht)
    etree.SubElement(operation_el, "TauxRS").text = operation.taux_rs
    etree.SubElement(operation_el, "TauxTVA").text = operation.taux_tva
    etree.SubElement(operation_el, "MontantTVA").text = str(operation.montant_tva)
    etree.SubElement(operation_el, "MontantTTC").text = str(operation.montant_ttc)
    etree.SubElement(operation_el, "MontantRS").text = str(operation.montant_rs)
    etree.SubElement(operation_el, "MontantNetServi").text = str(
        operation.montant_net_servi
    )


def build_and_validate(
    declarant: Declarant,
    annee_depot: str,
    mois_depot: str,
    certificats: list[Certificat],
    acte_depot: str = "0",
) -> bytes:
    """Build a declaration and validate it against the real TEJ schema before returning it."""
    xml_bytes = build_declaration(
        declarant, annee_depot, mois_depot, certificats, acte_depot
    )
    validate(xml_bytes, SCHEMA_PATH)
    return xml_bytes
