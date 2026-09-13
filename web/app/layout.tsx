/** Root layout: fonts, theme, toasts, skip link, and the shared header on every screen. */
import type { JSX } from "react";
import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter, Playfair_Display } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { AppHeader } from "@/components/shared/app-header";
import { Toaster } from "@/components/ui/sonner";
import { getCurrentUser } from "@/lib/session";
import "./globals.css";

// Latin Extended covers every accented character in the French interface (docs/design.md section 3).
// Headings are the serif; everything else is the sans. The two are never mixed within a role.
const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  weight: ["700", "800"],
  variable: "--font-playfair",
});
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});
// Withholding codes, identifiers and file references stay monospaced.
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

/** Wraps every route in the providers and the application header, which shows the signed-in user. */
export default async function RootLayout({ children }: LayoutProps<"/">): Promise<JSX.Element> {
  const user = await getCurrentUser();
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${playfair.variable} ${inter.variable} ${plexMono.variable}`}
    >
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
