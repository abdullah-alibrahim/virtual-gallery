"use client";

import { PerspectiveCamera } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { damp3, dampLookAt } from "maath/easing";
import {
  Component,
  lazy,
  Suspense,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import {
  ACESFilmicToneMapping,
  Color,
  Object3D,
  PCFSoftShadowMap,
  type PerspectiveCamera as PerspectiveCameraImpl,
  type SpotLight as SpotLightImpl,
  Vector3,
} from "three";

import type { SceneArtwork, SceneTemplate } from "@/core/entities";
import { ArtworkFrame } from "@/three/scene/artwork-frame";
import { GalleryEnvironment } from "@/three/scene/gallery-environment";
import { GalleryLights } from "@/three/scene/gallery-lights";
import { TemplateShell } from "@/three/scene/template-shell";

import {
  marketingCameraPosition,
  marketingLookTarget,
  type MarketingCameraMode,
} from "../lib/marketing-camera";
import { buildMarketingPreviewArtworks } from "../lib/marketing-preview-artworks";

const GalleryEffects = lazy(() =>
  import("@/three/scene/gallery-effects")
    .then((m) => ({
      default: m.GalleryEffects,
    }))
    .catch((err) => {
      console.warn("[gallery] effects chunk failed to load", err);
      return {
        default: function GalleryEffectsUnavailable() {
          return null;
        },
      };
    }),
);

export interface MarketingRoomCanvasProps {
  template: SceneTemplate;
  /** Override hung works; defaults to demo textures on template anchors. */
  artworks?: SceneArtwork[];
  mobile?: boolean;
  paused?: boolean;
  cameraMode?: MarketingCameraMode;
  /** Cap hung works (mobile templates previews use fewer). */
  maxArtworks?: number;
  /** Extra show wash aimed at the north wall — landing / auth heroes. */
  showWash?: boolean;
  /** Fall back to the CSS still when the GPU context is lost. */
  onContextLost?: () => void;
}

/**
 * Shared marketing WebGL room — Soft Museum landing, templates featured
 * preview, auth / pricing vignettes. One quality path (`marketing` / `mobile`).
 */
export function MarketingRoomCanvas({
  template,
  artworks: artworksProp,
  mobile = false,
  paused = false,
  cameraMode = "orbit",
  maxArtworks = 6,
  showWash = true,
  onContextLost,
}: MarketingRoomCanvasProps) {
  const quality = mobile ? ("mobile" as const) : ("marketing" as const);
  const artworks = useMemo(() => {
    const source =
      artworksProp ?? buildMarketingPreviewArtworks(template, maxArtworks);
    return mobile ? source.slice(0, Math.min(5, maxArtworks)) : source;
  }, [artworksProp, template, maxArtworks, mobile]);

  const clear = template.environment.background;
  const startPos = marketingCameraPosition(template, cameraMode, 0, mobile);

  return (
    <Canvas
      shadows={!mobile}
      dpr={mobile ? [1, 1.15] : [1, 1.65]}
      performance={{ min: mobile ? 0.45 : 0.6 }}
      frameloop={paused ? "demand" : "always"}
      gl={{
        antialias: !mobile,
        powerPreference: mobile ? "default" : "high-performance",
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: mobile
          ? template.environment.exposure
          : template.environment.exposure + 0.05,
        alpha: false,
      }}
      onCreated={({ scene, gl }) => {
        scene.background = new Color(clear);
        gl.setClearColor(clear, 1);
        if (!mobile) {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = PCFSoftShadowMap;
        }
        const canvas = gl.domElement;
        const handleLost = (event: Event) => {
          event.preventDefault();
          onContextLost?.();
        };
        canvas.addEventListener("webglcontextlost", handleLost, false);
      }}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        backgroundColor: clear,
      }}
      aria-hidden
    >
      <PerspectiveCamera
        makeDefault
        fov={mobile ? 48 : cameraMode === "hero" ? 38 : 42}
        near={0.1}
        far={60}
        position={startPos}
      />
      <GalleryLights template={template} quality={quality} cinematic={!mobile} />
      <GalleryEnvironment quality={quality} category={template.category} />
      {showWash ? <ShowWash template={template} mobile={mobile} /> : null}
      <TemplateShell
        template={template}
        receiveShadow={!mobile}
        mobile={mobile}
        quality={quality}
        floorBoost={!mobile}
      />
      {artworks.map((artwork) => (
        <ArtworkFrame
          key={artwork.id}
          artwork={artwork}
          showTitle={false}
          showHotspot={false}
          mobile={mobile}
        />
      ))}
      <CinematicCamera
        template={template}
        cameraMode={cameraMode}
        mobile={mobile}
        paused={paused}
      />
      <EffectsErrorBoundary>
        <Suspense fallback={null}>
          <GalleryEffects
            quality={quality}
            toneMapping="aces"
            preset="marketing"
          />
        </Suspense>
      </EffectsErrorBoundary>
    </Canvas>
  );
}

/** R3F-safe silent fallback — never mount DOM UI inside Canvas. */
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

function ShowWash({
  template,
  mobile,
}: {
  template: SceneTemplate;
  mobile: boolean;
}) {
  const lightRef = useRef<SpotLightImpl>(null);
  const targetRef = useRef<Object3D>(null);
  const north = template.walls.find((w) => w.id === "north") ?? template.walls[0];
  const targetZ = (north?.origin[2] ?? -5) + 0.15;

  useLayoutEffect(() => {
    if (!lightRef.current || !targetRef.current) return;
    lightRef.current.target = targetRef.current;
    lightRef.current.target.updateMatrixWorld();
  }, [targetZ]);

  if (mobile) {
    return (
      <pointLight
        color="#fff0dc"
        intensity={0.38}
        distance={9}
        decay={2}
        position={[0, 2.2, targetZ + 2.4]}
      />
    );
  }

  return (
    <>
      <spotLight
        ref={lightRef}
        color="#fff4e6"
        intensity={2.2}
        angle={0.55}
        penumbra={0.7}
        distance={18}
        position={[0.2, 3.4, Math.max(1.2, targetZ + 6.5)]}
        castShadow={false}
      />
      <object3D ref={targetRef} position={[0, 1.7, targetZ]} />
      <pointLight
        color="#ffe8c8"
        intensity={0.5}
        distance={10}
        decay={2}
        position={[0, 2.4, targetZ + 1.8]}
      />
    </>
  );
}

function CinematicCamera({
  template,
  cameraMode,
  mobile,
  paused,
}: {
  template: SceneTemplate;
  cameraMode: MarketingCameraMode;
  mobile: boolean;
  paused: boolean;
}) {
  const target = useRef(
    new Vector3(...marketingLookTarget(template, cameraMode, 0)),
  );
  const look = useRef(
    new Vector3(...marketingLookTarget(template, cameraMode, 0)),
  );

  useFrame((state, delta) => {
    if (paused) return;
    const camera = state.camera as PerspectiveCameraImpl;
    const t = state.clock.elapsedTime;
    const goal = marketingCameraPosition(template, cameraMode, t, mobile);
    const nextLook = marketingLookTarget(template, cameraMode, t);
    look.current.set(nextLook[0], nextLook[1], nextLook[2]);
    damp3(camera.position, goal, mobile ? 2.1 : 1.8, delta);
    damp3(target.current, look.current, mobile ? 2.4 : 2.0, delta);
    dampLookAt(camera, target.current, mobile ? 2.2 : 1.9, delta);
  });

  return null;
}
