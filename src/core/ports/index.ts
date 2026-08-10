import type {
  ArtistProfile,
  Artwork,
  Asset,
  Gallery,
  Lead,
  Template,
  UserAccount,
  Workspace,
  WorkspaceMember,
} from "@/core/entities";
import type { Slug } from "@/core/value-objects";

/**
 * Ports — the domain's only view of the outside world.
 *
 * Adapters in `src/infrastructure` implement these. Features and the app layer
 * depend on the ports, never on Firebase. That is what makes the domain
 * unit-testable and what lets us swap Storage for R2 or Firestore for Postgres
 * without touching a feature.
 */

export interface GalleryRepository {
  getById(id: string): Promise<Gallery | null>;
  getBySlug(slug: Slug): Promise<Gallery | null>;
  listByWorkspace(workspaceId: string): Promise<readonly Gallery[]>;
  create(gallery: Omit<Gallery, "id" | "createdAt" | "updatedAt">): Promise<Gallery>;
  update(id: string, patch: Partial<Gallery>): Promise<Gallery>;
  softDelete(id: string): Promise<void>;
}

export interface ArtworkRepository {
  listByGallery(galleryId: string): Promise<readonly Artwork[]>;
  getById(galleryId: string, artworkId: string): Promise<Artwork | null>;
  create(artwork: Omit<Artwork, "id" | "createdAt" | "updatedAt">): Promise<Artwork>;
  update(
    galleryId: string,
    artworkId: string,
    patch: Partial<Artwork>,
  ): Promise<Artwork>;
  remove(galleryId: string, artworkId: string): Promise<void>;
  /**
   * Applies many placement updates in one write batch. Used by auto-arrange so
   * the whole rearrange is one atomic step the UI can undo as a unit.
   */
  applyPlacements(
    galleryId: string,
    updates: ReadonlyArray<{
      artworkId: string;
      placement: Artwork["placement"];
      lighting?: Partial<Artwork["lighting"]>;
    }>,
  ): Promise<void>;
}

export interface AssetRepository {
  getById(id: string): Promise<Asset | null>;
  listByWorkspace(workspaceId: string): Promise<readonly Asset[]>;
  create(asset: Omit<Asset, "id" | "createdAt" | "updatedAt">): Promise<Asset>;
  update(id: string, patch: Partial<Asset>): Promise<Asset>;
}

/**
 * Storage port. Originals go to a private path; derived variants go to a public
 * CDN path. The domain never sees a bucket name.
 */
export interface AssetStorage {
  createUploadUrl(input: {
    workspaceId: string;
    assetId: string;
    contentType: string;
    bytes: number;
  }): Promise<{ uploadUrl: string; path: string }>;
  getPublicUrl(path: string): string;
  delete(path: string): Promise<void>;
}

export interface TemplateCatalog {
  listActive(): Promise<readonly Template[]>;
  getById(id: string, version?: number): Promise<Template | null>;
}

export interface WorkspaceRepository {
  getById(id: string): Promise<Workspace | null>;
  getMember(workspaceId: string, uid: string): Promise<WorkspaceMember | null>;
  create(workspace: Omit<Workspace, "id" | "createdAt" | "updatedAt">): Promise<Workspace>;
  updateUsage(id: string, usage: Partial<Workspace["usage"]>): Promise<void>;
}

export interface UserRepository {
  getById(uid: string): Promise<UserAccount | null>;
  upsert(user: UserAccount): Promise<UserAccount>;
}

export interface ArtistProfileRepository {
  getBySlug(slug: Slug): Promise<ArtistProfile | null>;
  getByWorkspace(workspaceId: string): Promise<ArtistProfile | null>;
  upsert(profile: ArtistProfile): Promise<ArtistProfile>;
}

export interface SlugRegistry {
  /**
   * Atomically reserves a slug. Returns false when already taken. The only
   * write path for the `slugs/{slug}` collection — clients never touch it.
   */
  reserve(input: {
    slug: Slug;
    type: "gallery" | "artist";
    targetId: string;
    workspaceId: string;
  }): Promise<boolean>;
  release(slug: Slug): Promise<void>;
  isAvailable(slug: Slug): Promise<boolean>;
}

export interface LeadRepository {
  create(lead: Omit<Lead, "id" | "createdAt" | "updatedAt" | "status">): Promise<Lead>;
  listByWorkspace(workspaceId: string): Promise<readonly Lead[]>;
  updateStatus(id: string, status: Lead["status"]): Promise<void>;
}

/**
 * Analytics writes are fire-and-forget from the viewer. The implementation
 * shards counters and rolls up nightly — callers do not care.
 */
export interface AnalyticsPort {
  recordView(input: {
    galleryId: string;
    visitorId: string;
    referrer: string | null;
    country: string | null;
  }): Promise<void>;
  recordArtworkClick(input: {
    galleryId: string;
    artworkId: string;
    visitorId: string;
  }): Promise<void>;
}

/**
 * Publish port. The compile step lives in a Cloud Function for the same reason
 * the viewer reads CDN: the compiler needs privileged access to every asset
 * URL and must write immutable Storage paths the client cannot forge.
 */
export interface PublishPort {
  publish(input: {
    galleryId: string;
    publishedBy: string;
  }): Promise<{ version: number; manifestPath: string; publicUrl: string }>;
  rollback(input: {
    galleryId: string;
    version: number;
  }): Promise<{ manifestPath: string }>;
}
