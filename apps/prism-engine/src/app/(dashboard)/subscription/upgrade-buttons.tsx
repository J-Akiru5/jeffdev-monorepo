"use client";

/**
 * Phase 2 upgrade flow: calls POST /api/subscriptions which creates a PayPal
 * subscription against env-configured plan IDs and returns the approval URL.
 * The actual activation lands via the consolidated BILLING.SUBSCRIPTION.*
 * webhook → prism_subscriptions.
 */

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@syntaxure/ui";

export function UpgradeButtons({
  tier,
  disabled,
}: {
  tier: "pro" | "team";
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState<"monthly" | "annual" | null>(null);

  async function checkout(billing: "monthly" | "annual") {
    setLoading(billing);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, billing }),
      });
      const data = (await res.json()) as {
        approvalUrl?: string;
        redirect?: string;
        error?: string;
      };
      if (data.approvalUrl) {
        window.location.href = data.approvalUrl;
        return;
      }
      if (data.redirect) {
        window.location.href = data.redirect;
        return;
      }
      throw new Error(data.error || "Checkout is not available right now.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Checkout failed — try again.",
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        variant={tier === "pro" ? "primary" : "secondary"}
        className="w-full"
        disabled={disabled || loading !== null}
        onClick={() => checkout("monthly")}
      >
        {loading === "monthly"
          ? "Redirecting to PayPal…"
          : tier === "team"
            ? "Subscribe — ₱249/seat/mo"
            : "Subscribe monthly"}
      </Button>
      <Button
        variant="secondary"
        className="w-full"
        disabled={disabled || loading !== null}
        onClick={() => checkout("annual")}
      >
        {loading === "annual"
          ? "Redirecting to PayPal…"
          : tier === "team"
            ? "Annual — ₱2,490/seat"
            : "Annual — 2 months free"}
      </Button>
    </div>
  );
}
