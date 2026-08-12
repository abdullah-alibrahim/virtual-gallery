"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { DoubleSide, type Mesh, type Texture } from "three";

import type { SceneArtwork } from "@/core/entities";
import { fitSizeToAspect } from "@/core/services/artwork-ai-assist";
import { toMetres } from "@/core/value-objects/dimensions";

import { pickLodLevel, pickLodLevelStable, textureUrlForLod } from "../loaders/lod";
import { useArtworkTexture } from "../loaders/use-artwork-texture";
import { ArtworkSpotlight } from "./artwork-spotlight";
import { Hotspot } from "./hotspot";
import { TitlePlate } from "./title-plate";

export function ArtworkFrame({
  artwork,
  showTitle,
  selected = false,
  mobile = false,
  showHotspot = true,
  onSelect,
}: {
  artwork: SceneArtwork;
  showTitle: boolean;
  selected?: boolean;
  mobile?: boolean;
  /** Marketing hero hides interactive markers. */
  showHotspot?: boolean;
  onSelect?: (artworkId: string | null) => void;
}) {
  const { camera } = useThree();
  const canvasRef = useRef<Mesh>(null);
  const [lod, setLod] = useState(() => pickLodLevel(6, mobile));
  const lodRef = useRef(lod);
  const url = textureUrlForLod(artwork.textures, lod);
  const texture = useArtworkTexture(url, {
    seed: artwork.id,
    anisotropy: mobile ? 2 : 4,
  });

  const metres = toMetres(artwork.dimensions);
  const hungW = metres.width * artwork.placement.scale;
  const hungH = metres.height * artwork.placement.scale;
  const natural = fitSizeToAspect(
    hungW,
    hungH,
    textureAspect(texture) ?? artwork.meta.aspectRatio,
  );
  const width = natural.width;
  const height = natural.height;

  const frame = artwork.frame;
  const moulding = (frame.widthCm / 100) * artwork.placement.scale;
  const matte = (frame.matteCm / 100) * artwork.placement.scale;

  const canvasW = width;
  const canvasH = height;
  const matteW = canvasW + matte * 2;
  const matteH = canvasH + matte * 2;
  const outerW = matteW + moulding * 2;
  const outerH = matteH + moulding * 2;

  useLayoutEffect(() => {
    const mesh = canvasRef.current;
    if (!mesh) return;
    mesh.userData.artworkId = artwork.id;
  }, [artwork.id]);

  useFrame(() => {
    const [px, py, pz] = artwork.placement.position;
    const dx = camera.position.x - px;
    const dy = camera.position.y - py;
    const dz = camera.position.z - pz;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const next = pickLodLevelStable(dist, mobile, lodRef.current);
    if (next !== lodRef.current) {
      lodRef.current = next;
      setLod(next);
    }
  });

  const [px, py, pz] = artwork.placement.position;
  const [rx, ry, rz] = artwork.placement.rotation;
  // Gallery moulding with enough depth for a soft wall shadow.
  const frameDepth = Math.max(0.038, moulding * 0.95);
  const matteVisible = matte > 0.001;
  const frameVisible = frame.style !== "none" && moulding > 0.001;
  // Sit canvas proud of matte; keep clear gaps to avoid z-fighting / black flashes.
  const matteZ = 0.004;
  const canvasZ = matteVisible ? matteZ + 0.006 : 0.01;
  const backingZ = -frameDepth * 0.35;

  const hotspotOffset = useMemo(
    () =>
      [canvasW * 0.42, -canvasH * 0.42, frameDepth + 0.02] as [
        number,
        number,
        number,
      ],
    [canvasW, canvasH, frameDepth],
  );

  return (
    <group position={[px, py, pz]} rotation={[rx, ry, rz]}>
      {frameVisible ? (
        <mesh position={[0, 0, -frameDepth / 2]} castShadow={!mobile} receiveShadow>
          <boxGeometry args={[outerW, outerH, frameDepth]} />
          <meshStandardMaterial
            color={frame.color}
            roughness={frame.style === "ornate" ? 0.34 : 0.48}
            metalness={frame.style === "ornate" ? 0.3 : 0.1}
            envMapIntensity={mobile ? 0.42 : 0.72}
          />
        </mesh>
      ) : null}

      {matteVisible ? (
        <mesh position={[0, 0, matteZ]} receiveShadow>
          <planeGeometry args={[matteW, matteH]} />
          <meshStandardMaterial
            color={frame.matteColor}
            roughness={0.94}
            metalness={0}
            envMapIntensity={0.06}
          />
        </mesh>
      ) : null}

      {/* Backing block — casts a soft contact shadow onto the wall. */}
      <mesh position={[0, 0, backingZ]} castShadow={!mobile}>
        <boxGeometry
          args={[
            Math.max(canvasW, matteW) * 0.99,
            Math.max(canvasH, matteH) * 0.99,
            Math.max(0.02, frameDepth * 0.45),
          ]}
        />
        <meshStandardMaterial color="#2a2420" roughness={0.92} metalness={0} />
      </mesh>

      <mesh
        ref={canvasRef}
        position={[0, 0, canvasZ]}
        onClick={(event) => {
          event.stopPropagation();
          onSelect?.(artwork.id);
        }}
      >
        <planeGeometry args={[canvasW, canvasH]} />
        {/*
          Color-accurate paint plane: unlit Basic so sRGB texture ≈ Wall Label
          thumbnail. Spots / IBL / ACES-lit Standard were darkening, flattening,
          and vignette-crushing pigment. Frame + matte stay Standard below.
          toneMapped={false} skips renderer exposure crush on the image itself.
        */}
        <meshBasicMaterial
          color="#ffffff"
          map={texture}
          side={DoubleSide}
          toneMapped={false}
          transparent={selected}
          opacity={selected ? 0.98 : 1}
        />
      </mesh>

      {artwork.lighting.enabled ? (
        <ArtworkSpotlight
          width={canvasW}
          height={canvasH}
          intensity={artwork.lighting.intensity * (mobile ? 0.72 : 0.82)}
          angle={artwork.lighting.angle}
          temperatureK={artwork.lighting.temperatureK}
        />
      ) : null}

      {showTitle ? (
        <TitlePlate
          title={artwork.title}
          year={artwork.year}
          medium={artwork.medium}
          width={Math.max(canvasW, 0.6)}
          yOffset={-(outerH / 2) - 0.08}
        />
      ) : null}

      {showHotspot ? (
        <Hotspot
          offset={hotspotOffset}
          onSelect={() => onSelect?.(artwork.id)}
          label={artwork.title}
        />
      ) : null}
    </group>
  );
}

function textureAspect(texture: Texture | null | undefined): number | null {
  const image = texture?.image as { width?: number; height?: number } | undefined;
  const width = image?.width ?? 0;
  const height = image?.height ?? 0;
  if (width < 2 || height < 2) return null;
  return width / height;
}
