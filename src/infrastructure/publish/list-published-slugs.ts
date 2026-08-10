/**
 * Lists live published gallery slugs for sitemaps (server-only).
 * The public viewer still reads Storage; this is a crawl index, not the walk path.
 */

import { getAdminDb } from "@/infrastructure/firebase/admin";

export interface PublishedSlugRow {
  readonly slug: string;
  readonly updatedAt: Date | null;
}

export async function listPublishedGallerySlugs(): Promise<PublishedSlugRow[]> {
  const snap = await getAdminDb()
    .collection("galleries")
    .where("status", "==", "published")
    .where("deletedAt", "==", null)
    .get();

  return snap.docs
    .map((doc) => {
      const data = doc.data();
      return {
        slug: String(data.slug ?? ""),
        updatedAt: (data.updatedAt?.toDate?.() as Date | undefined) ?? null,
      };
    })
    .filter((row) => row.slug.length > 0)
    .sort((a, b) => a.slug.localeCompare(b.slug));
}
