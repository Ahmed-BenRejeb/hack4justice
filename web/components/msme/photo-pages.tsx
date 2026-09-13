"use client";

/**
 * Photo pieces shared by the upload form and the phone capture page (G3): reducing photos before
 * they join a form, the camera button, and the list of what will be sent.
 */
import { useCallback, useRef, useState, type JSX } from "react";
import { CameraIcon, FileTextIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/format";
import { shrinkPhoto } from "@/lib/photos";

// The image types api/app/extraction/ocr.py can read. Only images combine into one document.
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/tiff"];

/** Whether the file is an image the backend reads, so it can be one page among several. */
export function isImage(file: File): boolean {
  return IMAGE_TYPES.includes(file.type);
}

/** Reduces images before they join a form, counting those in progress so the form waits for them. */
export function usePhotoReduction(): { preparing: number; prepare: (file: File) => Promise<File> } {
  const [preparing, setPreparing] = useState(0);
  const prepare = useCallback(async (file: File): Promise<File> => {
    if (!isImage(file)) return file;
    setPreparing((count) => count + 1);
    try {
      return await shrinkPhoto(file);
    } finally {
      setPreparing((count) => count - 1);
    }
  }, []);
  return { preparing, prepare };
}

/** Opens the phone's rear camera; each photo taken is handed to `onPhoto`. */
export function CameraButton({
  hasPages,
  disabled,
  onPhoto,
}: {
  hasPages: boolean;
  disabled: boolean;
  onPhoto: (photo: File) => void;
}): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          const photo = event.target.files?.[0];
          // Cleared so the next photo fires a change event even if the browser reuses the name.
          event.target.value = "";
          if (photo) onPhoto(photo);
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        <CameraIcon data-icon="inline-start" aria-hidden />
        {hasPages ? "Photographier la page suivante" : "Photographier le document"}
      </Button>
    </>
  );
}

/** The chosen file, or the numbered pages of one paper document, each removable. */
export function FileList({
  files,
  disabled,
  onRemove,
}: {
  files: File[];
  disabled: boolean;
  onRemove: (index: number) => void;
}): JSX.Element | null {
  if (files.length === 0) return null;
  const isPaged = files.length > 1;
  return (
    <div className="space-y-2">
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
              onClick={() => onRemove(index)}
              disabled={disabled}
              aria-label={isPaged ? `Retirer la page ${index + 1}` : undefined}
            >
              Retirer
            </Button>
          </li>
        ))}
      </ul>
      {isPaged && (
        <p className="text-xs text-muted-foreground">
          Les {files.length} pages seront analysées comme un seul document.
        </p>
      )}
    </div>
  );
}
