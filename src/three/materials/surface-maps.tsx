"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useTexture } from "@react-three/drei";
import {
  FrontSide,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
} from "three";

import type { FloorStyle } from "@/core/entities";
import {
  SURFACE_TEXTURE_NONE,
  ceilingTextureAlbedoPath,
  floorTextureAlbedoPath,
  wallTextureAlbedoPath,
} from "@/core/entities";
import {
  createCeilingTexture,
  createFloorTexture,
  createWallTexture,
  disposeTexture,
} from "@/three/materials/procedural-surfaces";

/** Style → CC0 albedo fallback when no explicit `floorTextureId` is set. */
export const FLOOR_ALBEDO_PATH: Partial<Record<FloorStyle, string>> = {
  plank: "/assets/textures/wood_floor/diff_1k.jpg",
  parquet: "/assets/textures/wood_floor/ambientcg_color.jpg",
  stone: "/assets/textures/stone_floor/diff_1k.jpg",
  concrete: "/assets/textures/concrete_floor/diff_1k.jpg",
};

export function floorAlbedoPath(style: FloorStyle): string | undefined {
  return FLOOR_ALBEDO_PATH[style];
}

export function resolveFloorAlbedoPath(
  style: FloorStyle,
  textureId?: string | null,
): string | undefined {
  if (textureId === SURFACE_TEXTURE_NONE) return undefined;
  const fromId = floorTextureAlbedoPath(textureId);
  if (fromId) return fromId;
  if (textureId) return undefined;
  return floorAlbedoPath(style);
}

export function resolveWallAlbedoPath(
  textureId?: string | null,
): string | undefined {
  if (textureId === SURFACE_TEXTURE_NONE) return undefined;
  return wallTextureAlbedoPath(textureId);
}

export function resolveCeilingAlbedoPath(
  textureId?: string | null,
): string | undefined {
  if (textureId === SURFACE_TEXTURE_NONE) return undefined;
  return ceilingTextureAlbedoPath(textureId);
}

export function ProceduralFloorMap({
  style,
  baseHex,
  mobile,
  children,
}: {
  style: FloorStyle;
  baseHex: string;
  mobile?: boolean;
  children: (map: Texture) => React.ReactNode;
}) {
  const map = useMemo(
    () => createFloorTexture(style, baseHex, { mobile }),
    [style, baseHex, mobile],
  );
  useEffect(() => () => disposeTexture(map), [map]);
  return <>{children(map)}</>;
}

function PhotoSurfaceMap({
  path,
  mobile,
  repeat = 1,
  children,
}: {
  path: string;
  mobile?: boolean;
  repeat?: number;
  children: (map: Texture) => React.ReactNode;
}) {
  const map = useTexture(path);
  useEffect(() => {
    map.colorSpace = SRGBColorSpace;
    map.wrapS = RepeatWrapping;
    map.wrapT = RepeatWrapping;
    map.repeat.set(repeat, repeat);
    map.anisotropy = mobile ? 2 : 4;
    map.needsUpdate = true;
  }, [map, mobile, repeat]);
  return <>{children(map)}</>;
}

/**
 * Walk/marketing: try CC0 photo albedo; Suspense falls back to procedural.
 * Edit: photo when an explicit `textureId` is set so artists preview maps;
 * otherwise procedural (cheaper).
 */
export function FloorAlbedoProvider({
  style,
  baseHex,
  mobile,
  preferPhoto,
  textureId,
  children,
}: {
  style: FloorStyle;
  baseHex: string;
  mobile?: boolean;
  preferPhoto?: boolean;
  textureId?: string | null;
  children: (map: Texture) => React.ReactNode;
}) {
  const explicit = Boolean(
    textureId && textureId !== SURFACE_TEXTURE_NONE && floorTextureAlbedoPath(textureId),
  );
  const path =
    !mobile && (preferPhoto || explicit)
      ? resolveFloorAlbedoPath(style, textureId)
      : undefined;

  if (!path) {
    return (
      <ProceduralFloorMap style={style} baseHex={baseHex} mobile={mobile}>
        {children}
      </ProceduralFloorMap>
    );
  }
  return (
    <Suspense
      fallback={
        <ProceduralFloorMap style={style} baseHex={baseHex} mobile={mobile}>
          {children}
        </ProceduralFloorMap>
      }
    >
      <PhotoSurfaceMap path={path} mobile={mobile}>
        {children}
      </PhotoSurfaceMap>
    </Suspense>
  );
}

export function WallAlbedoProvider({
  baseHex,
  mobile,
  preferPhoto,
  textureId,
  repeat = 1,
  children,
}: {
  baseHex: string;
  mobile?: boolean;
  preferPhoto?: boolean;
  textureId?: string | null;
  repeat?: number;
  children: (map: Texture) => React.ReactNode;
}) {
  const path =
    !mobile && preferPhoto ? resolveWallAlbedoPath(textureId) : undefined;

  const procedural = (
    <ProceduralWallMap baseHex={baseHex} mobile={mobile} repeat={repeat}>
      {children}
    </ProceduralWallMap>
  );

  if (!path) return procedural;

  return (
    <Suspense fallback={procedural}>
      <PhotoSurfaceMap path={path} mobile={mobile} repeat={repeat}>
        {children}
      </PhotoSurfaceMap>
    </Suspense>
  );
}

function ProceduralWallMap({
  baseHex,
  mobile,
  repeat = 1,
  children,
}: {
  baseHex: string;
  mobile?: boolean;
  repeat?: number;
  children: (map: Texture) => React.ReactNode;
}) {
  const map = useMemo(
    () => createWallTexture(baseHex, { mobile }),
    [baseHex, mobile],
  );
  useEffect(() => {
    map.wrapS = RepeatWrapping;
    map.wrapT = RepeatWrapping;
    map.repeat.set(repeat, repeat);
    map.needsUpdate = true;
    return () => disposeTexture(map);
  }, [map, repeat]);
  return <>{children(map)}</>;
}

export function CeilingAlbedoProvider({
  baseHex,
  mobile,
  preferPhoto,
  textureId,
  children,
}: {
  baseHex: string;
  mobile?: boolean;
  preferPhoto?: boolean;
  textureId?: string | null;
  children: (map: Texture) => React.ReactNode;
}) {
  const path =
    !mobile && preferPhoto ? resolveCeilingAlbedoPath(textureId) : undefined;

  const procedural = (
    <ProceduralCeilingMap baseHex={baseHex} mobile={mobile}>
      {children}
    </ProceduralCeilingMap>
  );

  if (!path) return procedural;

  return (
    <Suspense fallback={procedural}>
      <PhotoSurfaceMap path={path} mobile={mobile}>
        {children}
      </PhotoSurfaceMap>
    </Suspense>
  );
}

function ProceduralCeilingMap({
  baseHex,
  mobile,
  children,
}: {
  baseHex: string;
  mobile?: boolean;
  children: (map: Texture) => React.ReactNode;
}) {
  const map = useMemo(
    () => createCeilingTexture(baseHex, { mobile }),
    [baseHex, mobile],
  );
  useEffect(() => () => disposeTexture(map), [map]);
  return <>{children(map)}</>;
}

/** Shared floor material args so photo + procedural stay consistent. */
export const FLOOR_MATERIAL_SIDE = FrontSide;
