"use client";

import { decode } from "blurhash";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

/**
 * Client-only blurhash paint for the SSR viewer shell — cheap first paint while
 * the Canvas boots.
 */
export function BlurhashThumb({
  hash,
  alt,
  className,
}: {
  hash: string;
  alt: string;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hash) return;
    try {
      const pixels = decode(hash, 32, 32);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const image = ctx.createImageData(32, 32);
      image.data.set(pixels);
      ctx.putImageData(image, 0, 0);
    } catch {
      // Invalid hashes are non-fatal — leave the canvas blank.
    }
  }, [hash]);

  if (!hash) {
    return (
      <div
        className={cn("bg-neutral-800", className)}
        role="img"
        aria-label={alt}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={32}
      height={32}
      className={cn("h-full w-full object-cover", className)}
      aria-label={alt}
      role="img"
    />
  );
}
