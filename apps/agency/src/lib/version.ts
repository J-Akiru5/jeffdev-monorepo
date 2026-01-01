/**
 * Version Utility
 * ----------------
 * Smart versioning with semantic versioning + git hash.
 * Auto-detects environment: alpha (local/feature), beta (develop), stable (main)
 */

// Get version from package.json at build time
const packageVersion = process.env.npm_package_version || '2.0.0';

// Git info - populated at build time via next.config.ts
const gitCommitHash = process.env.NEXT_PUBLIC_GIT_COMMIT_SHA?.slice(0, 7) || 'dev';
const gitBranch = process.env.NEXT_PUBLIC_GIT_BRANCH || 'local';

type ReleaseStage = 'alpha' | 'beta' | 'stable';

/**
 * Determine release stage based on environment and branch
 */
function getReleaseStage(): ReleaseStage {
  // Production deployment (Vercel, etc.)
  if (process.env.VERCEL_ENV === 'production' || gitBranch === 'main') {
    return 'stable';
  }
  
  // Preview deployment or develop branch
  if (process.env.VERCEL_ENV === 'preview' || gitBranch === 'develop') {
    return 'beta';
  }
  
  // Local development or feature branches
  return 'alpha';
}

/**
 * Get full version string
 * Format: v{major}.{minor}.{patch}-{stage}.{hash}
 * Examples:
 *   - v2.0.0 (stable/production)
 *   - v2.0.0-beta.abc1234 (staging)
 *   - v2.0.0-alpha.abc1234 (development)
 */
export function getVersion(): string {
  const stage = getReleaseStage();
  
  if (stage === 'stable') {
    return `v${packageVersion}`;
  }
  
  return `v${packageVersion}-${stage}.${gitCommitHash}`;
}

/**
 * Get version metadata
 */
export function getVersionInfo() {
  return {
    version: getVersion(),
    packageVersion,
    gitCommitHash,
    gitBranch,
    stage: getReleaseStage(),
    environment: process.env.NODE_ENV,
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
  };
}

/**
 * Version display component data
 */
export function getVersionDisplay() {
  const info = getVersionInfo();
  
  return {
    version: info.version,
    stageBadge: {
      alpha: { label: 'ALPHA', className: 'bg-yellow-500/10 text-yellow-400' },
      beta: { label: 'BETA', className: 'bg-purple-500/10 text-purple-400' },
      stable: { label: 'STABLE', className: 'bg-emerald-500/10 text-emerald-400' },
    }[info.stage],
  };
}
