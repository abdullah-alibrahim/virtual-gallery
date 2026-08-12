"use client";

import { Suspense } from "react";
import { Text } from "@react-three/drei";

import {
  hasArabicScript,
  museumLetterSpacing,
  museumWallLabelText,
} from "@/features/viewer/lib/museum-wall-label";

/** Latin + Arabic — default Roboto has no Arabic glyphs. */
const LABEL_FONT = "/fonts/IBMPlexSansArabic-Regular.ttf";

/**
 * Thin museum didactic under a frame: title · year · medium.
 *
 * drei `<Text>` suspends while troika preloads its font. That suspend MUST be
 * caught here — R3F's Canvas wraps *all* children in one Suspense whose
 * fallback (`Block`) re-throws into the DOM tree and unmounts the <canvas>.
 */
export function TitlePlate({
  title,
  year,
  medium,
  width,
  yOffset,
}: {
  title: string;
  year?: number;
  medium?: string;
  width: number;
  yOffset: number;
}) {
  const lines = museumWallLabelText(title, year, medium);
  const hasMeta = Boolean(lines.meta);
  const plateW = Math.min(Math.max(width * 0.92, 0.55), width + 0.2);
  const plateH = hasMeta ? 0.135 : 0.085;
  const titleSize = Math.min(0.048, plateW * 0.09);
  const metaSize = Math.min(0.028, plateW * 0.05);

  return (
    <group position={[0, yOffset - plateH / 2, 0.01]}>
      {/* Quiet cream plaque — museum wall card, not a HUD chip */}
      <mesh position={[0, 0, 0]} castShadow={false} receiveShadow>
        <boxGeometry args={[plateW, plateH, 0.012]} />
        <meshStandardMaterial
          color="#f3f1ea"
          roughness={0.92}
          metalness={0.02}
          envMapIntensity={0.1}
        />
      </mesh>
      <mesh position={[0, 0, -0.008]}>
        <boxGeometry args={[plateW + 0.01, plateH + 0.01, 0.006]} />
        <meshStandardMaterial
          color="#c8c2b4"
          roughness={0.7}
          metalness={0.08}
          envMapIntensity={0.15}
        />
      </mesh>

      <Suspense fallback={null}>
        <Text
          font={LABEL_FONT}
          position={[0, hasMeta ? plateH * 0.18 : 0, 0.01]}
          fontSize={titleSize}
          maxWidth={plateW * 0.9}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          color="#1a1916"
          letterSpacing={museumLetterSpacing(lines.title, 0.02)}
          direction={hasArabicScript(lines.title) ? "rtl" : "ltr"}
        >
          {lines.title}
        </Text>
        {hasMeta ? (
          <Text
            font={LABEL_FONT}
            position={[0, -plateH * 0.22, 0.01]}
            fontSize={metaSize}
            maxWidth={plateW * 0.9}
            textAlign="center"
            anchorX="center"
            anchorY="middle"
            color="#5c5850"
            letterSpacing={museumLetterSpacing(lines.meta, 0.04)}
            direction={hasArabicScript(lines.meta) ? "rtl" : "ltr"}
          >
            {lines.meta}
          </Text>
        ) : null}
      </Suspense>
    </group>
  );
}
