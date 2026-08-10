/**
 * Firebase Admin singleton.
 *
 * Used only from server code (Route Handlers, Server Components). Never import
 * this into a Client Component — the Admin SDK holds privileged credentials.
 *
 * Emulator mode needs no real service-account file: set
 * FIREBASE_AUTH_EMULATOR_HOST / FIRESTORE_EMULATOR_HOST and a project id.
 */

import {
  type App,
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type AppOptions,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App | null = null;

function resolveOptions(): AppOptions {
  const projectId =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    process.env.GCLOUD_PROJECT ??
    "virtual-gallery-dev";

  const storageBucket =
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    `${projectId}.appspot.com`;

  const usingEmulators =
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true" ||
    Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST) ||
    Boolean(process.env.FIRESTORE_EMULATOR_HOST) ||
    Boolean(process.env.FIREBASE_STORAGE_EMULATOR_HOST);

  if (usingEmulators) {
    return { projectId, storageBucket };
  }

  const json = process.env.FIREBASE_ADMIN_CREDENTIALS;
  if (json) {
    const credentials = JSON.parse(json) as {
      project_id?: string;
      client_email: string;
      private_key: string;
    };
    return {
      credential: cert({
        projectId: credentials.project_id ?? projectId,
        clientEmail: credentials.client_email,
        privateKey: credentials.private_key.replace(/\\n/g, "\n"),
      }),
      projectId: credentials.project_id ?? projectId,
      storageBucket,
    };
  }

  return { credential: applicationDefault(), projectId, storageBucket };
}

export function getAdminApp(): App {
  if (app) return app;
  app = getApps()[0] ?? initializeApp(resolveOptions());
  return app;
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}
