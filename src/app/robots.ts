import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  const base = siteConfig.url.replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
                allow: ["/", "/g/", "/a/", "/templates", "/demo/", "/pricing", "/privacy", "/terms", "/support"],
        disallow: [
          "/api/",
          "/dashboard",
          "/galleries/",
          "/assets",
          "/inbox",
          "/analytics",
          "/settings/",
          "/onboarding",
          "/sign-in",
          "/sign-up",
          "/verify",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
