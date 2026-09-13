"use client";

/**
 * The TEJ declaration for a validated file. Field-level extraction does not exist yet, so the
 * officer enters every value the DGI schema requires; the backend builds the XML and validates
 * it against the real XSD before anything leaves the system. Nothing here is computed or guessed.
 */
import { useId, useState, type ChangeEvent, type FormEvent, type JSX, type ReactNode } from "react";
import { FileCodeIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { ErrorNotice } from "@/components/shared/api-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { api } from "@/lib/api-client";
import type { DocumentDetail } from "@/lib/api-types";
import { buildExportRequest, initialTejFormValues, type TejFormValues } from "@/lib/tej";
import { useResource } from "@/lib/use-resource";

type TextKey = { [K in keyof TejFormValues]: TejFormValues[K] extends string ? K : never }[keyof TejFormValues];
type FlagKey = { [K in keyof TejFormValues]: TejFormValues[K] extends boolean ? K : never }[keyof TejFormValues];

// Matricule fiscal format from TypeMatriculeFiscal in the TEJ schema.
const MATRICULE_PATTERN = "\\d{7}[A-Za-z]";
const MATRICULE_HINT = "7 chiffres suivis d’une lettre";

function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: (id: string) => ReactNode;
}): JSX.Element {
  const id = useId();
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children(id)}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Fieldset({ legend, children }: { legend: string; children: ReactNode }): JSX.Element {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold">{legend}</legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function shorten(text: string, length: number): string {
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}

interface ExportFormProps {
  document: DocumentDetail;
  onExported: () => void;
}

/** Declaration, beneficiary, then payment and operation; refused exports list every schema error. */
export function ExportForm({ document, onExported }: ExportFormProps): JSX.Element {
  const [values, setValues] = useState<TejFormValues>(() =>
    initialTejFormValues(document.organisation.tax_id, new Date()),
  );
  const codes = useResource("operation-codes", (signal) => api.listOperationCodes(signal));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const text = (key: TextKey) => ({
    value: values[key],
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setValues((current) => ({ ...current, [key]: event.target.value })),
  });
  const flag = (key: FlagKey) => ({
    checked: values[key],
    onChange: (event: ChangeEvent<HTMLInputElement>) =>
      setValues((current) => ({ ...current, [key]: event.target.checked })),
  });

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await api.exportDocument(document.id, buildExportRequest(values));
      toast.success("Export TEJ produit et validé");
      onExported();
    } catch (caught) {
      setError(caught);
      setIsSubmitting(false);
    }
  }

  const selectedCode = codes.data?.find((entry) => entry.code === values.code);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Déclaration TEJ</CardTitle>
        <CardDescription>
          Le dossier est validé. Renseignez la déclaration de retenue à la source : le fichier XML
          est produit, puis validé contre le schéma XSD TEJ avant de quitter le système.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(event) => void onSubmit(event)} className="space-y-6">
          <Fieldset legend="Déclaration">
            <Field label="Période déclarée">
              {(id) => <Input id={id} type="month" required {...text("period")} />}
            </Field>
            <Field label="Acte de dépôt">
              {(id) => (
                <NativeSelect id={id} {...text("acteDepot")}>
                  <option value="0">Initial</option>
                  <option value="1">Rectificatif</option>
                </NativeSelect>
              )}
            </Field>
            <Field label="Matricule fiscal du déclarant" hint={MATRICULE_HINT}>
              {(id) => (
                <Input id={id} required pattern={MATRICULE_PATTERN} className="font-mono" {...text("declarantMatricule")} />
              )}
            </Field>
            <Field label="Catégorie du déclarant">
              {(id) => (
                <NativeSelect id={id} {...text("declarantCategorie")}>
                  <option value="PM">Personne morale</option>
                  <option value="PP">Personne physique patentée</option>
                </NativeSelect>
              )}
            </Field>
          </Fieldset>

          <Fieldset legend="Bénéficiaire">
            <Field label="Nom ou raison sociale">
              {(id) => <Input id={id} required {...text("beneficiaryName")} />}
            </Field>
            <Field label="Matricule fiscal" hint={MATRICULE_HINT}>
              {(id) => (
                <Input id={id} required pattern={MATRICULE_PATTERN} className="font-mono" {...text("beneficiaryMatricule")} />
              )}
            </Field>
            <Field label="Catégorie">
              {(id) => (
                <NativeSelect id={id} {...text("beneficiaryCategorie")}>
                  <option value="PM">Personne morale</option>
                  <option value="PP">Personne physique patentée</option>
                </NativeSelect>
              )}
            </Field>
            <Field label="Adresse">{(id) => <Input id={id} required {...text("beneficiaryAddress")} />}</Field>
            <Field label="Adresse e-mail">
              {(id) => <Input id={id} type="email" required {...text("beneficiaryEmail")} />}
            </Field>
            <Field label="Téléphone">
              {(id) => <Input id={id} type="tel" required {...text("beneficiaryPhone")} />}
            </Field>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" className="size-4 accent-primary" {...flag("beneficiaryResident")} />
              Bénéficiaire résident
            </label>
          </Fieldset>

          <Fieldset legend="Paiement et opération">
            <Field label="Date de paiement">
              {(id) => <Input id={id} type="date" required {...text("paymentDate")} />}
            </Field>
            <Field label="Référence du certificat">
              {(id) => <Input id={id} required {...text("reference")} />}
            </Field>
            <Field label="Code d’opération" className="sm:col-span-2" hint={selectedCode?.description}>
              {(id) =>
                codes.data === undefined && !codes.isLoading ? (
                  <ErrorNotice error={codes.error} onRetry={codes.reload} />
                ) : (
                  <NativeSelect id={id} required disabled={codes.isLoading} {...text("code")}>
                    <option value="">
                      {codes.isLoading ? "Chargement des codes…" : "Choisissez le code de l’opération"}
                    </option>
                    {codes.data?.map((entry) => (
                      <option key={entry.code} value={entry.code}>
                        {entry.code} · {shorten(entry.description, 90)}
                      </option>
                    ))}
                  </NativeSelect>
                )
              }
            </Field>
            <Field label="Année de facturation">
              {(id) => (
                <Input id={id} required inputMode="numeric" pattern="20\d{2}" {...text("invoiceYear")} />
              )}
            </Field>
            <Field label="Taux de retenue (%)">
              {(id) => (
                <Input id={id} type="number" required min="0" max="100" step="0.01" {...text("rate")} />
              )}
            </Field>
            <Field label="Montant hors taxes (TND)">
              {(id) => <Input id={id} type="number" required min="0" step="0.001" {...text("amountExclTax")} />}
            </Field>
            <Field label="Montant TTC (TND)">
              {(id) => <Input id={id} type="number" required min="0" step="0.001" {...text("amountInclTax")} />}
            </Field>
            <Field label="Montant retenu (TND)">
              {(id) => <Input id={id} type="number" required min="0" step="0.001" {...text("amountWithheld")} />}
            </Field>
            <Field label="Montant net servi (TND)">
              {(id) => <Input id={id} type="number" required min="0" step="0.001" {...text("amountNetPaid")} />}
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4 accent-primary" {...flag("cnpc")} />
              Convention de non double imposition
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4 accent-primary" {...flag("pCharge")} />
              Prise en charge
            </label>
          </Fieldset>

          {error !== null && <ErrorNotice error={error} />}

          <div className="flex flex-wrap items-center justify-end gap-3">
            <p className="text-xs text-muted-foreground">Montants saisis en dinars, transmis en millimes.</p>
            <Button type="submit" size="lg" disabled={isSubmitting || codes.data === undefined}>
              <FileCodeIcon aria-hidden />
              {isSubmitting ? "Génération et validation…" : "Générer et valider l’export"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
