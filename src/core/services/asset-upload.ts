/**
 * Allowed upload MIME types and the hard Storage cap (mirrors storage.rules).
 */

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/tiff",
  "image/gif",
] as const;

export type AcceptedImageType = (typeof ACCEPTED_IMAGE_TYPES)[number];

/** Defence-in-depth cap — plan quotas are usually tighter. */
export const MAX_UPLOAD_BYTES = 80 * 1024 * 1024;

export const LOD_SIZES = [512, 1024, 2048] as const;
export type LodSize = (typeof LOD_SIZES)[number];

export function isAcceptedImageType(value: string): value is AcceptedImageType {
  return (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(value);
}

export function originalStoragePath(
  workspaceId: string,
  assetId: string,
  fileName: string,
): string {
  return `workspaces/${workspaceId}/originals/${assetId}/${fileName}`;
}

export function variantStoragePath(
  workspaceId: string,
  assetId: string,
  fileName: string,
): string {
  return `workspaces/${workspaceId}/assets/${assetId}/${fileName}`;
}

export function extensionForMime(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/tiff":
      return "tif";
    case "image/gif":
      return "gif";
    default:
      return "bin";
  }
}
