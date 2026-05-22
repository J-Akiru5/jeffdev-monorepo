import { config } from "@repo/eslint-config/base";

export default [
  ...config,
  {
    ignores: [
      "src/lib/**/*.js",
      "src/lib/**/*.d.ts",
      "src/lib/**/*.d.ts.map"
    ]
  }
];
