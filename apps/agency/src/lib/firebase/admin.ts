/**
 * Firebase Admin SDK Configuration
 * ---------------------------------
 * Server-side only. Used for:
 * - Verifying auth tokens
 * - Writing to Firestore from Server Actions
 * - Admin operations
 *
 * SECURITY: Never expose this on the client!
 */

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let app: App;
let auth: Auth;
let db: Firestore;

if (!getApps().length) {
  // Parse the private key (handle escaped newlines)
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
    ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
  });

  // Get Firestore and configure settings (must be done before any Firestore operations)
  db = getFirestore(app);
  db.settings({ ignoreUndefinedProperties: true });

  auth = getAuth(app);
} else {
  app = getApps()[0];
  db = getFirestore(app);
  auth = getAuth(app);
}

export { auth, auth as adminAuth, db };
export default app;
