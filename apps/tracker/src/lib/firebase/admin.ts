/**
 * Firebase Admin SDK Configuration
 * ---------------------------------
 * Server-only initialization for Server Actions.
 */
import 'server-only';

import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

function formatPrivateKey(key: string | undefined): string {
  if (!key) return '';
  return key.replace(/\\n/g, '\n');
}

const adminApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: formatPrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY),
        }),
      });

const adminDb = getFirestore(adminApp);

export { adminApp, adminDb, Timestamp };
