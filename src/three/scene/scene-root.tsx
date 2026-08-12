"use client";

import { Canvas, useThree } from "@react-three/fiber";
import {
  Component,
  lazy,
  Suspense,
  useEffect,
  type ReactNode,
} from "react";
import {
  ACESFilmicToneMapping,
  Color,
  Fog,
  NeutralToneMapping,
  NoToneMapping,
  PCFSoftShadowMap,
} from "three";

import type { SceneManifest } from "@/core/entities";
import {
  daylightLook,
  isNightLikePeriod,
  type DaylightPeriod,
} from "@/features/viewer/lib/daylight";

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
import { VisitorFloorShadow } from "./visitor-shadow";
import { WalkPlaceSoundBridge } from "./walk-place-sound";

/** Soft-fail: walk/edit still render if the postprocessing chunk is stale/missing. */
const GalleryEffects = lazy(() =>
  import("./gallery-effects")
    .then((m) => ({ default: m.GalleryEffects }))
    .catch((err) => {
      console.warn("[gallery] effects chunk failed to load", err);
      return { default: function GalleryEffectsUnavailable() {
        return null;
      } };
    }),
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
  /** Visitor night / evening lighting. Prefer `daylight`. */
  readonly eveningMode?: boolean;
  /** Museum daylight cycle — morning / noon / evening / night. */
  readonly daylight?: DaylightPeriod;
  /** Soft place sound + footsteps while walking. */
  readonly placeSoundEnabled?: boolean;
  /** Master mute for place / night ambience driven inside the canvas. */
  readonly soundMuted?: boolean;
  /** Soft elliptical visitor shadow on the floor (walk only). */
  readonly visitorShadow?: boolean;
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
  eveningMode = false,
  daylight,
  placeSoundEnabled = false,
  soundMuted = false,
  visitorShadow = false,
  selectedArtworkId = null,
  selectedArtworkLocked = false,
  onSelectArtwork,
  className,
  onReady,
  children,
}: SceneRootProps) {
  const { template, settings, artworks } = manifest;
  const spawn = template.spawn;
  const period: DaylightPeriod =
    daylight ?? (eveningMode ? "night" : "morning");
  const look = daylightLook(period);

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

  const dayClear = template.environment.background;
  const clearColor =
    look.clearDarken > 0 ? darkenHex(dayClear, look.clearDarken) : dayClear;
  const exposure = template.environment.exposure * look.exposureScale;

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
          toneMappingExposure: exposure,
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
          onReady?.();
        }}
      >
        <DaylightAtmosphereSync
          period={period}
          dayClear={dayClear}
          dayExposure={template.environment.exposure}
          fog={template.environment.fog ?? null}
        />
        <GalleryLights
          template={template}
          quality={quality}
          cinematic={quality === "walk"}
          daylight={period}
        />
        <GalleryEnvironment quality={quality} category={template.category} />

        <TemplateShell
          template={template}
          receiveShadow={enableShadows}
          mobile={mobile}
          quality={quality}
          floorBoost={quality === "walk" && reflective}
          floorPolish={
            quality === "walk" && reflective ? look.floorPolish : 1
          }
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

        {walkEnabled && !orbitEnabled && visitorShadow ? (
          <VisitorFloorShadow enabled={!mobile} />
        ) : null}

        {walkEnabled && !orbitEnabled ? (
          <WalkPlaceSoundBridge
            enabled={placeSoundEnabled}
            muted={soundMuted || reducedMotion}
          />
        ) : null}

        {enableEffects ? (
          <EffectsErrorBoundary>
            <Suspense fallback={null}>
              <GalleryEffects
                quality={quality}
                reducedMotion={reducedMotion}
                toneMapping={template.environment.toneMapping}
              />
            </Suspense>
          </EffectsErrorBoundary>
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

function DaylightAtmosphereSync({
  period,
  dayClear,
  dayExposure,
  fog,
}: {
  period: DaylightPeriod;
  dayClear: string;
  dayExposure: number;
  fog: { color: string; near: number; far: number } | null;
}) {
  const { scene, gl } = useThree();
  const look = daylightLook(period);

  useEffect(() => {
    const clear =
      look.clearDarken > 0 ? darkenHex(dayClear, look.clearDarken) : dayClear;
    scene.background = new Color(clear);
    gl.setClearColor(clear, 1);
    gl.toneMappingExposure = dayExposure * look.exposureScale;

    if (fog) {
      scene.fog = new Fog(
        look.clearDarken > 0.2 ? darkenHex(fog.color, look.clearDarken * 0.8) : fog.color,
        fog.near,
        look.clearDarken > 0.2 ? fog.far * 0.88 : fog.far,
      );
    } else if (isNightLikePeriod(period)) {
      scene.fog = new Fog(clear, 8, 42);
    } else {
      scene.fog = null;
    }
  }, [dayClear, dayExposure, fog, gl, look, period, scene]);

  return null;
}

/** R3F-safe: never fall back to DOM UI inside the Canvas tree. */
class EffectsErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  override componentDidCatch(error: Error) {
    console.warn("[gallery] effects disabled after runtime error", error);
  }

  override render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

/** Darken a CSS hex for evening clear/fog without pulling a color lib. */
function darkenHex(hex: string, amount: number): string {
  const raw = hex.replace("#", "").trim();
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw.slice(0, 6);
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return hex;
  const n = Number.parseInt(full, 16);
  const r = Math.max(0, Math.round(((n >> 16) & 255) * (1 - amount)));
  const g = Math.max(0, Math.round(((n >> 8) & 255) * (1 - amount)));
  const b = Math.max(0, Math.round((n & 255) * (1 - amount)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
