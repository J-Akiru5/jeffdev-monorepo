import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

/**
 * Firebase Admin SDK initialization
 * Used for reading Agency data (users, projects, clients, etc.)
 */

const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
};

// Initialize Firebase Admin only once
export function getFirebaseAdmin() {
  if (getApps().length === 0) {
    initializeApp(firebaseAdminConfig);
  }
  return {
    db: getFirestore(),
    auth: getAuth(),
  };
}

// Convenience exports
export const getAgencyDb = () => getFirebaseAdmin().db;
export const getAgencyAuth = () => getFirebaseAdmin().auth;

/**
 * Fetch Agency users from Firestore
 */
export async function getAgencyUsers() {
  try {
    const db = getAgencyDb();
    const usersSnapshot = await db.collection("users").get();
    return usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("[Firebase] Error fetching users:", error);
    return [];
  }
}

/**
 * Fetch Agency projects from Firestore
 */
export async function getAgencyProjects() {
  try {
    const db = getAgencyDb();
    const projectsSnapshot = await db.collection("projects").orderBy("createdAt", "desc").get();
    return projectsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("[Firebase] Error fetching projects:", error);
    return [];
  }
}

/**
 * Fetch Agency clients from Firestore
 */
export async function getAgencyClients() {
  try {
    const db = getAgencyDb();
    const clientsSnapshot = await db.collection("clients").orderBy("name", "asc").get();
    return clientsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("[Firebase] Error fetching clients:", error);
    return [];
  }
}

/**
 * Fetch Agency invoices from Firestore
 */
export async function getAgencyInvoices() {
  try {
    const db = getAgencyDb();
    const invoicesSnapshot = await db.collection("invoices").orderBy("createdAt", "desc").get();
    return invoicesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("[Firebase] Error fetching invoices:", error);
    return [];
  }
}
