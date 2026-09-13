"use client";

/**
 * "Répondre à la question" (J4): an abstention names the fact a rule could not establish, and a
 * person answers it here. The answer is a fact, not a verdict: it is recorded against the
 * supplier, the document's rules run again, and the rule decides, exactly as it would on a fact
 * the model supplied (root CLAUDE.md design law).
 *
 * "Je ne sais pas" sends nothing: an unknown is not an answer, and the abstention correctly stands.
 */
import { useState, type FormEvent, type JSX } from "react";
import { CheckIcon, HelpCircleIcon } from "lucide-react";
import { toast } from "sonner";
import { ErrorNotice } from "@/components/shared/api-state";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import type { AnswerableFacts } from "@/lib/api-types";
import { factQuestion } from "@/lib/labels";

interface AnswerAbstentionProps {
  documentId: string;
  /** The fact the rule was missing, from the abstention. */
  missingFact: string;
  /** What this document allows: the identified supplier, and the facts with their accepted values. */
  answerable: AnswerableFacts;
  /** Who is answering; recorded with the fact and shown in the trace. */
  answeredBy: string;
  /** Reloads the file so the finding re-renders as the rule's new outcome. */
  onAnswered: () => void;
}

/**
 * The question, its answers, and the reason it cannot be asked when there is one. Renders
 * nothing when this fact is not one a person may confirm about a supplier.
 */
export function AnswerAbstention({
  documentId,
  missingFact,
  answerable,
  answeredBy,
  onAnswered,
}: AnswerAbstentionProps): JSX.Element | null {
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);

  const copy = factQuestion(missingFact);
  const accepted = answerable.facts.find((fact) => fact.fact_name === missingFact);
  if (!copy || !accepted) return null;

  // The answer is kept against the supplier, so there must be a supplier to keep it against.
  if (answerable.supplier_tax_id === null) {
    return (
      <p className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
        Le fournisseur n’est pas identifié sur ce document, la réponse ne pourrait être rattachée à
        personne. Renseignez son matricule fiscal pour répondre à cette question.
      </p>
    );
  }

  const options = accepted.values.filter((value) => copy.options.has(value));

  async function submit(event: FormEvent<HTMLFormElement>, value: string): Promise<void> {
    event.preventDefault();
    setSubmitting(value);
    setError(null);
    try {
      await api.confirmSupplierFact(documentId, {
        fact_name: missingFact,
        value,
        confirmed_by: answeredBy,
      });
      toast.success("Réponse enregistrée, la règle a été réappliquée");
      onAnswered();
    } catch (caught) {
      setError(caught);
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="rounded-lg border bg-muted/40 p-4">
      <div className="flex gap-3">
        <HelpCircleIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-sm font-medium">{copy.question}</p>
          <div className="flex flex-wrap gap-2">
            {options.map((value) => (
              <form key={value} onSubmit={(event) => void submit(event, value)}>
                <Button type="submit" variant="outline" size="sm" disabled={submitting !== null}>
                  {submitting === value ? <CheckIcon aria-hidden /> : null}
                  {copy.options.get(value)}
                </Button>
              </form>
            ))}
            {/* Answers nothing on purpose: the rule keeps abstaining rather than receiving a guess. */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={submitting !== null}
              onClick={() =>
                toast.info("Aucune réponse enregistrée : la règle reste en attente de ce fait.")
              }
            >
              Je ne sais pas
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            La réponse est conservée pour ce fournisseur et apparaîtra dans le détail du constat.
            C’est la règle qui décide, jamais la réponse seule.
          </p>
          {error !== null && <ErrorNotice error={error} />}
        </div>
      </div>
    </div>
  );
}
