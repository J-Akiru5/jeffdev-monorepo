'use client';

/**
 * User Context
 * -------------
 * Provides current user info and role throughout admin panel.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import type { AppUser } from '@/types/rbac';

interface UserContextValue {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
  error: null,
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch user profile from Firestore
          const response = await fetch(`/api/users/${firebaseUser.uid}`);
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            // User exists in Firebase but not in our users collection
            // Default to employee role for now
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'User',
              photoURL: firebaseUser.photoURL || undefined,
              role: 'employee',
              assignedProjects: [],
              permissions: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        } catch (err) {
          console.error('[USER FETCH ERROR]', err);
          setError('Failed to load user profile');
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, error }}>
      {children}
    </UserContext.Provider>
  );
}
