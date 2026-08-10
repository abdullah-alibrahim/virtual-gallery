"use client";

import { Suspense } from "react";
import { Text } from "@react-three/drei";

/**
 * Wall label under a frame.
 *
 * drei `<Text>` suspends while troika preloads its font. That suspend MUST be
 * caught here — R3F's Canvas wraps *all* children in one Suspense whose
 * fallback (`Block`) re-throws into the DOM tree and unmounts the <canvas>,
 * which is exactly the "black void + chrome only" failure mode on /demo/walk
 * when `showTitles` is enabled.
 */
export function TitlePlate({
  title,
  width,
  yOffset,
}: {
  title: string;
  width: number;
  yOffset: number;
}) {
  return (
    <Suspense fallback={null}>
      <Text
        position={[0, yOffset, 0.02]}
        fontSize={0.06}
        maxWidth={width}
        textAlign="center"
        anchorX="center"
        anchorY="top"
        color="#1f1e1b"
        outlineWidth={0.003}
        outlineColor="#f7f4ec"
      >
        {title}
      </Text>
    </Suspense>
  );
}
