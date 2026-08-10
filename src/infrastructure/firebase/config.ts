/**
 * Firebase client SDK bootstrap.
 *
 * All Firebase imports in the application MUST live under
 * `src/infrastructure`. Features depend on core ports; this file is the only
 * place client config is read.
 */

export interface FirebaseClientConfig {
  readonly apiKey: string;
  readonly authDomain: string;
  readonly projectId: string;
  readonly storageBucket: string;
  readonly messagingSenderId: string;
  readonly appId: string;
  readonly measurementId?: string;
}

const EMULATOR_DEFAULTS: FirebaseClientConfig = {
  apiKey: "demo-api-key",
  authDomain: "localhost",
  projectId: "virtual-gallery-dev",
  storageBucket: "virtual-gallery-dev.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef",
};

/**
 * Reads client config. When emulators are enabled, missing public keys fall
 * back to demo values so local development works without a real Firebase
 * project. Production still requires every key.
 */
export function readFirebaseClientConfig(): FirebaseClientConfig {
  const usingEmulators =
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";

  const projectId =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    (usingEmulators ? EMULATOR_DEFAULTS.projectId : undefined);

  const required = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  } as const;

  if (usingEmulators) {
    return {
      apiKey: required.apiKey || EMULATOR_DEFAULTS.apiKey,
      authDomain: required.authDomain || EMULATOR_DEFAULTS.authDomain,
      projectId: required.projectId || EMULATOR_DEFAULTS.projectId,
      storageBucket: required.storageBucket || EMULATOR_DEFAULTS.storageBucket,
      messagingSenderId:
        required.messagingSenderId || EMULATOR_DEFAULTS.messagingSenderId,
      appId: required.appId || EMULATOR_DEFAULTS.appId,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    };
  }

  for (const [key, value] of Object.entries(required)) {
    if (!value) {
      throw new Error(
        `Missing required environment variable for Firebase: NEXT_PUBLIC_FIREBASE_${camelToEnv(key)}`,
      );
    }
  }

  return {
    apiKey: required.apiKey!,
    authDomain: required.authDomain!,
    projectId: required.projectId!,
    storageBucket: required.storageBucket!,
    messagingSenderId: required.messagingSenderId!,
    appId: required.appId!,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
}

function camelToEnv(key: string): string {
  return key.replace(/[A-Z]/g, (c) => `_${c}`).toUpperCase();
}
