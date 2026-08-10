/**
 * Lists non-deleted galleries for a workspace (dashboard / galleries index).
 */

import { getTemplateById } from "@/core/templates";
import { getAdminDb } from "@/infrastructure/firebase/admin";

export interface GalleryListItem {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly status: "draft" | "published" | "unpublished" | "archived";
  readonly artworkCount: number;
  readonly coverThumbUrl: string | null;
  readonly templateBackground: string | null;
  readonly updatedAt: Date | null;
}

export async function listWorkspaceGalleries(
  workspaceId: string,
): Promise<GalleryListItem[]> {
  const snap = await getAdminDb()
    .collection("galleries")
    .where("workspaceId", "==", workspaceId)
    .where("deletedAt", "==", null)
    .get();

  return snap.docs
    .map((doc) => {
      const data = doc.data();
      const templateId = String(data.templateId ?? "");
      const template = templateId ? getTemplateById(templateId) : null;
      return {
        id: doc.id,
        title: String(data.title ?? "Untitled"),
        slug: String(data.slug ?? doc.id),
        status: data.status as GalleryListItem["status"],
        artworkCount: Number(data.artworkCount ?? 0),
        coverThumbUrl: (data.cover?.thumbUrl as string | undefined) ?? null,
        templateBackground: template?.environment.background ?? null,
        updatedAt: (data.updatedAt?.toDate?.() as Date | undefined) ?? null,
      };
    })
    .sort(
      (a, b) =>
        (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0),
    );
}
