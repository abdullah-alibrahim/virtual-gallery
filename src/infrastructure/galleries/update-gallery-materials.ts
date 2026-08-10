/**
 * Persists gallery-level material overrides (wall/floor/ceiling/trim).
 * Does not mutate the shared template catalogue.
 */

import type { GalleryMaterialOverrides } from "@/core/entities";

import { updateGalleryRoomOverrides } from "./update-gallery-room-overrides";

export async function updateGalleryMaterials(input: {
  galleryId: string;
  uid: string;
  materialOverrides: GalleryMaterialOverrides | null;
}): Promise<void> {
  await updateGalleryRoomOverrides({
    galleryId: input.galleryId,
    uid: input.uid,
    materialOverrides: input.materialOverrides,
  });
}
