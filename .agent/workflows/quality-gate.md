---
description: Quality check so we won't iterate.
---

name: JeffDev Quality Gate

on:
  push:
    branches: ["main"]
  pull_request:
    types: [opened, synchronize]

jobs:
  security-and-quality:
    name: Security & Quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci

      # 1. Syncpack: Ensure all apps use the same React version
      - name: Dependency Alignment
        run: npx syncpack list-mismatches

      # 2. Security Audit (The "Doppler/Sentry" Check)
      # Fails if "High" vulnerabilities are found
      - name: Security Scan
        run: npm audit --audit-level=high

      # 3. Turbo Build (Only builds changed apps)
      - name: Build & Lint
        run: npx turbo run build lint