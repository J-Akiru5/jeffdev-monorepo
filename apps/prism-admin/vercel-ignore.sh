#!/bin/bash

echo "=== VERCEL IGNORE BUILD STEP ==="
echo "Target: prism-admin"
echo "Current Branch: $VERCEL_GIT_COMMIT_REF"

# 1. Only deploy on main branch
if [ "$VERCEL_GIT_COMMIT_REF" != "main" ]; then
  echo "🛑 Skipped: Build triggered on non-main branch ($VERCEL_GIT_COMMIT_REF)."
  exit 0;
fi

# 2. Check if prism-admin or its workspace dependencies are affected using turbo's built-in filter
#    (replaces deprecated turbo-ignore package)
echo "Checking for changes in apps/prism-admin and its workspace dependencies..."

BASE="${VERCEL_GIT_PREVIOUS_DEPLOY_SHA:-HEAD^1}"

# Run turbo dry-run to detect changes; if turbo itself fails, proceed with build (fail-safe)
OUTPUT=$(npx -y turbo@^2.7.2 run build --filter="prism-admin...[${BASE}]" --dry=json 2>&1) || {
  echo "⚠️  Turbo check failed — proceeding with build to be safe."
  exit 1;
}

if echo "$OUTPUT" | grep -q '"prism-admin"'; then
  echo "✅ Proceeding: Changes detected in apps/prism-admin or its dependencies."
  exit 1;
else
  echo "🛑 Skipped: No changes detected in apps/prism-admin or its dependencies."
  exit 0;
fi
