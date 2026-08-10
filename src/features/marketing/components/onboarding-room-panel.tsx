import { RoomStill } from "@/components/shared/room-still";
import { softMuseumTemplate } from "@/core/templates";

/**
 * Desktop onboarding vignette — CSS still (matches Soft Museum / auth language
 * without mounting a second WebGL context during onboarding).
 */
export function OnboardingRoomPanel() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 right-0 hidden w-[40%] max-w-lg lg:block"
    >
      <div
        className="relative size-full overflow-hidden opacity-70"
        style={{
          backgroundColor: softMuseumTemplate.environment.background,
        }}
      >
        <RoomStill template={softMuseumTemplate} artCount={4} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/75 to-background/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />
    </div>
  );
}
