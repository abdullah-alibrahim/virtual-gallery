import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { listPublishedGallerySlugs } from "@/infrastructure/publish/list-published-slugs";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url.replace(/\/$/, "");
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/templates`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${base}/pricing`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/privacy`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${base}/terms`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${base}/support`,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  try {
    const published = await listPublishedGallerySlugs();
    const galleryEntries: MetadataRoute.Sitemap = published.map((row) => ({
      url: `${base}/g/${row.slug}`,
      lastModified: row.updatedAt ?? undefined,
      changeFrequency: "weekly",
      priority: 0.9,
    }));
    return [...staticEntries, ...galleryEntries];
  } catch {
    // Emulators / missing Admin credentials should not break builds.
    return staticEntries;
  }
}
