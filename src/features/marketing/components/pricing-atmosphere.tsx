import { RoomStill } from "@/components/shared/room-still";
import { modernWhiteTemplate } from "@/core/templates";

/**
 * Subtle side vignette for pricing — CSS still only (no WebGL on this route).
 * Plans stay the focus; the room is atmospheric depth, not a second hero.
 */
export function PricingAtmosphere() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] max-w-xl lg:block"
    >
      <div className="absolute inset-0 origin-right scale-[1.05]">
        <div
          className="relative size-full overflow-hidden opacity-[0.55]"
          style={{
            backgroundColor: modernWhiteTemplate.environment.background,
          }}
        >
          <RoomStill template={modernWhiteTemplate} artCount={4} />
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/35" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
    </div>
  );
}
