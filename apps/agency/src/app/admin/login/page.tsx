'use client';

import { useState, Suspense } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Admin Login Page
 * ----------------
 * Google OAuth authentication for admin access.
 */

function AdminLoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite');

  // UI Text based on context
  const title = inviteToken ? 'Join Team' : 'Admin Login';
  const subtitle = inviteToken
    ? 'Sign in with your invited Google account to complete setup'
    : 'Sign in with your authorized Google account';

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Get ID token
      const idToken = await result.user.getIdToken();

      // Create session cookie via API route
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          inviteToken // Pass invite token if present
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create session');
      }

      // Redirect to dashboard or profile setup
      router.push(data.redirectPath || '/admin');
    } catch (err) {
      console.error('[LOGIN ERROR]', err);
      const error = err as { code?: string; message: string };
      // Handle Firebase Auth errors (like popup closed)
      if (error.code === 'auth/popup-closed-by-user') {
        setIsLoading(false);
        return;
      }
      setError(error.message || 'Failed to sign in');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-void px-6">
      <div className="w-full max-w-md">
        <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-8">
          <div className="mb-8 text-center">
            {/* Logo or specialized icon could go here */}
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            <p className="mt-2 text-white/50 text-sm">
              {subtitle}
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-md border border-red-500/20 bg-red-500/10 p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-3 rounded-md border border-white/10 bg-white/5 px-6 py-3 text-white transition-all hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {inviteToken ? 'Setting up...' : 'Signing in...'}
              </>
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-void" />}>
      <AdminLoginForm />
    </Suspense>
  );
}
