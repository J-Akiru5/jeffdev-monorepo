import { describe, it, expect, beforeEach, vi } from "vitest";

const store: Record<string, string> = {};

vi.mock("fs", () => ({
  readFileSync: vi.fn((path: string) => {
    if (store[path] !== undefined) return store[path];
    const err = new Error(`ENOENT: ${path}`);
    (err as any).code = "ENOENT";
    throw err;
  }),
  existsSync: vi.fn((path: string) => path in store),
  mkdirSync: vi.fn(),
}));

vi.mock("os", () => ({
  homedir: () => "C:\\mock-home",
}));

vi.mock("path", () => ({
  join: (...parts: string[]) => parts.join("\\"),
}));

import { kitchenAnalyze, kitchenPreview, kitchenTrim, kitchenHistory, kitchenOptimize } from "./kitchen.js";

const MOCK_RULES = `# Prism Rules

**Color Usage**
Use the primary color palette for all UI components.

**Typography**
Use Inter font family for all text.

**Spacing**
Use 4px grid system for all spacing.

**API Routes**
Validate all API route inputs with Zod.

**Component Naming**
Use PascalCase for component names.`;

const MOCK_SKILLS = `# Skills

**Styling a Button**
How to style buttons using the design system.

**Adding a Page**
Step-by-step guide to create new pages.`;

function setupFiles(rules: string, skills: string): void {
  store["C:\\mock-home\\.prism\\rules.md"] = rules;
  store["C:\\mock-home\\.prism\\skills.md"] = skills;
}

function clearStore(): void {
  Object.keys(store).forEach((k) => delete store[k]);
}

describe("kitchenAnalyze", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearStore();
  });

  it("should show warning when no rules exist", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await kitchenAnalyze({ task: "test" });
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("No local rules found"));
    logSpy.mockRestore();
  });

  it("should analyze rules when files exist", async () => {
    setupFiles(MOCK_RULES, MOCK_SKILLS);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await kitchenAnalyze({ task: "button component" });
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Sections"));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Keep"));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Tokens"));
    logSpy.mockRestore();
  });

  it("should output JSON with --json flag", async () => {
    setupFiles(MOCK_RULES, MOCK_SKILLS);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await kitchenAnalyze({ task: "button", json: true });
    const jsonCall = logSpy.mock.calls.find((c) => typeof c[0] === "string" && c[0].includes("task"));
    expect(jsonCall).toBeTruthy();
    if (jsonCall) {
      const parsed = JSON.parse(jsonCall[0]);
      expect(parsed).toHaveProperty("task", "button");
      expect(parsed).toHaveProperty("totalSections");
      expect(parsed).toHaveProperty("totalTokens");
    }
    logSpy.mockRestore();
  });
});

describe("kitchenPreview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearStore();
  });

  it("should show warning when no rules exist", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await kitchenPreview({});
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("No local rules found"));
    logSpy.mockRestore();
  });

  it("should preview rules when files exist", async () => {
    setupFiles(MOCK_RULES, MOCK_SKILLS);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await kitchenPreview({});
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Rules"));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Skills"));
    logSpy.mockRestore();
  });
});

describe("kitchenTrim", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearStore();
  });

  it("should show warning when no rules exist", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await kitchenTrim({ budget: 1000 });
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("No local rules found"));
    logSpy.mockRestore();
  });

  it("should trim rules to budget", async () => {
    setupFiles(MOCK_RULES, "");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await kitchenTrim({ budget: 200 });
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Budget"));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("After"));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Removed"));
    logSpy.mockRestore();
  });
});

describe("kitchenHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearStore();
  });

  it("should show message when no history exists", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await kitchenHistory({});
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("No kitchen sessions"));
    logSpy.mockRestore();
  });
});

describe("kitchenOptimize", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearStore();
  });

  it("should show message when no telemetry exists", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await kitchenOptimize({});
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("No telemetry"));
    logSpy.mockRestore();
  });
});
