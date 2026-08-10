"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  DoubleSide,
  Euler,
  ExtrudeGeometry,
  Object3D,
  Shape,
  SpotLight as ThreeSpotLight,
  Vector3,
} from "three";

import type { SceneTemplate, TemplateArchitecture, TemplateWall } from "@/core/entities";
import { yawFromNormal } from "@/three/math/geometry";
import { GalleryGlbProp } from "@/three/props/gallery-glb-prop";

import { GallerySign } from "./gallery-sign";
import { pickSparseTrackIndices } from "./track-lighting-utils";

/**
 * Procedural hall architecture: skylight, window, plinths, beams, tracks, benches.
 * Flagship halls can swap benches for CC0 GLTFs and add `glbProps` dressing.
 * Driven by `template.architecture` — no-ops when absent.
 */
export function ShellArchitecture({
  template,
  ceilingY,
  receiveShadow,
  castShadow,
  mobile = false,
}: {
  template: SceneTemplate;
  ceilingY: number;
  receiveShadow: boolean;
  castShadow: boolean;
  mobile?: boolean;
}) {
  const arch = template.architecture;
  const aabb = useMemo(
    () => boundsAabb(template.walkBounds),
    [template.walkBounds],
  );

  if (!arch) return null;

  return (
    <group>
      {arch.skylight ? (
        <SkylightWell
          skylight={arch.skylight}
          ceilingY={ceilingY}
          trim={template.materials.trim}
          ceiling={template.materials.ceiling}
          receiveShadow={receiveShadow}
          mobile={mobile}
        />
      ) : null}
      {arch.window ? (
        <HallWindow
          window={arch.window}
          walls={template.walls}
          trim={template.materials.trim}
          castShadow={castShadow}
          receiveShadow={receiveShadow}
          mobile={mobile}
        />
      ) : null}
      {arch.plinths?.map((plinth, i) => (
        <DisplayPlinth
          key={`plinth-${i}`}
          position={plinth.position}
          size={plinth.size}
          castShadow={castShadow}
          receiveShadow={receiveShadow}
        />
      ))}
      {arch.beams ? (
        <CeilingBeams
          beams={arch.beams}
          ceilingY={ceilingY}
          aabb={aabb}
          castShadow={castShadow}
          receiveShadow={receiveShadow}
          skylight={arch.skylight}
        />
      ) : null}
      {arch.trackLights ? (
        <TrackLighting
          tracks={arch.trackLights}
          ceilingY={ceilingY}
          aabb={aabb}
          mobile={mobile}
        />
      ) : null}
      {arch.benches?.map((bench, i) =>
        bench.glb ? (
          <GalleryGlbProp
            key={`bench-glb-${i}`}
            model="bench"
            position={bench.position}
            yaw={bench.yaw ?? 0}
            fitSize={bench.size}
            castShadow={castShadow}
            receiveShadow={receiveShadow}
          />
        ) : (
          <GalleryBench
            key={`bench-${i}`}
            position={bench.position}
            size={bench.size}
            yaw={bench.yaw ?? 0}
            color={bench.color ?? "#c4a574"}
            castShadow={castShadow}
            receiveShadow={receiveShadow}
          />
        ),
      )}
      {arch.glbProps?.map((prop, i) => (
        <GalleryGlbProp
          key={`glb-${prop.model}-${i}`}
          model={prop.model}
          position={prop.position}
          yaw={prop.yaw ?? 0}
          scale={prop.scale ?? 1}
          fitSize={prop.fitSize}
          castShadow={castShadow}
          receiveShadow={receiveShadow}
        />
      ))}
      {arch.signs?.map((sign, i) => (
        <GallerySign
          key={`sign-${i}-${sign.text}`}
          text={sign.text}
          subtitle={sign.subtitle}
          position={sign.position}
          yaw={sign.yaw ?? 0}
          width={sign.width}
          height={sign.height}
          style={sign.style ?? "wall"}
        />
      ))}
    </group>
  );
}

type Aabb = { minX: number; maxX: number; minZ: number; maxZ: number };

function boundsAabb(walkBounds: SceneTemplate["walkBounds"]): Aabb {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const [x, z] of walkBounds) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
  }
  if (!Number.isFinite(minX)) {
    return { minX: -5, maxX: 5, minZ: -5, maxZ: 5 };
  }
  return { minX, maxX, minZ, maxZ };
}

function fieldLayout(
  axis: "x" | "z",
  count: number,
  aabb: Aabb,
  lengthM: number | undefined,
  center: readonly [number, number] | undefined,
  spacingM: number | undefined,
  inset = 0.55,
): { length: number; positions: number[]; cx: number; cz: number } {
  const cx = center?.[0] ?? (aabb.minX + aabb.maxX) / 2;
  const cz = center?.[1] ?? (aabb.minZ + aabb.maxZ) / 2;
  const spanX = Math.max(2, aabb.maxX - aabb.minX - inset * 2);
  const spanZ = Math.max(2, aabb.maxZ - aabb.minZ - inset * 2);
  const length = lengthM ?? (axis === "x" ? spanX : spanZ);
  const alongSpan = axis === "x" ? spanZ : spanX;
  const spacing =
    spacingM ?? (count <= 1 ? 0 : alongSpan / Math.max(1, count - 1));
  const start = -((count - 1) * spacing) / 2;
  const positions = Array.from({ length: count }, (_, i) => start + i * spacing);
  return { length, positions, cx, cz };
}

function CeilingBeams({
  beams,
  ceilingY,
  aabb,
  castShadow,
  receiveShadow,
  skylight,
}: {
  beams: NonNullable<TemplateArchitecture["beams"]>;
  ceilingY: number;
  aabb: Aabb;
  castShadow: boolean;
  receiveShadow: boolean;
  skylight?: TemplateArchitecture["skylight"];
}) {
  const widthM = beams.widthM ?? 0.2;
  const heightM = beams.heightM ?? 0.26;
  const color = beams.color ?? "#c9a56e";
  const { length, positions, cx, cz } = fieldLayout(
    beams.axis,
    beams.count,
    aabb,
    beams.lengthM,
    beams.center,
    beams.spacingM,
  );
  const y = ceilingY - heightM / 2 - 0.01;
  // Leave the coffered skylight well clear of timber (Metasteps-style opening).
  const skipHalfX = skylight ? skylight.width / 2 + 0.35 : 0;
  const skipHalfZ = skylight ? skylight.depth / 2 + 0.35 : 0;

  return (
    <group>
      {positions.map((along, i) => {
        const pos: [number, number, number] =
          beams.axis === "x"
            ? [cx, y, cz + along]
            : [cx + along, y, cz];
        if (
          skylight &&
          Math.abs(pos[0]) < skipHalfX &&
          Math.abs(pos[2]) < skipHalfZ
        ) {
          return null;
        }
        const args: [number, number, number] =
          beams.axis === "x"
            ? [length, heightM, widthM]
            : [widthM, heightM, length];
        return (
          <mesh
            key={`beam-${i}`}
            position={pos}
            castShadow={castShadow}
            receiveShadow={receiveShadow}
          >
            <boxGeometry args={args} />
            <meshStandardMaterial
              color={color}
              roughness={0.72}
              metalness={0.02}
              envMapIntensity={0.14}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function TrackLighting({
  tracks,
  ceilingY,
  aabb,
  mobile,
}: {
  tracks: NonNullable<TemplateArchitecture["trackLights"]>;
  ceilingY: number;
  aabb: Aabb;
  mobile: boolean;
}) {
  const spotsPerRail = tracks.spotsPerRail ?? 5;
  const railColor = tracks.railColor ?? "#1c1c1e";
  const baseIntensity = tracks.intensity ?? 0.48;
  const maxLive = Math.min(10, Math.max(0, tracks.maxLive ?? 8));
  const { length, positions, cx, cz } = fieldLayout(
    tracks.axis,
    tracks.count,
    aabb,
    tracks.lengthM,
    tracks.center,
    tracks.spacingM,
    0.9,
  );
  const railY = ceilingY - 0.12;
  const railThickness = 0.035;
  const railDepth = 0.055;

  const fixturePositions = useMemo(() => {
    const list: (readonly [number, number, number])[] = [];
    for (const along of positions) {
      for (let s = 0; s < spotsPerRail; s++) {
        const t = spotsPerRail === 1 ? 0 : s / (spotsPerRail - 1);
        const alongRail = -length / 2 + t * length;
        list.push(
          tracks.axis === "x"
            ? ([cx + alongRail, railY - 0.06, cz + along] as const)
            : ([cx + along, railY - 0.06, cz + alongRail] as const),
        );
      }
    }
    return list;
  }, [positions, spotsPerRail, length, tracks.axis, cx, cz, railY]);

  // Sparse live keys — desktop only; every fixture stays lit (emissive + lens).
  const liveIndices = useMemo(
    () => pickSparseTrackIndices(fixturePositions.length, mobile ? 0 : maxLive),
    [fixturePositions.length, mobile, maxLive],
  );
  const liveSet = useMemo(() => new Set(liveIndices), [liveIndices]);

  return (
    <group>
      {positions.map((along, railIndex) => {
        const railPos: [number, number, number] =
          tracks.axis === "x"
            ? [cx, railY, cz + along]
            : [cx + along, railY, cz];
        const railArgs: [number, number, number] =
          tracks.axis === "x"
            ? [length, railThickness, railDepth]
            : [railDepth, railThickness, length];

        const spotPositions = Array.from({ length: spotsPerRail }, (_, s) => {
          const t = spotsPerRail === 1 ? 0 : s / (spotsPerRail - 1);
          const alongRail = -length / 2 + t * length;
          return tracks.axis === "x"
            ? ([cx + alongRail, railY - 0.06, cz + along] as const)
            : ([cx + along, railY - 0.06, cz + alongRail] as const);
        });

        return (
          <group key={`rail-${railIndex}`}>
            <mesh position={railPos}>
              <boxGeometry args={railArgs} />
              <meshStandardMaterial
                color={railColor}
                roughness={0.45}
                metalness={0.55}
                envMapIntensity={0.35}
              />
            </mesh>
            {spotPositions.map((sp, s) => {
              const globalIdx = railIndex * spotsPerRail + s;
              const isLive = liveSet.has(globalIdx);
              const canEmissive = mobile
                ? 0.45
                : isLive
                  ? 1.35
                  : 0.85;
              return (
                <group key={`spot-${railIndex}-${s}`} position={[...sp]}>
                  <mesh>
                    <cylinderGeometry args={[0.04, 0.055, 0.08, 10]} />
                    <meshStandardMaterial
                      color="#141416"
                      roughness={0.4}
                      metalness={0.6}
                      emissive="#fff4e0"
                      emissiveIntensity={canEmissive}
                    />
                  </mesh>
                  {/* Lit lens disc so cans read as “on”, not dark decorative shells */}
                  <mesh position={[0, -0.042, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[0.032, 12]} />
                    <meshBasicMaterial
                      color={isLive || mobile ? "#fff8ec" : "#ffe8c8"}
                      toneMapped={false}
                    />
                  </mesh>
                </group>
              );
            })}
          </group>
        );
      })}
      {liveIndices.map((idx) => {
        const pos = fixturePositions[idx];
        if (!pos) return null;
        // Aim slightly outward from nave centre so pools kiss walls/art bands.
        const aimX = pos[0] * 1.15;
        const aimZ = pos[2] * 1.05;
        return (
          <TrackSpotLive
            key={`live-spot-${idx}`}
            position={pos}
            target={[aimX, 1.55, aimZ]}
            intensity={baseIntensity * 1.95}
          />
        );
      })}
    </group>
  );
}

function TrackSpotLive({
  position,
  target,
  intensity,
}: {
  position: readonly [number, number, number];
  target: readonly [number, number, number];
  intensity: number;
}) {
  const lightRef = useRef<ThreeSpotLight>(null);
  const targetRef = useRef<Object3D>(null);

  useLayoutEffect(() => {
    if (!lightRef.current || !targetRef.current) return;
    lightRef.current.target = targetRef.current;
    lightRef.current.target.updateMatrixWorld();
  }, [target]);

  return (
    <>
      <spotLight
        ref={lightRef}
        color="#fff3e4"
        intensity={intensity}
        angle={0.48}
        penumbra={0.86}
        distance={14}
        position={[position[0], position[1], position[2]]}
        castShadow={false}
        decay={2}
      />
      <object3D ref={targetRef} position={[target[0], target[1], target[2]]} />
    </>
  );
}

function GalleryBench({
  position,
  size,
  yaw,
  color,
  castShadow,
  receiveShadow,
}: {
  position: readonly [number, number, number];
  size: readonly [number, number, number];
  yaw: number;
  color: string;
  castShadow: boolean;
  receiveShadow: boolean;
}) {
  const [w, h, d] = size;
  const legW = Math.min(0.14, w * 0.08);
  const legH = h * 0.92;
  const insetX = w * 0.5 - legW * 0.5 - 0.06;
  const insetZ = d * 0.5 - legW * 0.5 - 0.04;

  return (
    <group position={[position[0], position[1], position[2]]} rotation={[0, yaw, 0]}>
      <mesh
        position={[0, h / 2, 0]}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      >
        <boxGeometry args={[w, h * 0.22, d]} />
        <meshStandardMaterial
          color={color}
          roughness={0.58}
          metalness={0.04}
          envMapIntensity={0.18}
        />
      </mesh>
      {(
        [
          [-insetX, -insetZ],
          [insetX, -insetZ],
          [-insetX, insetZ],
          [insetX, insetZ],
        ] as const
      ).map(([lx, lz], i) => (
        <mesh
          key={`leg-${i}`}
          position={[lx, legH / 2, lz]}
          castShadow={castShadow}
          receiveShadow={receiveShadow}
        >
          <boxGeometry args={[legW, legH, legW]} />
          <meshStandardMaterial
            color={color}
            roughness={0.74}
            metalness={0.02}
            envMapIntensity={0.1}
          />
        </mesh>
      ))}
      <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w * 1.08, d * 1.12]} />
        <meshStandardMaterial
          color="#1a1612"
          transparent
          opacity={0.14}
          depthWrite={false}
          roughness={1}
          envMapIntensity={0}
        />
      </mesh>
    </group>
  );
}

function SkylightWell({
  skylight,
  ceilingY,
  trim,
  ceiling,
  receiveShadow,
  mobile,
}: {
  skylight: NonNullable<TemplateArchitecture["skylight"]>;
  ceilingY: number;
  trim: string;
  ceiling: string;
  receiveShadow: boolean;
  mobile: boolean;
}) {
  const width = skylight.width;
  const depth = skylight.depth;
  const recess = skylight.recessM ?? 0.26;
  const gridX = skylight.gridX ?? 3;
  const gridZ = skylight.gridZ ?? 4;
  const wellY = ceilingY - recess / 2;
  const mullion = 0.055;
  const panelW = (width - mullion * (gridX + 1)) / gridX;
  const panelD = (depth - mullion * (gridZ + 1)) / gridZ;
  const glassY = ceilingY - recess + 0.02;

  const panels = useMemo(() => {
    const list: { x: number; z: number }[] = [];
    for (let ix = 0; ix < gridX; ix++) {
      for (let iz = 0; iz < gridZ; iz++) {
        const x =
          -width / 2 + mullion + panelW / 2 + ix * (panelW + mullion);
        const z =
          -depth / 2 + mullion + panelD / 2 + iz * (panelD + mullion);
        list.push({ x, z });
      }
    }
    return list;
  }, [gridX, gridZ, width, depth, panelW, panelD, mullion]);

  return (
    <group>
      {/* Recess well walls */}
      <mesh position={[0, wellY, -depth / 2]} receiveShadow={receiveShadow}>
        <boxGeometry args={[width + 0.08, recess, 0.06]} />
        <meshStandardMaterial color={ceiling} roughness={0.9} envMapIntensity={0.06} />
      </mesh>
      <mesh position={[0, wellY, depth / 2]} receiveShadow={receiveShadow}>
        <boxGeometry args={[width + 0.08, recess, 0.06]} />
        <meshStandardMaterial color={ceiling} roughness={0.9} envMapIntensity={0.06} />
      </mesh>
      <mesh position={[-width / 2, wellY, 0]} receiveShadow={receiveShadow}>
        <boxGeometry args={[0.06, recess, depth]} />
        <meshStandardMaterial color={ceiling} roughness={0.9} envMapIntensity={0.06} />
      </mesh>
      <mesh position={[width / 2, wellY, 0]} receiveShadow={receiveShadow}>
        <boxGeometry args={[0.06, recess, depth]} />
        <meshStandardMaterial color={ceiling} roughness={0.9} envMapIntensity={0.06} />
      </mesh>

      {/* Outer coffer rim at ceiling plane (frame only — do not fill the opening) */}
      <mesh position={[0, ceilingY - 0.01, -(depth + 0.11) / 2]}>
        <boxGeometry args={[width + 0.22, 0.05, 0.11]} />
        <meshStandardMaterial color={trim} roughness={0.78} metalness={0.02} envMapIntensity={0.12} />
      </mesh>
      <mesh position={[0, ceilingY - 0.01, (depth + 0.11) / 2]}>
        <boxGeometry args={[width + 0.22, 0.05, 0.11]} />
        <meshStandardMaterial color={trim} roughness={0.78} metalness={0.02} envMapIntensity={0.12} />
      </mesh>
      <mesh position={[-(width + 0.11) / 2, ceilingY - 0.01, 0]}>
        <boxGeometry args={[0.11, 0.05, depth]} />
        <meshStandardMaterial color={trim} roughness={0.78} metalness={0.02} envMapIntensity={0.12} />
      </mesh>
      <mesh position={[(width + 0.11) / 2, ceilingY - 0.01, 0]}>
        <boxGeometry args={[0.11, 0.05, depth]} />
        <meshStandardMaterial color={trim} roughness={0.78} metalness={0.02} envMapIntensity={0.12} />
      </mesh>

      {/* Grid mullions */}
      {Array.from({ length: gridX + 1 }, (_, i) => {
        const px = -width / 2 + mullion / 2 + i * (panelW + mullion);
        return (
          <mesh key={`mx-${i}`} position={[px, glassY, 0]}>
            <boxGeometry args={[mullion, 0.04, depth - mullion]} />
            <meshStandardMaterial color={trim} roughness={0.7} metalness={0.03} />
          </mesh>
        );
      })}
      {Array.from({ length: gridZ + 1 }, (_, i) => {
        const pz = -depth / 2 + mullion / 2 + i * (panelD + mullion);
        return (
          <mesh key={`mz-${i}`} position={[0, glassY, pz]}>
            <boxGeometry args={[width - mullion, 0.04, mullion]} />
            <meshStandardMaterial color={trim} roughness={0.7} metalness={0.03} />
          </mesh>
        );
      })}

      {/* Frosted glass panels — real well opening, soft daylight (not a glowing box) */}
      {panels.map((p, i) => (
        <mesh key={`panel-${i}`} position={[p.x, glassY, p.z]}>
          <boxGeometry args={[panelW * 0.98, 0.016, panelD * 0.98]} />
          <meshStandardMaterial
            color="#eef3f8"
            emissive="#d8e2ee"
            emissiveIntensity={mobile ? 0.22 : 0.34}
            roughness={0.82}
            metalness={0}
            transparent
            opacity={0.78}
            envMapIntensity={0.2}
          />
        </mesh>
      ))}

      {/* Sky beyond the hole — sits above the ceiling, never a hanging light column */}
      <mesh position={[0, ceilingY + 0.42, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width * 1.35, depth * 1.35]} />
        <meshBasicMaterial
          color="#e6edf5"
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>
    </group>
  );
}

function HallWindow({
  window: win,
  walls,
  trim,
  castShadow,
  receiveShadow,
  mobile = false,
}: {
  window: NonNullable<TemplateArchitecture["window"]>;
  walls: readonly TemplateWall[];
  trim: string;
  castShadow: boolean;
  receiveShadow: boolean;
  mobile?: boolean;
}) {
  const wall = walls.find((w) => w.id === win.wallId);
  if (!wall) return null;

  const sill = win.sillM ?? 0.4;
  const offset = win.offsetM ?? 0;
  const arched = win.arched ?? false;
  const yaw = yawFromNormal(wall.normal);
  const normal = new Vector3(wall.normal[0], wall.normal[1], wall.normal[2]);
  const tangent = new Vector3(-wall.normal[2], 0, wall.normal[0]).normalize();

  const faceInset = 0.02;
  const center = new Vector3(
    wall.origin[0],
    sill + win.height / 2,
    wall.origin[2],
  )
    .add(tangent.clone().multiplyScalar(offset))
    .add(normal.clone().multiplyScalar(faceInset));

  const glassGeom = useMemo(() => {
    if (!arched) return null;
    const hw = win.width / 2;
    const archR = Math.min(hw, win.height * 0.28);
    const bodyH = win.height - archR;
    const shape = new Shape();
    shape.moveTo(-hw, 0);
    shape.lineTo(hw, 0);
    shape.lineTo(hw, bodyH);
    shape.absarc(0, bodyH, archR, 0, Math.PI, false);
    shape.closePath();
    const geom = new ExtrudeGeometry(shape, {
      depth: 0.04,
      bevelEnabled: false,
    });
    geom.translate(0, -win.height / 2, -0.02);
    return geom;
  }, [arched, win.width, win.height]);

  useEffect(() => {
    return () => {
      glassGeom?.dispose();
    };
  }, [glassGeom]);

  // Warm morning glass — brighter emissive, no mesh “god ray” slabs.
  const glassEmissive = "#f3e6d2";
  const glassEmissiveIntensity = mobile ? 0.95 : 1.18;

  return (
    <group position={center.toArray()} rotation={new Euler(0, yaw, 0)}>
      {/* Outer frame */}
      <mesh
        position={[0, 0, 0.02]}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      >
        <boxGeometry args={[win.width + 0.14, win.height + 0.14, 0.08]} />
        <meshStandardMaterial
          color={trim}
          roughness={0.68}
          metalness={0.04}
          envMapIntensity={0.2}
        />
      </mesh>

      {/* Reveal / jamb depth */}
      <mesh position={[0, 0, -0.04]}>
        <boxGeometry args={[win.width + 0.02, win.height + 0.02, 0.12]} />
        <meshStandardMaterial color="#c8ced4" roughness={0.88} />
      </mesh>

      {arched && glassGeom ? (
        <mesh geometry={glassGeom} position={[0, 0, 0.01]}>
          <meshStandardMaterial
            color="#f7f2ea"
            emissive={glassEmissive}
            emissiveIntensity={glassEmissiveIntensity}
            roughness={0.28}
            metalness={0.02}
            transparent
            opacity={0.92}
            side={DoubleSide}
            envMapIntensity={0.4}
          />
        </mesh>
      ) : (
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[win.width * 0.92, win.height * 0.92, 0.03]} />
          <meshStandardMaterial
            color="#f7f2ea"
            emissive={glassEmissive}
            emissiveIntensity={glassEmissiveIntensity}
            roughness={0.28}
            metalness={0.02}
            transparent
            opacity={0.92}
            side={DoubleSide}
            envMapIntensity={0.4}
          />
        </mesh>
      )}

      {/* Real morning spill — soft spot through the opening (no volumetric mesh) */}
      {!mobile ? (
        <WindowMorningSpill
          sill={sill}
          windowHeight={win.height}
          windowWidth={win.width}
        />
      ) : null}
    </group>
  );
}

/**
 * Soft warm pool from the tall window onto the floor/walls. Uses a real
 * SpotLight with wide penumbra so morning light reads as atmosphere, not
 * low-poly translucent slabs.
 */
function WindowMorningSpill({
  sill,
  windowHeight,
  windowWidth,
}: {
  sill: number;
  windowHeight: number;
  windowWidth: number;
}) {
  const lightRef = useRef<ThreeSpotLight>(null);
  const targetRef = useRef<Object3D>(null);
  // Local +Z = into the room; aim down-floor a few metres in.
  const floorY = -(sill + windowHeight / 2);
  const targetX = 0.12;
  const targetY = floorY + 0.02;
  const targetZ = Math.max(4.2, windowHeight * 1.35);

  useLayoutEffect(() => {
    if (!lightRef.current || !targetRef.current) return;
    lightRef.current.target = targetRef.current;
    lightRef.current.target.updateMatrixWorld();
  }, [targetX, targetY, targetZ]);

  return (
    <>
      <spotLight
        ref={lightRef}
        color="#ffe2b8"
        intensity={1.85}
        angle={Math.min(0.55, 0.32 + windowWidth * 0.08)}
        penumbra={0.92}
        distance={Math.max(14, windowHeight * 4.2)}
        position={[0.06, windowHeight * 0.12, 0.35]}
        castShadow={false}
        decay={2}
      />
      <object3D ref={targetRef} position={[targetX, targetY, targetZ]} />
    </>
  );
}

function DisplayPlinth({
  position,
  size,
  castShadow,
  receiveShadow,
}: {
  position: readonly [number, number, number];
  size: readonly [number, number, number];
  castShadow: boolean;
  receiveShadow: boolean;
}) {
  const [w, h, d] = size;
  return (
    <group position={[position[0], position[1], position[2]]}>
      <mesh
        position={[0, h / 2, 0]}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      >
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color="#f0eeea"
          roughness={0.72}
          metalness={0.035}
          envMapIntensity={0.16}
        />
      </mesh>
      {/* Soft contact AO under plinth */}
      <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w * 1.15, d * 1.15]} />
        <meshStandardMaterial
          color="#1a1612"
          transparent
          opacity={0.18}
          depthWrite={false}
          roughness={1}
          envMapIntensity={0}
        />
      </mesh>
    </group>
  );
}
