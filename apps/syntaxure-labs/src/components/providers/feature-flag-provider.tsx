'use client';

/**
 * Feature Flag Context
 * ---------------------
 * Client-side context for feature flags.
 * Flags are fetched server-side and passed to this provider.
 */

import { createContext, useContext, type ReactNode } from 'react';

export interface FeatureFlags {
  prismEngineEnabled: boolean;
  prismEngineTeaser: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  prismEngineEnabled: false,
  prismEngineTeaser: true,
};

const FeatureFlagContext = createContext<FeatureFlags>(DEFAULT_FLAGS);

interface FeatureFlagProviderProps {
  flags: FeatureFlags;
  children: ReactNode;
}

export function FeatureFlagProvider({ flags, children }: FeatureFlagProviderProps) {
  return (
    <FeatureFlagContext.Provider value={flags}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlags(): FeatureFlags {
  return useContext(FeatureFlagContext);
}
