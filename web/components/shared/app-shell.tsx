"use client";

/**
 * The frame of every signed-in space (docs/design.md section 4): a dark navigation column with the
 * screens this role may use, the account and the theme switch, then the page. Below `lg` the
 * column becomes a top bar whose menu opens on demand.
 */
import { useState, type JSX, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ActivityIcon,
  BookOpenIcon,
  ClipboardCheckIcon,
  InboxIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MenuIcon,
  ScaleIcon,
  UploadIcon,
  XIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import type { Role, User } from "@/lib/api-types";
import { signOut } from "@/lib/auth-actions";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Other paths that belong to this item, such as a file opened from it. */
  also?: string[];
}

const TEXTES: NavItem = { href: "/textes", label: "Textes juridiques", icon: BookOpenIcon };

const MSME_NAV: NavItem[] = [
  { href: "/entreprise", label: "Tableau de bord", icon: LayoutDashboardIcon },
  { href: "/entreprise/deposer", label: "Déposer un dossier", icon: UploadIcon, also: ["/entreprise/dossiers"] },
  TEXTES,
];

// The same role split the backend enforces on every route. The first item is the space's dashboard.
const SPACES: Record<Role, { title: string; nav: NavItem[] }> = {
  msme: { title: "Espace entreprise", nav: MSME_NAV },
  accountant: { title: "Espace entreprise", nav: MSME_NAV },
  officer: {
    title: "Espace agent",
    nav: [
      { href: "/agent", label: "Tableau de bord", icon: LayoutDashboardIcon },
      { href: "/agent/dossiers", label: "File des dossiers", icon: InboxIcon },
      { href: "/agent/mesures", label: "Mesures", icon: ActivityIcon },
      TEXTES,
    ],
  },
  admin: {
    title: "Administration",
    nav: [
      { href: "/admin", label: "Tableau de bord", icon: LayoutDashboardIcon },
      { href: "/admin/regles", label: "Registre des règles", icon: ScaleIcon },
      { href: "/admin/corpus", label: "Vérification du corpus", icon: ClipboardCheckIcon },
      TEXTES,
    ],
  },
};

const ROLE_LABELS: Record<Role, string> = {
  msme: "Entreprise",
  accountant: "Comptable",
  officer: "Agent",
  admin: "Administrateur",
};

// Ghost buttons default to the light ground's hover colours; these keep them legible on the dark one.
const INVERSE_BUTTON = "text-inverse-foreground hover:bg-inverse-accent hover:text-inverse-foreground";

/** A dashboard is current only on its own path, since every other screen of the space sits below it. */
function isCurrent(item: NavItem, pathname: string, isDashboard: boolean): boolean {
  if (isDashboard) return pathname === item.href;
  return [item.href, ...(item.also ?? [])].some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/** Navigation column and page; the current screen is marked with aria-current and the brand marker. */
export function AppShell({ user, children }: { user: User; children: ReactNode }): JSX.Element {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const space = SPACES[user.role];

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      {/* The ring token is re-scoped so keyboard focus stays visible on the dark ground. */}
      <aside className="bg-inverse text-inverse-foreground [--ring:var(--inverse-foreground)] lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col">
        <div className="flex h-16 shrink-0 items-center justify-between gap-3 px-4 lg:px-5">
          <Logo tone="inverse" />
          <Button
            variant="ghost"
            size="icon"
            className={cn(INVERSE_BUTTON, "lg:hidden")}
            aria-expanded={menuOpen}
            aria-controls="navigation-espace"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <XIcon aria-hidden /> : <MenuIcon aria-hidden />}
            <span className="sr-only">{menuOpen ? "Fermer le menu" : "Ouvrir le menu"}</span>
          </Button>
        </div>

        <div
          id="navigation-espace"
          className={cn("min-h-0 flex-1 flex-col border-t border-inverse-border lg:flex", menuOpen ? "flex" : "hidden")}
        >
          <nav aria-label={space.title} className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            <p className="px-3 pb-2 text-xs font-medium tracking-wide text-inverse-muted uppercase">{space.title}</p>
            {space.nav.map((item, index) => {
              const current = isCurrent(item, pathname, index === 0);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={current ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    current
                      ? "bg-inverse-accent font-medium text-inverse-foreground before:absolute before:inset-y-1.5 before:left-0 before:w-1 before:rounded-full before:bg-primary"
                      : "text-inverse-muted hover:bg-inverse-accent hover:text-inverse-foreground",
                  )}
                >
                  <item.icon className="size-4 shrink-0" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="space-y-2 border-t border-inverse-border px-4 py-4">
            <div className="min-w-0 px-1">
              <p className="truncate text-sm">{user.email}</p>
              <p className="text-xs text-inverse-muted">{ROLE_LABELS[user.role]}</p>
            </div>
            <div className="flex items-center gap-1">
              <form action={signOut} className="flex-1">
                <Button type="submit" variant="ghost" size="sm" className={cn(INVERSE_BUTTON, "w-full justify-start")}>
                  <LogOutIcon aria-hidden />
                  Se déconnecter
                </Button>
              </form>
              <ThemeToggle className={INVERSE_BUTTON} />
            </div>
          </div>
        </div>
      </aside>

      <main id="contenu" tabIndex={-1} className="min-w-0 outline-none">
        {children}
      </main>
    </div>
  );
}
