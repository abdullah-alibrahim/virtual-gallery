"use client";

import { useSyncExternalStore } from "react";

/**
 * Subscribes to a CSS media query via `useSyncExternalStore` so the value is
 * correct on the first client paint and SSR always returns `false`.
 *
 * The editor is desktop-only — this is how the route decides whether to show
 * the five-panel shell or the mobile handoff screen.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Matches the Tailwind `lg` breakpoint — the editor's minimum viable width. */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
