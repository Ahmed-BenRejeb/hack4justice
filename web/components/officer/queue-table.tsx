/**
 * Dense, scannable list of pre-qualified files (docs/design.md section 4). A row that arrived
 * since the last poll plays the product's one orchestrated animation (docs/design.md section 5).
 */
import type { JSX } from "react";
import Link from "next/link";
import { CheckIcon, ChevronRightIcon, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { QueueItem } from "@/lib/api-types";
import { countLabel, formatDateTime } from "@/lib/format";
import { DocumentStatusBadge, STATUS_TONE } from "@/components/shared/status-badge";

function FindingCounts({ decided, abstained }: { decided: number; abstained: number }): JSX.Element {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge variant="outline" className={decided > 0 ? STATUS_TONE.decided : "text-muted-foreground"}>
        {countLabel(decided, "décidé", "décidés")}
      </Badge>
      {abstained > 0 && (
        <Badge variant="outline" className={STATUS_TONE.abstained}>
          {countLabel(abstained, "abstention", "abstentions")}
        </Badge>
      )}
    </div>
  );
}

function RneCell({ registered }: { registered: boolean | null }): JSX.Element {
  if (registered === null) return <span className="text-muted-foreground">Non vérifié</span>;
  const Icon = registered ? CheckIcon : XIcon;
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="size-4" aria-hidden />
      {registered ? "Inscrit" : "Non inscrit"}
    </span>
  );
}

interface QueueTableProps {
  items: QueueItem[];
  /** Ids that appeared since the previous poll. */
  arrived: ReadonlySet<string>;
}

/** One row per file; the filename links to the officer review screen. */
export function QueueTable({ items, arrived }: QueueTableProps): JSX.Element {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="px-4">Dossier</TableHead>
            <TableHead>Déposé le</TableHead>
            <TableHead>Constats</TableHead>
            <TableHead>RNE</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="w-10 pr-4">
              <span className="sr-only">Ouvrir</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow
              key={item.document_id}
              data-arrived={arrived.has(item.document_id) ? "" : undefined}
              className="relative data-arrived:animate-queue-arrive"
            >
              <TableCell className="px-4 py-2.5">
                {/* The link's ::after covers the row, so the whole row is clickable with one keyboard stop. */}
                <Link
                  href={`/agent/dossiers/${encodeURIComponent(item.document_id)}`}
                  className="rounded-sm font-medium underline-offset-4 after:absolute after:inset-0 hover:underline"
                >
                  {item.filename}
                </Link>
                <p className="text-xs text-muted-foreground">{item.organisation_name}</p>
              </TableCell>
              <TableCell className="text-muted-foreground tabular-nums">
                {formatDateTime(item.submitted_at)}
              </TableCell>
              <TableCell>
                <FindingCounts decided={item.decided_count} abstained={item.abstained_count} />
              </TableCell>
              <TableCell>
                <RneCell registered={item.counterparty_registered} />
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
