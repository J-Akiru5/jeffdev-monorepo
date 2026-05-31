"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";

/**
 * Subscription Success Page
 *
 * Polls /api/subscription-status to confirm webhook processed.
 * Never activates based on URL params alone.
 */

type Status = "loading" | "success" | "pending" | "error";

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams();
  const subscriptionId = searchParams.get("subscriptionId") || "";
  const [status, setStatus] = useState<Status>("loading");
  const [tier, setTier] = useState("pro");
  const [message, setMessage] = useState("Confirming your subscription...");

  const checkStatus = useCallback(async () => {
    if (!subscriptionId) {
      setStatus("error");
      setMessage("No subscription ID found. Please check your email.");
      return;
    }

    try {
      const res = await fetch(
        `/api/subscription-status?subscriptionId=${subscriptionId}`,
      );
      const data = await res.json();

      if (data.status === "active") {
        setStatus("success");
        setTier(data.tier || "pro");
        setMessage(data.message);
      } else if (data.status === "pending") {
        // Keep polling
        setMessage(data.message || "Waiting for confirmation...");
        return true; // Continue polling
      } else {
        setStatus("error");
        setMessage(data.message || "Something went wrong.");
      }
    } catch {
      // Network error, keep polling
      return true;
    }
    return false;
  }, [subscriptionId]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let attempts = 0;
    const maxAttempts = 30; // 30 attempts × 2s = 60s max

    async function poll() {
      const shouldContinue = await checkStatus();
      attempts++;

      if (shouldContinue && attempts < maxAttempts) {
        timeout = setTimeout(poll, 2000);
      } else if (attempts >= maxAttempts) {
        setStatus("pending");
        setMessage(
          "Taking longer than expected. Check your email or try the dashboard.",
        );
      }
    }

    poll();

    return () => clearTimeout(timeout);
  }, [checkStatus]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      {/* Loading State */}
      {status === "loading" && (
        <>
          <div className="rounded-full bg-cyan-500/10 p-4 mb-6">
            <Loader2 className="h-12 w-12 text-cyan-400 animate-spin" />
          </div>
          <h1 className="text-3xl font-bold text-white">
            Confirming Subscription
          </h1>
          <p className="mt-4 max-w-md text-white/60">{message}</p>
          <p className="mt-2 text-sm text-white/40">
            This usually takes a few seconds...
          </p>
        </>
      )}

      {/* Success State */}
      {status === "success" && (
        <>
          <div className="rounded-full bg-emerald-500/10 p-4 mb-6">
            <CheckCircle className="h-12 w-12 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">
            Welcome to Prism {tier.charAt(0).toUpperCase() + tier.slice(1)}!
          </h1>
          <p className="mt-4 max-w-md text-white/60">
            Your subscription is now active. You have access to all{" "}
            {tier} features.
          </p>

          <div className="mt-8 flex gap-4">
            <Link
              href="/generate"
              className="rounded-md bg-cyan-500 px-6 py-2.5 font-medium text-black transition-colors hover:bg-cyan-400"
            >
              Start Generating
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md border border-white/20 px-6 py-2.5 font-medium text-white transition-colors hover:bg-white/5"
            >
              Go to Dashboard
            </Link>
          </div>

          <p className="mt-8 text-sm text-white/40">
            A confirmation email has been sent to your account.
          </p>
        </>
      )}

      {/* Pending State (taking longer) */}
      {status === "pending" && (
        <>
          <div className="rounded-full bg-amber-500/10 p-4 mb-6">
            <Loader2 className="h-12 w-12 text-amber-400 animate-spin" />
          </div>
          <h1 className="text-3xl font-bold text-white">
            Almost There
          </h1>
          <p className="mt-4 max-w-md text-white/60">{message}</p>

          <div className="mt-8 flex gap-4">
            <Link
              href="/dashboard"
              className="rounded-md bg-cyan-500 px-6 py-2.5 font-medium text-black transition-colors hover:bg-cyan-400"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/subscription"
              className="rounded-md border border-white/20 px-6 py-2.5 font-medium text-white transition-colors hover:bg-white/5"
            >
              Check Subscription
            </Link>
          </div>
        </>
      )}

      {/* Error State */}
      {status === "error" && (
        <>
          <div className="rounded-full bg-red-500/10 p-4 mb-6">
            <AlertCircle className="h-12 w-12 text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">
            Something Went Wrong
          </h1>
          <p className="mt-4 max-w-md text-white/60">{message}</p>

          <div className="mt-8 flex gap-4">
            <Link
              href="/subscription"
              className="rounded-md bg-cyan-500 px-6 py-2.5 font-medium text-black transition-colors hover:bg-cyan-400"
            >
              Try Again
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md border border-white/20 px-6 py-2.5 font-medium text-white transition-colors hover:bg-white/5"
            >
              Go to Dashboard
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
