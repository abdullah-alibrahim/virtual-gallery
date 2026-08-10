import { ValidationError } from "@/core/errors";

/**
 * A URL-safe public identifier. Branded so a raw string can never be passed
 * where a validated slug is required.
 *
 * Slugs are globally unique across galleries and artist profiles because both
 * live at the site root (`/g/{slug}`, `/a/{slug}`) and are reserved through the
 * same registry.
 */
export type Slug = string & { readonly __brand: "Slug" };

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const MIN_LENGTH = 3;
const MAX_LENGTH = 48;

/**
 * Paths the application owns. A user slug may never shadow one of these, or
 * `/dashboard` would resolve to somebody's gallery.
 */
const RESERVED = new Set([
  "a",
  "about",
  "account",
  "admin",
  "analytics",
  "api",
  "assets",
  "auth",
  "billing",
  "blog",
  "callback",
  "careers",
  "contact",
  "cookies",
  "dashboard",
  "docs",
  "editor",
  "explore",
  "faq",
  "feed",
  "g",
  "galleries",
  "gallery",
  "help",
  "inbox",
  "internal",
  "legal",
  "login",
  "logout",
  "new",
  "onboarding",
  "pricing",
  "privacy",
  "public",
  "reset",
  "root",
  "settings",
  "sign-in",
  "sign-out",
  "sign-up",
  "sitemap",
  "static",
  "status",
  "support",
  "team",
  "templates",
  "terms",
  "upgrade",
  "verify",
  "www",
]);

export function isReservedSlug(value: string): boolean {
  return RESERVED.has(value.toLowerCase());
}

/**
 * Derives a candidate slug from arbitrary human input. Lossy by design — the
 * caller is expected to check availability and, on collision, append a
 * discriminator.
 *
 * Returns `null` when the input contains nothing usable (for example, a title
 * written entirely in a script we cannot transliterate), so the caller can fall
 * back to a generated identifier rather than publishing an empty URL.
 */
export function slugify(input: string): string | null {
  const normalized = input
    .normalize("NFKD")
    // strip combining marks so "Café" becomes "Cafe" rather than "Caf"
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_LENGTH)
    .replace(/-+$/g, "");

  return normalized.length >= MIN_LENGTH ? normalized : null;
}

export function isValidSlug(value: string): boolean {
  return (
    value.length >= MIN_LENGTH &&
    value.length <= MAX_LENGTH &&
    SLUG_PATTERN.test(value) &&
    !isReservedSlug(value) &&
    !value.includes("--")
  );
}

/** Validates and brands a slug, throwing a domain error when unusable. */
export function toSlug(value: string): Slug {
  if (value.length < MIN_LENGTH || value.length > MAX_LENGTH) {
    throw new ValidationError(
      `Link must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters`,
      { value },
    );
  }
  if (!SLUG_PATTERN.test(value)) {
    throw new ValidationError(
      "Link may only contain lowercase letters, numbers, and hyphens",
      { value },
    );
  }
  if (value.includes("--")) {
    throw new ValidationError("Link may not contain consecutive hyphens", {
      value,
    });
  }
  if (isReservedSlug(value)) {
    throw new ValidationError("That link is reserved", { value });
  }
  return value as Slug;
}

export const slugConstraints = {
  minLength: MIN_LENGTH,
  maxLength: MAX_LENGTH,
} as const;
