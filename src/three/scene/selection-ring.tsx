"use client";

import type { SceneArtwork } from "@/core/entities";
import { toMetres } from "@/core/value-objects/dimensions";

/**
 * Brass selection outline — museum-editor cue without a heavy gizmo.
 */
export function SelectionRing({
  artwork,
  locked = false,
}: {
  artwork: SceneArtwork;
  locked?: boolean;
}) {
  const metres = toMetres(artwork.dimensions);
  const width = metres.width * artwork.placement.scale + 0.1;
  const height = metres.height * artwork.placement.scale + 0.1;
  const [px, py, pz] = artwork.placement.position;
  const [rx, ry, rz] = artwork.placement.rotation;
  const color = locked ? "#8a8074" : "#c4a574";

  return (
    <group position={[px, py, pz]} rotation={[rx, ry, rz]}>
      <mesh position={[0, 0, 0.012]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={locked ? 0.1 : 0.16}
          depthWrite={false}
        />
      </mesh>
      {/* Thin border planes for a crisp frame edge */}
      <mesh position={[0, height / 2, 0.014]}>
        <planeGeometry args={[width, 0.012]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} depthWrite={false} />
      </mesh>
      <mesh position={[0, -height / 2, 0.014]}>
        <planeGeometry args={[width, 0.012]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} depthWrite={false} />
      </mesh>
      <mesh position={[width / 2, 0, 0.014]}>
        <planeGeometry args={[0.012, height]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} depthWrite={false} />
      </mesh>
      <mesh position={[-width / 2, 0, 0.014]}>
        <planeGeometry args={[0.012, height]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} depthWrite={false} />
      </mesh>
    </group>
  );
}
