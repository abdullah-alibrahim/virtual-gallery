import type { SceneTemplate, TemplateAnchor } from "@/core/entities";

function spaced(
  count: number,
  span: number,
  hangY: number,
  axis: "x" | "z",
  fixed: number,
  preferredMiddle = false,
): TemplateAnchor[] {
  const anchors: TemplateAnchor[] = [];
  for (let i = 0; i < count; i += 1) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const along = -span / 2 + t * span;
    const mid = preferredMiddle && i === Math.floor(count / 2);
    const position: [number, number, number] =
      axis === "x" ? [along, hangY, fixed] : [fixed, hangY, along];
    anchors.push({
      position,
      maxWidth: mid ? 2.4 : 2.0,
      maxHeight: mid ? 2.5 : 2.2,
      ...(mid ? { preferred: true as const } : {}),
    });
  }
  return anchors;
}

/** Standard rectangular room with hang anchors on each wall. */
export function fourWallRoom(input: {
  width: number;
  depth: number;
  height: number;
  northAnchors?: number;
  sideAnchors?: number;
  southAnchors?: number;
}): SceneTemplate["walls"] {
  const { width, depth, height } = input;
  const halfW = width / 2;
  const halfD = depth / 2;
  // Gallery standard centre-line ~1.5–1.6 m (eye height), not postcard-high.
  const hangY = Math.min(1.62, Math.max(1.52, height * 0.46));
  const northN = input.northAnchors ?? 3;
  const sideN = input.sideAnchors ?? 2;
  const southN = input.southAnchors ?? 2;

  return [
    {
      id: "north",
      label: "North wall",
      origin: [0, 0, -halfD],
      normal: [0, 0, 1],
      width,
      height,
      anchors: spaced(northN, width * 0.72, hangY, "x", 0.04, true),
    },
    {
      id: "east",
      label: "East wall",
      origin: [halfW, 0, 0],
      normal: [-1, 0, 0],
      width: depth,
      height,
      anchors: spaced(sideN, depth * 0.55, hangY, "z", 0.04),
    },
    {
      id: "west",
      label: "West wall",
      origin: [-halfW, 0, 0],
      normal: [1, 0, 0],
      width: depth,
      height,
      anchors: spaced(sideN, depth * 0.55, hangY, "z", -0.04),
    },
    {
      id: "south",
      label: "South wall",
      origin: [0, 0, halfD],
      normal: [0, 0, -1],
      width,
      height,
      anchors: spaced(southN, width * 0.5, hangY, "x", -0.04),
    },
  ];
}

export function roomWalkBounds(
  halfW: number,
  halfD: number,
): SceneTemplate["walkBounds"] {
  return [
    [-halfW, -halfD],
    [halfW, -halfD],
    [halfW, halfD],
    [-halfW, halfD],
  ];
}
