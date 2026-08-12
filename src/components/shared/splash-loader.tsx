"use client";

import { useEffect, useState } from "react";

const MIN_MS = 550;
const MAX_MS = 4500;
const FADE_MS = 480;

type Phase = "in" | "out" | "gone";

/**
 * First-paint splash rendered inside the React tree.
 *
 * Must dismiss via React state (not DOM `remove()` / `removeChild`): imperative
 * removal of a React-owned node races hydration/reconcile and triggers
 * `insertBefore` NotFoundError.
 *
 * Overflow lock is CSS-only (`html:has(#vg-splash:not([data-state=out]))`) so
 * we never mutate `<html className>` outside React / next-themes.
 */
export function SplashLoader({
  brand,
  label,
}: {
  brand: string;
  label: string;
}) {
  const [phase, setPhase] = useState<Phase>("in");

  useEffect(() => {
    let cancelled = false;
    let maxTimer: ReturnType<typeof setTimeout> | undefined;
    const started = performance.now();

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

    void Promise.race([
      Promise.all([waitFonts(), waitMin()]),
      new Promise<void>((resolve) => {
        maxTimer = setTimeout(resolve, MAX_MS);
      }),
    ]).then(() => {
      if (!cancelled) setPhase("out");
    });

    return () => {
      cancelled = true;
      if (maxTimer) clearTimeout(maxTimer);
    };
  }, []);

  useEffect(() => {
    if (phase !== "out") return;
    const fadeTimer = setTimeout(() => setPhase("gone"), FADE_MS);
    return () => clearTimeout(fadeTimer);
  }, [phase]);

  if (phase === "gone") return null;

  const isOut = phase === "out";

  return (
    <div
      id="vg-splash"
      role="status"
      aria-live="polite"
      aria-busy={!isOut}
      aria-hidden={isOut}
      aria-label={label}
      data-state={isOut ? "out" : undefined}
      inert={isOut || undefined}
    >
      <div className="vg-splash-inner">
        <span className="vg-splash-mark" aria-hidden="true" />
        <p className="vg-splash-brand">{brand}</p>
        <div className="vg-splash-rule" aria-hidden="true" />
        <div className="vg-splash-spinner" aria-hidden="true" />
        <p className="vg-splash-label">{label}</p>
      </div>
    </div>
  );
}
