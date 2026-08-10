"use client";

import { useEffect, useRef } from "react";

import { useT } from "@/i18n/locale-provider";
import { useTouchInputStore } from "@/three/controls/touch-input-store";
import { cn } from "@/lib/utils";

/**
 * Twin-stick overlay — left walks, right looks.
 * Soft glass discs so they read as room instruments, not game HUD spam.
 */
export function TouchControls() {
  const t = useT();
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-between",
        "ps-[max(1rem,env(safe-area-inset-left))] pe-[max(1rem,env(safe-area-inset-right))]",
        "pb-[max(1.25rem,env(safe-area-inset-bottom))] md:hidden",
      )}
    >
      <Stick side="left" ariaLabel={t("walk.walk")} />
      <Stick side="right" ariaLabel={t("walk.look")} />
    </div>
  );
}

function Stick({
  side,
  ariaLabel,
}: {
  side: "left" | "right";
  ariaLabel: string;
}) {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const active = useRef(false);
  const origin = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = baseRef.current;
    if (!el) return;

    const radius = 44;
    const setKnob = (dx: number, dy: number) => {
      const knob = knobRef.current;
      if (!knob) return;
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
    };

    const onStart = (event: PointerEvent) => {
      active.current = true;
      el.setPointerCapture(event.pointerId);
      const rect = el.getBoundingClientRect();
      origin.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    };

    const onMove = (event: PointerEvent) => {
      if (!active.current) return;
      let dx = event.clientX - origin.current.x;
      let dy = event.clientY - origin.current.y;
      const len = Math.hypot(dx, dy) || 1;
      if (len > radius) {
        dx = (dx / len) * radius;
        dy = (dy / len) * radius;
      }
      setKnob(dx, dy);
      const nx = dx / radius;
      const ny = dy / radius;
      if (side === "left") {
        useTouchInputStore.getState().setMove(nx, -ny);
      } else {
        useTouchInputStore.getState().addLook(nx * 16, ny * 12);
      }
    };

    const onEnd = () => {
      active.current = false;
      setKnob(0, 0);
      if (side === "left") useTouchInputStore.getState().setMove(0, 0);
    };

    el.addEventListener("pointerdown", onStart);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onEnd);
    el.addEventListener("pointercancel", onEnd);

    return () => {
      el.removeEventListener("pointerdown", onStart);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onEnd);
      el.removeEventListener("pointercancel", onEnd);
    };
  }, [side]);

  return (
    <div
      ref={baseRef}
      className={cn(
        "pointer-events-auto relative size-[6.75rem] touch-none",
        "rounded-full border border-white/15 bg-black/30 backdrop-blur-md",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_28px_-8px_rgba(0,0,0,0.5)]",
      )}
      role="application"
      aria-label={ariaLabel}
    >
      <div
        ref={knobRef}
        className="absolute top-1/2 left-1/2 size-11 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-white/25 shadow-[0_2px_12px_rgba(0,0,0,0.35)] transition-transform duration-75 will-change-transform"
      />
    </div>
  );
}
