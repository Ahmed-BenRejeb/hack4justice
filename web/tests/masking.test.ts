/** Unit tests for lib/masking.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { splitPlaceholders } from "../lib/masking.ts";

test("splitPlaceholders separates placeholders from the text around them", () => {
  assert.deepEqual(splitPlaceholders("[NOM_1], MF [MATRICULE_12]."), [
    { text: "[NOM_1]", placeholder: true },
    { text: ", MF ", placeholder: false },
    { text: "[MATRICULE_12]", placeholder: true },
    { text: ".", placeholder: false },
  ]);
});

test("splitPlaceholders leaves text without placeholders, or with bracketed ordinary text, whole", () => {
  assert.deepEqual(splitPlaceholders("Montant [HT] 1 000"), [{ text: "Montant [HT] 1 000", placeholder: false }]);
  assert.deepEqual(splitPlaceholders(""), []);
});
