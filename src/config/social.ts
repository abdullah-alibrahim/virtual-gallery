/**
 * Public site social destinations. Override via NEXT_PUBLIC_SOCIAL_* env vars.
 * Empty / "#" hides a network from the footer strip.
 */

function envOr(key: string, fallback: string): string {
  const value = process.env[key]?.trim();
  return value && value.length > 0 ? value : fallback;
}

export const siteSocials = {
  instagram: envOr("NEXT_PUBLIC_SOCIAL_INSTAGRAM", "#"),
  twitter: envOr("NEXT_PUBLIC_SOCIAL_TWITTER", "#"),
  linkedin: envOr("NEXT_PUBLIC_SOCIAL_LINKEDIN", "#"),
  youtube: envOr("NEXT_PUBLIC_SOCIAL_YOUTUBE", "#"),
  behance: envOr("NEXT_PUBLIC_SOCIAL_BEHANCE", "#"),
} as const;

export type SiteSocialNetwork = keyof typeof siteSocials;

export const siteSocialLabels: Record<SiteSocialNetwork, string> = {
  instagram: "Instagram",
  twitter: "X",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  behance: "Behance",
};
