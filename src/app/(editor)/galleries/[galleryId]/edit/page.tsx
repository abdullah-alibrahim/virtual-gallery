import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import type { Artwork, Gallery } from "@/core/entities";
import { NotFoundError } from "@/core/errors";
import { getTemplateById } from "@/core/templates";
import { EditorApp } from "@/features/editor/components/editor-app";
import { getAuthContext } from "@/infrastructure/firebase/auth-context";
import { loadGalleryForEditor } from "@/infrastructure/galleries/load-gallery";
import { getAdminDb } from "@/infrastructure/firebase/admin";
import type { AssetListItem } from "@/infrastructure/firebase/assets-client";

export const metadata: Metadata = {
  title: "Editor",
  robots: { index: false, follow: false },
};

export default async function GalleryEditorPage({
  params,
}: {
  params: Promise<{ galleryId: string }>;
}) {
  const ctx = await getAuthContext();
  if (!ctx?.account) redirect("/sign-in?force=1");
  if (!ctx.account.onboarding.completed) redirect("/onboarding");

  const { galleryId } = await params;

  let gallery: Gallery;
  let artworks: Artwork[];
  try {
    ({ gallery, artworks } = await loadGalleryForEditor({
      galleryId,
      uid: ctx.session.uid,
    }));
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const template = getTemplateById(gallery.templateId);
  if (!template) notFound();

  const assetsSnap = await getAdminDb()
    .collection("assets")
    .where("workspaceId", "==", gallery.workspaceId)
    .where("kind", "==", "image")
    .get();

  const assets: AssetListItem[] = assetsSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      workspaceId: String(data.workspaceId),
      status: data.status,
      fileName: String(data.meta?.fileName ?? "Untitled"),
      bytes: Number(data.original?.bytes ?? 0),
      mime: String(data.original?.mime ?? ""),
      width: data.original?.width ?? null,
      height: data.original?.height ?? null,
      thumbUrl: data.variants?.thumb_512 ?? null,
      blurhash: data.meta?.blurhash ?? null,
      dominantColor: data.meta?.dominantColor ?? null,
      textureFormat: data.meta?.textureFormat ?? null,
      error: data.error ?? null,
      createdAt: data.createdAt?.toDate?.() ?? null,
    };
  });

  return (
    <EditorApp
      gallery={gallery}
      template={template}
      artworks={artworks}
      assets={assets}
    />
  );
}
