/**
 * Dependency injection container.
 *
 * Phase 1 wires real Firestore / Storage / Auth adapters here. Until then the
 * container is a typed placeholder so features can declare their dependencies
 * without importing infrastructure internals.
 *
 * Rule: features import `getContainer()`, never a concrete adapter.
 */

import type {
  AnalyticsPort,
  ArtistProfileRepository,
  ArtworkRepository,
  AssetRepository,
  AssetStorage,
  GalleryRepository,
  LeadRepository,
  PublishPort,
  SlugRegistry,
  TemplateCatalog,
  UserRepository,
  WorkspaceRepository,
} from "@/core/ports";

export interface AppContainer {
  readonly galleries: GalleryRepository;
  readonly artworks: ArtworkRepository;
  readonly assets: AssetRepository;
  readonly assetStorage: AssetStorage;
  readonly templates: TemplateCatalog;
  readonly workspaces: WorkspaceRepository;
  readonly users: UserRepository;
  readonly artistProfiles: ArtistProfileRepository;
  readonly slugs: SlugRegistry;
  readonly leads: LeadRepository;
  readonly analytics: AnalyticsPort;
  readonly publish: PublishPort;
}

let container: AppContainer | null = null;

export function getContainer(): AppContainer {
  if (!container) {
    throw new Error(
      "Infrastructure container is not initialised. Call createContainer() during app bootstrap (Phase 1).",
    );
  }
  return container;
}

/** Test and bootstrap helper. Production wiring lands in Phase 1. */
export function setContainer(next: AppContainer): void {
  container = next;
}

export function resetContainer(): void {
  container = null;
}
