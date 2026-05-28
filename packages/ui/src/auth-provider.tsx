"use client";

/**
 * AuthProvider & useAuth
 * ----------------------
 * Shared authentication context for all Syntaxure apps.
 *
 * Provides:
 *   - AuthProfile (id, email, full_name, avatar_url, role, raw profile)
 *   - loading / error states
 *   - signOut()  — signs out via Supabase
 *   - refresh()  — re-fetches user + profile
 *
 * Usage (app-specific wrapper):
 *   <AuthProvider createClient={createClient}>
 *     {children}
 *   </AuthProvider>
 *
 * Then in any child:
 *   const { user, loading, signOut } = useAuth();
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuthProfile {
  /** Supabase Auth user ID */
  id: string;
  /** Email address */
  email: string;
  /** User's display name (falls back to email prefix) */
  full_name?: string;
  /** Avatar URL */
  avatar_url?: string;
  /** RBAC role from user_profiles table */
  role?: string;
  /** Raw profile columns from user_profiles */
  [key: string]: unknown;
}

export interface AuthState {
  /** Current authenticated user (null if not signed in / still loading) */
  user: AuthProfile | null;
  /** True while initial auth check or refresh() is in flight */
  loading: boolean;
  /** Last error message, if any */
  error: string | null;
}

export interface AuthContextValue extends AuthState {
  /** Sign the current user out and clear state */
  signOut: () => Promise<void>;
  /** Re-fetch current user + profile from Supabase */
  refresh: () => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  error: null,
  signOut: async () => {},
  refresh: async () => {},
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export interface AuthProviderProps {
  children: ReactNode;
  /** Function that returns a Supabase browser client (called once per mount) */
  createClient: () => any;
}

export function AuthProvider({ children, createClient }: AuthProviderProps) {
  const [user, setUser] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create client once per mount and hold in a ref so it's stable across renders
  const clientRef = useRef<any>(null);

  // ── Refresh: fetch user + profile from Supabase ──
  const refresh = useCallback(async () => {
    // For subsequent refreshes (auth state changes), don't flash loading
    setError(null);

    try {
      if (!clientRef.current) {
        setLoading(true);
        clientRef.current = createClient();
      }
      const supabase = clientRef.current;

      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData?.user as Record<string, unknown> | null;

      if (!authUser) {
        setUser(null);
        return;
      }

      // Fetch profile from user_profiles
      const { data: rawProfile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", authUser.id as string)
        .maybeSingle();

      const profile = rawProfile as Record<string, unknown> | null;
      const meta = authUser.user_metadata as Record<string, unknown> | undefined;

      setUser({
        id: authUser.id as string,
        email: (authUser.email as string) || "",
        full_name:
          (meta?.full_name as string) ||
          (profile?.full_name as string) ||
          ((authUser.email as string)?.split("@")[0] as string) ||
          "User",
        avatar_url:
          (meta?.avatar_url as string) || (profile?.avatar_url as string),
        role: (profile?.role as string) || "employee",
        ...profile,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load user";
      setError(message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [createClient]);

  // ── Sign Out ──
  const signOut = useCallback(async () => {
    try {
      if (!clientRef.current) clientRef.current = createClient();
      await clientRef.current.auth.signOut();
      setUser(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to sign out";
      setError(message);
    }
  }, [createClient]);

  // ── Mount: initial fetch + listen for auth changes ──
  useEffect(() => {
    // Create client synchronously before any async work
    if (!clientRef.current) {
      clientRef.current = createClient();
    }

    // Initial fetch (sets loading to true inside refresh since client is fresh)
    refresh();

    // Subscribe to auth changes (doesn't flash loading on token refresh)
    const { data: sub } = clientRef.current.auth.onAuthStateChange(
      (_event: string) => {
        refresh();
      },
    );

    return () => {
      sub?.subscription?.unsubscribe();
    };
  }, [refresh, createClient]);

  return (
    <AuthContext.Provider value={{ user, loading, error, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}
