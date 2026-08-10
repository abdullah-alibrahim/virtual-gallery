/**
 * Public URL helpers for room mockups and personal spaces.
 *
 * Demo galleries live under `/demo/*` (not `/g/{slug}`) so links must know
 * which surface they came from.
 */

export type MockupRouteContext =
  | { kind: "published"; slug: string; artworkId: string }
  | { kind: "demo"; artworkId: string; variant?: "quiet" | "pro" };

export function mockupsHrefFor(ctx: MockupRouteContext): string {
  if (ctx.kind === "published") {
    return `/g/${ctx.slug}/a/${ctx.artworkId}/mockups`;
  }
  const base = ctx.variant === "pro" ? "/demo/pro/mockups" : "/demo/mockups";
  return `${base}?artwork=${encodeURIComponent(ctx.artworkId)}`;
}

export function spaceHrefFor(ctx: MockupRouteContext): string {
  if (ctx.kind === "published") {
    return `/g/${ctx.slug}/a/${ctx.artworkId}/space`;
  }
  const base = ctx.variant === "pro" ? "/demo/pro/space" : "/demo/space";
  return `${base}?artwork=${encodeURIComponent(ctx.artworkId)}`;
}
