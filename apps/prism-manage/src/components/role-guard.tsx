"use client";

/**
 * RoleGuard
 * ---------
 * Restricts access to department-specific pages/hubs based on the user's
 * C-Level title. If the user lacks access, they are redirected to the
 * dashboard or shown an access-denied message.
 *
 * Usage:
 *   <RoleGuard department="Engineering">
 *     <EngineeringDashboard />
 *   </RoleGuard>
 *
 * Access matrix:
 *   - CEO: all departments
 *   - CTO: Engineering only
 *   - CPO: Product only
 *   - COO: Operations only
 *   - CMO: Marketing only
 *   - Employee: their assigned department
 *   - Unrefined founder: all departments
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";

const C_LEVEL_DEPARTMENT: Record<string, string> = {
  ceo: "__all__",
  cto: "Engineering",
  cpo: "Product",
  coo: "Operations",
  cmo: "Marketing",
};

interface RoleGuardProps {
  /** The department required to view this page */
  department: string;
  /** Content to render if authorized */
  children: React.ReactNode;
  /** Whether to redirect instead of showing an error (default: true) */
  redirectOnDeny?: boolean;
  /** Fallback redirect path (default: /dashboard) */
  fallbackPath?: string;
}

export function RoleGuard({
  department,
  children,
  redirectOnDeny = true,
  fallbackPath = "/dashboard",
}: RoleGuardProps) {
  const router = useRouter();
  const userRole = useWorkspaceStore((s) => s.userRole);
  const cLevelTitle = useWorkspaceStore((s) => s.cLevelTitle);
  const userDepartmentId = useWorkspaceStore((s) => s.userDepartmentId);
  const departments = useWorkspaceStore((s) => s.departments);
  const loaded = useWorkspaceStore((s) => s.loaded);

  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loaded) return;

    const isFounder = userRole === "founder";

    // CEO sees everything
    if (cLevelTitle === "ceo") {
      setAuthorized(true);
      return;
    }

    // Unrefined founder sees everything
    if (isFounder && !cLevelTitle) {
      setAuthorized(true);
      return;
    }

    // C-Level scoped: only access their own department
    if (cLevelTitle && C_LEVEL_DEPARTMENT[cLevelTitle] === department) {
      setAuthorized(true);
      return;
    }

    // Employee: only access their assigned department
    if (!isFounder && userDepartmentId) {
      const userDept = departments.find((d) => d.id === userDepartmentId);
      if (userDept?.name === department) {
        setAuthorized(true);
        return;
      }
    }

    // Denied
    setAuthorized(false);
    if (redirectOnDeny) {
      router.replace(fallbackPath);
    }
  }, [loaded, userRole, cLevelTitle, userDepartmentId, departments, department, redirectOnDeny, fallbackPath, router]);

  if (!loaded || authorized === null) {
    return null;
  }

  if (!authorized) {
    return redirectOnDeny ? null : (
      <div className="flex flex-col items-center justify-center py-20">
        <ShieldAlert className="h-12 w-12 text-white/30 mb-4" />
        <h2 className="text-lg font-semibold text-white">Access Denied</h2>
        <p className="mt-1 text-sm text-white/40">
          You don&apos;t have access to the {department} dashboard.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
