import { describe, it, expect, beforeEach } from "vitest";
import { getConfig, resolveFormat, resolveMaxTokens, overridePlatform } from "./platform-formatter.js";
import { setCurrentClient } from "./client-detector.js";

describe("platform-formatter", () => {
  beforeEach(() => {
    overridePlatform(null);
    setCurrentClient({ name: "unknown", version: "0.0.0" });
  });

  describe("getConfig", () => {
    it("returns vscode config with full metadata", () => {
      setCurrentClient({ name: "Visual Studio Code", version: "1.96" });
      const config = getConfig();
      expect(config.defaultFormat).toBe("markdown");
      expect(config.includeMetadata).toBe(true);
      expect(config.includeSkills).toBe(true);
    });

    it("returns cursor config with compact json", () => {
      setCurrentClient({ name: "Cursor", version: "1.0" });
      const config = getConfig();
      expect(config.defaultFormat).toBe("json");
      expect(config.includeMetadata).toBe(false);
      expect(config.includeSkills).toBe(false);
      expect(config.maxTokens).toBe(2000);
    });

    it("returns claude config with minimal info", () => {
      setCurrentClient({ name: "Claude", version: "1.0" });
      const config = getConfig();
      expect(config.defaultFormat).toBe("markdown");
      expect(config.includeMetadata).toBe(false);
      expect(config.includeSkills).toBe(false);
      expect(config.maxTokens).toBe(1500);
    });

    it("returns cline config with structured json", () => {
      setCurrentClient({ name: "Cline", version: "1.0" });
      const config = getConfig();
      expect(config.defaultFormat).toBe("json");
      expect(config.includeMetadata).toBe(true);
      expect(config.includeSkills).toBe(true);
    });

    it("returns windsurf config with metadata", () => {
      setCurrentClient({ name: "Windsurf", version: "1.0" });
      const config = getConfig();
      expect(config.defaultFormat).toBe("markdown");
      expect(config.includeMetadata).toBe(true);
      expect(config.includeSkills).toBe(true);
    });

    it("returns github-copilot config with compact response", () => {
      setCurrentClient({ name: "GitHub Copilot", version: "1.0" });
      const config = getConfig();
      expect(config.defaultFormat).toBe("markdown");
      expect(config.includeMetadata).toBe(false);
      expect(config.includeSkills).toBe(false);
      expect(config.maxTokens).toBe(1000);
    });

    it("respects overridePlatform", () => {
      overridePlatform("cursor");
      const config = getConfig();
      expect(config.defaultFormat).toBe("json");
      expect(config.maxTokens).toBe(2000);
    });
  });

  describe("resolveFormat", () => {
    it("uses requested format when provided", () => {
      setCurrentClient({ name: "vscode", version: "1" });
      expect(resolveFormat("json")).toBe("json");
    });

    it("falls back to platform default when not requested", () => {
      setCurrentClient({ name: "Cursor", version: "1" });
      expect(resolveFormat(undefined)).toBe("json");

      setCurrentClient({ name: "vscode", version: "1" });
      expect(resolveFormat(undefined)).toBe("markdown");
    });
  });

  describe("resolveMaxTokens", () => {
    it("uses platform maxTokens when lower than requested", () => {
      setCurrentClient({ name: "Cursor", version: "1" });
      expect(resolveMaxTokens(5000)).toBe(2000); // cursor caps at 2000
    });

    it("uses requested maxTokens when under platform limit", () => {
      setCurrentClient({ name: "Cursor", version: "1" });
      expect(resolveMaxTokens(1000)).toBe(1000);
    });

    it("passes through when platform has no limit", () => {
      setCurrentClient({ name: "vscode", version: "1" });
      expect(resolveMaxTokens(5000)).toBe(5000);
    });
  });
});
