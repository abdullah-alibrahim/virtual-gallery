"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import type { Group, Object3D } from "three";

import {
  GALLERY_PROP_NATIVE_SIZE,
  GALLERY_PROP_PATHS,
  type GalleryPropModel,
} from "./gallery-prop-paths";

/**
 * Loads a local CC0 GLTF prop. Scale can be uniform or fit a target AABB
 * (e.g. template bench `size`). Shadows optional for walk quality.
 */
export function GalleryGlbProp({
  model,
  position,
  yaw = 0,
  scale = 1,
  fitSize,
  castShadow = false,
  receiveShadow = false,
}: {
  model: GalleryPropModel;
  position: readonly [number, number, number];
  yaw?: number;
  /** Uniform scale when `fitSize` is omitted. */
  scale?: number;
  /** Target width/height/depth (metres) — non-uniform fit to native AABB. */
  fitSize?: readonly [number, number, number];
  castShadow?: boolean;
  receiveShadow?: boolean;
}) {
  return (
    <Suspense fallback={null}>
      <GlbPropInner
        model={model}
        position={position}
        yaw={yaw}
        scale={scale}
        fitSize={fitSize}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      />
    </Suspense>
  );
}

function GlbPropInner({
  model,
  position,
  yaw,
  scale,
  fitSize,
  castShadow,
  receiveShadow,
}: {
  model: GalleryPropModel;
  position: readonly [number, number, number];
  yaw: number;
  scale: number;
  fitSize?: readonly [number, number, number];
  castShadow: boolean;
  receiveShadow: boolean;
}) {
  const path = GALLERY_PROP_PATHS[model];
  const { scene } = useGLTF(path);
  const clone = useMemo(() => scene.clone(true), [scene]);

  const sx = useMemo(() => {
    const native = GALLERY_PROP_NATIVE_SIZE[model];
    if (fitSize) {
      return [
        fitSize[0] / native[0],
        fitSize[1] / native[1],
        fitSize[2] / native[2],
      ] as const;
    }
    return [scale, scale, scale] as const;
  }, [model, fitSize, scale]);

  useEffect(() => {
    clone.traverse((obj: Object3D) => {
      const mesh = obj as Object3D & {
        isMesh?: boolean;
        castShadow?: boolean;
        receiveShadow?: boolean;
      };
      if (mesh.isMesh) {
        mesh.castShadow = castShadow;
        mesh.receiveShadow = receiveShadow;
      }
    });
    // Do not dispose clone materials/geometries — they share the useGLTF cache.
  }, [clone, castShadow, receiveShadow]);

  return (
    <group position={[position[0], position[1], position[2]]} rotation={[0, yaw, 0]}>
      <primitive object={clone as Group} scale={[sx[0], sx[1], sx[2]]} />
    </group>
  );
}

/** Preload flagship props so Walk does not hitch on first bench/plant. */
export function preloadGalleryProps(paths: readonly string[]): void {
  for (const path of paths) {
    useGLTF.preload(path);
  }
}
