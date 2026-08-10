"use client";

import { useLayoutEffect, useRef } from "react";
import type { Mesh } from "three";

/**
 * Small interactive marker on the artwork. Click opens the detail sheet.
 */
export function Hotspot({
  offset,
  onSelect,
  label,
}: {
  offset: readonly [number, number, number];
  onSelect?: () => void;
  label?: string;
}) {
  const meshRef = useRef<Mesh>(null);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.userData.hotspot = true;
    mesh.userData.label = label;
  }, [label]);

  return (
    <mesh
      ref={meshRef}
      position={[offset[0], offset[1], offset[2]]}
      onClick={(event) => {
        event.stopPropagation();
        onSelect?.();
      }}
    >
      <sphereGeometry args={[0.035, 16, 16]} />
      <meshStandardMaterial
        color="#f5f2ea"
        emissive="#c4b79a"
        emissiveIntensity={0.35}
        roughness={0.4}
      />
    </mesh>
  );
}
