/** Unit tests for the size a photo is reduced to before upload (lib/photos.ts). */
import assert from "node:assert/strict";
import { test } from "node:test";
import { PHOTO_MAX_PIXELS } from "../lib/config.ts";
import { fitWithin } from "../lib/photos.ts";

test("a phone photo is reduced to the maximum on its long side, keeping its proportions", () => {
  assert.deepEqual(fitWithin(4032, 3024, 3000), { width: 3000, height: 2250 });
  assert.deepEqual(fitWithin(3024, 4032, 3000), { width: 2250, height: 3000 });
});

test("a photo that already fits is left as it is", () => {
  assert.equal(fitWithin(3000, 2000, 3000), null);
  assert.equal(fitWithin(1200, 1600, PHOTO_MAX_PIXELS), null);
});
