/** Root layout: fonts, theme, tooltips, toasts, skip link, and the shared header on every screen. */
import type { JSX } from "react";
import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { AppHeader } from "@/components/shared/app-header";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

// Latin Extended covers every accented character in the French interface (docs/design.md section 3).
const plexSans = IBM_Plex_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: { default: "Chahed", template: "%s · Chahed" },
  description:
    "Conformité de la retenue à la source pour les entreprises tunisiennes, chaque conclusion adossée à l’article qui la fonde.",
};

/** Wraps every route in the providers and the application header. */
export default function RootLayout({ children }: LayoutProps<"/">): JSX.Element {
  return (
    <html lang="fr" suppressHydrationWarning className={`${plexSans.variable} ${plexMono.variable}`}>
      <body className="min-h-dvh antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <TooltipProvider delayDuration={300}>
            <a
              href="#contenu"
              className="sr-only rounded-md border bg-card px-3 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50"
            >
              Aller au contenu
            </a>
            <AppHeader />
            <main id="contenu" tabIndex={-1} className="outline-none">
              {children}
            </main>
            <Toaster position="bottom-right" />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
