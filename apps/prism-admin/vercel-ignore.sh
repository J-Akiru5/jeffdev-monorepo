#!/bin/bash

echo "=== VERCEL IGNORE BUILD STEP ==="
echo "Target: prism-admin"
echo "Current Branch: $VERCEL_GIT_COMMIT_REF"

# 1. Check if the current branch is 'main'
if [ "$VERCEL_GIT_COMMIT_REF" != "main" ]; then
  echo "🛑 Skipped: Build triggered on non-main branch ($VERCEL_GIT_COMMIT_REF)."
  exit 0;
fi

# 2. Check if there are changes in this app or its workspace dependencies using turbo-ignore
echo "Checking for changes in apps/prism-admin and its workspace dependencies..."
npx turbo-ignore
exit_code=$?

if [ $exit_code -eq 0 ]; then
  echo "🛑 Skipped: No changes detected in apps/prism-admin or its dependencies."
  exit 0;
else
  echo "✅ Proceeding: Changes detected in apps/prism-admin or its dependencies."
  exit 1;
fi
