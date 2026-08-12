"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Vector3 } from "three";

import { getGalleryAmbienceEngine } from "@/features/viewer/lib/webaudio-ambience";

/**
 * Feeds walk motion into the place-sound / footstep WebAudio engine.
 */
export function WalkPlaceSoundBridge({
  enabled,
  muted,
}: {
  enabled: boolean;
  muted: boolean;
}) {
  const { camera } = useThree();
  const last = useMemo(() => new Vector3(), []);
  const engine = useMemo(() => getGalleryAmbienceEngine(), []);
  const ready = useRef(false);

  useEffect(() => {
    ready.current = true;
    void engine.setMuted(muted);
    void engine.setPlaceSound(enabled && !muted);
    return () => {
      void engine.setPlaceSound(false);
    };
  }, [enabled, engine, muted]);

  useFrame(() => {
    if (!ready.current || !enabled || muted) {
      engine.noteMovement(false);
      return;
    }
    const dx = camera.position.x - last.x;
    const dz = camera.position.z - last.z;
    const moving = dx * dx + dz * dz > 0.00002;
    last.copy(camera.position);
    engine.noteMovement(moving);
  });

  return null;
}
