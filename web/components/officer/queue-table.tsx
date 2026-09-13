/**
 * Dense, scannable list of files awaiting review (docs/design.md section 4). A row that arrived
 * since the last poll plays the product's one orchestrated animation (docs/design.md section 5).
 */
import type { JSX } from "react";
import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { QueueItem } from "@/lib/api-types";
import { countLabel, formatDateTime } from "@/lib/format";
import { DocumentStatusBadge, STATUS_TONE } from "@/components/shared/status-badge";

function FindingCounts({ decided, abstained }: { decided: number; abstained: number }): JSX.Element {
  if (decided === 0 && abstained === 0) {
    return <span className="text-muted-foreground">Aucun constat</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {decided > 0 && (
        <Badge variant="outline" className={STATUS_TONE.decided}>
          {countLabel(decided, "décidé", "décidés")}
        </Badge>
      )}
      {abstained > 0 && (
        <Badge variant="outline" className={STATUS_TONE.abstained}>
          {countLabel(abstained, "abstention", "abstentions")}
        </Badge>
      )}
    </div>
  );
}

interface QueueTableProps {
  items: QueueItem[];
  /** Ids that appeared since the previous poll. */
  arrived: ReadonlySet<string>;
}

/** One row per file; the whole row opens the officer review screen. */
export function QueueTable({ items, arrived }: QueueTableProps): JSX.Element {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="px-4">Dossier</TableHead>
            <TableHead>Déposé le</TableHead>
            <TableHead>Constats</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="w-10 pr-4">
              <span className="sr-only">Ouvrir</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow
              key={item.id}
              data-arrived={arrived.has(item.id) ? "" : undefined}
              className="relative data-arrived:animate-queue-arrive"
            >
              <TableCell className="px-4 py-2.5">
                {/* The link's ::after covers the row, so the whole row is clickable with one keyboard stop. */}
                <Link
                  href={`/agent/dossiers/${encodeURIComponent(item.id)}`}
                  className="rounded-sm font-medium underline-offset-4 after:absolute after:inset-0 hover:underline"
                >
                  {item.filename}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {item.organisation_name} · {item.uploaded_by}
                </p>
              </TableCell>
              <TableCell className="text-muted-foreground tabular-nums">
                {formatDateTime(item.created_at)}
              </TableCell>
              <TableCell>
                <FindingCounts decided={item.decided_count} abstained={item.abstained_count} />
              </TableCell>
              <TableCell>
                <DocumentStatusBadge status={item.status} />
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
