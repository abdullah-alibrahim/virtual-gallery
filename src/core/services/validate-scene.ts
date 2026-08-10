import type { Artwork, GallerySettings, SceneTemplate } from "@/core/entities";
import type { SceneIssue } from "@/core/errors";
import { AssetNotReadyError } from "@/core/errors";

/**
 * Validates a gallery is ready to publish. Returns a structured list of issues
 * the editor can highlight inline — never a boolean. An empty list means go.
 *
 * Pure: the caller supplies already-loaded artworks and a readiness map so this
 * function does not depend on any repository.
 */
export function validateScene(input: {
  readonly artworks: readonly Artwork[];
  readonly template: SceneTemplate;
  readonly settings: GallerySettings;
  /** assetId → true when every required variant exists. */
  readonly assetReady: ReadonlyMap<string, boolean>;
}): readonly SceneIssue[] {
  const issues: SceneIssue[] = [];

  if (input.artworks.length === 0) {
    issues.push({
      kind: "missing-placement",
      message: "Add at least one artwork before publishing",
    });
  }

  if (input.artworks.length > input.template.capacity.max) {
    issues.push({
      kind: "capacity-exceeded",
      message: `This template holds up to ${input.template.capacity.max} works. Remove ${input.artworks.length - input.template.capacity.max} or choose a larger template.`,
    });
  }

  const wallIds = new Set(input.template.walls.map((w) => w.id));
  const occupied = new Map<string, string>();

  for (const artwork of input.artworks) {
    if (!artwork.title.trim()) {
      issues.push({
        kind: "missing-title",
        message: "Every artwork needs a title",
        artworkId: artwork.id,
      });
    }

    if (!input.assetReady.get(artwork.assetId)) {
      issues.push({
        kind: "asset-not-ready",
        message: `"${artwork.title || "Untitled"}" is still being processed`,
        artworkId: artwork.id,
      });
    }

    if (!wallIds.has(artwork.placement.wallId)) {
      issues.push({
        kind: "off-wall",
        message: `"${artwork.title || "Untitled"}" is not hanging on a valid wall`,
        artworkId: artwork.id,
        wallId: artwork.placement.wallId,
      });
      continue;
    }

    if (artwork.placement.anchorIndex !== null) {
      const key = `${artwork.placement.wallId}:${artwork.placement.anchorIndex}`;
      const other = occupied.get(key);
      if (other) {
        issues.push({
          kind: "overlapping-artwork",
          message: "Two artworks share the same wall position",
          artworkId: artwork.id,
          wallId: artwork.placement.wallId,
        });
      } else {
        occupied.set(key, artwork.id);
      }
    }
  }

  return issues;
}

/**
 * Narrow helper used by the publish callable when a single asset is the
 * blocker. Throws a typed domain error the API layer maps to 409.
 */
export function assertAssetReady(assetId: string, ready: boolean, status: string): void {
  if (!ready) throw new AssetNotReadyError(assetId, status);
}
