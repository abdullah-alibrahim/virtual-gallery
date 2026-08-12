"use client";

import { Suspense } from "react";
import { Text } from "@react-three/drei";

/** Latin + Arabic. Troika's default Roboto has no Arabic glyphs — signs looked empty. */
const SIGN_FONT = "/fonts/IBMPlexSansArabic-Regular.ttf";

/**
 * Architectural gallery title — wall-mounted museum lettering or a freestanding
 * plaque. Kept out of the HUD so the hall itself carries the exhibition name.
 */
export function GallerySign({
  text,
  subtitle,
  position,
  yaw = 0,
  width = 4.2,
  height = 0.9,
  style = "wall",
}: {
  text: string;
  subtitle?: string;
  position: readonly [number, number, number];
  yaw?: number;
  width?: number;
  height?: number;
  style?: "wall" | "plaque";
}) {
  if (style === "plaque") {
    return (
      <FreestandingPlaque
        text={text}
        subtitle={subtitle}
        position={position}
        yaw={yaw}
        width={width}
        height={height}
      />
    );
  }

  return (
    <WallTitle
      text={text}
      subtitle={subtitle}
      position={position}
      yaw={yaw}
      width={width}
      height={height}
    />
  );
}

function WallTitle({
  text,
  subtitle,
  position,
  yaw,
  width,
  height,
}: {
  text: string;
  subtitle?: string;
  position: readonly [number, number, number];
  yaw: number;
  width: number;
  height: number;
}) {
  const boardDepth = 0.06;
  const fontSize = Math.min(0.42, height * 0.42);

  return (
    <group position={[position[0], position[1], position[2]]} rotation={[0, yaw, 0]}>
      {/* Recessed stone panel */}
      <mesh position={[0, 0, -boardDepth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, height, boardDepth]} />
        <meshStandardMaterial
          color="#e8eaed"
          roughness={0.88}
          metalness={0.02}
          envMapIntensity={0.12}
        />
      </mesh>
      {/* Thin brass reveal */}
      <mesh position={[0, 0, 0.002]}>
        <boxGeometry args={[width + 0.08, height + 0.08, 0.02]} />
        <meshStandardMaterial
          color="#8a7a58"
          roughness={0.42}
          metalness={0.55}
          envMapIntensity={0.35}
        />
      </mesh>
      <mesh position={[0, 0, 0.014]}>
        <boxGeometry args={[width, height, 0.018]} />
        <meshStandardMaterial
          color="#f2f3f5"
          roughness={0.9}
          metalness={0.01}
          envMapIntensity={0.08}
        />
      </mesh>
      <Suspense fallback={null}>
        <Text
          font={SIGN_FONT}
          position={[0, subtitle ? 0.08 : 0, 0.03]}
          fontSize={fontSize}
          maxWidth={width * 0.92}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          color="#1a1c1e"
          letterSpacing={signLetterSpacing(text, 0.08)}
          direction={hasArabic(text) ? "rtl" : "ltr"}
        >
          {signLabel(text)}
        </Text>
        {subtitle ? (
          <Text
            font={SIGN_FONT}
            position={[0, -height * 0.28, 0.03]}
            fontSize={Math.min(0.11, height * 0.14)}
            maxWidth={width * 0.9}
            textAlign="center"
            anchorX="center"
            anchorY="middle"
            color="#5c6168"
            letterSpacing={signLetterSpacing(subtitle, 0.12)}
            direction={hasArabic(subtitle) ? "rtl" : "ltr"}
          >
            {signLabel(subtitle)}
          </Text>
        ) : null}
      </Suspense>
    </group>
  );
}

function FreestandingPlaque({
  text,
  subtitle,
  position,
  yaw,
  width,
  height,
}: {
  text: string;
  subtitle?: string;
  position: readonly [number, number, number];
  yaw: number;
  width: number;
  height: number;
}) {
  const postH = 1.15;
  const boardY = postH + height / 2;
  const fontSize = Math.min(0.16, height * 0.38);

  return (
    <group position={[position[0], position[1], position[2]]} rotation={[0, yaw, 0]}>
      {/* Pedestal */}
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.42, 0.12, 0.42]} />
        <meshStandardMaterial color="#d8d4cc" roughness={0.78} metalness={0.04} />
      </mesh>
      <mesh position={[0, postH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.1, postH, 0.1]} />
        <meshStandardMaterial color="#c9c4ba" roughness={0.82} metalness={0.03} />
      </mesh>
      {/* Double-sided plaque */}
      <mesh position={[0, boardY, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, 0.05]} />
        <meshStandardMaterial
          color="#1c1e22"
          roughness={0.55}
          metalness={0.12}
          envMapIntensity={0.25}
        />
      </mesh>
      <mesh position={[0, boardY, 0]}>
        <boxGeometry args={[width + 0.04, height + 0.04, 0.02]} />
        <meshStandardMaterial
          color="#9a8860"
          roughness={0.4}
          metalness={0.5}
          envMapIntensity={0.4}
        />
      </mesh>
      <Suspense fallback={null}>
        <Text
          font={SIGN_FONT}
          position={[0, boardY + (subtitle ? 0.04 : 0), 0.032]}
          fontSize={fontSize}
          maxWidth={width * 0.9}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          color="#f4f1ea"
          letterSpacing={signLetterSpacing(text, 0.04)}
          direction={hasArabic(text) ? "rtl" : "ltr"}
        >
          {signLabel(text)}
        </Text>
        {subtitle ? (
          <Text
            font={SIGN_FONT}
            position={[0, boardY - height * 0.28, 0.032]}
            fontSize={Math.min(0.055, height * 0.16)}
            maxWidth={width * 0.88}
            textAlign="center"
            anchorX="center"
            anchorY="middle"
            color="#c4b79a"
            letterSpacing={signLetterSpacing(subtitle, 0.08)}
            direction={hasArabic(subtitle) ? "rtl" : "ltr"}
          >
            {signLabel(subtitle)}
          </Text>
        ) : null}
      </Suspense>
    </group>
  );
}

function hasArabic(value: string): boolean {
  return /[\u0600-\u06FF]/.test(value);
}

function signLetterSpacing(value: string, latin: number): number {
  return hasArabic(value) ? 0 : latin;
}

function signLabel(value: string): string {
  return hasArabic(value) ? value : value.toUpperCase();
}
