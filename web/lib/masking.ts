/** Reads the placeholders api/app/extraction/masking.py puts in place of identifiers (J5). */

/** A run of masked text: plain text, or a placeholder such as "[MATRICULE_1]". */
export interface MaskedSegment {
  text: string;
  placeholder: boolean;
}

const PLACEHOLDER = /\[[A-Z]+_\d+\]/g;

/** Splits masked text into plain runs and placeholders, in order, so placeholders can be marked without HTML strings. */
export function splitPlaceholders(text: string): MaskedSegment[] {
  const segments: MaskedSegment[] = [];
  let last = 0;
  for (const match of text.matchAll(PLACEHOLDER)) {
    const start = match.index;
    if (start > last) segments.push({ text: text.slice(last, start), placeholder: false });
    segments.push({ text: match[0], placeholder: true });
    last = start + match[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last), placeholder: false });
  return segments;
}
