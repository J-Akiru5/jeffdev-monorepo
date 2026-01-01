/**
 * User API Route
 * ---------------
 * Fetch user profile from Firestore.
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      uid: userDoc.id,
      ...userDoc.data(),
    });
  } catch (error) {
    console.error('[GET USER ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
