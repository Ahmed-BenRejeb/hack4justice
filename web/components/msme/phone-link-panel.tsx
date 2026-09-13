"use client";

/**
 * Laptop side of phone capture (G3, D-057): a QR code the phone scans to file a document for this
 * user and organisation without signing in. The link is polled, and the review opens here once the
 * phone has filed the document.
 */
import { useEffect, useMemo, useState, type JSX } from "react";
import { useRouter } from "next/navigation";
import { QrCodeIcon } from "lucide-react";
import { encode } from "uqr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api-client";
import { createCaptureLink, type CaptureLinkResult } from "@/lib/capture-actions";
import { CAPTURE_POLL_MS } from "@/lib/config";
import { formatTime } from "@/lib/format";
import { useResource } from "@/lib/use-resource";

type ShownLink = Exclude<CaptureLinkResult, { error: string }>;

/** Shows a capture link as a QR code and opens the document the phone files through it. */
export function PhoneLinkPanel({ organisationId }: { organisationId: string }): JSX.Element {
  const router = useRouter();
  const [link, setLink] = useState<ShownLink | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ponytail: an expired link keeps being polled while the page stays open, so a document the phone
  // started filing just before expiry still opens; stop after a grace period if the requests matter.
  const linkId = link?.id ?? null;
  const status = useResource(
    linkId && `capture-link:${linkId}`,
    (signal) => api.getCaptureLink(linkId as string, signal),
    CAPTURE_POLL_MS,
  );
  const documentId = status.data?.document_id ?? null;

  // The backend refuses the link from its expiry on; the code stops being offered at the same moment.
  useEffect(() => {
    if (!link) return;
    const timer = setTimeout(() => setIsExpired(true), Date.parse(link.expires_at) - Date.now());
    return () => clearTimeout(timer);
  }, [link]);

  useEffect(() => {
    if (documentId) router.push(`/entreprise/dossiers/${encodeURIComponent(documentId)}`);
  }, [documentId, router]);

  async function show(): Promise<void> {
    setIsCreating(true);
    setError(null);
    let result: CaptureLinkResult;
    try {
      result = await createCaptureLink(organisationId);
    } catch {
      result = { error: "La demande n’a pas abouti. Réessayez dans un instant." };
    }
    setIsCreating(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setIsExpired(false);
    setLink(result);
  }

  const isWaiting = link !== null && !isExpired && !documentId;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Depuis un téléphone</CardTitle>
        <CardDescription>
          Scannez le code avec l’appareil photo du téléphone, photographiez chaque page, puis envoyez.
          Le dossier s’ouvre ici dès qu’il est analysé.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {link && !isExpired && (
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <QrCode value={link.url} />
            <div role="status" className="space-y-1 text-sm">
              <p className="font-medium">{documentId ? "Dossier reçu, ouverture…" : "En attente du téléphone"}</p>
              <p className="text-muted-foreground">
                Code valable jusqu’à {formatTime(new Date(link.expires_at))}, pour un seul dossier.
              </p>
            </div>
          </div>
        )}
        {isExpired && !documentId && (
          <p role="status" className="text-sm text-muted-foreground">
            Ce code a expiré. Affichez-en un nouveau pour continuer.
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {!documentId && (
          <Button type="button" variant={isWaiting ? "ghost" : "outline"} disabled={isCreating} onClick={() => void show()}>
            <QrCodeIcon data-icon="inline-start" aria-hidden />
            {isCreating ? "Préparation du code…" : link ? "Nouveau code" : "Afficher le code"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/** The link as a QR code, drawn from uqr's module matrix as one SVG path. */
function QrCode({ value }: { value: string }): JSX.Element {
  const { size, path } = useMemo(() => {
    // No border in the matrix: the padding around the SVG is the quiet zone.
    const { size, data } = encode(value, { border: 0 });
    const modules = data.flatMap((row, y) => row.map((dark, x) => (dark ? `M${x} ${y}h1v1h-1z` : "")));
    return { size, path: modules.join("") };
  }, [value]);

  return (
    // Dark modules on a light ground in both themes: phone cameras do not reliably read an inverted code.
    <div className="shrink-0 rounded-lg bg-qr-paper p-5">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Code QR du lien de capture"
        className="size-44 text-qr-ink"
        shapeRendering="crispEdges"
      >
        <path d={path} fill="currentColor" />
      </svg>
    </div>
  );
}
