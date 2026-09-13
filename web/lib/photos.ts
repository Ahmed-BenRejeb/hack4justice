/**
 * Reduces a photo in the browser before it is uploaded (G3), so a 12 MP phone picture does not
 * cross mobile data at full size. The backend reduces pages to the same size before OCR
 * (api/app/extraction/photos.py), so this loses nothing the OCR would have used.
 */
import { PHOTO_JPEG_QUALITY, PHOTO_MAX_PIXELS } from "./config.ts";

/** The size that fits `width` by `height` within `max` on its long side, or null when it already fits. */
export function fitWithin(width: number, height: number, max: number): { width: number; height: number } | null {
  const scale = max / Math.max(width, height);
  if (scale >= 1) return null;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/** The photo as an upright JPEG within PHOTO_MAX_PIXELS, or the file unchanged when it already fits or cannot be redrawn here. */
export async function shrinkPhoto(file: File): Promise<File> {
  if (typeof createImageBitmap !== "function" || typeof OffscreenCanvas !== "function") return file;
  let bitmap: ImageBitmap;
  try {
    // "from-image" applies the EXIF orientation, so the redrawn pixels are already upright.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // A format this browser cannot decode (TIFF, in most) is sent as it is; the backend reduces it.
    return file;
  }
  const size = fitWithin(bitmap.width, bitmap.height, PHOTO_MAX_PIXELS);
  const context = size && new OffscreenCanvas(size.width, size.height).getContext("2d");
  if (!size || !context) {
    bitmap.close();
    return file;
  }
  context.drawImage(bitmap, 0, 0, size.width, size.height);
  bitmap.close();
  const blob = await context.canvas.convertToBlob({ type: "image/jpeg", quality: PHOTO_JPEG_QUALITY });
  const name = `${file.name.replace(/\.[^.]+$/, "")}.jpg`;
  return new File([blob], name, { type: "image/jpeg", lastModified: file.lastModified });
}
