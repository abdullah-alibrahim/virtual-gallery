import type { Slug } from "@/core/value-objects/slug";

export type WorkspaceType = "artist" | "museum" | "brand";
export type PlanId = "free" | "pro" | "studio";
export type MemberRole = "owner" | "admin" | "editor" | "viewer";

/**
 * The TENANT. Every gallery, asset, and lead belongs to a workspace, never
 * directly to a user. v1 only ever creates `type: "artist"` and never surfaces
 * the word "workspace" in the UI — the artist sees their own account.
 *
 * Introducing this boundary on day one is what makes museums, malls, and
 * brands a member/role change later rather than a data migration.
 */
export interface Workspace {
  readonly id: string;
  readonly type: WorkspaceType;
  readonly name: string;
  readonly plan: PlanId;
  readonly ownerId: string;
  readonly limits: WorkspaceLimits;
  readonly usage: WorkspaceUsage;
  readonly billing: WorkspaceBilling | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface WorkspaceLimits {
  readonly galleries: number;
  readonly artworksPerGallery: number;
  readonly storageBytes: number;
  readonly customDomain: boolean;
  /** Max members including the owner (team seats). */
  readonly seats: number;
}

/**
 * Pending email invite to join a workspace. Accepted when the invitee signs in
 * with a matching email (or immediately if they already have an account).
 */
export interface WorkspaceInvite {
  readonly id: string;
  readonly workspaceId: string;
  readonly email: string;
  readonly role: Exclude<MemberRole, "owner">;
  readonly invitedBy: string;
  readonly status: "pending" | "accepted" | "revoked";
  readonly createdAt: Date;
  readonly acceptedAt: Date | null;
}

export interface WorkspaceUsage {
  readonly galleries: number;
  readonly artworks: number;
  readonly storageBytes: number;
}

export interface WorkspaceBilling {
  readonly stripeCustomerId: string;
  readonly subscriptionId: string | null;
  readonly status: "active" | "past_due" | "canceled" | "trialing";
  readonly periodEnd: Date | null;
}

export interface WorkspaceMember {
  readonly uid: string;
  readonly role: MemberRole;
  readonly displayName: string;
  readonly email: string;
  readonly joinedAt: Date;
}

/**
 * Public-facing artist surface. Deliberately contains no PII beyond what the
 * artist has chosen to publish. Backed by `artistProfiles/{workspaceId}` and
 * readable without auth.
 */
export interface ArtistProfile {
  readonly workspaceId: string;
  readonly slug: Slug;
  readonly displayName: string;
  readonly bio: string;
  readonly statement: string;
  readonly avatarUrl: string | null;
  readonly coverUrl: string | null;
  readonly location: string | null;
  readonly socials: ArtistSocials;
  readonly contact: ArtistContact;
  readonly featuredGalleryIds: readonly string[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ArtistSocials {
  readonly website?: string;
  readonly instagram?: string;
  readonly twitter?: string;
  readonly linkedin?: string;
  readonly behance?: string;
  /** @deprecated Prefer linkedin / behance; retained for older docs. */
  readonly bluesky?: string;
}

export interface ArtistContact {
  readonly allowInquiries: boolean;
  readonly showEmail: boolean;
  readonly email?: string;
}

/**
 * Auth-mirror document. Private to the owner. Preferences live here so the
 * session bootstrap can hydrate the shell without an extra round trip.
 */
export interface UserAccount {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly photoURL: string | null;
  readonly defaultWorkspaceId: string;
  readonly locale: string;
  readonly onboarding: OnboardingState;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface OnboardingState {
  readonly completed: boolean;
  readonly step: "profile" | "template" | "upload" | "done";
  readonly completedAt: Date | null;
}
