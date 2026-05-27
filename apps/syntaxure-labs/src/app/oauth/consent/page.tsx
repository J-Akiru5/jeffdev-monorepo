"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  SyntaxureLogo,
  GridBackground,
} from "@syntaxure/ui";
import { Shield, ArrowRight, Loader2, Check, AlertTriangle, Globe } from "lucide-react";

function OAuthConsentForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const authorizationId = searchParams.get("authorization_id");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    async function init() {
      if (!authorizationId) {
        setError("Missing authorization_id parameter. Please verify the URL.");
        setIsLoading(false);
        return;
      }

      try {
        const supabase = createClient();

        // 1. Get authenticated user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          // Redirect to login with 'next' parameter pointing back to current URL
          const currentUrl = window.location.pathname + window.location.search;
          router.push(`/admin/login?next=${encodeURIComponent(currentUrl)}`);
          return;
        }
        setUser(user);

        // 2. Fetch authorization details
        const { data, error: detailsError } = await (supabase.auth.oauth as any).getAuthorizationDetails(
          authorizationId
        );

        if (detailsError) {
          throw detailsError;
        }

        setDetails(data);
      } catch (err: any) {
        console.error("Error loading consent details:", err);
        setError(err.message || "Failed to load authorization details from Supabase.");
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, [authorizationId, router]);

  const handleApprove = async () => {
    if (!authorizationId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: approveError } = await (supabase.auth.oauth as any).approveAuthorization(
        authorizationId
      );

      if (approveError) {
        throw approveError;
      }

      if (data?.redirect_uri) {
        window.location.href = data.redirect_uri;
      } else {
        setError("Approval succeeded but no redirect URL was returned.");
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.error("Error approving authorization:", err);
      setError(err.message || "Failed to approve authorization.");
      setIsSubmitting(false);
    }
  };

  const handleDeny = async () => {
    if (!authorizationId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: denyError } = await (supabase.auth.oauth as any).denyAuthorization(
        authorizationId
      );

      if (denyError) {
        throw denyError;
      }

      if (data?.redirect_uri) {
        window.location.href = data.redirect_uri;
      } else {
        setError("Denial succeeded but no redirect URL was returned.");
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.error("Error denying authorization:", err);
      setError(err.message || "Failed to deny authorization.");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        <p className="text-sm font-mono text-white/50">Fetching request authorization details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md border-red-500/20 bg-red-500/5">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 border border-red-500/25">
            <AlertTriangle className="h-6 w-6 text-red-400" />
          </div>
          <CardTitle className="text-red-400">Authorization Error</CardTitle>
          <CardDescription className="text-white/40 mt-1">An error occurred during verification.</CardDescription>
        </CardHeader>
        <CardContent className="text-center font-mono text-xs text-white/70 py-2">
          {error}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="secondary" onClick={() => router.push("/")} size="sm">
            Back to Home
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const clientName = details?.client_name || "Third-party Application";
  const clientWebsite = details?.client_website || "";
  const scopes = details?.scopes || [];

  return (
    <div className="w-full max-w-md relative">
      {/* Glow Effects */}
      <div className="absolute -top-12 -left-12 h-32 w-32 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-purple-500/10 blur-2xl pointer-events-none" />

      <Card variant="elevated" className="overflow-hidden border-white/[0.08] bg-black/40 backdrop-blur-xl">
        <CardHeader className="text-center pb-4">
          {/* Connection flow visualization */}
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-md bg-black/40 border border-white/10 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
              <SyntaxureLogo className="h-9 w-9" />
            </div>

            <div className="relative flex items-center justify-center w-12">
              <div className="absolute w-full h-[2px] bg-gradient-to-r from-cyan-500 to-purple-500 opacity-30" />
              <ArrowRight className="h-4 w-4 text-cyan-400 animate-pulse z-10" />
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-md bg-black/40 border border-white/10 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
              <Globe className="h-6 w-6 text-purple-400" />
            </div>
          </div>

          <CardTitle className="text-2xl font-bold tracking-tight text-white">Authorize {clientName}</CardTitle>
          <CardDescription className="text-white/45 mt-1.5 text-xs">
            wants to connect to your Syntaxure Labs account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-2">
          {/* User badge */}
          <div className="flex items-center justify-between rounded-md border border-white/5 bg-white/[0.01] p-3 text-xs">
            <span className="text-white/40 font-mono">Logged in as:</span>
            <span className="text-white font-medium font-mono text-white/80">{user?.email}</span>
          </div>

          {/* Requested scopes */}
          <div className="space-y-3">
            <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider block">
              This application will be able to:
            </span>
            <div className="space-y-2.5">
              {scopes.length === 0 ? (
                <div className="flex items-start gap-3 text-xs text-white/60">
                  <Check className="h-4 w-4 text-cyan-400 mt-0.5 shrink-0" />
                  <span>Access your basic profile info</span>
                </div>
              ) : (
                scopes.map((scope: string, index: number) => {
                  let label = `Access scope: ${scope}`;
                  if (scope === "profile") label = "Access your profile information (name, avatar)";
                  if (scope === "email") label = "Read your primary email address";

                  return (
                    <div key={index} className="flex items-start gap-3 text-xs text-white/60">
                      <div className="flex h-4.5 w-4.5 items-center justify-center rounded bg-cyan-500/10 border border-cyan-500/25 mt-0.5 shrink-0">
                        <Check className="h-3 w-3 text-cyan-400" />
                      </div>
                      <span className="font-mono text-[11px] uppercase tracking-wider text-white/70">{scope}</span>
                      <span className="text-white/50 text-xs shrink opacity-80">— {label.replace(/Access scope: .*/, "Read-only access")}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Verification warning */}
          <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3.5 flex items-start gap-3">
            <Shield className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <span className="text-xs font-semibold text-amber-400 block">Trust Notice</span>
              <p className="text-[11px] text-white/50 leading-relaxed">
                Make sure you trust {clientName} before granting access. By continuing, you agree to share authorization credentials back to {clientWebsite || "the third-party URL"}.
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2.5 pt-4">
          <Button
            variant="cyan"
            className="w-full text-xs font-mono uppercase tracking-wider h-11"
            isLoading={isSubmitting}
            onClick={handleApprove}
          >
            Authorize Access
          </Button>

          <Button
            variant="ghost"
            className="w-full text-xs font-mono uppercase tracking-wider text-white/40 hover:text-white/80"
            disabled={isSubmitting}
            onClick={handleDeny}
          >
            Cancel & Decline
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function ConsentPage() {
  return (
    <main className="min-h-screen bg-void flex items-center justify-center relative px-6 py-12">
      <GridBackground variant="neon" />
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            <p className="text-sm font-mono text-white/50">Initializing secure session...</p>
          </div>
        }
      >
        <OAuthConsentForm />
      </Suspense>
    </main>
  );
}
