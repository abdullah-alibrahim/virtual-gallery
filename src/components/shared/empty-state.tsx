import type { ComponentType, ReactNode } from "react";

import { HouseMark } from "@/components/shared/house-mark";
import { cn } from "@/lib/utils";

/**
 * Empty states are a product surface, not a fallback. Every one names the thing
 * that is missing and offers the single action that fixes it.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center gap-6 overflow-hidden border border-dashed border-border px-8 py-24 text-center scale-in",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 surface-grain opacity-80"
      />
      <div
        aria-hidden
        className="atmosphere-drift pointer-events-none absolute -inset-[12%] bg-[radial-gradient(ellipse_50%_40%_at_50%_15%,oklch(0.93_0.02_85_/0.55),transparent_70%)]"
      />
      <div
        aria-hidden
        className="relative mb-2 flex h-20 w-full max-w-[16rem] items-end justify-center gap-2.5"
      >
        <span className="h-12 w-9 border border-border/80 bg-[linear-gradient(145deg,#c4784a,#3a2a28)] soft-pulse" />
        <span className="h-16 w-11 border border-border/80 bg-[radial-gradient(circle_at_45%_40%,#e8f0f5,#1a2a38)]" />
        <span className="h-14 w-9 border border-border/80 bg-[linear-gradient(160deg,#a83228,#2a0e0c)] soft-pulse" />
      </div>
      <HouseMark
        size={18}
        className="relative text-[color:var(--luxury-brass)]"
      />
      {Icon ? (
        <div className="relative flex size-12 items-center justify-center border border-border text-muted-foreground">
          <Icon className="size-5" aria-hidden />
        </div>
      ) : null}
      <div className="relative flex max-w-md flex-col gap-2">
        <p className="font-serif text-2xl tracking-tight sm:text-3xl">
          {title}
        </p>
        {description ? (
          <p className="text-base text-muted-foreground text-pretty">
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <div className="relative stagger-fade stagger-fade-2">{action}</div>
      ) : null}
    </div>
  );
}
