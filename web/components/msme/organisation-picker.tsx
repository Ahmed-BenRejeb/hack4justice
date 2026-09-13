"use client";

/**
 * Chooses which of the signed-in user's organisations a file is filed for. Only an accountant
 * files for several (A4); an MSME user's one organisation needs no choice.
 */
import { useId, type JSX } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import type { Organisation } from "@/lib/api-types";

interface OrganisationPickerProps {
  organisations: Organisation[];
  value: string;
  onChange: (organisationId: string) => void;
}

/** A select of the organisations this user files for. */
export function OrganisationPicker({ organisations, value, onChange }: OrganisationPickerProps): JSX.Element {
  const selectId = useId();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organisation</CardTitle>
        <CardDescription>L’entreprise pour le compte de laquelle le dossier est déposé.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Label htmlFor={selectId}>Organisation</Label>
        <NativeSelect id={selectId} value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="">Choisissez une organisation</option>
          {organisations.map((organisation) => (
            <option key={organisation.id} value={organisation.id}>
              {organisation.name} ({organisation.tax_id})
            </option>
          ))}
        </NativeSelect>
      </CardContent>
    </Card>
  );
}
