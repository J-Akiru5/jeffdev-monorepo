import { nextJsConfig } from "@repo/eslint-config/next-js";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,
  // Relax no-explicit-any to warning for Supabase type flexibility
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];
