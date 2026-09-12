/** What the system established before the officer opened the file: the "already checked" list. */
import type { JSX } from "react";
import { Building2Icon, CircleHelpIcon, FileTextIcon, ListChecksIcon, type LucideIcon } from "lucide-react";
import { cn } from "cn";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DocumentDetail, Finding } from "@/lib/api-types";
import { countLabel } from "@/lib/format";

function rneSummary(check: DocumentDetail["counterparty_check"]): string {
  if (!check) return "Fournisseur non vérifié au RNE";
  const registration = check.registered ? "Fournisseur inscrit au RNE" : "Fournisseur non inscrit au RNE";
  const identifiers = check.identifiers_match ? "identifiants concordants" : "identifiants non concordants";
  return `${registration}, ${identifiers}`;
}

interface SummaryLine {
  icon: LucideIcon;
  text: string;
  tone?: string;
}

/** Compact checklist summarising findings, abstentions, extracted fields and the RNE check. */
export function PrequalificationSummary({
  document,
  findings,
}: {
  document: DocumentDetail;
  findings: Finding[];
}): JSX.Element {
  const decided = findings.filter((finding) => finding.status === "decided").length;
  const abstained = findings.length - decided;
  const assisted = document.extractions.filter((extraction) => extraction.source === "assisted").length;

  const lines: SummaryLine[] = [
    { icon: ListChecksIcon, text: `${countLabel(decided, "constat décidé", "constats décidés")}, chacun cité` },
    ...(abstained > 0
      ? [
          {
            icon: CircleHelpIcon,
            text: `${countLabel(abstained, "abstention", "abstentions")} : information manquante à obtenir`,
            tone: "text-status-abstained",
          },
        ]
      : []),
    {
      icon: FileTextIcon,
      text: `${countLabel(document.extractions.length, "champ extrait", "champs extraits")}, dont ${countLabel(assisted, "assisté", "assistés")}`,
    },
    { icon: Building2Icon, text: rneSummary(document.counterparty_check) },
  ];

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Déjà vérifié</CardTitle>
        <CardDescription>Ce que le système a établi avant votre examen.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2.5">
          {lines.map(({ icon: Icon, text, tone }) => (
            <li key={text} className="flex items-start gap-2.5 text-sm">
              <Icon className={cn("mt-0.5 size-4 shrink-0 text-muted-foreground", tone)} aria-hidden />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
