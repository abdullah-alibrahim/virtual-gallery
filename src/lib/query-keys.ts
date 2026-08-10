/**
 * Stable React Query key factory.
 *
 * Every feature builds keys from here so invalidation is predictable: publish a
 * gallery and `queryKeys.galleries.detail(id)` plus the workspace list both
 * refresh, without stringly-typed cache keys scattered through hooks.
 */
export const queryKeys = {
  session: ["session"] as const,

  workspaces: {
    all: ["workspaces"] as const,
    detail: (id: string) => ["workspaces", id] as const,
  },

  galleries: {
    all: ["galleries"] as const,
    byWorkspace: (workspaceId: string) =>
      ["galleries", "workspace", workspaceId] as const,
    detail: (id: string) => ["galleries", id] as const,
  },

  artworks: {
    byGallery: (galleryId: string) =>
      ["artworks", "gallery", galleryId] as const,
    detail: (id: string) => ["artworks", id] as const,
  },

  assets: {
    byWorkspace: (workspaceId: string) =>
      ["assets", "workspace", workspaceId] as const,
    detail: (id: string) => ["assets", id] as const,
  },

  templates: {
    all: ["templates"] as const,
    detail: (id: string) => ["templates", id] as const,
  },

  profile: {
    bySlug: (slug: string) => ["profile", "slug", slug] as const,
    byWorkspace: (workspaceId: string) =>
      ["profile", "workspace", workspaceId] as const,
  },

  leads: {
    byWorkspace: (workspaceId: string) =>
      ["leads", "workspace", workspaceId] as const,
  },

  analytics: {
    gallery: (galleryId: string, range: string) =>
      ["analytics", "gallery", galleryId, range] as const,
  },
} as const;
