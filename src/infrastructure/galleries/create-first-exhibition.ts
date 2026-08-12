/**
 * Creates the artist's first draft gallery and hangs the starter pack
 * so onboarding lands in a room that already looks like a show.
 */

import { getTemplateById } from "@/core/templates";
import { fillWithSamplePaintings } from "@/features/editor/lib/fill-sample-paintings";
import { createGalleryDocument } from "@/infrastructure/galleries/create-gallery";
import { saveGalleryArtworks } from "@/infrastructure/galleries/save-artworks";

export async function createFirstExhibition(input: {
  readonly uid: string;
  readonly workspaceId: string;
  readonly displayName: string;
}): Promise<{ galleryId: string; slug: string } | null> {
  const title = input.displayName.trim() || "First exhibition";
  const created = await createGalleryDocument({
    uid: input.uid,
    workspaceId: input.workspaceId,
    title,
    templateId: "modern-white",
  });

  const template = getTemplateById(created.templateId);
  if (!template) return created;

  const filled = fillWithSamplePaintings({
    galleryId: created.galleryId,
    workspaceId: input.workspaceId,
    template,
    existing: [],
    assets: [],
  });

  if (filled.artworks.length > 0) {
    await saveGalleryArtworks({
      uid: input.uid,
      galleryId: created.galleryId,
      artworks: filled.artworks,
    });
  }

  return created;
}
