import {
  type FirebaseApp,
  getApp,
  getApps,
  initializeApp,
} from "firebase/app";
import {
  type Auth,
  connectAuthEmulator,
  getAuth,
} from "firebase/auth";
import {
  type Firestore,
  connectFirestoreEmulator,
  getFirestore,
} from "firebase/firestore";
import {
  type Functions,
  connectFunctionsEmulator,
  getFunctions,
} from "firebase/functions";
import {
  type FirebaseStorage,
  connectStorageEmulator,
  getStorage,
} from "firebase/storage";

import {
  type FirebaseClientConfig,
  readFirebaseClientConfig,
} from "./config";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let functions: Functions | null = null;
let emulatorsConnected = false;

function shouldUseEmulators(): boolean {
  return process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";
}

/**
 * Connects Auth / Firestore / Storage / Functions to local emulators once.
 * Safe to call repeatedly — the Firebase SDK throws if connected twice.
 */
function connectEmulators(
  authInstance: Auth,
  dbInstance: Firestore,
  storageInstance: FirebaseStorage,
  functionsInstance: Functions,
): void {
  if (emulatorsConnected || !shouldUseEmulators()) return;
  emulatorsConnected = true;

  connectAuthEmulator(authInstance, "http://127.0.0.1:9099", {
    disableWarnings: true,
  });
  connectFirestoreEmulator(dbInstance, "127.0.0.1", 8080);
  connectStorageEmulator(storageInstance, "127.0.0.1", 9199);
  connectFunctionsEmulator(functionsInstance, "127.0.0.1", 5001);
}

export function getFirebaseApp(
  config: FirebaseClientConfig = readFirebaseClientConfig(),
): FirebaseApp {
  if (app) return app;
  app = getApps().length > 0 ? getApp() : initializeApp(config);
  return app;
}

export function getFirebaseAuth(): Auth {
  if (auth) return auth;
  const instance = getAuth(getFirebaseApp());
  // Touch the other services so emulators connect as a set on first auth use.
  const dbInstance = getFirestore(getFirebaseApp());
  const storageInstance = getStorage(getFirebaseApp());
  const functionsInstance = getFunctions(getFirebaseApp());
  connectEmulators(instance, dbInstance, storageInstance, functionsInstance);
  auth = instance;
  db = dbInstance;
  storage = storageInstance;
  functions = functionsInstance;
  return auth;
}

export function getFirestoreDb(): Firestore {
  if (db) return db;
  getFirebaseAuth(); // ensures emulators are wired
  return db!;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (storage) return storage;
  getFirebaseAuth();
  return storage!;
}

export function getFirebaseFunctions(): Functions {
  if (functions) return functions;
  getFirebaseAuth();
  return functions!;
}

/** Test helper — clears the module singletons between suites. */
export function resetFirebaseClient(): void {
  app = null;
  auth = null;
  db = null;
  storage = null;
  functions = null;
  emulatorsConnected = false;
}
