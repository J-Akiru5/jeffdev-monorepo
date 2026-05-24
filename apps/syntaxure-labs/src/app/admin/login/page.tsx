"use client";

import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/browser";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Admin Login Page
 * ----------------
 * Supabase OAuth authentication for admin access.
 * Glassmorphism + neon accent design for brand consistency.
 */

function AdminLoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const queryError = searchParams.get("error");

  // Set initial error if callback redirected back with error
  useState(() => {
    if (queryError === "auth_failed") {
      setError("Google authentication failed. Please try again.");
    }
  });

  const title = inviteToken ? "Join Team" : "Admin Login";
  const subtitle = inviteToken
    ? "Sign in with your invited Google account to complete setup"
    : "Sign in with your authorized Google account";

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?invite=${inviteToken || ""}`,
        },
      });

      if (oauthError) {
        throw oauthError;
      }
    } catch (err: any) {
      console.error("[LOGIN ERROR]", err);
      setError(err.message || "Failed to initialize Google login");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-void px-6">
      <div className="w-full max-w-md">
        {/* Glass Card */}
        <div className="relative overflow-hidden glass-heavy glass-shimmer rounded-lg p-10">
          {/* Neon accent top bar */}
          <div className="absolute top-0 left-4 right-4 h-px animate-border-beam" />

          <div className="mb-8 text-center">
            {/* Logo icon */}
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/30 animate-neon-pulse">
              <svg
                className="h-8 w-8 text-cyan-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-white">{title}</h1>
            <p className="mt-2 text-white/50 text-sm">{subtitle}</p>
          </div>

          {error && (
            <div className="mb-6 rounded-md border border-red-500/20 bg-red-500/10 p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-3 glass rounded-md px-6 py-3.5 text-white/80 transition-all hover:border-cyan-500/30 hover:text-white hover:shadow-[0_0_25px_rgba(6,182,212,0.15)] disabled:cursor-not-allowed disabled:opacity-50 font-mono text-xs uppercase tracking-wider"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                {inviteToken ? "Setting up..." : "Signing in..."}
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

          {/* Neon accent bottom bar */}
          <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
        </div>

        {/* Small footer text */}
        <p className="mt-6 text-center text-[11px] text-white/25 font-mono">
          Authorized personnel only
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-void flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
