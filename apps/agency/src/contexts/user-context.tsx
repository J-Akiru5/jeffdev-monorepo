"use client";

/**
 * User Context
 * Rewritten to use Supabase Auth
 * Public API remains identical to consumer components
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/browser";
import type { AppUser } from "@/types/rbac";

interface UserContextValue {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
  error: null,
  logout: async () => {},
});

export function useUser() {
  return useContext(UserContext);
}

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        try {
          // Fetch user profile from Supabase
          const response = await fetch(`/api/users/${session.user.id}`);

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            // User exists in Supabase Auth but not in user_profiles
            // Default to employee role for now
            setUser({
              uid: session.user.id,
              email: session.user.email || "",
              displayName: session.user.user_metadata?.name || "User",
              photoURL: session.user.user_metadata?.avatar_url || undefined,
              role: "employee",
              assignedProjects: [],
              permissions: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        } catch (err) {
          console.error("[USER FETCH ERROR]", err);
          setError("Failed to load user profile");
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase]);

  async function logout() {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (err) {
      console.error("[LOGOUT ERROR]", err);
      setError("Failed to sign out");
    }
  }

  return (
    <UserContext.Provider value={{ user, loading, error, logout }}>
      {children}
    </UserContext.Provider>
  );
}
