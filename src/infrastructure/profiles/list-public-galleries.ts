/**
 * Lists published galleries for a public artist profile.
 */

import { getAdminDb } from "@/infrastructure/firebase/admin";

export interface PublicGalleryCard {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly description: string;
  readonly coverThumbUrl: string | null;
  readonly artworkCount: number;
  readonly publishedAt: Date | null;
  /** Override the default `/g/{slug}` entry (static demos). */
  readonly href?: string;
}

export async function listPublishedGalleriesForWorkspace(
  workspaceId: string,
): Promise<PublicGalleryCard[]> {
  const snap = await getAdminDb()
    .collection("galleries")
    .where("workspaceId", "==", workspaceId)
    .where("status", "==", "published")
    .get();

  return snap.docs
    .map((doc) => {
      const data = doc.data();
      if (data.deletedAt) return null;
      return {
        id: doc.id,
        title: String(data.title ?? "Untitled"),
        slug: String(data.slug ?? ""),
        description: String(data.description ?? ""),
        coverThumbUrl: data.cover?.thumbUrl ?? null,
        artworkCount: Number(data.artworkCount ?? 0),
        publishedAt: (data.publishedAt?.toDate?.() as Date | undefined) ?? null,
      };
    })
    .filter((g): g is PublicGalleryCard => Boolean(g?.slug))
    .sort(
      (a, b) =>
        (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0),
    );
}
