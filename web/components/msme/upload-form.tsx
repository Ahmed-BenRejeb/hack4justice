"use client";

/** Drop zone and file picker for a payment file. On success, opens the file's review screen. */
import { useId, useRef, useState, type DragEvent, type FormEvent, type JSX } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, FileTextIcon, UploadIcon } from "lucide-react";
import { cn } from "cn";
import { ErrorNotice } from "@/components/shared/api-state";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { formatFileSize } from "@/lib/format";

const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png"];

/** Native file input wrapped in a label, so the drop zone is keyboard and screen-reader operable. */
export function UploadForm(): JSX.Element {
  const router = useRouter();
  const inputId = useId();
  const typeErrorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
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
    if (!file) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const created = await api.uploadDocument(file);
      // Stay in the submitting state: the review screen replaces this one.
      router.push(`/entreprise/dossiers/${encodeURIComponent(created.id)}`);
    } catch (caught) {
      setError(caught);
      setIsSubmitting(false);
    }
  }

  return (
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
          "flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed bg-card px-6 py-14 text-center transition-colors hover:border-foreground/25",
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
            PDF, JPEG ou PNG, document numérique ou numérisé
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
          Format non pris en charge. Déposez un PDF, un JPEG ou un PNG.
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

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={!file || isSubmitting}>
          {isSubmitting ? "Envoi en cours…" : "Analyser le dossier"}
          {!isSubmitting && <ArrowRightIcon data-icon="inline-end" aria-hidden />}
        </Button>
      </div>
    </form>
  );
}
