import type { SceneTemplate } from "@/core/entities";
import { getTemplateSwatches } from "@/core/templates";
import { cn } from "@/lib/utils";

const PREVIEW_ART = [
  "linear-gradient(145deg, #c4784a, #3a2a28)",
  "radial-gradient(circle at 45% 40%, #e8f0f5, #1a2a38)",
  "linear-gradient(160deg, #a83228, #2a0e0c)",
  "radial-gradient(circle at 50% 48%, #f5e6c8, #8a5a18 55%, #2a1c0c)",
] as const;

/**
 * High-quality CSS room still — used as WebGL fallback and for app/dashboard
 * swatches so product surfaces share the same visual language without Canvas.
 */
export function RoomStill({
  template,
  className,
  animate = true,
  artCount = 3,
}: {
  template: SceneTemplate;
  className?: string;
  animate?: boolean;
  artCount?: number;
}) {
  const { wall, floor } = getTemplateSwatches(template);
  const matte =
    template.frameDefaults.matteColor ||
    template.frameDefaults.color ||
    "#f5f1e8";
  const arts = PREVIEW_ART.slice(0, Math.max(1, Math.min(4, artCount)));

  return (
    <div
      className={cn("absolute inset-0 overflow-hidden", className)}
      style={{
        background: `linear-gradient(180deg, ${wall} 0%, ${wall} 60%, ${floor} 60%, ${floor} 100%)`,
      }}
      aria-hidden
    >
      <div
        className={cn(
          "absolute inset-0 origin-center",
          animate && "ken-burns",
        )}
      >
        <div className="absolute inset-x-[10%] top-[16%] bottom-[44%] flex items-stretch justify-center gap-2.5 sm:gap-3">
          {arts.map((bg, i) => (
            <div
              key={i}
              className="relative h-full border border-black/15 bg-[#1f1c18] p-[3px] sm:p-1"
              style={{
                flex: i === Math.floor(arts.length / 2) ? 1.2 : 1,
                maxWidth: arts.length <= 2 ? "38%" : "30%",
              }}
            >
              <div
                className="size-full"
                style={{
                  background: bg,
                  boxShadow: `inset 0 0 0 5px ${matte}`,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
