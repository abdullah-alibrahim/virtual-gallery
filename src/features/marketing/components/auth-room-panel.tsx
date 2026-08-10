"use client";

import { softMuseumTemplate } from "@/core/templates";
import { siteConfig } from "@/config/site";
import { RoomStill } from "@/components/shared/room-still";

/**
 * Auth aside — CSS room still only.
 * WebGL on this route was causing context-lost / overlay noise while signing in.
 */
export function AuthRoomPanel() {
  return (
    <aside className="relative hidden overflow-hidden border-r border-border lg:flex lg:w-[46%] lg:flex-col lg:justify-end">
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: softMuseumTemplate.environment.background,
        }}
      >
        <RoomStill template={softMuseumTemplate} artCount={3} />
      </div>
      <div className="relative z-10 space-y-3 bg-gradient-to-t from-background via-background/90 to-transparent px-10 pb-12 pt-32">
        <p className="font-serif text-4xl tracking-tight">{siteConfig.name}</p>
        <p className="max-w-sm text-base text-muted-foreground">
          {siteConfig.tagline}
        </p>
      </div>
    </aside>
  );
}
