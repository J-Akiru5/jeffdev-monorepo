import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let db: ReturnType<typeof getFirestore> | null = null;

export function getDb() {
  if (db) return db;

  if (getApps().length === 0) {
    const key = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (key && process.env.FIREBASE_ADMIN_PROJECT_ID) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || '',
          privateKey: key,
        }),
      });
    } else {
      console.warn('[marketing] Firebase Admin credentials missing — KPIs will be read-only');
    }
  }

  db = getFirestore();
  return db;
}
