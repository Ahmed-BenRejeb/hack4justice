/** Header of a file review: back link, short reference as the title, then filename, date and status. */
import type { JSX } from "react";
import { FileTextIcon } from "lucide-react";
import type { DocumentDetail } from "@/lib/api-types";
import { formatDateTime, shortId } from "@/lib/format";
import { BackLink } from "./back-link";
import { DocumentStatusBadge } from "./status-badge";

interface FileHeaderProps {
  backHref: string;
  backLabel: string;
  document: Pick<DocumentDetail, "id" | "filename" | "status" | "uploaded_at">;
}

/** The short id reads better as a title than a long upload filename, which stays one line below. */
export function FileHeader({ backHref, backLabel, document }: FileHeaderProps): JSX.Element {
  return (
    <div className="space-y-4">
      <BackLink href={backHref}>{backLabel}</BackLink>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Dossier {shortId(document.id)}
          </h1>
          <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex max-w-full min-w-0 items-center gap-1.5">
              <FileTextIcon className="size-4 shrink-0" aria-hidden />
              <span className="truncate" title={document.filename}>
                {document.filename}
              </span>
            </span>
            <span>Déposé le {formatDateTime(document.uploaded_at)}</span>
          </div>
        </div>
        <DocumentStatusBadge status={document.status} />
      </div>
    </div>
  );
}
