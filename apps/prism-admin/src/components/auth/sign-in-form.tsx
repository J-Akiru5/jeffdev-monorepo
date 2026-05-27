"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { Button, Input } from "@syntaxure/ui";
import { Loader2, Lock, Shield } from "lucide-react";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleOAuthSignIn(provider: "google" | "github") {
    setOauthLoading(provider);
    setError("");

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (oauthError) {
        setError(oauthError.message);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setOauthLoading(null);
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative overflow-hidden glass-heavy glass-shimmer rounded-lg p-10">
      {/* Neon accent top bar */}
      <div className="absolute top-0 left-4 right-4 h-px animate-border-beam" />

      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/30 animate-neon-pulse">
          <Shield className="h-8 w-8 text-cyan-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">Prism Admin</h1>
        <p className="mt-2 text-white/50 text-sm">Mission Control Access</p>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* OAuth Buttons */}
      <div className="space-y-2.5 mb-6">
        <button
          type="button"
          onClick={() => handleOAuthSignIn("google")}
          disabled={oauthLoading !== null}
          className="flex w-full items-center justify-center gap-3 glass rounded-md px-6 py-2.5 text-white/80 transition-all hover:border-cyan-500/30 hover:text-white hover:shadow-[0_0_25px_rgba(6,182,212,0.15)] disabled:cursor-not-allowed disabled:opacity-50 font-mono text-xs uppercase tracking-wider"
        >
          {oauthLoading === "google" ? (
            <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
          ) : (
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
          )}
          Sign in with Google
        </button>
        <button
          type="button"
          onClick={() => handleOAuthSignIn("github")}
          disabled={oauthLoading !== null}
          className="flex w-full items-center justify-center gap-3 glass rounded-md px-6 py-2.5 text-white/80 transition-all hover:border-cyan-500/30 hover:text-white hover:shadow-[0_0_25px_rgba(6,182,212,0.15)] disabled:cursor-not-allowed disabled:opacity-50 font-mono text-xs uppercase tracking-wider"
        >
          {oauthLoading === "github" ? (
            <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          )}
          Sign in with GitHub
        </button>
      </div>

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/5" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-glass-heavy px-3 text-white/30 font-mono uppercase tracking-wider">
            Or continue with email
          </span>
        </div>
      </div>

      <form onSubmit={handleSignIn} className="space-y-4">
        <div className="relative">
          <Lock className="absolute left-3 top-[34px] h-4 w-4 text-white/30 pointer-events-none" />
          <Input
            label="Email"
            type="email"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            variant="glass"
            required
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-[34px] h-4 w-4 text-white/30 pointer-events-none" />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10"
            variant="glass"
            required
          />
        </div>

        <Button
          type="submit"
          isLoading={loading}
          variant="primary"
          className="w-full mt-2"
        >
          Sign In
        </Button>
      </form>

      {/* Neon accent bottom bar */}
      <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
    </div>
  );
}
