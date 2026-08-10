"use client";

import { useEffect, useMemo } from "react";
import {
  DoubleSide,
  Euler,
  FrontSide,
  type Texture,
  Vector3,
} from "three";

import type { FloorStyle, SceneTemplate, TemplateMaterials, TemplateWall } from "@/core/entities";
import { materialsFallback } from "@/core/templates";
import {
  createBoundsShapeGeometry,
  SURFACE_UV_PER_METER,
} from "@/three/math/bounds-shape-geometry";
import { yawFromNormal } from "@/three/math/geometry";
import {
  CeilingAlbedoProvider,
  FloorAlbedoProvider,
  WallAlbedoProvider,
  resolveCeilingAlbedoPath,
  resolveWallAlbedoPath,
} from "@/three/materials/surface-maps";

import type { GalleryQuality } from "./gallery-quality";
import { shouldUsePolishedFloor } from "./gallery-quality";
import { ShellArchitecture } from "./shell-architecture";

/** Wall slab thickness — reads as built architecture, not a billboard. */
const WALL_THICKNESS = 0.16;
/** Extra length past each end so corner junctions overlap (no light seams). */
const WALL_CORNER_OVERLAP = 0.18;
/** Nudge front face slightly behind hang plane to avoid z-fight with frames. */
const WALL_FACE_INSET = 0.012;
/** Wall plaster detail density (BoxGeometry UVs are 0–1 per face). */
const WALL_REPEAT_PER_METER = 0.55;

/**
 * Procedural gallery shell from template walls + walkBounds.
 *
 * Floors / ceilings are ShapeGeometry from the walkBounds polygon so
 * multi-room suites, L-plans, and courtyards match the walkable plan — not a
 * single AABB slab. Surfaces use procedural Canvas/Data textures.
 */
export function TemplateShell({
  template,
  receiveShadow = true,
  mobile = false,
  quality = mobile ? "mobile" : "walk",
  floorBoost = false,
}: {
  template: SceneTemplate;
  receiveShadow?: boolean;
  mobile?: boolean;
  quality?: GalleryQuality;
  /** Marketing / walk museum grade: richer floor reflection. */
  floorBoost?: boolean;
}) {
  const materials = useMemo(
    () =>
      template.materials ??
      materialsFallback(template.category, template.environment.background),
    [template],
  );
  const ceilingY = useMemo(
    () =>
      Math.max(
        ...template.walls.map((w) => (w.origin[1] ?? 0) + w.height),
        3.2,
      ) + 0.02,
    [template.walls],
  );

  const floorStyle = resolveFloorStyle(materials.floorStyle, template.category);
  const wallRoughness = materials.wallRoughness ?? 0.92;
  const floorRoughness = materials.floorRoughness ?? 0.78;
  const floorMetalness = materials.floorMetalness ?? 0.02;
  const ceilingRoughness = materials.ceilingRoughness ?? 1;
  const polishedFloor = shouldUsePolishedFloor(quality, template.category);
  const castShellShadow = quality === "walk" || quality === "marketing";
  const skylight = template.architecture?.skylight;

  const floorUv = mobile ? SURFACE_UV_PER_METER * 0.85 : SURFACE_UV_PER_METER;
  const floorGeometry = useMemo(
    () =>
      createBoundsShapeGeometry(template.walkBounds, {
        facing: "up",
        uvPerMeter: floorUv,
      }),
    [template.walkBounds, floorUv],
  );
  const ceilingGeometry = useMemo(
    () =>
      createBoundsShapeGeometry(template.walkBounds, {
        facing: "down",
        uvPerMeter: mobile ? 0.18 : 0.22,
        hole: skylight
          ? {
              centerX: 0,
              centerZ: 0,
              width: skylight.width,
              depth: skylight.depth,
            }
          : undefined,
      }),
    [
      template.walkBounds,
      mobile,
      skylight?.width,
      skylight?.depth,
    ],
  );

  const preferPhotoFloor =
    (quality === "walk" || quality === "marketing") && !mobile;
  const wallRepeat = mobile
    ? WALL_REPEAT_PER_METER * 0.9
    : WALL_REPEAT_PER_METER;
  // Photo wall/ceiling whenever an explicit catalogue id is set (incl. edit preview).
  const preferPhotoWall = Boolean(resolveWallAlbedoPath(materials.wallTextureId));
  const preferPhotoCeiling = Boolean(
    resolveCeilingAlbedoPath(materials.ceilingTextureId),
  );

  useEffect(() => {
    return () => {
      floorGeometry.dispose();
      ceilingGeometry.dispose();
    };
  }, [floorGeometry, ceilingGeometry]);

  const walkEnv =
    quality === "walk" || quality === "marketing"
      ? polishedFloor
        ? floorBoost
          ? 0.52
          : 0.4
        : 0.22
      : 0.14;

  const useMarbleClearcoat =
    polishedFloor && floorStyle === "stone" && (quality === "walk" || quality === "marketing");

  const voidTone = softenVoidColor(template.environment.background);

  return (
    <group>
      {/* Safety net: warm void beyond shell so any residual gap never reads as white infinity. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]}>
        <planeGeometry args={[180, 180]} />
        <meshBasicMaterial color={voidTone.ground} depthWrite={false} />
      </mesh>
      <mesh position={[0, 14, 0]}>
        <sphereGeometry args={[70, 24, 16]} />
        <meshBasicMaterial
          color={voidTone.sky}
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Geometry already lies in XZ — do not rotateX(-π/2) (that mirrors Z). */}
      <mesh
        position={[0, 0, 0]}
        receiveShadow={receiveShadow}
        geometry={floorGeometry}
      >
        <FloorAlbedoProvider
          style={floorStyle}
          baseHex={materials.floor}
          mobile={mobile}
          preferPhoto={preferPhotoFloor}
          textureId={materials.floorTextureId}
        >
          {(floorMap) =>
            useMarbleClearcoat ? (
              <meshPhysicalMaterial
                color="#ffffff"
                map={floorMap}
                roughness={Math.max(
                  0.28,
                  floorRoughness - (floorBoost ? 0.12 : 0.06),
                )}
                metalness={Math.min(
                  0.05,
                  floorMetalness + (floorBoost ? 0.02 : 0.01),
                )}
                clearcoat={floorBoost ? 0.55 : 0.38}
                clearcoatRoughness={floorBoost ? 0.22 : 0.32}
                envMapIntensity={walkEnv}
                side={FrontSide}
              />
            ) : (
              <meshStandardMaterial
                color="#ffffff"
                map={floorMap}
                roughness={
                  polishedFloor
                    ? Math.max(0.42, floorRoughness - (floorBoost ? 0.14 : 0.08))
                    : Math.max(0.52, floorRoughness)
                }
                metalness={
                  polishedFloor
                    ? Math.min(0.06, floorMetalness + (floorBoost ? 0.025 : 0.01))
                    : Math.min(0.03, floorMetalness)
                }
                envMapIntensity={walkEnv}
                side={FrontSide}
              />
            )
          }
        </FloorAlbedoProvider>
      </mesh>

      <mesh
        position={[0, ceilingY, 0]}
        receiveShadow={receiveShadow}
        geometry={ceilingGeometry}
      >
        <CeilingAlbedoProvider
          baseHex={materials.ceiling}
          mobile={mobile}
          preferPhoto={preferPhotoCeiling}
          textureId={materials.ceilingTextureId}
        >
          {(ceilingMap) => (
            <meshStandardMaterial
              color={materials.ceiling}
              map={ceilingMap}
              roughness={Math.min(1, ceilingRoughness + 0.02)}
              side={FrontSide}
              envMapIntensity={
                quality === "walk" || quality === "marketing" ? 0.05 : 0.08
              }
            />
          )}
        </CeilingAlbedoProvider>
      </mesh>

      <WallAlbedoProvider
        baseHex={materials.wall}
        mobile={mobile}
        preferPhoto={preferPhotoWall}
        textureId={materials.wallTextureId}
        repeat={wallRepeat}
      >
        {(wallMap) => (
          <>
            {template.walls.map((wall) => (
              <WallAssembly
                key={wall.id}
                wall={wall}
                materials={materials}
                wallMap={wallMap}
                wallRoughness={wallRoughness}
                receiveShadow={receiveShadow}
                castShadow={castShellShadow && !mobile}
              />
            ))}
          </>
        )}
      </WallAlbedoProvider>

      <ShellArchitecture
        template={template}
        ceilingY={ceilingY}
        receiveShadow={receiveShadow}
        castShadow={castShellShadow && !mobile}
        mobile={mobile}
      />
    </group>
  );
}

function WallAssembly({
  wall,
  materials,
  wallMap,
  wallRoughness,
  receiveShadow,
  castShadow,
}: {
  wall: TemplateWall;
  materials: TemplateMaterials;
  wallMap: Texture;
  wallRoughness: number;
  receiveShadow: boolean;
  castShadow: boolean;
}) {
  const yaw = yawFromNormal(wall.normal);
  const normal = new Vector3(wall.normal[0], wall.normal[1], wall.normal[2]);
  const faceOffset = normal.clone().multiplyScalar(-(WALL_FACE_INSET));
  const centerOffset = normal
    .clone()
    .multiplyScalar(-(WALL_FACE_INSET + WALL_THICKNESS / 2));
  const baseY = wall.origin[1] ?? 0;
  const position: [number, number, number] = [
    wall.origin[0] + centerOffset.x,
    baseY + wall.height / 2,
    wall.origin[2] + centerOffset.z,
  ];
  const faceX = wall.origin[0] + faceOffset.x;
  const faceZ = wall.origin[2] + faceOffset.z;
  const trimDepth = WALL_THICKNESS + 0.045;
  const trimPush = normal.clone().multiplyScalar(-(WALL_FACE_INSET - 0.01));
  const slabWidth = wall.width + WALL_CORNER_OVERLAP * 2;
  const trimWidth = slabWidth + 0.02;
  const showFloorTrim = baseY < 0.08;

  const bandColor = materials.wallBand;
  const bandBottom = materials.wallBandBottomM ?? 0.9;
  const bandTop = materials.wallBandTopM ?? 2.4;
  const bandHeight = Math.max(0.05, Math.min(wall.height - 0.1, bandTop - bandBottom));
  const bandMid = baseY + bandBottom + bandHeight / 2;
  const showBand =
    Boolean(bandColor) &&
    baseY < 0.08 &&
    bandBottom < wall.height - 0.05 &&
    bandHeight > 0.1;

  return (
    <group>
      <mesh
        position={position}
        rotation={new Euler(0, yaw, 0)}
        receiveShadow={receiveShadow}
        castShadow={castShadow}
      >
        <boxGeometry args={[slabWidth, wall.height, WALL_THICKNESS]} />
        <meshStandardMaterial
          color={materials.wall}
          map={wallMap}
          roughness={wallRoughness}
          side={DoubleSide}
          envMapIntensity={0.08}
        />
      </mesh>

      {showBand ? (
        <mesh
          position={[
            faceX + normal.x * 0.006,
            bandMid,
            faceZ + normal.z * 0.006,
          ]}
          rotation={new Euler(0, yaw, 0)}
          receiveShadow={receiveShadow}
        >
          <boxGeometry args={[slabWidth + 0.01, bandHeight, 0.012]} />
          <meshStandardMaterial
            color={bandColor}
            map={wallMap}
            roughness={Math.min(1, wallRoughness + 0.02)}
            side={FrontSide}
            envMapIntensity={0.06}
          />
        </mesh>
      ) : null}

      {showFloorTrim ? (
        <>
          {/* Contact AO — soft dark strip at wall–floor junction */}
          <mesh
            position={[
              faceX + trimPush.x + normal.x * 0.01,
              0.01,
              faceZ + trimPush.z + normal.z * 0.01,
            ]}
            rotation={new Euler(0, yaw, 0)}
          >
            <boxGeometry args={[slabWidth + 0.04, 0.02, 0.09]} />
            <meshStandardMaterial
              color="#1a1612"
              roughness={1}
              metalness={0}
              transparent
              opacity={0.22}
              depthWrite={false}
              envMapIntensity={0}
            />
          </mesh>

          {/* Baseboard */}
          <mesh
            position={[faceX + trimPush.x, 0.07, faceZ + trimPush.z]}
            rotation={new Euler(0, yaw, 0)}
            castShadow={castShadow}
            receiveShadow={receiveShadow}
          >
            <boxGeometry args={[trimWidth, 0.14, trimDepth]} />
            <meshStandardMaterial
              color={materials.trim}
              roughness={0.62}
              metalness={0.03}
              envMapIntensity={0.28}
            />
          </mesh>
        </>
      ) : null}

      {/* Picture rail — only on full-height hang walls without a museum band */}
      {baseY < 0.08 && wall.height > 2.8 && !showBand ? (
        <mesh
          position={[
            faceX + trimPush.x,
            Math.min(wall.height * 0.7, wall.height - 0.58),
            faceZ + trimPush.z,
          ]}
          rotation={new Euler(0, yaw, 0)}
        >
          <boxGeometry args={[slabWidth, 0.032, 0.04]} />
          <meshStandardMaterial
            color={materials.trim}
            roughness={0.65}
            metalness={0.025}
            envMapIntensity={0.22}
          />
        </mesh>
      ) : null}

      {/* Crown / cove moulding at top of slab */}
      <mesh
        position={[
          faceX + trimPush.x,
          baseY + wall.height - 0.06,
          faceZ + trimPush.z,
        ]}
        rotation={new Euler(0, yaw, 0)}
        castShadow={castShadow}
      >
        <boxGeometry args={[trimWidth, 0.09, trimDepth * 0.88]} />
        <meshStandardMaterial
          color={materials.trim}
          roughness={0.72}
          metalness={0.02}
          envMapIntensity={0.18}
        />
      </mesh>
      <mesh
        position={[
          faceX + trimPush.x + normal.x * 0.02,
          baseY + wall.height - 0.11,
          faceZ + trimPush.z + normal.z * 0.02,
        ]}
        rotation={new Euler(0, yaw, 0)}
      >
        <boxGeometry args={[slabWidth, 0.045, 0.055]} />
        <meshStandardMaterial
          color={materials.trim}
          roughness={0.78}
          metalness={0.02}
          envMapIntensity={0.15}
        />
      </mesh>
    </group>
  );
}

/** Dimmer ground / sky so residual gaps never read as blown-out white. */
function softenVoidColor(background: string): { ground: string; sky: string } {
  const hex = background.replace("#", "");
  if (hex.length < 6) {
    return { ground: "#3a342c", sky: "#6a6258" };
  }
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const ground = `#${[r, g, b]
    .map((c) => Math.max(28, Math.round(c * 0.28)).toString(16).padStart(2, "0"))
    .join("")}`;
  const sky = `#${[r, g, b]
    .map((c) => Math.max(48, Math.round(c * 0.52)).toString(16).padStart(2, "0"))
    .join("")}`;
  return { ground, sky };
}

function resolveFloorStyle(
  explicit: FloorStyle | undefined,
  category: SceneTemplate["category"],
): FloorStyle {
  if (explicit) return explicit;
  switch (category) {
    case "museum":
    case "timber":
      return "parquet";
    case "loft":
    case "industrial":
    case "brutalist":
      return "concrete";
    case "luxury":
    case "white":
      return "plank";
    case "black":
    case "night":
    case "minimal":
    case "atrium":
    case "coastal":
    case "zen":
      return "stone";
    default:
      return "plank";
  }
}
