/**
 * Client Auth operations. The only place features talk to Firebase Auth —
 * keeps `firebase/*` imports inside infrastructure for the boundary rules.
 */

import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signInWithEmailLink,
  signInWithPopup,
  signOut as firebaseSignOut,
  type Unsubscribe,
  type User,
} from "firebase/auth";

import { getFirebaseAuth } from "./client";

export async function sendEmailSignInLink(
  email: string,
  continueUrl: string,
): Promise<void> {
  const auth = getFirebaseAuth();
  await sendSignInLinkToEmail(auth, email, {
    url: continueUrl,
    handleCodeInApp: true,
  });
}

export function isEmailSignInLink(url: string): boolean {
  return isSignInWithEmailLink(getFirebaseAuth(), url);
}

export async function completeEmailSignIn(
  email: string,
  url: string,
): Promise<string> {
  const credential = await signInWithEmailLink(
    getFirebaseAuth(),
    email,
    url,
  );
  return credential.user.getIdToken(/* forceRefresh */ true);
}

export async function signInWithEmailPassword(
  email: string,
  password: string,
): Promise<string> {
  const credential = await signInWithEmailAndPassword(
    getFirebaseAuth(),
    email,
    password,
  );
  return credential.user.getIdToken(true);
}

export async function signUpWithEmailPassword(
  email: string,
  password: string,
): Promise<string> {
  const credential = await createUserWithEmailAndPassword(
    getFirebaseAuth(),
    email,
    password,
  );
  return credential.user.getIdToken(true);
}

export async function signInWithGoogle(): Promise<string> {
  const result = await signInWithPopup(
    getFirebaseAuth(),
    new GoogleAuthProvider(),
  );
  return result.user.getIdToken(true);
}

export async function clientSignOut(): Promise<void> {
  await firebaseSignOut(getFirebaseAuth());
}

export async function signInWithSessionToken(token: string): Promise<void> {
  const auth = getFirebaseAuth();
  await signInWithCustomToken(auth, token);
  await auth.currentUser?.getIdToken(true);
}

export function subscribeAuth(
  listener: (user: User | null) => void,
): Unsubscribe {
  return onAuthStateChanged(getFirebaseAuth(), listener);
}

export function getClientAuthUser(): User | null {
  return getFirebaseAuth().currentUser;
}
