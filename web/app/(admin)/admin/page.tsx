/** Admin entry: the rule registry and the corpus verification queue. */
import type { JSX } from "react";
import type { Metadata } from "next";
import { RuleRegistry } from "@/components/admin/rule-registry";
import { VerificationQueue } from "@/components/admin/verification-queue";

export const metadata: Metadata = { title: "Registre des règles" };

/** Renders the read-only registry, then what the corpus still needs verified (D-032). */
export default function AdminPage(): JSX.Element {
  return (
    <div className="space-y-12">
      <RuleRegistry />
      <VerificationQueue />
    </div>
  );
}
