/** The latest files as a dense table; the whole row opens the file (docs/design.md section 4). */
import type { JSX } from "react";
import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { RecentDocument } from "@/lib/api-types";
import { formatDateTime } from "@/lib/format";
import { DocumentStatusBadge } from "./status-badge";

interface RecentDocumentsProps {
  documents: RecentDocument[];
  /** The review route a row opens, without the trailing id, such as "/entreprise/dossiers". */
  basePath: string;
}

/** One row per file, newest first as the backend orders them. */
export function RecentDocuments({ documents, basePath }: RecentDocumentsProps): JSX.Element {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="px-4">Dossier</TableHead>
            <TableHead>Déposé le</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="w-10 pr-4">
              <span className="sr-only">Ouvrir</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((document) => (
            <TableRow key={document.id} className="relative">
              <TableCell className="px-4 py-2.5">
                {/* The link's ::after covers the row, so the whole row is clickable with one keyboard stop. */}
                <Link
                  href={`${basePath}/${encodeURIComponent(document.id)}`}
                  className="rounded-sm font-medium underline-offset-4 after:absolute after:inset-0 hover:underline"
                >
                  {document.filename}
                </Link>
                <p className="text-xs text-muted-foreground">{document.organisation_name}</p>
              </TableCell>
              <TableCell className="text-muted-foreground tabular-nums">{formatDateTime(document.created_at)}</TableCell>
              <TableCell>
                <DocumentStatusBadge status={document.status} />
              </TableCell>
              <TableCell className="pr-4 text-muted-foreground">
                <ChevronRightIcon className="size-4" aria-hidden />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
