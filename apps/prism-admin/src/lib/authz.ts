/**
 * Centralized server-side authorization for Prism Admin.
 *
 * Invariant:
 *
 *   authenticated + authorized caller
 *       ↓
 *   server-side privileged operation
 *       ↓
 *   service-role client
 *
 * NEVER: anonymous caller → server action → service-role client.
 *
 * `requireRole()` is the single enforcement point used by every server
 * action and every protected API route. It independently verifies the
 * caller's Supabase session AND their authoritative role from
 * `user_profiles` — it never trusts client-side UI state and never relies
 * on the `/admin` layout gate.
 */

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  AuthzError,
  canAccess,
  type RequiredRole,
} from "@/lib/authz-roles";

export { AuthzError, canAccess, roleRank, canRunDevOnlyFeature } from "@/lib/authz-roles";
export type { AdminRole, RequiredRole } from "@/lib/authz-roles";

/** Authenticated, authorized caller identity. */
export interface AdminActor {
  id: string;
  email: string | null;
  role: string;
}

export const requireRole = cache(
  async (required: RequiredRole = "manager"): Promise<AdminActor> => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new AuthzError("Authentication required", 401);
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role, email")
      .eq("id", user.id)
      .maybeSingle();

    const role: string = profile?.role ?? "employee";

    if (!canAccess(role, required)) {
      throw new AuthzError(`Insufficient role: ${required} required`, 403);
    }

    return {
      id: user.id,
      email: profile?.email ?? user.email ?? null,
      role,
    };
  },
);
