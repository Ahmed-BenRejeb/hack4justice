"use client";

/**
 * The TEJ declaration for a validated file. Field-level extraction does not exist yet, so the
 * officer enters every value the DGI schema requires; the backend builds the XML and validates
 * it against the real XSD before anything leaves the system. Nothing here is computed or guessed.
 * A refused value is explained in French on its own field (J7); formats are left to the schema
 * rather than duplicated as browser patterns, so the schema is the one that explains.
 */
import { useId, useRef, useState, type ChangeEvent, type FormEvent, type JSX, type ReactNode } from "react";
import { FileCodeIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { ErrorNotice } from "@/components/shared/api-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { api, ApiError } from "@/lib/api-client";
import type { DocumentDetail } from "@/lib/api-types";
import {
  buildExportRequest,
  exportFieldErrors,
  initialTejFormValues,
  type ExportFieldErrors,
  type TejFormValues,
} from "@/lib/tej";
import { useResource } from "@/lib/use-resource";

type TextKey = { [K in keyof TejFormValues]: TejFormValues[K] extends string ? K : never }[keyof TejFormValues];
type FlagKey = { [K in keyof TejFormValues]: TejFormValues[K] extends boolean ? K : never }[keyof TejFormValues];

/** Accessibility attributes that tie an input to its error message. */
type InvalidProps = { "aria-invalid"?: true; "aria-describedby"?: string };

const MATRICULE_HINT = "7 chiffres suivis d’une lettre";

function Field({
  label,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: (id: string, invalid: InvalidProps) => ReactNode;
}): JSX.Element {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children(id, error ? { "aria-invalid": true, "aria-describedby": errorId } : {})}
      {error ? (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
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

/** Declaration, beneficiary, then payment and operation; refused values are explained on their fields. */
export function ExportForm({ document, onExported }: ExportFormProps): JSX.Element {
  const [values, setValues] = useState<TejFormValues>(() =>
    initialTejFormValues(document.organisation.tax_id, new Date()),
  );
  const codes = useResource("operation-codes", (signal) => api.listOperationCodes(signal));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [fieldErrors, setFieldErrors] = useState<ExportFieldErrors["fields"]>({});
  const formRef = useRef<HTMLFormElement>(null);

  // Editing a field withdraws its error: the next submission says whether the new value is accepted.
  function update<K extends keyof TejFormValues>(key: K, value: TejFormValues[K]): void {
    setValues((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  const text = (key: TextKey) => ({
    value: values[key],
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => update(key, event.target.value),
  });
  const flag = (key: FlagKey) => ({
    checked: values[key],
    onChange: (event: ChangeEvent<HTMLInputElement>) => update(key, event.target.checked),
  });

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setFieldErrors({});
    try {
      await api.exportDocument(document.id, buildExportRequest(values));
      toast.success("Export TEJ produit et validé");
      onExported();
    } catch (caught) {
      const placed = caught instanceof ApiError && caught.status === 422 ? exportFieldErrors(caught.body) : null;
      if (placed && Object.keys(placed.fields).length > 0) {
        setFieldErrors(placed.fields);
        if (placed.unplaced.length > 0) {
          setError(new ApiError(422, placed.unplaced.join("; "), placed.unplaced));
        }
        // Keyboard users land on the first field to correct.
        requestAnimationFrame(() =>
          formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus(),
        );
      } else {
        setError(caught);
      }
      setIsSubmitting(false);
    }
  }

  const selectedCode = codes.data?.find((entry) => entry.code === values.code);
  const refusedCount = Object.keys(fieldErrors).length;

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
        <form ref={formRef} onSubmit={(event) => void onSubmit(event)} className="space-y-6">
          <Fieldset legend="Déclaration">
            <Field label="Période déclarée" error={fieldErrors.period}>
              {(id, invalid) => <Input id={id} type="month" required {...invalid} {...text("period")} />}
            </Field>
            <Field label="Acte de dépôt" error={fieldErrors.acteDepot}>
              {(id, invalid) => (
                <NativeSelect id={id} {...invalid} {...text("acteDepot")}>
                  <option value="0">Initial</option>
                  <option value="1">Rectificatif</option>
                </NativeSelect>
              )}
            </Field>
            <Field label="Matricule fiscal du déclarant" hint={MATRICULE_HINT} error={fieldErrors.declarantMatricule}>
              {(id, invalid) => (
                <Input id={id} required className="font-mono" {...invalid} {...text("declarantMatricule")} />
              )}
            </Field>
            <Field label="Catégorie du déclarant" error={fieldErrors.declarantCategorie}>
              {(id, invalid) => (
                <NativeSelect id={id} {...invalid} {...text("declarantCategorie")}>
                  <option value="PM">Personne morale</option>
                  <option value="PP">Personne physique patentée</option>
                </NativeSelect>
              )}
            </Field>
          </Fieldset>

          <Fieldset legend="Bénéficiaire">
            <Field label="Nom ou raison sociale" error={fieldErrors.beneficiaryName}>
              {(id, invalid) => <Input id={id} required {...invalid} {...text("beneficiaryName")} />}
            </Field>
            <Field label="Matricule fiscal" hint={MATRICULE_HINT} error={fieldErrors.beneficiaryMatricule}>
              {(id, invalid) => (
                <Input id={id} required className="font-mono" {...invalid} {...text("beneficiaryMatricule")} />
              )}
            </Field>
            <Field label="Catégorie" error={fieldErrors.beneficiaryCategorie}>
              {(id, invalid) => (
                <NativeSelect id={id} {...invalid} {...text("beneficiaryCategorie")}>
                  <option value="PM">Personne morale</option>
                  <option value="PP">Personne physique patentée</option>
                </NativeSelect>
              )}
            </Field>
            <Field label="Adresse" error={fieldErrors.beneficiaryAddress}>
              {(id, invalid) => <Input id={id} required {...invalid} {...text("beneficiaryAddress")} />}
            </Field>
            <Field label="Adresse e-mail" error={fieldErrors.beneficiaryEmail}>
              {(id, invalid) => <Input id={id} type="email" required {...invalid} {...text("beneficiaryEmail")} />}
            </Field>
            <Field label="Téléphone" error={fieldErrors.beneficiaryPhone}>
              {(id, invalid) => <Input id={id} type="tel" required {...invalid} {...text("beneficiaryPhone")} />}
            </Field>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" className="size-4 accent-primary" {...flag("beneficiaryResident")} />
              Bénéficiaire résident
            </label>
          </Fieldset>

          <Fieldset legend="Paiement et opération">
            <Field label="Date de paiement" error={fieldErrors.paymentDate}>
              {(id, invalid) => <Input id={id} type="date" required {...invalid} {...text("paymentDate")} />}
            </Field>
            <Field label="Référence du certificat" error={fieldErrors.reference}>
              {(id, invalid) => <Input id={id} required {...invalid} {...text("reference")} />}
            </Field>
            <Field
              label="Code d’opération"
              className="sm:col-span-2"
              hint={selectedCode?.description}
              error={fieldErrors.code}
            >
              {(id, invalid) =>
                codes.data === undefined && !codes.isLoading ? (
                  <ErrorNotice error={codes.error} onRetry={codes.reload} />
                ) : (
                  <NativeSelect id={id} required disabled={codes.isLoading} {...invalid} {...text("code")}>
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
            <Field label="Année de facturation" error={fieldErrors.invoiceYear}>
              {(id, invalid) => <Input id={id} required inputMode="numeric" {...invalid} {...text("invoiceYear")} />}
            </Field>
            <Field label="Taux de retenue (%)" error={fieldErrors.rate}>
              {(id, invalid) => (
                <Input id={id} type="number" required min="0" max="100" step="0.01" {...invalid} {...text("rate")} />
              )}
            </Field>
            <Field label="Montant hors taxes (TND)" error={fieldErrors.amountExclTax}>
              {(id, invalid) => (
                <Input id={id} type="number" required min="0" step="0.001" {...invalid} {...text("amountExclTax")} />
              )}
            </Field>
            <Field label="Taux de TVA (%)" error={fieldErrors.vatRate}>
              {(id, invalid) => (
                <Input id={id} type="number" required min="0" max="100" step="0.01" {...invalid} {...text("vatRate")} />
              )}
            </Field>
            <Field label="Montant de TVA (TND)" error={fieldErrors.amountVat}>
              {(id, invalid) => (
                <Input id={id} type="number" required min="0" step="0.001" {...invalid} {...text("amountVat")} />
              )}
            </Field>
            <Field label="Montant TTC (TND)" error={fieldErrors.amountInclTax}>
              {(id, invalid) => (
                <Input id={id} type="number" required min="0" step="0.001" {...invalid} {...text("amountInclTax")} />
              )}
            </Field>
            <Field label="Montant retenu (TND)" error={fieldErrors.amountWithheld}>
              {(id, invalid) => (
                <Input id={id} type="number" required min="0" step="0.001" {...invalid} {...text("amountWithheld")} />
              )}
            </Field>
            <Field label="Montant net servi (TND)" error={fieldErrors.amountNetPaid}>
              {(id, invalid) => (
                <Input id={id} type="number" required min="0" step="0.001" {...invalid} {...text("amountNetPaid")} />
              )}
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
            <p role="status" className="text-xs text-muted-foreground">
              {refusedCount > 0
                ? `Export refusé : ${refusedCount > 1 ? `${refusedCount} champs à corriger` : "1 champ à corriger"}.`
                : "Montants saisis en dinars, transmis en millimes."}
            </p>
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
