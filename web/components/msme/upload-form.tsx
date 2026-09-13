"use client";

/**
 * Upload of a payment file: the organisation it is filed for, who files it, and the file.
 * The backend reads the document and applies the rules before answering, then the review opens.
 */
import { useId, useRef, useState, type DragEvent, type FormEvent, type JSX } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, FileTextIcon, UploadIcon } from "lucide-react";
import { cn } from "cn";
import { ErrorNotice } from "@/components/shared/api-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api-client";
import { formatFileSize } from "@/lib/format";
import { OrganisationPicker } from "./organisation-picker";

// The content types api/app/extraction/ocr.py can read.
const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/tiff"];

/** Organisation picker, then the file form. */
export function UploadForm(): JSX.Element {
  const router = useRouter();
  const inputId = useId();
  const emailId = useId();
  const typeErrorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [organisationId, setOrganisationId] = useState("");
  const [uploadedBy, setUploadedBy] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasTypeError, setHasTypeError] = useState(false);
  const [error, setError] = useState<unknown>(null);

  function choose(candidate: File | undefined): void {
    if (!candidate) return;
    setError(null);
    const accepted = ACCEPTED_TYPES.includes(candidate.type);
    setHasTypeError(!accepted);
    setFile(accepted ? candidate : null);
  }

  function clear(): void {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function onDrop(event: DragEvent<HTMLLabelElement>): void {
    event.preventDefault();
    setIsDragging(false);
    choose(event.dataTransfer.files[0]);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!file || !organisationId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const created = await api.uploadDocument(file, organisationId, uploadedBy.trim());
      // Stay in the submitting state: the review screen replaces this one.
      router.push(`/entreprise/dossiers/${encodeURIComponent(created.id)}`);
    } catch (caught) {
      setError(caught);
      setIsSubmitting(false);
    }
  }

  const canSubmit = Boolean(file && organisationId && uploadedBy.trim()) && !isSubmitting;

  return (
    <div className="space-y-4">
      <OrganisationPicker value={organisationId} onChange={setOrganisationId} />

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
            <div className="space-y-2">
              <Label htmlFor={emailId}>Votre adresse e-mail</Label>
              <Input
                id={emailId}
                type="email"
                autoComplete="email"
                value={uploadedBy}
                onChange={(event) => setUploadedBy(event.target.value)}
                placeholder="comptable@entreprise.tn"
                required
              />
            </div>

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

            {hasTypeError && (
              <p id={typeErrorId} role="alert" className="text-sm text-destructive">
                Format non pris en charge. Déposez un PDF, un JPEG, un PNG ou un TIFF.
              </p>
            )}

            {file && (
              <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
                <FileTextIcon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={clear} disabled={isSubmitting}>
                  Retirer
                </Button>
              </div>
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
