/** Pure helpers for the legal corpus screens: search excerpts and match labels (J2, J10). */
import type { PassageMatch } from "./api-types";

/** A run of a search excerpt: plain text, or a matched term. */
export interface ExcerptSegment {
  text: string;
  matched: boolean;
}

const MATCH_START = "\x02";
const MATCH_END = "\x03";

/**
 * Splits a `ts_headline`-marked excerpt (api/app/corpus/api.py:excerpts()) into plain runs and
 * matched terms, in order, so a match can be marked without building HTML from backend text.
 */
export function splitExcerpt(excerpt: string): ExcerptSegment[] {
  const segments: ExcerptSegment[] = [];
  let index = 0;
  while (index < excerpt.length) {
    const start = excerpt.indexOf(MATCH_START, index);
    if (start === -1) {
      segments.push({ text: excerpt.slice(index), matched: false });
      break;
    }
    if (start > index) segments.push({ text: excerpt.slice(index, start), matched: false });
    const end = excerpt.indexOf(MATCH_END, start + 1);
    const stop = end === -1 ? excerpt.length : end;
    segments.push({ text: excerpt.slice(start + 1, stop), matched: true });
    index = stop + 1;
  }
  return segments;
}

/** French label for how a search found a passage. */
export function matchLabel(match: PassageMatch): string {
  if (match === "les deux") return "Terme exact et sens proche";
  return match === "texte" ? "Terme exact" : "Sens proche";
}
