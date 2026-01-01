/**
 * Session API Route
 * ------------------
 * Creates a secure session cookie after Firebase authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth as adminAuth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { acceptInvite } from '@/app/actions/accept-invite';

export async function POST(request: NextRequest) {
  try {
    const { idToken, inviteToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'Missing idToken' },
        { status: 400 }
      );
    }

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    // Handle invite if present
    let redirectPath = '/admin'; // Default redirect
    if (inviteToken) {
      if (!email) {
        return NextResponse.json(
          { error: 'Email is required for invite acceptance' },
          { status: 400 }
        );
      }

      const inviteResult = await acceptInvite(inviteToken, uid, email);

      if (!inviteResult.success) {
        return NextResponse.json(
          { error: inviteResult.error || 'Failed to accept invite' },
          { status: 400 }
        );
      }

      // New users go to profile setup
      redirectPath = '/admin/profile';
    }

    // Create session cookie (expires in 5 days)
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return NextResponse.json(
      { success: true, uid, redirectPath },
      { status: 200 }
    );
  } catch (error) {
    console.error('[SESSION ERROR]', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}
