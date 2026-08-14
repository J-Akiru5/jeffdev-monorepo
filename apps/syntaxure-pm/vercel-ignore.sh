#!/bin/bash

echo "=== VERCEL IGNORE BUILD STEP ==="
echo "Target: syntaxure-pm"
echo "Current Branch: $VERCEL_GIT_COMMIT_REF"

# 1. Only build on main (production) or staging (preview) — everything else
#    (develop, feature branches, etc.) is intentionally never deployed.
if [ "$VERCEL_GIT_COMMIT_REF" != "main" ] && [ "$VERCEL_GIT_COMMIT_REF" != "staging" ]; then
  echo "🛑 Skipped: Build triggered on non-deploy branch ($VERCEL_GIT_COMMIT_REF). Only main/staging deploy."
  exit 0;
fi

# 2. Check if syntaxure-pm or its workspace dependencies are affected using turbo's built-in filter
#    (replaces deprecated turbo-ignore package)
echo "Checking for changes in apps/syntaxure-pm and its workspace dependencies..."

if [ -z "$VERCEL_GIT_PREVIOUS_DEPLOY_SHA" ]; then
  echo "⚠️  VERCEL_GIT_PREVIOUS_DEPLOY_SHA is not set (e.g. first deployment) — proceeding with build to be safe."
  exit 1;
fi

BASE="$VERCEL_GIT_PREVIOUS_DEPLOY_SHA"

# Run turbo dry-run to detect changes; if turbo itself fails, proceed with build (fail-safe)
OUTPUT=$(npx -y turbo@^2.7.2 run build --filter="syntaxure-pm...[${BASE}]" --dry=json 2>&1) || {
  echo "⚠️  Turbo check failed — proceeding with build to be safe."
  exit 1;
}

if echo "$OUTPUT" | grep -q '"syntaxure-pm"'; then
  echo "✅ Proceeding: Changes detected in apps/syntaxure-pm or its dependencies."
  exit 1;
else
  echo "🛑 Skipped: No changes detected in apps/syntaxure-pm or its dependencies."
  exit 0;
fi
