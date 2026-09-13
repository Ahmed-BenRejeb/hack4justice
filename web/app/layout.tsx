/** Root layout: fonts, theme, toasts, skip link, and the shared header on every screen. */
import type { JSX } from "react";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { AppHeader } from "@/components/shared/app-header";
import { Toaster } from "@/components/ui/sonner";
import { getCurrentUser } from "@/lib/session";
// Fonts are npm packages, never fetched from Google during the build (D-056). The container has
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

/** Wraps every route in the providers and the application header, which shows the signed-in user. */
export default async function RootLayout({ children }: LayoutProps<"/">): Promise<JSX.Element> {
  const user = await getCurrentUser();
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
          <AppHeader user={user} />
          <main id="contenu" tabIndex={-1} className="outline-none">
            {children}
          </main>
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
