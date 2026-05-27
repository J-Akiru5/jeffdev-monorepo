import { nextJsConfig } from "@repo/eslint-config/next-js";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,
  // Relax no-explicit-any to warning for Supabase type flexibility
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow Next.js <style jsx> and <style jsx global> attributes
      "react/no-unknown-property": ["warn", { ignore: ["jsx", "global"] }],
    },
  },
];
