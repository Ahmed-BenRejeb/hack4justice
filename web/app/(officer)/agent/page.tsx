/** Officer entry: the queue of pre-qualified files. */
import type { JSX } from "react";
import type { Metadata } from "next";
import { OfficerQueue } from "@/components/officer/officer-queue";

export const metadata: Metadata = { title: "File des dossiers" };

/** Renders the polling queue. */
export default function OfficerQueuePage(): JSX.Element {
  return <OfficerQueue />;
}
