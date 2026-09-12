/** Admin entry: the rule registry. */
import type { JSX } from "react";
import type { Metadata } from "next";
import { RuleRegistry } from "@/components/admin/rule-registry";

export const metadata: Metadata = { title: "Registre des règles" };

/** Renders the read-only registry. */
export default function AdminPage(): JSX.Element {
  return <RuleRegistry />;
}
