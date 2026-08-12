"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Vector3 } from "three";

import { getGalleryAmbienceEngine } from "@/features/viewer/lib/webaudio-ambience";

/**
 * Feeds walk motion into the place-sound / footstep WebAudio engine.
 * Threshold ignores micro-jitter so standing still stays silent.
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
  const primed = useRef(false);

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
    if (!primed.current) {
      last.copy(camera.position);
      primed.current = true;
      return;
    }
    const dx = camera.position.x - last.x;
    const dz = camera.position.z - last.z;
    const dist = Math.hypot(dx, dz);
    // Ignore tiny camera corrections / floating-point jitter.
    const moving = dist > 0.00035;
    last.copy(camera.position);
    engine.noteMovement(moving, dist);
  });

  useEffect(() => {
    primed.current = false;
  }, [enabled]);

  return null;
}
