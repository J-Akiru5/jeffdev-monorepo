"use client";

/**
 * OperationsGuard
 * ---------------
 * Client-side guard for the Operations hub + Business Model Canvas.
 *   - mode="operations": CEO/COO (or unrefined founder) only
 *   - mode="bmc": any founder/C-level may view (editing is gated server-side)
 * Server actions enforce the same rules independently.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";

interface OperationsGuardProps {
  mode: "operations" | "bmc";
  children: React.ReactNode;
  redirectOnDeny?: boolean;
}

export function OperationsGuard({
  mode,
  children,
  redirectOnDeny = true,
}: OperationsGuardProps) {
  const router = useRouter();
  const userRole = useWorkspaceStore((s) => s.userRole);
  const cLevelTitle = useWorkspaceStore((s) => s.cLevelTitle);
  const loaded = useWorkspaceStore((s) => s.loaded);

  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loaded) return;

    const isFounder = userRole === "founder";
    const operationsOk =
      isFounder &&
      (!cLevelTitle || cLevelTitle === "ceo" || cLevelTitle === "coo");
    const ok = mode === "operations" ? operationsOk : isFounder;

    setAuthorized(ok);
    if (!ok && redirectOnDeny) {
      router.replace("/dashboard");
    }
  }, [loaded, userRole, cLevelTitle, mode, redirectOnDeny, router]);

  if (!loaded || authorized === null) {
    return null;
  }

  if (!authorized) {
    return redirectOnDeny ? null : (
      <div className="flex flex-col items-center justify-center py-20">
        <ShieldAlert className="h-12 w-12 text-white/40 mb-4" />
        <h2 className="text-lg font-semibold text-white">Access Denied</h2>
        <p className="mt-1 text-sm text-white/40">
          {mode === "operations"
            ? "Only the CEO and COO can access the Operations hub."
            : "Only founders and C-levels can view the business canvas."}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
