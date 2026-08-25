import { ReactNode } from "react";

export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { getUserTier } from "@/lib/subscriptions";
import DashboardShell from "@/components/layout/dashboard-shell";

/**
 * Dashboard Layout
 * ----------------
 * Server component: fetches auth + subscription data, then hands off
 * to the client DashboardShell for all navigation / layout rendering.
 * Cache busted for Next.js 16
 */
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  /* ── Subscription tier — resolved through the canonical getUserTier()
     (active/trialing only) so a cancelled subscriber no longer sees a paid
     badge the API would refuse to honor. ── */
  let currentTier = "free";
  if (user) {
    currentTier = await getUserTier(user.id);
  }

  /* ── Derived display values ── */
  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    "User";
  const userInitial = (displayName?.charAt(0) || "U").toUpperCase();
  const isPaidTier = currentTier !== "free";
  const planLabel =
    currentTier.charAt(0).toUpperCase() + currentTier.slice(1);

  return (
    <DashboardShell
      userInfo={{
        displayName,
        email: user?.email || "",
        userInitial,
        isPaidTier,
        planLabel,
      }}
    >
      {children}
    </DashboardShell>
  );
}
