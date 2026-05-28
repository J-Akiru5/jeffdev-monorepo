"use client";

/**
 * @component FeatureFlagProvider
 * @description Centralized feature flag context for client components.
 * Flags are fetched server-side and passed to this provider.
 * Any app can use this by wrapping its layout with the provider and
 * passing flags fetched from environment variables or a database.
 *
 * @example
 * // Server component layout:
 * import { FeatureFlagProvider, type FeatureFlags } from "@syntaxure/ui";
 * const flags: FeatureFlags = {
 *   myFeature: process.env.FEATURE_MY_FEATURE === "true",
 * };
 *
 * export default function RootLayout({ children }) {
 *   return <FeatureFlagProvider flags={flags}>{children}</FeatureFlagProvider>;
 * }
 *
 * // Client component:
 * import { useFeatureFlag } from "@syntaxure/ui";
 * if (useFeatureFlag("myFeature")) { ... }
 */

import { createContext, useContext, createElement, type ReactNode } from "react";

/** Generic feature flags record - each app defines its own flag keys */
export type FeatureFlags = Record<string, boolean>;

const FeatureFlagContext = createContext<FeatureFlags>({});

interface FeatureFlagProviderProps {
  /** Map of feature flag name to boolean */
  flags: FeatureFlags;
  children: ReactNode;
}

export function FeatureFlagProvider({
  flags,
  children,
}: FeatureFlagProviderProps) {
  return createElement(
    FeatureFlagContext.Provider,
    { value: flags },
    children,
  );
}

/**
 * Hook to check if a specific feature flag is enabled.
 * Returns false if the flag is not defined.
 */
export function useFeatureFlag(name: string): boolean {
  const flags = useContext(FeatureFlagContext);
  return flags[name] === true;
}

/**
 * Hook to get all feature flags.
 */
export function useFeatureFlags(): FeatureFlags {
  return useContext(FeatureFlagContext);
}
