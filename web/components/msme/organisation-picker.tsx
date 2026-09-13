"use client";

/**
 * Chooses the organisation a file is filed for, or creates one. There is no sign-in yet, so
 * this is how an upload gets its `organisation_id` (GET and POST /organisations).
 */
import { useId, useState, type FormEvent, type JSX } from "react";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { ErrorNotice } from "@/components/shared/api-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { ApiError, api } from "@/lib/api-client";
import { useResource } from "@/lib/use-resource";

function createErrorMessage(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  if (error.status === 409) return "Une organisation porte déjà ce matricule fiscal.";
  if (error.status === 422) return "Renseignez le nom et le matricule fiscal.";
  return null;
}

interface OrganisationPickerProps {
  value: string;
  onChange: (organisationId: string) => void;
}

/** A select of existing organisations, with an inline form to add one. */
export function OrganisationPicker({ value, onChange }: OrganisationPickerProps): JSX.Element {
  const selectId = useId();
  const nameId = useId();
  const taxId = useId();
  const organisations = useResource("organisations", (signal) => api.listOrganisations(signal));
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [matricule, setMatricule] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [createError, setCreateError] = useState<unknown>(null);

  const list = organisations.data ?? [];
  // With no organisation yet, the form to add one is the only useful thing to show.
  const showForm = isAdding || (organisations.data !== undefined && list.length === 0);

  async function create(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSaving(true);
    setCreateError(null);
    try {
      const created = await api.createOrganisation({ name, tax_id: matricule });
      toast.success(`Organisation « ${created.name} » enregistrée`);
      organisations.reload();
      onChange(created.id);
      setName("");
      setMatricule("");
      setIsAdding(false);
    } catch (error) {
      setCreateError(error);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organisation</CardTitle>
        <CardDescription>L’entreprise pour le compte de laquelle le dossier est déposé.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {organisations.isLoading ? (
          <p role="status" className="text-sm text-muted-foreground">
            Chargement des organisations…
          </p>
        ) : organisations.data === undefined ? (
          <ErrorNotice error={organisations.error} onRetry={organisations.reload} />
        ) : (
          list.length > 0 && (
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Label htmlFor={selectId}>Organisation</Label>
                <NativeSelect
                  id={selectId}
                  value={value}
                  onChange={(event) => onChange(event.target.value)}
                >
                  <option value="">Choisissez une organisation</option>
                  {list.map((organisation) => (
                    <option key={organisation.id} value={organisation.id}>
                      {organisation.name} ({organisation.tax_id})
                    </option>
                  ))}
                </NativeSelect>
              </div>
              {!showForm && (
                <Button type="button" variant="outline" onClick={() => setIsAdding(true)}>
                  <PlusIcon aria-hidden />
                  Nouvelle organisation
                </Button>
              )}
            </div>
          )
        )}

        {showForm && (
          <form onSubmit={(event) => void create(event)} className="space-y-3 rounded-lg border bg-muted/30 p-4">
            <p className="text-sm font-medium">Nouvelle organisation</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={nameId}>Nom ou raison sociale</Label>
                <Input id={nameId} value={name} onChange={(event) => setName(event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor={taxId}>Matricule fiscal</Label>
                <Input
                  id={taxId}
                  value={matricule}
                  onChange={(event) => setMatricule(event.target.value)}
                  className="font-mono"
                  required
                />
              </div>
            </div>
            {createError !== null &&
              (createErrorMessage(createError) ? (
                <p role="alert" className="text-sm text-destructive">
                  {createErrorMessage(createError)}
                </p>
              ) : (
                <ErrorNotice error={createError} />
              ))}
            <div className="flex flex-wrap justify-end gap-2">
              {list.length > 0 && (
                <Button type="button" variant="ghost" onClick={() => setIsAdding(false)} disabled={isSaving}>
                  Annuler
                </Button>
              )}
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Enregistrement…" : "Enregistrer l’organisation"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
