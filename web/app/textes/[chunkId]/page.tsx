/** The verified passage one citation points to (J2). */
import type { JSX } from "react";
import type { Metadata } from "next";
import { PassageReader } from "@/components/corpus/passage-reader";
import { PageGuide } from "@/components/shared/page-guide";

export const metadata: Metadata = { title: "Passage vérifié" };

/** The reader, with its guide closed so the passage stays first on screen. */
export default async function PassagePage(props: PageProps<"/textes/[chunkId]">): Promise<JSX.Element> {
  const { chunkId } = await props.params;
  return (
    <div className="space-y-6">
      <PageGuide
        defaultOpen={false}
        steps={[
          "Le passage affiché a été comparé au texte officiel par une personne ; un passage non vérifié n’est jamais montré.",
          "Le plan de l’article et les passages voisins permettent de lire le texte dans son contexte.",
          "Le lien vers la source ouvre la page officielle d’où le passage est tiré.",
        ]}
      />
      <PassageReader chunkId={chunkId} />
    </div>
  );
}
