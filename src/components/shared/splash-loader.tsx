"use client";

import { useEffect } from "react";

const SPLASH_ID = "vg-splash";
const MIN_MS = 550;
const MAX_MS = 4500;
const FADE_MS = 480;

/**
 * Dismisses the SSR `#vg-splash` once fonts are ready, React has hydrated,
 * and a short minimum dwell has elapsed — with a hard max so it never sticks.
 *
 * Walk demos keep their own Enter / LoadingShell after this; we only gate
 * first paint of marketing + app chrome.
 */
export function SplashDismisser() {
  useEffect(() => {
    const el = document.getElementById(SPLASH_ID);
    if (!el) return;

    let cancelled = false;
    let fadeTimer: ReturnType<typeof setTimeout> | undefined;
    let maxTimer: ReturnType<typeof setTimeout> | undefined;

    const started = performance.now();

    const hide = () => {
      if (cancelled || el.dataset.state === "out") return;
      el.dataset.state = "out";
      el.setAttribute("aria-busy", "false");
      el.setAttribute("aria-hidden", "true");
      document.documentElement.classList.remove("vg-splash-active");
      fadeTimer = setTimeout(() => {
        el.remove();
      }, FADE_MS);
    };

    const waitFonts = () =>
      typeof document.fonts?.ready?.then === "function"
        ? document.fonts.ready.catch(() => undefined)
        : Promise.resolve();

    const waitMin = () =>
      new Promise<void>((resolve) => {
        const elapsed = performance.now() - started;
        const left = Math.max(0, MIN_MS - elapsed);
        setTimeout(resolve, left);
      });

    // Hydrated = this effect ran. Race fonts + min dwell against max timeout.
    void Promise.race([
      Promise.all([waitFonts(), waitMin()]),
      new Promise<void>((resolve) => {
        maxTimer = setTimeout(resolve, MAX_MS);
      }),
    ]).then(() => {
      if (!cancelled) hide();
    });

    return () => {
      cancelled = true;
      if (fadeTimer) clearTimeout(fadeTimer);
      if (maxTimer) clearTimeout(maxTimer);
    };
  }, []);

  return null;
}
