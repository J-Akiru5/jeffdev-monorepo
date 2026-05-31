"use client";

/**
 * ModeGuard
 * ---------
 * Route-level access guard that enforces mode × role permissions.
 * Redirects or shows an access-denied message when the user's current mode
 * and workspace role don't grant access to the requested feature/page.
 *
 * Usage:
 *   <ModeGuard feature="marketing" fallbackPath="/dashboard">
 *     <MarketingDashboard />
 *   </ModeGuard>
 *
 * The guard waits for the workspace store to hydrate before making a decision.
 *
 * Permission matrix is defined in lib/mode-permissions.ts.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldOff } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useManageModeStore } from "@/stores/manage-mode-store";
import {
  type ManageFeature,
  canAccessFeature,
  isFeatureHidden,
} from "@/lib/mode-permissions";

interface ModeGuardProps {
  /** The feature/page to guard */
  feature: ManageFeature;
  /** Content to render if authorized */
  children: React.ReactNode;
  /** Redirect path when access is denied (default: /dashboard) */
  fallbackPath?: string;
  /** Whether to redirect (true) or show access-denied UI (false). Default: true */
  redirectOnDeny?: boolean;
  /** Whether to allow restricted access (default: false — only "allowed" is authorized) */
  allowRestricted?: boolean;
}

export function ModeGuard({
  feature,
  children,
  fallbackPath = "/dashboard",
  redirectOnDeny = true,
  allowRestricted = false,
}: ModeGuardProps) {
  const router = useRouter();
  const userRole = useWorkspaceStore((s) => s.userRole);
  const loaded = useWorkspaceStore((s) => s.loaded);
  const manageMode = useManageModeStore((s) => s.mode);

  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loaded) return;

    const hasAccess = allowRestricted
      ? canAccessFeature(manageMode, userRole, feature)
      : !isFeatureHidden(manageMode, userRole, feature);

    setAuthorized(hasAccess);

    if (!hasAccess && redirectOnDeny) {
      router.replace(fallbackPath);
    }
  }, [loaded, manageMode, userRole, feature, fallbackPath, redirectOnDeny, allowRestricted, router]);

  // Wait for hydration
  if (!loaded || authorized === null) {
    return <div className="min-h-[60vh]" />;
  }

  if (!authorized) {
    if (redirectOnDeny) return null;

    const featureName = feature.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-glass-10">
            <ShieldOff className="h-8 w-8 text-white/30" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white/70">
              Access Restricted
            </h2>
            <p className="mt-1 max-w-sm text-sm text-white/40">
              {feature === "marketing" ? (
                <>The Marketing dashboard is only available in{" "}
                  <strong className="text-white/60">Workspace</strong> mode.</>
              ) : feature === "departments" ? (
                <>Departments are only available in{" "}
                  <strong className="text-white/60">Workspace</strong> mode.</>
              ) : feature === "manage_members" ? (
                <>Member management is restricted to founders in{" "}
                  <strong className="text-white/60">Workspace</strong> mode.</>
              ) : (
                <>{featureName} is not available in your current mode.</>
              )}
            </p>
            <p className="mt-1 text-xs text-white/30">
              Switch to{" "}                <button
                onClick={() => {
                  useManageModeStore.getState().setMode(manageMode === "focus" ? "workspace" : "focus");
                }}
                className="text-cyan-400 underline hover:text-cyan-300"
              >
                {manageMode === "focus" ? "Workspace" : "Focus"} mode
              </button>{" "}
              or go to the{" "}
              <button
                onClick={() => router.push(fallbackPath)}
                className="text-cyan-400 underline hover:text-cyan-300"
              >
                dashboard
              </button>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
