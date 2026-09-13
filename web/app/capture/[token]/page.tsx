/** Phone capture page, opened from a laptop's QR code without signing in (G3, D-057). */
import type { JSX } from "react";
import type { Metadata } from "next";
import { PhoneCapture } from "@/components/msme/phone-capture";

export const metadata: Metadata = {
  title: "Photographier un dossier",
  // The address carries the link's token, so it is never passed on to another site.
  referrer: "no-referrer",
};

/** The token comes from the path; the backend decides whether the link is still usable. */
export default async function CapturePage({ params }: PageProps<"/capture/[token]">): Promise<JSX.Element> {
  const { token } = await params;
  return (
    <main id="contenu" tabIndex={-1} className="mx-auto w-full max-w-md px-4 py-8 outline-none">
      <PhoneCapture token={token} />
    </main>
  );
}
