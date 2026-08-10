"use client";

import { Canvas } from "@react-three/fiber";
import { lazy, Suspense, useEffect } from "react";
import {
  ACESFilmicToneMapping,
  Color,
  Fog,
  NeutralToneMapping,
  NoToneMapping,
  PCFSoftShadowMap,
} from "three";

import type { SceneManifest } from "@/core/entities";

import { EditorOrbitControls } from "../controls/editor-orbit-controls";
import { FirstPersonWalkControls } from "../controls/first-person-walk-controls";
import { preloadGalleryProps } from "../props/gallery-glb-prop";
import { FLAGSHIP_PROP_PRELOAD } from "../props/gallery-prop-paths";
import { ArtworkFrame } from "./artwork-frame";
import { GalleryEnvironment } from "./gallery-environment";
import { GalleryLights } from "./gallery-lights";
import type { GalleryQuality } from "./gallery-quality";
import { SelectionRing } from "./selection-ring";
import { TemplateShell } from "./template-shell";

const GalleryEffects = lazy(() =>
  import("./gallery-effects").then((m) => ({ default: m.GalleryEffects })),
);

export interface SceneRootProps {
  readonly manifest: SceneManifest;
  /** Editor mounts with walk disabled; the public viewer enables it. */
  readonly walkEnabled?: boolean;
  /** When true, orbit replaces first-person (edit camera). */
  readonly orbitEnabled?: boolean;
  /** Cap DPR / shadows / LOD for phones. */
  readonly mobile?: boolean;
  /** Disable bloom / heavy post when the user prefers reduced motion. */
  readonly reducedMotion?: boolean;
  readonly selectedArtworkId?: string | null;
  /** Editor-only: muted selection when placement is locked. */
  readonly selectedArtworkLocked?: boolean;
  readonly onSelectArtwork?: (artworkId: string | null) => void;
  readonly className?: string;
  readonly onReady?: () => void;
  /** R3F children (e.g. editor placement tools). */
  readonly children?: React.ReactNode;
}

/**
 * Shared 3D mount. Editor and viewer both render through this component so a
 * published gallery cannot diverge from what the artist arranged.
 */
export function SceneRoot({
  manifest,
  walkEnabled = true,
  orbitEnabled = false,
  mobile = false,
  reducedMotion = false,
  selectedArtworkId = null,
  selectedArtworkLocked = false,
  onSelectArtwork,
  className,
  onReady,
  children,
}: SceneRootProps) {
  const { template, settings, artworks } = manifest;
  const spawn = template.spawn;

  useEffect(() => {
    if (
      template.architecture?.glbProps?.length ||
      template.architecture?.benches?.some((b) => b.glb)
    ) {
      preloadGalleryProps(FLAGSHIP_PROP_PRELOAD);
    }
  }, [template.architecture]);

  const toneMapping =
    template.environment.toneMapping === "neutral"
      ? NeutralToneMapping
      : template.environment.toneMapping === "linear"
        ? NoToneMapping
        : ACESFilmicToneMapping;

  /** Edit mode stays lighter; walk/public gets museum-grade polish when not mobile. */
  const quality: GalleryQuality = mobile
    ? "mobile"
    : orbitEnabled
      ? "edit"
      : "walk";
  const enableShadows = quality === "walk";
  const enableEffects = quality !== "edit" && !reducedMotion;
  const reflective =
    template.category === "museum" ||
    template.category === "luxury" ||
    template.category === "white" ||
    template.category === "atrium" ||
    template.category === "coastal" ||
    template.category === "zen" ||
    template.category === "timber";

  const editCameraPosition: [number, number, number] = orbitEnabled
    ? [spawn.position[0] + 2.5, 2.2, spawn.position[2] + 4.5]
    : [spawn.position[0], spawn.position[1], spawn.position[2]];

  const clearColor = template.environment.background;

  return (
    <div
      className={className}
      style={{
        width: "100%",
        height: "100%",
        // Never show the viewer’s dark chrome through a failed/transparent GL
        // context — match the template room colour as an HTML fallback.
        backgroundColor: clearColor,
      }}
    >
      <Canvas
        shadows={enableShadows}
        dpr={
          quality === "mobile"
            ? [1, 1.25]
            : quality === "edit"
              ? [1, 1.5]
              : [1, 1.75]
        }
        performance={{ min: quality === "mobile" ? 0.5 : 0.7 }}
        gl={{
          antialias: quality !== "mobile",
          powerPreference: quality === "mobile" ? "default" : "high-performance",
          toneMapping,
          toneMappingExposure: template.environment.exposure,
          // R3F defaults to alpha:true; an empty/suspended scene would then
          // punch a hole through to the dark viewer chrome.
          alpha: false,
        }}
        style={{ width: "100%", height: "100%", display: "block" }}
        camera={{
          // ~55° reads as standing in a gallery; 60° felt slightly game-wide.
          fov: quality === "mobile" ? 62 : quality === "edit" ? 58 : 55,
          near: 0.05,
          far: 80,
          position: editCameraPosition,
        }}
        onPointerMissed={() => onSelectArtwork?.(null)}
        onCreated={({ camera, scene, gl }) => {
          camera.rotation.order = "YXZ";
          if (!orbitEnabled) {
            camera.rotation.y = spawn.yaw;
            camera.rotation.x = 0;
          }
          scene.background = new Color(clearColor);
          gl.setClearColor(clearColor, 1);
          if (enableShadows) {
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = PCFSoftShadowMap;
          }
          const fog = template.environment.fog;
          if (fog) {
            scene.fog = new Fog(fog.color, fog.near, fog.far);
          } else {
            scene.fog = null;
          }
          onReady?.();
        }}
      >
        <GalleryLights
          template={template}
          quality={quality}
          cinematic={quality === "walk"}
        />
        <GalleryEnvironment quality={quality} category={template.category} />

        <TemplateShell
          template={template}
          receiveShadow={enableShadows}
          mobile={mobile}
          quality={quality}
          floorBoost={quality === "walk" && reflective}
        />

        {artworks.map((artwork) => (
          <group key={artwork.id}>
            <ArtworkFrame
              artwork={artwork}
              showTitle={settings.showTitles}
              selected={selectedArtworkId === artwork.id}
              mobile={mobile}
              // Walk / public: click the frame itself. Hotspot dots only in editor.
              showHotspot={orbitEnabled}
              onSelect={onSelectArtwork}
            />
            {selectedArtworkId === artwork.id && !mobile ? (
              <SelectionRing
                artwork={artwork}
                locked={selectedArtworkLocked}
              />
            ) : null}
          </group>
        ))}

        {enableEffects ? (
          <Suspense fallback={null}>
            <GalleryEffects
              quality={quality}
              reducedMotion={reducedMotion}
              toneMapping={template.environment.toneMapping}
            />
          </Suspense>
        ) : null}

        {walkEnabled && !orbitEnabled ? (
          <FirstPersonWalkControls
            walkBounds={template.walkBounds}
            walkSpeed={settings.walkSpeed}
            eyeHeight={spawn.position[1]}
            initialYaw={spawn.yaw}
            enabled
          />
        ) : null}
        {orbitEnabled && !walkEnabled ? (
          <EditorOrbitControls enabled />
        ) : null}
        {children}
      </Canvas>
    </div>
  );
}
