"use client";

/**
 * Upload of a payment file for one of the signed-in user's organisations. The backend records the
 * user as its filer, reads the document and applies the rules before answering, then the review opens.
 * A paper document can be photographed page by page (G3): with this device's camera on a touch
 * screen, or with a phone that scans the QR code a laptop shows (D-057). Photos are reduced first.
 */
import { useId, useRef, useState, type DragEvent, type FormEvent, type JSX } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, UploadIcon } from "lucide-react";
import { cn } from "cn";
import { ErrorNotice } from "@/components/shared/api-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api-client";
import type { Organisation } from "@/lib/api-types";
import { OrganisationPicker } from "./organisation-picker";
import { PhoneLinkPanel } from "./phone-link-panel";
import { CameraButton, FileList, IMAGE_TYPES, isImage, usePhotoReduction } from "./photo-pages";

// The content types api/app/extraction/ocr.py can read.
const ACCEPTED_TYPES = ["application/pdf", ...IMAGE_TYPES];

/** The organisation picker when the user files for several, the file form, then the phone QR code. */
export function UploadForm({ organisations }: { organisations: Organisation[] }): JSX.Element {
  const router = useRouter();
  const inputId = useId();
  const typeErrorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  // An MSME user files for exactly one organisation, so there is nothing to choose.
  const [organisationId, setOrganisationId] = useState(organisations.length === 1 ? organisations[0].id : "");
  // One chosen file, or the photographed pages of one paper document in the order they were taken.
  const [files, setFiles] = useState<File[]>([]);
  const { preparing, prepare } = usePhotoReduction();
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasTypeError, setHasTypeError] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function choose(candidate: File | undefined): Promise<void> {
    if (!candidate) return;
    setError(null);
    const accepted = ACCEPTED_TYPES.includes(candidate.type);
    setHasTypeError(!accepted);
    setFiles(accepted ? [await prepare(candidate)] : []);
  }

  /** A photo joins the pages already taken, or replaces a PDF chosen before it. */
  async function addPhoto(candidate: File): Promise<void> {
    setError(null);
    const accepted = isImage(candidate);
    setHasTypeError(!accepted);
    if (!accepted) return;
    const photo = await prepare(candidate);
    setFiles((current) => (current.every(isImage) ? [...current, photo] : [photo]));
  }

  function remove(index: number): void {
    setFiles((current) => current.filter((_, position) => position !== index));
    if (inputRef.current) inputRef.current.value = "";
  }

  function onDrop(event: DragEvent<HTMLLabelElement>): void {
    event.preventDefault();
    setIsDragging(false);
    void choose(event.dataTransfer.files[0]);
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

  const canSubmit = files.length > 0 && preparing === 0 && Boolean(organisationId) && !isSubmitting;

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
                onChange={(event) => void choose(event.target.files?.[0])}
              />
            </label>

            {/* Touch screens only: that is where a camera sits behind the file input. */}
            <div className="pointer-fine:hidden">
              <CameraButton
                hasPages={files.length > 0 && files.every(isImage)}
                disabled={isSubmitting}
                onPhoto={(photo) => void addPhoto(photo)}
              />
            </div>

            {hasTypeError && (
              <p id={typeErrorId} role="alert" className="text-sm text-destructive">
                Format non pris en charge. Déposez un PDF, un JPEG, un PNG ou un TIFF.
              </p>
            )}

            <FileList files={files} disabled={isSubmitting} onRemove={remove} />

            {error !== null && <ErrorNotice error={error} />}

            <div className="flex flex-wrap items-center justify-end gap-3">
              {!organisationId && (
                <p className="text-xs text-muted-foreground">Choisissez d’abord une organisation.</p>
              )}
              <Button type="submit" size="lg" disabled={!canSubmit}>
                {isSubmitting ? "Lecture et analyse…" : preparing > 0 ? "Préparation des photos…" : "Analyser le dossier"}
                {!isSubmitting && preparing === 0 && <ArrowRightIcon data-icon="inline-end" aria-hidden />}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Fine pointers only: a laptop hands the camera work to a phone, a phone already has one. */}
      {organisationId && (
        <div className="pointer-coarse:hidden">
          <PhoneLinkPanel key={organisationId} organisationId={organisationId} />
        </div>
      )}
    </div>
  );
}
