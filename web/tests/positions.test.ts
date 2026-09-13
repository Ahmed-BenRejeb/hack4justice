import assert from "node:assert/strict";
import { test } from "node:test";
import { bboxToStyle } from "../lib/positions.ts";

test("bboxToStyle expresses a box as a percentage of the page's own pixel size", () => {
  const style = bboxToStyle({ x0: 100, y0: 50, x1: 300, y1: 150 }, 1000, 500);

  assert.equal(style.left, "10.000%");
  assert.equal(style.top, "10.000%");
  assert.equal(style.width, "20.000%");
  assert.equal(style.height, "20.000%");
});

test("bboxToStyle handles a box spanning the whole page", () => {
  const style = bboxToStyle({ x0: 0, y0: 0, x1: 800, y1: 600 }, 800, 600);

  assert.equal(style.left, "0.000%");
  assert.equal(style.top, "0.000%");
  assert.equal(style.width, "100.000%");
  assert.equal(style.height, "100.000%");
});
