"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { DoubleSide, Mesh, Vector3 } from "three";

/**
 * Soft elliptical floor shadow that follows the walk camera — not a full avatar.
 * Pass `enabled={false}` on mobile when performance is a concern.
 */
export function VisitorFloorShadow({
  enabled = true,
}: {
  enabled?: boolean;
}) {
  const meshRef = useRef<Mesh>(null);
  const { camera } = useThree();
  const last = useMemo(() => new Vector3(), []);
  const opacityRef = useRef(0);

  useFrame((_, dt) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    if (!enabled) {
      opacityRef.current = Math.max(0, opacityRef.current - dt * 2.5);
      const mat = mesh.material as { opacity: number };
      mat.opacity = opacityRef.current * 0.26;
      mesh.visible = opacityRef.current > 0.02;
      return;
    }

    mesh.position.set(camera.position.x, 0.012, camera.position.z);
    mesh.scale.set(1.15, 0.72, 1);

    const moved = last.distanceToSquared(camera.position) > 0.000004;
    last.copy(camera.position);
    const target = moved ? 1 : 0.7;
    opacityRef.current += (target - opacityRef.current) * Math.min(1, dt * 3.5);

    const mat = mesh.material as { opacity: number };
    mat.opacity = opacityRef.current * 0.26;
    mesh.visible = true;
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      renderOrder={2}
      frustumCulled={false}
    >
      <circleGeometry args={[0.34, 40]} />
      <meshBasicMaterial
        color="#161310"
        transparent
        opacity={0}
        depthWrite={false}
        side={DoubleSide}
      />
    </mesh>
  );
}
