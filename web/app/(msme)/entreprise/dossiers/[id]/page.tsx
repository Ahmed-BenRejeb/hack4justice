/** MSME review of one uploaded file. */
import type { JSX } from "react";
import type { Metadata } from "next";
import { DocumentReview } from "@/components/msme/document-review";

export const metadata: Metadata = { title: "Dossier" };

/** Resolves the id from the route and hands it to the client-side review. */
export default async function MsmeDocumentPage(
  props: PageProps<"/entreprise/dossiers/[id]">,
): Promise<JSX.Element> {
  const { id } = await props.params;
  return <DocumentReview documentId={id} />;
}
