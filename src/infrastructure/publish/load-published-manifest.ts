/**
 * Loads the live public manifest for a gallery slug — Storage only, no Firestore.
 */

import { NotFoundError } from "@/core/errors";
import type { SceneManifest } from "@/core/entities";

import {
  readLatestPointer,
  readManifestAtPath,
} from "./manifest-storage";

export async function loadPublishedManifestBySlug(
  slug: string,
): Promise<SceneManifest> {
  const pointer = await readLatestPointer(slug);
  if (!pointer) {
    throw new NotFoundError("PublishedGallery", slug);
  }

  const manifest = await readManifestAtPath(pointer.manifestPath);
  if (!manifest) {
    throw new NotFoundError("Manifest", pointer.manifestPath);
  }

  return manifest;
}
