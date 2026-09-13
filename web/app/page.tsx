/**
 * The home page: a brochure presenting Chahed's services and method, open to everyone.
 *
 * Every claim here describes what the product does or a text marked `verified` in docs/facts.md
 * (the Article 52 I a) and Article 55 I citations, the DGI's published TEJ schema). No client
 * count, testimonial or figure appears: none is verified. No animation plays on its own
 * (docs/design.md section 5).
 */
import type { JSX } from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  BookOpenIcon,
  Building2Icon,
  CircleHelpIcon,
  FileCheckIcon,
  FileSearchIcon,
  InboxIcon,
  LandmarkIcon,
  LockIcon,
  ScaleIcon,
  ShieldCheckIcon,
  UserCheckIcon,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { STATUS_TONE } from "@/components/shared/status-badge";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/api-types";
import { fieldLabel } from "@/lib/labels";
import { getCurrentUser, ROLE_HOME } from "@/lib/session";

const ANCHORS = [
  { href: "#services", label: "Services" },
  { href: "#methode", label: "Méthode" },
  { href: "#parcours", label: "Parcours" },
  { href: "#pour-qui", label: "Pour qui" },
];

const SERVICES: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: FileSearchIcon,
    title: "Lecture des documents",
    text: "PDF numériques, scans et photos prises au téléphone. Chaque champ repéré est encadré sur la page d’origine.",
  },
  {
    icon: ScaleIcon,
    title: "Code de retenue proposé",
    text: "Le code de retenue à la source applicable est proposé avec la source, l’article et le texte intégral qui le fondent.",
  },
  {
    icon: CircleHelpIcon,
    title: "Abstention motivée",
    text: "Quand une information manque, Chahed ne devine pas : il s’abstient et nomme l’information à fournir.",
  },
  {
    icon: InboxIcon,
    title: "Dossier pré-qualifié",
    text: "L’agent reçoit un dossier déjà lu et analysé, voit ce qui manque avant de l’ouvrir, puis valide ou signale.",
  },
  {
    icon: FileCheckIcon,
    title: "Déclaration TEJ contrôlée",
    text: "La déclaration est validée contre le schéma publié par la DGI ; chaque erreur s’affiche sur le champ concerné.",
  },
  {
    icon: BookOpenIcon,
    title: "Textes juridiques vérifiés",
    text: "Recherche dans les passages comparés au texte officiel par une personne, avec un lien vers la page de la source.",
  },
];

const PRINCIPLES: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: ShieldCheckIcon,
    title: "Un jugement déterministe",
    text: "La conformité est tranchée par des règles écrites en code. Le modèle de langage extrait des faits ; il ne décide jamais si un constat existe.",
  },
  {
    icon: BookOpenIcon,
    title: "Aucun constat sans citation",
    text: "Chaque règle porte sa source, son article, le texte intégral et le lien vers le texte officiel, vérifiés par une personne.",
  },
  {
    icon: UserCheckIcon,
    title: "L’humain décide",
    text: "Le système pré-qualifie le dossier. L’agent public valide ou signale, et seul un dossier validé peut être déclaré.",
  },
  {
    icon: LockIcon,
    title: "Des identifiants masqués",
    text: "Matricule fiscal, RIB, adresse électronique et téléphone sont masqués avant tout appel à un modèle de langage.",
  },
];

const STEPS = [
  { title: "Dépôt", text: "L’entreprise ou son comptable dépose le dossier de paiement, depuis un ordinateur ou un téléphone." },
  { title: "Lecture", text: "Le texte est lu et ses identifiants masqués avant l’extraction des champs." },
  {
    title: "Application des règles",
    text: "Chaque règle du registre rend un résultat cité, ou s’abstient en nommant l’information manquante.",
  },
  { title: "Examen", text: "L’agent ouvre le dossier pré-qualifié, résout les abstentions, puis valide ou signale." },
  { title: "Déclaration", text: "Le dossier validé produit une déclaration TEJ contrôlée contre le schéma de la DGI." },
];

const AUDIENCES: { icon: LucideIcon; title: string; text: string; href: string; cta: string }[] = [
  {
    icon: Building2Icon,
    title: "Entreprises et comptables",
    text: "Déposer ses dossiers, comprendre chaque code proposé et fournir ce qui manque avant la déclaration.",
    href: "/inscription",
    cta: "Créer un compte",
  },
  {
    icon: LandmarkIcon,
    title: "Agents de l’administration",
    text: "Travailler à partir de dossiers pré-qualifiés et produire des déclarations conformes au schéma.",
    href: "/connexion",
    cta: "Se connecter",
  },
  {
    icon: ShieldCheckIcon,
    title: "Administrateurs",
    text: "Tenir le registre des règles et suivre la vérification des textes par des personnes.",
    href: "/connexion",
    cta: "Se connecter",
  },
];

// Buttons on the navy ground: a light solid one and a quiet outlined one.
const INVERSE_SOLID = "bg-card text-card-foreground hover:bg-card/90";
const INVERSE_OUTLINE =
  "border-inverse-border bg-transparent text-inverse-foreground hover:bg-inverse-accent hover:text-inverse-foreground dark:bg-transparent";

/** Sign-in and sign-up for a visitor; the way back to their own space for a signed-in person. */
function AccountActions({ user, inverse = false }: { user: User | null; inverse?: boolean }): JSX.Element {
  if (user) {
    return (
      <Button asChild className={inverse ? INVERSE_SOLID : undefined}>
        <Link href={ROLE_HOME[user.role]}>
          Accéder à mon espace
          <ArrowRightIcon aria-hidden />
        </Link>
      </Button>
    );
  }
  return (
    <>
      <Button asChild className={inverse ? INVERSE_SOLID : undefined}>
        <Link href="/inscription">Créer un compte entreprise</Link>
      </Button>
      <Button asChild variant={inverse ? "outline" : "ghost"} className={inverse ? INVERSE_OUTLINE : undefined}>
        <Link href="/connexion">Se connecter</Link>
      </Button>
    </>
  );
}

/** A section heading with the brand eyebrow. */
function SectionHeading({ id, eyebrow, title, text }: { id: string; eyebrow: string; title: string; text: string }): JSX.Element {
  return (
    <div className="max-w-2xl space-y-3">
      <p className="text-sm font-medium text-brand">{eyebrow}</p>
      <h2 id={id} className="font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
        {title}
      </h2>
      <p className="text-pretty text-muted-foreground">{text}</p>
    </div>
  );
}

/** How a file reads once analysed: one decided finding and one abstention, each with its article. */
function SampleFile(): JSX.Element {
  return (
    <figure className="rounded-xl border bg-card p-5 text-card-foreground shadow-sm">
      <figcaption className="text-xs text-muted-foreground">Exemple d’affichage, pas un dossier réel</figcaption>
      <p className="mt-2 font-medium">Dossier de paiement · honoraires</p>
      <ul className="mt-4 space-y-3">
        <li className="space-y-1.5 rounded-lg border p-3">
          <Badge variant="outline" className={STATUS_TONE.decided}>
            Décidé
          </Badge>
          <p className="text-sm">Le certificat comporte les mentions requises.</p>
          <p className="text-xs text-muted-foreground">Article 55, I · Code de l’IRPP et de l’IS, édition 2026</p>
        </li>
        <li className="space-y-1.5 rounded-lg border p-3">
          <Badge variant="outline" className={STATUS_TONE.abstained}>
            Abstention
          </Badge>
          <p className="text-sm">Information manquante : {fieldLabel("beneficiary_fiscal_regime").toLowerCase()}.</p>
          <p className="text-xs text-muted-foreground">Article 52, I, a) · Code de l’IRPP et de l’IS, édition 2026</p>
        </li>
      </ul>
    </figure>
  );
}

/** Header, lead band, services, method, steps, audiences, closing call and footer. */
export default async function HomePage(): Promise<JSX.Element> {
  const user = await getCurrentUser();

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Logo />
          <nav aria-label="Sections" className="hidden items-center gap-1 md:flex">
            {ANCHORS.map((anchor) => (
              <a
                key={anchor.href}
                href={anchor.href}
                className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {anchor.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden items-center gap-2 sm:flex">
              <AccountActions user={user} />
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="contenu" tabIndex={-1} className="outline-none">
        <section
          aria-labelledby="accroche"
          className="bg-inverse text-inverse-foreground [--ring:var(--inverse-foreground)]"
        >
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="space-y-6">
              <p className="text-sm font-medium text-inverse-muted">
                Conformité de la retenue à la source pour les TPE et PME tunisiennes
              </p>
              <h1
                id="accroche"
                className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-5xl"
              >
                Chaque conclusion fiscale, adossée à l’article qui la fonde.
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-pretty text-inverse-muted">
                Chahed lit les dossiers de paiement que détiennent déjà les entreprises, les confronte au droit
                fiscal tunisien avec une citation pour chaque constat, et remet à l’agent public un dossier
                pré-qualifié, prêt pour la déclaration TEJ.
              </p>
              <div className="flex flex-wrap gap-3">
                <AccountActions user={user} inverse />
              </div>
            </div>
            <SampleFile />
          </div>
        </section>

        <section id="services" aria-labelledby="services-titre" className="scroll-mt-16">
          <div className="mx-auto max-w-6xl space-y-10 px-4 py-16 sm:px-6 sm:py-20">
            <SectionHeading
              id="services-titre"
              eyebrow="Nos services"
              title="De la pièce justificative à la déclaration"
              text="Six services, un même principe : le système prépare le dossier, une personne décide."
            />
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SERVICES.map(({ icon: Icon, title, text }) => (
                <li key={title} className="space-y-3 rounded-xl border bg-card p-6">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-5 text-foreground" aria-hidden />
                  </span>
                  <h3 className="font-medium">{title}</h3>
                  <p className="text-sm text-muted-foreground">{text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="methode" aria-labelledby="methode-titre" className="scroll-mt-16 border-y bg-card">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="space-y-10">
              <SectionHeading
                id="methode-titre"
                eyebrow="Notre expertise"
                title="Une méthode que l’on peut vérifier"
                text="Une conclusion fiscale n’a de valeur que si l’on peut remonter à sa source. Chahed est construit autour de cette exigence."
              />
              <dl className="grid gap-8 sm:grid-cols-2">
                {PRINCIPLES.map(({ icon: Icon, title, text }) => (
                  <div key={title} className="space-y-2">
                    <dt className="flex items-center gap-2 font-medium">
                      <Icon className="size-4 text-muted-foreground" aria-hidden />
                      {title}
                    </dt>
                    <dd className="text-sm text-muted-foreground">{text}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <aside aria-labelledby="references" className="h-fit space-y-4 rounded-xl border bg-background p-6">
              <h3 id="references" className="font-medium">
                Textes de référence couverts
              </h3>
              <ul className="space-y-4 text-sm">
                <li>
                  <p>Code de l’IRPP et de l’IS, édition 2026 (DGI)</p>
                  <p className="text-muted-foreground">Article 52, paragraphe I, a) et article 55, paragraphe I</p>
                </li>
                <li>
                  <p>Schéma de la déclaration des retenues à la source (TEJ)</p>
                  <p className="text-muted-foreground">Publié par la DGI, utilisé pour valider chaque déclaration</p>
                </li>
              </ul>
              <p className="border-t pt-4 text-xs text-muted-foreground">
                Une règle n’entre au registre qu’une fois sa citation comparée au texte officiel par une personne.
              </p>
            </aside>
          </div>
        </section>

        <section id="parcours" aria-labelledby="parcours-titre" className="scroll-mt-16">
          <div className="mx-auto max-w-6xl space-y-10 px-4 py-16 sm:px-6 sm:py-20">
            <SectionHeading
              id="parcours-titre"
              eyebrow="Comment ça marche"
              title="Cinq étapes, de l’entreprise à l’administration"
              text="Chaque étape laisse une trace lisible : ce qui a été lu, la règle appliquée, et la personne qui a décidé."
            />
            <ol className="grid gap-6 md:grid-cols-5">
              {STEPS.map((step, index) => (
                <li key={step.title} className="space-y-2 border-t-2 border-brand pt-4">
                  <p className="text-sm font-medium tabular-nums text-muted-foreground">Étape {index + 1}</p>
                  <h3 className="font-medium">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="pour-qui" aria-labelledby="pour-qui-titre" className="scroll-mt-16 border-t bg-card">
          <div className="mx-auto max-w-6xl space-y-10 px-4 py-16 sm:px-6 sm:py-20">
            <SectionHeading
              id="pour-qui-titre"
              eyebrow="Pour qui"
              title="Un espace pour chaque rôle"
              text="Chacun accède aux seuls écrans de son rôle ; les comptes d’agent et d’administrateur sont créés par l’administration."
            />
            <ul className="grid gap-4 md:grid-cols-3">
              {AUDIENCES.map(({ icon: Icon, title, text, href, cta }) => (
                <li key={title} className="flex flex-col gap-4 rounded-xl border bg-background p-6">
                  <Icon className="size-5 text-muted-foreground" aria-hidden />
                  <div className="flex-1 space-y-1.5">
                    <h3 className="font-medium">{title}</h3>
                    <p className="text-sm text-muted-foreground">{text}</p>
                  </div>
                  {!user && (
                    <Link
                      href={href}
                      className="inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {cta}
                      <ArrowRightIcon className="size-4" aria-hidden />
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          aria-labelledby="appel"
          className="bg-inverse text-inverse-foreground [--ring:var(--inverse-foreground)]"
        >
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-4 py-12 sm:px-6">
            <div className="space-y-2">
              <h2 id="appel" className="font-heading text-2xl font-semibold tracking-tight">
                Déposez votre premier dossier.
              </h2>
              <p className="text-inverse-muted">Le code proposé, l’article qui le fonde, et ce qui manque, dès l’analyse.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <AccountActions user={user} inverse />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 sm:px-6">
          <Logo />
          <p className="text-sm text-muted-foreground">Conformité fiscale des TPE et PME tunisiennes</p>
        </div>
      </footer>
    </>
  );
}
