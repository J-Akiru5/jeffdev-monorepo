"use client";

/**
 * MarketingGuard
 * --------------
 * Client-side RBAC guard for marketing pages.
 * Only allows access if the user is:
 * - A founder (can access all departments)
 * - An employee assigned to the Marketing department
 *
 * If not authorized, renders an empty state rather than redirecting,
 * so the page layout still shows properly without jarring navigation.
 */

import { useWorkspaceStore } from "@/stores/workspace-store";
import { ShieldOff } from "lucide-react";

interface MarketingGuardProps {
  children: React.ReactNode;
}

export function MarketingGuard({ children }: MarketingGuardProps) {
  const userRole = useWorkspaceStore((s) => s.userRole);
  const departments = useWorkspaceStore((s) => s.departments);
  const userDepartmentId = useWorkspaceStore((s) => s.userDepartmentId);
  const loaded = useWorkspaceStore((s) => s.loaded);

  // Check if user has access to marketing
  const isFounder = userRole === "founder";
  const marketingDept = departments.find((d) => d.name === "Marketing");
  const isMarketingMember = !isFounder && !!marketingDept && userDepartmentId === marketingDept.id;
  const hasAccess = isFounder || isMarketingMember;

  // Don't render guard until store is hydrated
  if (!loaded) {
    return null;
  }

  if (!hasAccess) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-glass-10">
            <ShieldOff className="h-8 w-8 text-white/30" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white/70">
              Marketing Restricted
            </h2>
            <p className="mt-1 max-w-sm text-sm text-white/40">
              Only members of the Marketing department or founders can access
              this section.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
