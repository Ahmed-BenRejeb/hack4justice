/** Quiet navigation link back to the parent screen. */
import type { JSX, ReactNode } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

/** A left-arrow link, visually secondary to the page title. */
export function BackLink({ href, children }: { href: string; children: ReactNode }): JSX.Element {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeftIcon className="size-4" aria-hidden />
      {children}
    </Link>
  );
}
