import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // e2e/ contains Playwright specs — they are not vitest tests.
    exclude: ["e2e/**", "node_modules/**", ".next/**"],
  },
});
