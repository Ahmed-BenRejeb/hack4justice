/** Officer review of one pre-qualified file. */
import type { JSX } from "react";
import type { Metadata } from "next";
import { OfficerReview } from "@/components/officer/officer-review";

export const metadata: Metadata = { title: "Examen du dossier" };

/** Resolves the id from the route; the deciding officer is the signed-in user. */
export default async function OfficerDocumentPage(
  props: PageProps<"/agent/dossiers/[id]">,
): Promise<JSX.Element> {
  const { id } = await props.params;
  return <OfficerReview documentId={id} />;
}
