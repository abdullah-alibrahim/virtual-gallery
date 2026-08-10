import { PrintCatalogue } from "@/features/viewer/components/print-catalogue";
import { loadPublishedManifestBySlug } from "@/infrastructure/publish/load-published-manifest";
import { NotFoundError } from "@/core/errors";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const manifest = await loadPublishedManifestBySlug(slug);
    return {
      title: `Catalogue · ${manifest.title}`,
      description:
        manifest.description ||
        `Printable catalogue for ${manifest.title} by ${manifest.artist.displayName}`,
      robots: { index: false, follow: true },
    };
  } catch {
    return { title: "Catalogue not found", robots: { index: false } };
  }
}

export default async function GalleryCataloguePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let manifest;
  try {
    manifest = await loadPublishedManifestBySlug(slug);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  return (
    <PrintCatalogue
      manifest={manifest}
      walkHref={`/g/${manifest.slug}`}
      listHref={`/g/${manifest.slug}?view=list`}
    />
  );
}
