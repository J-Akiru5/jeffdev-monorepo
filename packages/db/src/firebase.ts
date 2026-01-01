/**
 * @module @jeffdev/db/firebase
 * @description Firebase Admin SDK singleton for server-side operations.
 * Uses the AGENCY_FIREBASE_KEY from Doppler environment.
 * 
 * @example
 * import { firestore, auth } from "@jeffdev/db/firebase";
 * const users = await firestore.collection("users").get();
 */

import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

let app: App;
let firestoreInstance: Firestore;
let authInstance: Auth;

/**
 * Initialize Firebase Admin SDK with service account credentials.
 * Uses singleton pattern to prevent multiple initializations.
 */
function initializeFirebaseAdmin(): App {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }

  const serviceAccountKey = process.env.AGENCY_FIREBASE_KEY;
  
  if (!serviceAccountKey) {
    throw new Error(
      "[packages/db] AGENCY_FIREBASE_KEY is not set. " +
      "Ensure Doppler is injecting environment variables."
    );
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    
    app = initializeApp({
      credential: cert(serviceAccount),
    });
    
    return app;
  } catch (error) {
    throw new Error(
      `[packages/db] Failed to parse AGENCY_FIREBASE_KEY: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Get the Firestore instance (singleton).
 * Automatically initializes Firebase Admin if not already done.
 */
export function getFirestoreClient(): Firestore {
  if (!firestoreInstance) {
    initializeFirebaseAdmin();
    firestoreInstance = getFirestore();
  }
  return firestoreInstance;
}

/**
 * Get the Auth instance (singleton).
 * Automatically initializes Firebase Admin if not already done.
 */
export function getAuthClient(): Auth {
  if (!authInstance) {
    initializeFirebaseAdmin();
    authInstance = getAuth();
  }
  return authInstance;
}

// Convenience exports
export const firestore = getFirestoreClient;
export const auth = getAuthClient;

// Re-export types for consumers
export type { Firestore, Auth };
