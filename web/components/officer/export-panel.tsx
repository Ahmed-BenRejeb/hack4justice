"use client";

/** Produces the TEJ export for a validated file. The backend validates it against the XSD before returning. */
import { useState, type JSX } from "react";
import { FileCodeIcon } from "lucide-react";
import { toast } from "sonner";
import { ErrorNotice } from "@/components/shared/api-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api-client";

interface ExportPanelProps {
  documentId: string;
  onExported: () => void;
}

/** One button; a refusal from the backend (for example, a file not yet validated) is shown inline. */
export function ExportPanel({ documentId, onExported }: ExportPanelProps): JSX.Element {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function generate(): Promise<void> {
    setIsExporting(true);
    setError(null);
    try {
      await api.exportDocument(documentId);
      toast.success("Export TEJ produit");
      onExported();
    } catch (caught) {
      setError(caught);
      setIsExporting(false);
    }
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Export TEJ</CardTitle>
        <CardDescription>
          Produit le fichier XML TEJ et le valide contre le schéma XSD avant qu’il ne quitte le système.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error !== null && <ErrorNotice error={error} />}
        <Button size="lg" className="w-full" onClick={() => void generate()} disabled={isExporting}>
          <FileCodeIcon aria-hidden />
          {isExporting ? "Génération et validation…" : "Générer l’export TEJ"}
        </Button>
      </CardContent>
    </Card>
  );
}
