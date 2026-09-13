/** Unit tests for lib/corpus.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { matchLabel, splitExcerpt } from "../lib/corpus.ts";

test("splitExcerpt separates matched terms from the text around them", () => {
  assert.deepEqual(splitExcerpt("Les \x02honoraires\x03 et les \x02commissions\x03 sont visés."), [
    { text: "Les ", matched: false },
    { text: "honoraires", matched: true },
    { text: " et les ", matched: false },
    { text: "commissions", matched: true },
    { text: " sont visés.", matched: false },
  ]);
});

test("splitExcerpt leaves unmarked text whole, and handles an unterminated marker", () => {
  assert.deepEqual(splitExcerpt("Aucun terme marqué ici."), [
    { text: "Aucun terme marqué ici.", matched: false },
  ]);
  assert.deepEqual(splitExcerpt(""), []);
  assert.deepEqual(splitExcerpt("Début \x02sans fin"), [
    { text: "Début ", matched: false },
    { text: "sans fin", matched: true },
  ]);
});

test("matchLabel names each match kind in French", () => {
  assert.equal(matchLabel("texte"), "Terme exact");
  assert.equal(matchLabel("sens"), "Sens proche");
  assert.equal(matchLabel("les deux"), "Terme exact et sens proche");
});
