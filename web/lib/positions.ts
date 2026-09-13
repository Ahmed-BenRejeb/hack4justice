/**
 * Places a field's bounding box (in a page's own pixel space) as a percentage-based CSS
 * rectangle, so it lines up with the page image regardless of how large the browser renders it
 * (the image is shown at its natural aspect ratio, so a percentage of its pixel size is also a
 * percentage of its displayed size).
 */
import type { BBox } from "./api-types";

export interface BoxStyle {
  left: string;
  top: string;
  width: string;
  height: string;
}

export function bboxToStyle(bbox: BBox, pageWidth: number, pageHeight: number): BoxStyle {
  const percent = (value: number, total: number) => `${((value / total) * 100).toFixed(3)}%`;
  return {
    left: percent(bbox.x0, pageWidth),
    top: percent(bbox.y0, pageHeight),
    width: percent(bbox.x1 - bbox.x0, pageWidth),
    height: percent(bbox.y1 - bbox.y0, pageHeight),
  };
}
