"use strict";
/**
 * Cloud Functions entrypoint — Phase 1.
 *
 * `bootstrapUser` mirrors the Next.js `/api/session` bootstrap so production
 * callables and the App Router share the same account creation semantics.
 * The Next.js route is the primary path in local emulators; this callable is
 * the production-facing equivalent for clients that prefer HTTPS callables.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrapUser = void 0;
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const zod_1 = require("zod");
(0, app_1.initializeApp)();
const PLAN_LIMITS_FREE = {
    galleries: 3,
    artworksPerGallery: 15,
    storageBytes: 500 * 1024 * 1024,
    customDomain: false,
};
const RESERVED = new Set([
    "dashboard",
    "sign-in",
    "sign-up",
    "settings",
    "admin",
    "api",
    "a",
    "g",
    "explore",
    "onboarding",
]);
function slugify(input) {
    const normalized = input
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/['’]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48)
        .replace(/-+$/g, "");
    return normalized.length >= 3 ? normalized : null;
}
async function reserveUniqueSlug(displayName, workspaceId) {
    const db = (0, firestore_1.getFirestore)();
    const base = slugify(displayName) ??
        `artist-${workspaceId.slice(0, 8).toLowerCase()}`;
    for (let attempt = 0; attempt < 50; attempt++) {
        const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
        if (RESERVED.has(candidate))
            continue;
        const snap = await db.collection("slugs").doc(candidate).get();
        if (!snap.exists)
            return candidate;
    }
    return `artist${Date.now()}`;
}
exports.bootstrapUser = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Sign in required");
    }
    const uid = request.auth.uid;
    const email = request.auth.token.email ?? "";
    const displayName = request.auth.token.name?.trim() ||
        email.split("@")[0] ||
        "Artist";
    const photoURL = request.auth.token.picture ?? null;
    const db = (0, firestore_1.getFirestore)();
    const auth = (0, auth_1.getAuth)();
    const existing = await db.collection("users").doc(uid).get();
    if (existing.exists) {
        const data = existing.data();
        return {
            workspaceId: data.defaultWorkspaceId,
            created: false,
            onboardingComplete: Boolean(data.onboarding?.completed),
        };
    }
    const workspaceId = db.collection("workspaces").doc().id;
    const slug = await reserveUniqueSlug(displayName, workspaceId);
    const now = firestore_1.FieldValue.serverTimestamp();
    await db.runTransaction(async (tx) => {
        const userRef = db.collection("users").doc(uid);
        if ((await tx.get(userRef)).exists)
            return;
        tx.set(userRef, {
            email,
            displayName,
            photoURL,
            defaultWorkspaceId: workspaceId,
            locale: "en",
            onboarding: { completed: false, step: "profile", completedAt: null },
            createdAt: now,
            updatedAt: now,
        });
        tx.set(db.collection("workspaces").doc(workspaceId), {
            type: "artist",
            name: displayName,
            plan: "free",
            ownerId: uid,
            limits: PLAN_LIMITS_FREE,
            usage: { galleries: 0, artworks: 0, storageBytes: 0 },
            billing: null,
            createdAt: now,
            updatedAt: now,
        });
        tx.set(db.collection("workspaces").doc(workspaceId).collection("members").doc(uid), {
            uid,
            role: "owner",
            displayName,
            email,
            joinedAt: now,
        });
        tx.set(db.collection("artistProfiles").doc(workspaceId), {
            workspaceId,
            slug,
            displayName,
            bio: "",
            statement: "",
            avatarUrl: photoURL,
            coverUrl: null,
            location: null,
            socials: {},
            contact: { allowInquiries: true, showEmail: false },
            featuredGalleryIds: [],
            createdAt: now,
            updatedAt: now,
        });
        tx.set(db.collection("slugs").doc(slug), {
            type: "artist",
            targetId: workspaceId,
            workspaceId,
            createdAt: now,
        });
    });
    await auth.setCustomUserClaims(uid, {
        workspaces: { [workspaceId]: "owner" },
    });
    // Optional body reserved for future profile hints.
    zod_1.z.object({}).passthrough().parse(request.data ?? {});
    return {
        workspaceId,
        slug,
        created: true,
        onboardingComplete: false,
    };
});
//# sourceMappingURL=index.js.map