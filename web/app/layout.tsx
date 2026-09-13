/** Root layout: fonts, theme, toasts and the skip link. Each screen family draws its own frame and `<main>`. */
import type { JSX } from "react";
import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
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

/**
 * Wraps every route in the providers. The frame differs by screen family (the home page's header,
 * a space's navigation column, the centred sign-in card), so each renders its own `<main id="contenu">`
 * and the skip link below always lands on the content.
 */
export default function RootLayout({ children }: LayoutProps<"/">): JSX.Element {
  return (
    <html lang="fr" suppressHydrationWarning className={`${plexSans.variable} ${plexMono.variable}`}>
      <body className="min-h-dvh antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <a
            href="#contenu"
            className="sr-only rounded-md border bg-card px-3 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50"
          >
            Aller au contenu
          </a>
          {children}
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
