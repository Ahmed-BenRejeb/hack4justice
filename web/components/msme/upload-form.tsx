"use client";

/**
 * Upload of a payment file for one of the signed-in user's organisations. The backend records the
 * user as its filer, reads the document and applies the rules before answering, then the review opens.
 * On a phone, a paper document can be photographed page by page and filed as one document (G3).
 */
import { useId, useRef, useState, type DragEvent, type FormEvent, type JSX } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, CameraIcon, FileTextIcon, UploadIcon } from "lucide-react";
import { cn } from "cn";
import { ErrorNotice } from "@/components/shared/api-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api-client";
import type { Organisation } from "@/lib/api-types";
import { formatFileSize } from "@/lib/format";
import { OrganisationPicker } from "./organisation-picker";

// The content types api/app/extraction/ocr.py can read. Only images combine into one document.
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/tiff"];
const ACCEPTED_TYPES = ["application/pdf", ...IMAGE_TYPES];

const isImage = (file: File): boolean => IMAGE_TYPES.includes(file.type);

/** The organisation picker when the user files for several, then the file form. */
export function UploadForm({ organisations }: { organisations: Organisation[] }): JSX.Element {
  const router = useRouter();
  const inputId = useId();
  const typeErrorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  // An MSME user files for exactly one organisation, so there is nothing to choose.
  const [organisationId, setOrganisationId] = useState(organisations.length === 1 ? organisations[0].id : "");
  // One chosen file, or the photographed pages of one paper document in the order they were taken.
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasTypeError, setHasTypeError] = useState(false);
  const [error, setError] = useState<unknown>(null);

  function choose(candidate: File | undefined): void {
    if (!candidate) return;
    setError(null);
    const accepted = ACCEPTED_TYPES.includes(candidate.type);
    setHasTypeError(!accepted);
    setFiles(accepted ? [candidate] : []);
  }

  /** A photo joins the pages already taken, or replaces a PDF chosen before it. */
  function addPhoto(candidate: File | undefined): void {
    // Reset so the next capture fires a change event even if the browser reuses the name.
    if (cameraRef.current) cameraRef.current.value = "";
    if (!candidate) return;
    setError(null);
    const accepted = isImage(candidate);
    setHasTypeError(!accepted);
    if (accepted) setFiles((current) => (current.every(isImage) ? [...current, candidate] : [candidate]));
  }

  function remove(index: number): void {
    setFiles((current) => current.filter((_, position) => position !== index));
    if (inputRef.current) inputRef.current.value = "";
  }

  function onDrop(event: DragEvent<HTMLLabelElement>): void {
    event.preventDefault();
    setIsDragging(false);
    choose(event.dataTransfer.files[0]);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (files.length === 0 || !organisationId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const created = await api.uploadDocument(files, organisationId);
      // Stay in the submitting state: the review screen replaces this one.
      router.push(`/entreprise/dossiers/${encodeURIComponent(created.id)}`);
    } catch (caught) {
      setError(caught);
      setIsSubmitting(false);
    }
  }

  const canSubmit = files.length > 0 && Boolean(organisationId) && !isSubmitting;
  const isPaged = files.length > 1;

  return (
    <div className="space-y-4">
      {organisations.length > 1 && (
        <OrganisationPicker organisations={organisations} value={organisationId} onChange={setOrganisationId} />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Dossier de paiement</CardTitle>
          <CardDescription>
            Le document est lu, puis les règles du registre lui sont appliquées. Cela peut prendre
            quelques secondes pour un document numérisé.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(event) => void onSubmit(event)} className="space-y-4">
            <label
              htmlFor={inputId}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed bg-card px-6 py-12 text-center transition-colors hover:border-foreground/25",
                "has-[:focus-visible]:border-ring has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                isDragging && "border-primary bg-primary/5",
              )}
            >
              <span className="pointer-events-none flex size-12 items-center justify-center rounded-full bg-muted">
                <UploadIcon className="size-5 text-muted-foreground" aria-hidden />
              </span>
              <span className="pointer-events-none space-y-1">
                <span className="block text-sm font-medium">
                  Glissez le dossier de paiement ici, ou{" "}
                  <span className="text-primary underline underline-offset-4">choisissez un fichier</span>
                </span>
                <span className="block text-xs text-muted-foreground">
                  PDF, JPEG, PNG ou TIFF, document numérique ou numérisé
                </span>
              </span>
              <input
                ref={inputRef}
                id={inputId}
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                className="sr-only"
                aria-describedby={hasTypeError ? typeErrorId : undefined}
                onChange={(event) => choose(event.target.files?.[0])}
              />
            </label>

            {/* Touch screens only: that is where a camera sits behind the file input. */}
            <div className="pointer-fine:hidden">
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                tabIndex={-1}
                aria-hidden
                onChange={(event) => addPhoto(event.target.files?.[0])}
              />
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
                onClick={() => cameraRef.current?.click()}
              >
                <CameraIcon data-icon="inline-start" aria-hidden />
                {files.length > 0 && files.every(isImage) ? "Photographier la page suivante" : "Photographier le document"}
              </Button>
            </div>

            {hasTypeError && (
              <p id={typeErrorId} role="alert" className="text-sm text-destructive">
                Format non pris en charge. Déposez un PDF, un JPEG, un PNG ou un TIFF.
              </p>
            )}

            {files.length > 0 && (
              <ul className="space-y-2">
                {files.map((item, index) => (
                  <li
                    key={`${index}-${item.name}-${item.lastModified}`}
                    className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3"
                  >
                    <FileTextIcon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{isPaged ? `Page ${index + 1}` : item.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(item.size)}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      disabled={isSubmitting}
                      aria-label={isPaged ? `Retirer la page ${index + 1}` : undefined}
                    >
                      Retirer
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            {isPaged && (
              <p className="text-xs text-muted-foreground">
                Les {files.length} pages seront analysées comme un seul document.
              </p>
            )}

            {error !== null && <ErrorNotice error={error} />}

            <div className="flex flex-wrap items-center justify-end gap-3">
              {!organisationId && (
                <p className="text-xs text-muted-foreground">Choisissez d’abord une organisation.</p>
              )}
              <Button type="submit" size="lg" disabled={!canSubmit}>
                {isSubmitting ? "Lecture et analyse…" : "Analyser le dossier"}
                {!isSubmitting && <ArrowRightIcon data-icon="inline-end" aria-hidden />}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
