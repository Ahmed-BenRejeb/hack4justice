/** The verified passage one citation points to (J2). */
import type { JSX } from "react";
import type { Metadata } from "next";
import { PassageReader } from "@/components/corpus/passage-reader";

export const metadata: Metadata = { title: "Passage vérifié" };

export default async function PassagePage(props: PageProps<"/textes/[chunkId]">): Promise<JSX.Element> {
  const { chunkId } = await props.params;
  return <PassageReader chunkId={chunkId} />;
}
