/** Admin rule registry, read-only. */
import type { JSX } from "react";
import type { Metadata } from "next";
import { RuleRegistry } from "@/components/admin/rule-registry";

export const metadata: Metadata = { title: "Registre des règles" };

/** Renders the searchable registry. */
export default function RulesPage(): JSX.Element {
  return <RuleRegistry />;
}
