/** Root layout: fonts, theme, toasts and the skip link. Each screen family draws its own frame and `<main>`. */
import type { JSX } from "react";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
// Fonts are npm packages, never fetched from Google during the build (D-059). The container has
// no route to fonts.gstatic.com, and an image build must not depend on one. The variable families
// carry every weight the interface uses in a single file; Plex Mono is static, so it names its two.
import "@fontsource-variable/playfair-display/index.css";
import "@fontsource-variable/inter/index.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./globals.css";

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
    <html lang="fr" suppressHydrationWarning>
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
