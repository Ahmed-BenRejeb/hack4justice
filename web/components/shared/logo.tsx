/** The Chahed logo and wordmark, linking home. */
import type { JSX } from "react";
import Link from "next/link";
import { cn } from "cn";

/**
 * The logo image, served from `web/public/`. `logo.svg` is a placeholder: replace the file, or
 * point this at the real one (a square image reads best, it is drawn at 32 px).
 */
export const LOGO_SRC = "/logo.svg";

/** Logo and name; `tone="inverse"` on the navy ground. */
export function Logo({ tone = "default" }: { tone?: "default" | "inverse" }): JSX.Element {
  return (
    <Link href="/" className="flex items-center gap-2.5 rounded-sm">
      {/* A plain <img>: a static local asset whose format is not known until the real logo lands. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={LOGO_SRC} alt="" width={32} height={32} className="size-8 shrink-0" />
      <span className="flex flex-col leading-tight">
        <span className="font-heading text-base font-semibold tracking-tight">Chahed</span>
        <span className={cn("text-xs", tone === "inverse" ? "text-inverse-muted" : "text-muted-foreground")}>
          Conformité fiscale
        </span>
      </span>
    </Link>
  );
}
