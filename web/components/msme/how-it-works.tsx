/** What happens to a file after upload, in the five steps of docs/plan.md section 4. */
import type { JSX } from "react";

const STEPS = [
  {
    title: "Lecture",
    text: "Le texte du document est lu : directement pour un PDF numérique, par reconnaissance de caractères pour un scan.",
  },
  {
    title: "Application des règles",
    text: "Chaque règle du registre est appliquée au texte lu, et propose un code ou s’abstient.",
  },
  {
    title: "Preuve",
    text: "Chaque conclusion est accompagnée de l’article retrouvé, consultable en un clic.",
  },
  {
    title: "Abstention",
    text: "Quand les informations ne permettent pas de trancher, le système le dit et nomme ce qui manque.",
  },
  {
    title: "Restitution",
    text: "Le dossier pré-qualifié est transmis à un agent, qui valide ou signale.",
  },
];

/** Numbered list of pipeline steps with a note on data handling. */
export function HowItWorks(): JSX.Element {
  return (
    <section aria-labelledby="how-it-works" className="space-y-5">
      <h2 id="how-it-works" className="font-heading text-lg font-semibold tracking-tight">
        Ce qui se passe ensuite
      </h2>
      <ol className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span
              aria-hidden
              className="flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium tabular-nums text-muted-foreground"
            >
              {index + 1}
            </span>
            <div className="space-y-0.5">
              <p className="text-sm font-medium">{step.title}</p>
              <p className="text-sm text-muted-foreground">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="border-t pt-4 text-xs text-muted-foreground">
        La lecture du document et l’application des règles sont effectuées sur le serveur de
        l’application, sans appel à un service externe.
      </p>
    </section>
  );
}
