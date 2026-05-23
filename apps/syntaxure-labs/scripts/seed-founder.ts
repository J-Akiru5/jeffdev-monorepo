/**
 * Seed Founder User Script
 * -------------------------
 * Run this script ONCE to create the founder user document.
 * 
 * Usage: npx ts-node scripts/seed-founder.ts
 * 
 * NOTE: You need to get your Firebase UID from:
 * 1. Firebase Console → Authentication → Users → Copy UID
 * 2. Or check browser DevTools → Application → IndexedDB → firebaseLocalStorage
 */

import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env vars from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// ============================================
// ⚠️ CONFIGURE THESE BEFORE RUNNING
// ============================================
const FOUNDER_EMAIL = 'jeffmartinez474@gmail.com'; // Your Firebase Auth email
// Get your UID from Firebase Console → Authentication → Users
// Leave empty to auto-detect from email
const FOUNDER_UID = ''; 

// ============================================

const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();
const auth = getAuth();

async function seedFounder() {
  console.log('🔐 Seeding Founder Account...\n');

  try {
    // Find UID by email if not provided
    let uid = FOUNDER_UID;
    
    if (!uid) {
      console.log(`Looking up user by email: ${FOUNDER_EMAIL}`);
      const userRecord = await auth.getUserByEmail(FOUNDER_EMAIL);
      uid = userRecord.uid;
      console.log(`Found UID: ${uid}\n`);
    }

    // Check if user document already exists
    const existingDoc = await db.collection('users').doc(uid).get();
    if (existingDoc.exists) {
      console.log('⚠️  User document already exists!');
      console.log('Current data:', existingDoc.data());
      console.log('\nSkipping seed. Delete the document first if you want to reseed.');
      return;
    }

    // Create the founder user document
    const founderProfile = {
      uid,
      email: FOUNDER_EMAIL,
      displayName: 'Jeff Edrick Martinez',
      photoURL: '',
      role: 'founder',
      title: 'Founder & Lead Developer',
      bio: 'Building the future, one line at a time',
      phone: '09519167103',
      location: 'Iloilo, Philippines',
      website: 'https://jeffdev.studio',
      status: 'active',
      assignedProjects: [],
      permissions: ['*'], // Founder has all permissions
      socials: {
        github: 'https://github.com/J-Akiru5',
        linkedin: '',
        twitter: '',
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await db.collection('users').doc(uid).set(founderProfile);
    console.log('✅ Founder user document created successfully!\n');
    console.log('Document ID:', uid);
    console.log('Data:', JSON.stringify(founderProfile, null, 2));

    // Set custom claims for role-based access
    await auth.setCustomUserClaims(uid, { role: 'founder' });
    console.log('\n✅ Custom claims set (role: founder)');
    console.log('\n🎉 Done! Refresh your browser and you should see "Founder" instead of "Employee".');

  } catch (error) {
    console.error('❌ Error seeding founder:', error);
    process.exit(1);
  }
}

seedFounder().then(() => process.exit(0));
