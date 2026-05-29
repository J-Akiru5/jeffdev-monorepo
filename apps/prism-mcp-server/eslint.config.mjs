import { config } from "@repo/eslint-config/base";

export default [
  ...config,
  {
    ignores: [
      "src/lib/**/*.js",
      "src/lib/**/*.d.ts",
      "src/lib/**/*.d.ts.map"
    ]
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "turbo/no-undeclared-env-vars": "off"
    }
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: "off"
    }
  }
];
