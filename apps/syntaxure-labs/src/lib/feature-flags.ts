'use server';

/**
 * Feature Flags
 * --------------
 * Server-side feature flag management via environment variables.
 * Replaces the old Firestore-based implementation.
 */

export interface FeatureFlags {
  prismEngineEnabled: boolean;
  prismEngineTeaser: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  prismEngineEnabled: false,
  prismEngineTeaser: true,
};

/**
 * Get current feature flags from environment variables.
 * Falls back to defaults if not configured.
 */
export async function getFeatureFlags(): Promise<FeatureFlags> {
  return {
    prismEngineEnabled:
      process.env.FEATURE_PRISM_ENGINE_ENABLED === 'true' ||
      DEFAULT_FLAGS.prismEngineEnabled,
    prismEngineTeaser:
      process.env.FEATURE_PRISM_ENGINE_TEASER !== 'false' ||
      DEFAULT_FLAGS.prismEngineTeaser,
  };
}

/**
 * Update feature flags is a no-op in env-var mode.
 * Flags must be updated via Vercel/Doppler environment variables.
 */
export async function updateFeatureFlags(
  _flags: Partial<FeatureFlags>
): Promise<{ success: boolean; error?: string }> {
  void _flags; // flags managed via env vars
  return {
    success: false,
    error: 'Feature flags are managed via environment variables. Deploy with updated FEATURE_* vars to change flags.',
  };
}
