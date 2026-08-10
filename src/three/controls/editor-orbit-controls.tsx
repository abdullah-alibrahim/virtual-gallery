"use client";

import { OrbitControls } from "@react-three/drei";

/**
 * Editor camera: orbit / pan / dolly. Walk mode swaps this for first-person.
 */
export function EditorOrbitControls({ enabled = true }: { enabled?: boolean }) {
  return (
    <OrbitControls
      enabled={enabled}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={1.2}
      maxDistance={18}
      maxPolarAngle={Math.PI * 0.49}
      target={[0, 1.4, 0]}
    />
  );
}
