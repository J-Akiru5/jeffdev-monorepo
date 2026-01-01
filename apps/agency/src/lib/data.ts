/**
 * Firestore Data Fetching Layer
 * -------------------------------
 * Server-side functions to fetch data from Firestore.
 * Uses Firebase Admin SDK for secure reads.
 */

import { db } from '@/lib/firebase/admin';
import type {
  FirestoreService,
  FirestoreProject,
  FirestoreQuote,
  FirestoreMessage,
} from '@/types/firestore';

// =============================================================================
// SERVICES
// =============================================================================
export async function getServices(): Promise<FirestoreService[]> {
  try {
    const snapshot = await db
      .collection('services')
      .orderBy('order', 'asc')
      .get();

    return snapshot.docs.map((doc) => doc.data() as FirestoreService);
  } catch (error) {
    console.error('[GET SERVICES ERROR]', error);
    return [];
  }
}

export async function getServiceBySlug(
  slug: string
): Promise<FirestoreService | null> {
  try {
    const doc = await db.collection('services').doc(slug).get();
    if (!doc.exists) return null;
    return doc.data() as FirestoreService;
  } catch (error) {
    console.error('[GET SERVICE ERROR]', error);
    return null;
  }
}

// =============================================================================
// PROJECTS
// =============================================================================
export async function getProjects(): Promise<FirestoreProject[]> {
  try {
    const snapshot = await db
      .collection('projects')
      .orderBy('order', 'asc')
      .get();

    return snapshot.docs.map((doc) => doc.data() as FirestoreProject);
  } catch (error) {
    console.error('[GET PROJECTS ERROR]', error);
    return [];
  }
}

export async function getFeaturedProjects(): Promise<FirestoreProject[]> {
  try {
    const snapshot = await db
      .collection('projects')
      .where('featured', '==', true)
      .orderBy('order', 'asc')
      .get();

    return snapshot.docs.map((doc) => doc.data() as FirestoreProject);
  } catch (error) {
    console.error('[GET FEATURED PROJECTS ERROR]', error);
    return [];
  }
}

export async function getProjectBySlug(
  slug: string
): Promise<FirestoreProject | null> {
  try {
    const doc = await db.collection('projects').doc(slug).get();
    if (!doc.exists) return null;
    return doc.data() as FirestoreProject;
  } catch (error) {
    console.error('[GET PROJECT ERROR]', error);
    return null;
  }
}

// =============================================================================
// QUOTES
// =============================================================================
export async function getQuotes(limit = 50): Promise<FirestoreQuote[]> {
  try {
    const snapshot = await db
      .collection('quotes')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FirestoreQuote[];
  } catch (error) {
    console.error('[GET QUOTES ERROR]', error);
    return [];
  }
}

// =============================================================================
// MESSAGES
// =============================================================================
export async function getMessages(limit = 50): Promise<FirestoreMessage[]> {
  try {
    const snapshot = await db
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FirestoreMessage[];
  } catch (error) {
    console.error('[GET MESSAGES ERROR]', error);
    return [];
  }
}
