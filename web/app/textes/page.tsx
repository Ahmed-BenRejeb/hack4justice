/** Legal search entry: verified passages only (J10), above what the corpus holds. */
import type { JSX } from "react";
import type { Metadata } from "next";
import { CorpusOverview } from "@/components/corpus/corpus-overview";
import { LegalSearch } from "@/components/corpus/legal-search";

export const metadata: Metadata = { title: "Recherche dans les textes" };

export default function TextesPage(): JSX.Element {
  return (
    <div className="space-y-10">
      <LegalSearch />
      <CorpusOverview />
    </div>
  );
}
