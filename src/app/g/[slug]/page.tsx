import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { siteConfig } from "@/config/site";
import { NotFoundError } from "@/core/errors";
import { GalleryViewer } from "@/features/viewer/components/gallery-viewer";
import { loadPublishedManifestBySlug } from "@/infrastructure/publish/load-published-manifest";
import { readLatestPointer } from "@/infrastructure/publish/manifest-storage";
import { getAdminDb } from "@/infrastructure/firebase/admin";
import { loadWorkspaceUsage } from "@/infrastructure/workspaces/load-workspace-usage";
import { buildGalleryJsonLd } from "@/lib/seo/gallery-json-ld";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ view?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { view } = await searchParams;
  try {
    const manifest = await loadPublishedManifestBySlug(slug);
    const description =
      manifest.description ||
      `${manifest.title} — a walkable exhibition by ${manifest.artist.displayName}`;
    const cover =
      manifest.artworks[0]?.textures.lod1 ||
      manifest.artworks[0]?.textures.lod0;

    return {
      title: manifest.title,
      description,
      alternates: {
        canonical: `${siteConfig.url}/g/${manifest.slug}`,
      },
      openGraph: {
        title: manifest.title,
        description,
        type: "website",
        url: `${siteConfig.url}/g/${manifest.slug}`,
        ...(cover ? { images: [{ url: cover }] } : {}),
      },
      twitter: {
        card: "summary_large_image",
        title: manifest.title,
        description,
        ...(cover ? { images: [cover] } : {}),
      },
      robots: {
        index: view !== "list",
        follow: true,
      },
    };
  } catch {
    return { title: "Gallery not found", robots: { index: false } };
  }
}

export default async function PublicGalleryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { slug } = await params;
  const { view } = await searchParams;

  let manifest;
  try {
    manifest = await loadPublishedManifestBySlug(slug);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const jsonLd = buildGalleryJsonLd(manifest);
  const brandMark = await shouldShowFreeBrandMark(slug);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <GalleryViewer
        manifest={manifest}
        initialMode={view === "list" ? "list" : "walk"}
        brandMark={brandMark}
      />
    </>
  );
}

async function shouldShowFreeBrandMark(slug: string): Promise<boolean> {
  try {
    const pointer = await readLatestPointer(slug);
    if (!pointer) return true;
    const gallery = await getAdminDb()
      .collection("galleries")
      .doc(pointer.galleryId)
      .get();
    const workspaceId = String(gallery.data()?.workspaceId ?? "");
    if (!workspaceId) return true;
    const usage = await loadWorkspaceUsage(workspaceId);
    if (!usage) return true;
    return usage.plan === "free" && !usage.trialActive;
  } catch {
    return true;
  }
}
