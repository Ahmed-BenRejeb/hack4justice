/** The produced TEJ file and whether it passed XSD validation. */
import type { JSX } from "react";
import { FileCheckIcon, FileXIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TejExport } from "@/lib/api-types";
import { formatDateTime } from "@/lib/format";

/** Validation outcome first, then the file reference and validation time. */
export function ExportResult({ result }: { result: TejExport }): JSX.Element {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Export TEJ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {result.xsd_validated ? (
          <div className="flex items-start gap-3">
            <FileCheckIcon className="mt-0.5 size-5 shrink-0" aria-hidden />
            <div>
              <p className="text-sm font-semibold">Validation XSD réussie</p>
              <p className="text-sm text-muted-foreground">Le fichier XML est conforme au schéma TEJ.</p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 text-destructive">
            <FileXIcon className="mt-0.5 size-5 shrink-0" aria-hidden />
            <div>
              <p className="text-sm font-semibold">Échec de la validation XSD</p>
              <p className="text-sm">Le fichier n’est pas conforme au schéma et ne quitte pas le système.</p>
            </div>
          </div>
        )}
        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Référence du fichier</dt>
            <dd className="mt-0.5 font-mono text-xs break-all">{result.xml_ref}</dd>
          </div>
          {result.validated_at && (
            <div>
              <dt className="text-xs text-muted-foreground">Validé le</dt>
              <dd className="mt-0.5">{formatDateTime(result.validated_at)}</dd>
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}
