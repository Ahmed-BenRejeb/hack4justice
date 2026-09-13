/** Entry screen: what Chahed does, its live numbers, and the three role spaces. */
import type { JSX } from "react";
import Link from "next/link";
import { ArrowRightIcon, BookOpenIcon, Building2Icon, LandmarkIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const SPACES = [
  {
    href: "/entreprise",
    icon: Building2Icon,
    title: "Espace entreprise",
    text: "Déposer un dossier de paiement, lire le code de retenue proposé et l’article qui le fonde.",
  },
  {
    href: "/agent",
    icon: LandmarkIcon,
    title: "Espace agent",
    text: "Examiner les dossiers pré-qualifiés, valider ou signaler, puis produire l’export TEJ.",
  },
  {
    href: "/admin",
    icon: BookOpenIcon,
    title: "Administration",
    text: "Consulter le registre des règles et la citation qui fonde chacune d’elles.",
  },
];

const PRINCIPLES = [
  {
    title: "Un jugement déterministe",
    text: "La conformité est tranchée par des règles écrites en code. Le modèle extrait et explique ; il ne décide jamais.",
  },
  {
    title: "Aucun constat sans citation",
    text: "Chaque règle porte sa source, son article, le texte intégral et le lien vers la source officielle.",
  },
  {
    title: "L’humain décide",
    text: "Le système pré-qualifie le dossier. L’agent valide ou signale.",
  },
];

/** Headline, live measurement, role space links, and the three principles behind every screen. */
export default function HomePage(): JSX.Element {
  return (
    <div>
      <section className="relative overflow-hidden px-4 pt-16 pb-20 sm:px-6 sm:pt-24">
        {/* Soft accent glow behind the headline; decorative only, so it is hidden from the tree. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 h-[500px] w-[800px] -translate-x-1/2 bg-[radial-gradient(ellipse,var(--accent-light),transparent_65%)] opacity-70"
        />

        <div className="relative mx-auto max-w-5xl">
          <div className="max-w-3xl space-y-6">
            <p className="bg-accent-light text-accent-foreground inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium">
              <span className="bg-primary size-1.5 animate-pulse-dot rounded-full" aria-hidden />
              Hack4Justice 2026, Challenge A
            </p>

            <h1 className="font-heading text-4xl font-extrabold tracking-tight text-balance sm:text-6xl">
              Chaque conclusion fiscale, adossée à l’article qui la fonde.
            </h1>

            <p className="max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground">
              Chahed lit les dossiers de paiement des entreprises, propose le code de retenue
              applicable avec sa citation, s’abstient quand une information manque et transmet à
              l’agent un dossier pré-qualifié.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button size="lg" asChild>
                <Link href="/entreprise">
                  Déposer un dossier
                  <ArrowRightIcon aria-hidden />
                </Link>
              </Button>
              <Button size="lg" variant="ghost" asChild>
                <Link href="/textes">
                  <SearchIcon aria-hidden />
                  Consulter les textes vérifiés
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Espaces" className="border-t px-4 py-16 sm:px-6">
        <nav className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
          {SPACES.map(({ href, icon: Icon, title, text }) => (
            <Link
              key={href}
              href={href}
              className="hover:border-primary flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-card transition-colors"
            >
              <Icon className="size-5 text-muted-foreground" aria-hidden />
              <div className="flex-1 space-y-1.5">
                <h2 className="font-medium">{title}</h2>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
              <span className="text-primary inline-flex items-center gap-1.5 text-sm font-medium">
                Ouvrir
                <ArrowRightIcon className="size-4" aria-hidden />
              </span>
            </Link>
          ))}
        </nav>
      </section>

      <section aria-labelledby="principes" className="border-t bg-pattern px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 id="principes" className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Trois principes, sur chaque écran
          </h2>
          <dl className="mt-8 grid gap-8 md:grid-cols-3">
            {PRINCIPLES.map(({ title, text }) => (
              <div key={title}>
                <dt className="text-sm font-medium">{title}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  );
}
