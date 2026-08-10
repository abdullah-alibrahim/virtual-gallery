import type { SceneTemplate } from "@/core/entities";

import { landingCameraPosition, landingLookTarget } from "./landing-camera";

export type MarketingCameraMode = "hero" | "orbit" | "static";

/**
 * Frontal camera for Soft Museum landing — reuses the tuned landing path.
 * Other templates get a bounds-aware frontal sway looking at the north wall.
 */
export function marketingCameraPosition(
  template: SceneTemplate,
  mode: MarketingCameraMode,
  elapsed: number,
  mobile: boolean,
): [number, number, number] {
  if (template.id === "soft-museum" && mode === "hero") {
    return landingCameraPosition(elapsed, mobile);
  }

  const bounds = roomExtents(template);
  const eyeY = mobile ? 1.48 : 1.55;
  const baseZ = Math.min(bounds.maxZ - 0.85, bounds.depth * 0.22);

  if (mode === "orbit") {
    const radius = Math.min(bounds.width, bounds.depth) * 0.38;
    const angle = elapsed * 0.07;
    return [
      Math.sin(angle) * radius,
      eyeY + 0.12,
      Math.cos(angle) * radius * 0.55 + baseZ * 0.35,
    ];
  }

  const sway =
    Math.sin(elapsed * (mode === "static" ? 0.05 : 0.09)) *
    (mobile ? 0.9 : mode === "static" ? 0.55 : 1.4);
  const dolly =
    Math.sin(elapsed * 0.055) * (mobile ? 0.28 : mode === "static" ? 0.18 : 0.5);
  const bob = Math.sin(elapsed * 0.18) * 0.014;

  return [sway, eyeY + bob, baseZ + dolly];
}

export function marketingLookTarget(
  template: SceneTemplate,
  mode: MarketingCameraMode,
  elapsed: number,
): [number, number, number] {
  if (template.id === "soft-museum" && mode === "hero") {
    return landingLookTarget(elapsed);
  }

  const north = template.walls.find((w) => w.id === "north") ?? template.walls[0];
  const wallZ = north?.origin[2] ?? -5;
  const lookZ = wallZ + (north && north.normal[2] > 0 ? 0.12 : -0.12);

  if (mode === "orbit") {
    return [0, 1.65, lookZ];
  }

  // Slow pan across north-wall preferred anchors when present.
  const foci = northAnchors(template);
  if (foci.length === 0) return [0, 1.65, lookZ];

  const period = mode === "static" ? 12 : 9;
  const total = foci.length * period;
  const u = ((elapsed % total) + total) % total;
  const idx = Math.floor(u / period) % foci.length;
  const next = (idx + 1) % foci.length;
  const local = (u % period) / period;
  const t = local * local * (3 - 2 * local);
  const hold = mode === "static" ? Math.min(1, Math.max(0, (local - 0.75) / 0.25)) : t;
  const blend = mode === "static" ? hold : smoothstep(0.68, 1, local);
  const a = foci[idx]!;
  const b = foci[next]!;
  return [
    a[0] + (b[0] - a[0]) * blend,
    a[1] + (b[1] - a[1]) * blend,
    a[2] + (b[2] - a[2]) * blend,
  ];
}

function northAnchors(
  template: SceneTemplate,
): readonly (readonly [number, number, number])[] {
  const north = template.walls.find((w) => w.id === "north") ?? template.walls[0];
  if (!north) return [[0, 1.65, -5]];
  const preferred = north.anchors.filter((a) => a.preferred);
  const anchors = preferred.length > 0 ? preferred : north.anchors;
  return anchors.map(
    (a) =>
      [
        north.origin[0] + a.position[0],
        north.origin[1] + a.position[1],
        north.origin[2] + a.position[2],
      ] as const,
  );
}

function roomExtents(template: SceneTemplate) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const [x, z] of template.walkBounds) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
  }
  return {
    minX,
    maxX,
    minZ,
    maxZ,
    width: Math.max(4, maxX - minX),
    depth: Math.max(4, maxZ - minZ),
  };
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
