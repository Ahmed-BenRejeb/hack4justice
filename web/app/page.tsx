/** Entry screen: what Chahed does, and the three role spaces. */
import type { JSX } from "react";
import Link from "next/link";
import { ArrowRightIcon, BookOpenIcon, Building2Icon, LandmarkIcon } from "lucide-react";

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

/** Headline, role space links, and the three principles behind every screen. */
export default function HomePage(): JSX.Element {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="max-w-3xl space-y-5">
        <p className="text-sm font-medium text-muted-foreground">Conformité de la retenue à la source</p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Chaque conclusion fiscale, adossée à l’article qui la fonde.
        </h1>
        <p className="text-lg leading-relaxed text-pretty text-muted-foreground">
          Chahed lit les dossiers de paiement des entreprises, propose le code de retenue applicable
          avec sa citation, s’abstient quand une information manque et transmet à l’agent un dossier
          pré-qualifié.
        </p>
      </div>

      <nav aria-label="Choisir un espace" className="mt-12 grid gap-4 md:grid-cols-3">
        {SPACES.map(({ href, icon: Icon, title, text }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col gap-4 rounded-xl border bg-card p-6 transition-colors hover:border-foreground/25"
          >
            <Icon className="size-5 text-muted-foreground" aria-hidden />
            <div className="flex-1 space-y-1.5">
              <h2 className="font-medium">{title}</h2>
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
              Ouvrir
              <ArrowRightIcon className="size-4" aria-hidden />
            </span>
          </Link>
        ))}
      </nav>

      <section aria-labelledby="principes" className="mt-16 border-t pt-10">
        <h2 id="principes" className="sr-only">
          Principes
        </h2>
        <dl className="grid gap-8 md:grid-cols-3">
          {PRINCIPLES.map(({ title, text }) => (
            <div key={title}>
              <dt className="text-sm font-medium">{title}</dt>
              <dd className="mt-1.5 text-sm text-muted-foreground">{text}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
