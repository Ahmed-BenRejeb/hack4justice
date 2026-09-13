/** Legal search entry: verified passages only (J10). */
import type { JSX } from "react";
import type { Metadata } from "next";
import { LegalSearch } from "@/components/corpus/legal-search";

export const metadata: Metadata = { title: "Recherche dans les textes" };

export default function TextesPage(): JSX.Element {
  return <LegalSearch />;
}
