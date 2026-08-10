/**
 * Lists publish versions for the editor rollback UI.
 */

import { getAdminDb } from "@/infrastructure/firebase/admin";
import { loadGalleryForEditor } from "@/infrastructure/galleries/load-gallery";

export interface GalleryVersionSummary {
  readonly version: number;
  readonly manifestPath: string;
  readonly artworkCount: number;
  readonly publishedBy: string;
  readonly compiledAt: string;
  readonly isLive: boolean;
}

export async function listGalleryVersions(input: {
  galleryId: string;
  uid: string;
}): Promise<GalleryVersionSummary[]> {
  const { gallery } = await loadGalleryForEditor({
    galleryId: input.galleryId,
    uid: input.uid,
  });

  const snap = await getAdminDb()
    .collection("galleries")
    .doc(gallery.id)
    .collection("versions")
    .orderBy("version", "desc")
    .limit(20)
    .get();

  return snap.docs.map((doc) => {
    const data = doc.data();
    const version = Number(data.version);
    return {
      version,
      manifestPath: String(data.manifestPath ?? ""),
      artworkCount: Number(data.artworkCount ?? 0),
      publishedBy: String(data.publishedBy ?? ""),
      compiledAt: String(data.compiledAt ?? ""),
      isLive:
        gallery.status === "published" &&
        gallery.publishedVersion === version,
    };
  });
}
