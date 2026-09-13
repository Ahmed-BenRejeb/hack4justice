"use client";

/** Top bar on every screen: product name, the three role spaces, and the theme switch. */
import { useEffect, useState, type JSX } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { ThemeToggle } from "./theme-toggle";

const SPACES = [
  { href: "/entreprise", label: "Entreprise", shortLabel: "Entreprise" },
  { href: "/agent", label: "Agent", shortLabel: "Agent" },
  { href: "/textes", label: "Textes", shortLabel: "Textes" },
  { href: "/admin", label: "Administration", shortLabel: "Admin" },
] as const;

/** Sticky header; the current space is marked with aria-current. */
export function AppHeader(): JSX.Element {
  const pathname = usePathname();
  // The border and lift appear only once the page has moved, so the header sits flat at rest.
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = (): void => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-card/85 backdrop-blur-sm transition-shadow",
        scrolled ? "shadow-card" : "border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:gap-8 sm:px-6">
        <Link href="/" className="flex items-baseline gap-2 rounded-sm">
          <span className="font-heading text-lg font-bold tracking-tight">Chahed</span>
          <span className="hidden text-xs text-muted-foreground md:inline">Conformité fiscale</span>
        </Link>
        <nav aria-label="Espaces" className="flex min-w-0 items-center gap-1">
          {SPACES.map((space) => {
            const active = pathname.startsWith(space.href);
            return (
              <Link
                key={space.href}
                href={space.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  active && "bg-muted font-medium text-foreground",
                )}
              >
                <span className="sm:hidden">{space.shortLabel}</span>
                <span className="hidden sm:inline">{space.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
