"use client";

/**
 * Phone side of capture through a QR code (G3, D-057). Opened without signing in: the link is the
 * permission. The pages are photographed, reduced, and filed as one document for the person whose
 * laptop showed the code, and the analysis opens on that laptop.
 */
import { useState, type JSX } from "react";
import { ErrorNotice, LoadingBlock } from "@/components/shared/api-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api, ApiError } from "@/lib/api-client";
import { useResource } from "@/lib/use-resource";
import { CameraButton, FileList, isImage, usePhotoReduction } from "./photo-pages";

/** Checks the link, then takes the pages and sends them. */
export function PhoneCapture({ token }: { token: string }): JSX.Element {
  const invite = useResource(`capture-invite:${token}`, (signal) => api.getCaptureInvite(token, signal));
  const [files, setFiles] = useState<File[]>([]);
  const { preparing, prepare } = usePhotoReduction();
  const [hasTypeError, setHasTypeError] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function addPhoto(candidate: File): Promise<void> {
    setError(null);
    const accepted = isImage(candidate);
    setHasTypeError(!accepted);
    if (!accepted) return;
    const photo = await prepare(candidate);
    setFiles((current) => [...current, photo]);
  }

  async function send(): Promise<void> {
    setIsSending(true);
    setError(null);
    try {
      await api.sendCapturedPhotos(token, files);
      setIsSent(true);
    } catch (caught) {
      setError(caught);
    }
    setIsSending(false);
  }

  if (invite.isLoading) return <LoadingBlock label="Vérification du lien" />;
  // Used, expired or never made: the backend does not say which, and the remedy is the same.
  if (invite.error instanceof ApiError && invite.error.status === 404) {
    return (
      <Notice
        title="Ce lien n’est plus valable"
        text="Affichez un nouveau code sur l’ordinateur, puis scannez-le."
      />
    );
  }
  if (!invite.data) return <ErrorNotice error={invite.error} onRetry={invite.reload} />;
  if (isSent) {
    return (
      <Notice title="Dossier envoyé" text="L’analyse s’affiche sur l’ordinateur. Vous pouvez fermer cette page." />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Photographier le dossier</CardTitle>
        <CardDescription>
          Pour {invite.data.organisation_name}. Photographiez chaque page dans l’ordre, puis envoyez.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <CameraButton hasPages={files.length > 0} disabled={isSending} onPhoto={(photo) => void addPhoto(photo)} />
        {hasTypeError && (
          <p role="alert" className="text-sm text-destructive">
            Format non pris en charge. Photographiez la page en JPEG ou en PNG.
          </p>
        )}
        <FileList
          files={files}
          disabled={isSending}
          onRemove={(index) => setFiles((current) => current.filter((_, position) => position !== index))}
        />
        {error !== null && <ErrorNotice error={error} />}
        <Button
          type="button"
          size="lg"
          className="w-full"
          disabled={files.length === 0 || preparing > 0 || isSending}
          onClick={() => void send()}
        >
          {isSending ? "Envoi et analyse…" : preparing > 0 ? "Préparation des photos…" : "Envoyer le dossier"}
        </Button>
      </CardContent>
    </Card>
  );
}

function Notice({ title, text }: { title: string; text: string }): JSX.Element {
  return (
    <Card role="status">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{text}</CardDescription>
      </CardHeader>
    </Card>
  );
}
