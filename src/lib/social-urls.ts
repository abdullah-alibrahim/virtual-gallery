import type { ArtistSocials } from "@/core/entities";

/**
 * Normalises artist social fields into absolute https URLs for display.
 * Handles bare handles (@name) and full URLs.
 */

const HANDLE = /^@?[A-Za-z0-9._-]{1,80}$/;

function asHandleUrl(
  value: string | undefined,
  base: string,
): string | undefined {
  if (!value?.trim()) return undefined;
  const raw = value.trim();
  if (/^https?:\/\//i.test(raw)) return raw;
  if (!HANDLE.test(raw)) return undefined;
  return `${base}${raw.replace(/^@/, "")}`;
}

function asHttpUrl(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  const raw = value.trim();
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(raw)) return `https://${raw}`;
  return undefined;
}

export type SocialLinkKind =
  | "website"
  | "facebook"
  | "instagram"
  | "twitter"
  | "linkedin"
  | "behance";

export interface ResolvedSocialLink {
  readonly kind: SocialLinkKind;
  readonly href: string;
}

export function resolveArtistSocialLinks(
  socials: ArtistSocials | undefined | null,
  options?: { galleryWebsite?: string | null },
): ResolvedSocialLink[] {
  const links: ResolvedSocialLink[] = [];
  const seen = new Set<SocialLinkKind>();

  const push = (kind: SocialLinkKind, href: string | undefined) => {
    if (!href || seen.has(kind)) return;
    seen.add(kind);
    links.push({ kind, href });
  };

  const pushSite = (href: string | undefined) => {
    if (href && /facebook\.com/i.test(href)) push("facebook", href);
    else push("website", href);
  };

  if (!socials) {
    pushSite(asHttpUrl(options?.galleryWebsite ?? undefined));
    return links;
  }

  push("facebook", asHttpUrl(socials.facebook));
  pushSite(
    asHttpUrl(socials.website) ?? asHttpUrl(options?.galleryWebsite ?? undefined),
  );
  push("instagram", asHandleUrl(socials.instagram, "https://instagram.com/"));
  push("twitter", asHandleUrl(socials.twitter, "https://x.com/"));
  push("linkedin", asHttpUrl(socials.linkedin));
  push("behance", asHttpUrl(socials.behance));

  return links;
}

/** Zod-friendly: empty string → undefined; otherwise require http(s) URL. */
export function optionalHttpUrl(value: string | undefined): string | undefined {
  if (value == null || value.trim() === "") return undefined;
  const trimmed = value.trim();
  if (!/^https?:\/\/.+/i.test(trimmed)) {
    throw new Error("Invalid URL");
  }
  return trimmed;
}

/** Instagram / X handle or profile URL. */
export function optionalSocialHandle(
  value: string | undefined,
): string | undefined {
  if (value == null || value.trim() === "") return undefined;
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (HANDLE.test(trimmed)) return trimmed.replace(/^@/, "");
  throw new Error("Invalid handle");
}
