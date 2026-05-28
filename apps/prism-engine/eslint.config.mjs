import { nextJsConfig } from "@repo/eslint-config/next-js";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,
  {
    rules: {
      // Allow Next.js <style jsx> and <style jsx global> attributes
      "react/no-unknown-property": ["warn", { ignore: ["jsx", "global"] }],
    },
  },
];
