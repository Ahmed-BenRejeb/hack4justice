/** Pure helpers behind the officer queue view. */
import type { QueueItem } from "./api-types";

/** The queue views an officer can switch between. */
export type QueueFilter = "all" | "abstained" | "decided";

/**
 * Ids present in this poll but absent from the previous one. The first load has no previous
 * poll and reports nothing, so files already waiting never play the arrival animation.
 */
export function newArrivals(
  previousIds: ReadonlySet<string> | null,
  currentIds: readonly string[],
): Set<string> {
  if (previousIds === null) return new Set();
  return new Set(currentIds.filter((id) => !previousIds.has(id)));
}

/**
 * "abstained" keeps files with at least one abstention awaiting a human answer;
 * "decided" keeps files where every evaluated rule reached a finding.
 */
export function filterQueue(items: readonly QueueItem[], filter: QueueFilter): QueueItem[] {
  if (filter === "abstained") return items.filter((item) => item.abstained_count > 0);
  if (filter === "decided") {
    return items.filter((item) => item.abstained_count === 0 && item.decided_count > 0);
  }
  return [...items];
}

/** Every fact some file in the queue is missing, each once, sorted. */
export function queueMissingFacts(items: readonly Pick<QueueItem, "missing_facts">[]): string[] {
  return [...new Set(items.flatMap((item) => item.missing_facts))].sort();
}

/** Files whose abstentions name the fact; an empty fact keeps every file. */
export function withMissingFact(items: readonly QueueItem[], fact: string): QueueItem[] {
  return fact === "" ? [...items] : items.filter((item) => item.missing_facts.includes(fact));
}
