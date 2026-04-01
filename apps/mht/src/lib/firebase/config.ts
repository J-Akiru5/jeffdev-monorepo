/**
 * Firebase Client SDK Configuration (MHT)
 * ----------------------------------------
 * Re-uses the same Firebase project as the agency app.
 * Singleton pattern for Next.js SSR compatibility.
 *
 * IMPORTANT: Gracefully handles missing env vars during build.
 */

import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Only initialize if we have actual config values (prevents build crashes)
let app: FirebaseApp | undefined;
let auth: Auth | undefined;

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
}

export { app, auth };
