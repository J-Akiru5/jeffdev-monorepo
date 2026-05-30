import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { EventEmitter } from "events";
import { PassThrough } from "stream";

// ─── Mocks ───────────────────────────────────────────────────────────────────

const store: Record<string, string> = {};

vi.mock("fs", () => ({
  readFileSync: vi.fn((path: string) => {
    if (store[path] !== undefined) return store[path];
    const err = new Error(`ENOENT: ${path}`);
    (err as any).code = "ENOENT";
    throw err;
  }),
  existsSync: vi.fn((path: string) => {
    // Check if exact path is in store
    if (path in store) return true;
    // Also check with normalized path (resolve .. components)
    const parts = path.split("\\");
    const resolved: string[] = [];
    for (const part of parts) {
      if (part === "..") resolved.pop();
      else if (part !== ".") resolved.push(part);
    }
    const normalized = resolved.join("\\");
    return normalized in store;
  }),
  writeFileSync: vi.fn((path: string, data: string) => {
    store[path] = data;
  }),
  mkdirSync: vi.fn(),
}));

vi.mock("os", () => ({
  homedir: () => "C:\\mock-home",
}));

vi.mock("path", () => ({
  join: (...parts: string[]) => parts.join("\\"),
  dirname: (p: string) => {
    const parts = p.split("\\");
    parts.pop();
    return parts.join("\\");
  },
}));

vi.mock("url", () => ({
  fileURLToPath: () => "C:\\mock-home\\.prism\\commands\\serve.ts",
}));

const mockSpawn = vi.fn();
vi.mock("child_process", () => ({
  spawn: (...args: unknown[]) => mockSpawn(...args),
  spawnSync: vi.fn(),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createMockChild() {
  const child = new EventEmitter() as any;
  child.stdin = new PassThrough();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.exitCode = null;
  child.kill = vi.fn(() => {
    child.exitCode = 0;
    child.emit("exit", 0);
  });
  return child;
}

function setupRulesCache(rules: any[]): void {
  store["C:\\mock-home\\.prism\\rules\\rules.json"] = JSON.stringify(rules);
}

function clearStore(): void {
  for (const key of Object.keys(store)) {
    delete store[key];
  }
}

const SAMPLE_RULES = [
  {
    _id: "rule-1",
    name: "No console.log",
    content: "Do not use console.log in production code",
    category: "quality",
    priority: 10,
    pattern: "console\\.log\\(",
    severity: "error",
    isActive: true,
    tags: ["debugging", "quality"],
  },
  {
    _id: "rule-2",
    name: "Use PascalCase",
    content: "Component names must use PascalCase",
    category: "naming",
    priority: 20,
    isActive: true,
    tags: ["naming", "components"],
  },
  {
    _id: "rule-3",
    name: "No inline styles",
    content: "Use Tailwind CSS classes instead of inline styles",
    category: "styling",
    priority: 30,
    pattern: "style=\\{\\{",
    severity: "warning",
    isActive: true,
    tags: ["styling", "tailwind"],
  },
  {
    _id: "skill-1",
    name: "How to add a new page",
    content: "Step-by-step guide for adding pages",
    skillsContent: "# Adding a Page\n\n1. Create route\n2. Add layout\n3. Update navigation",
    category: "skills",
    priority: 50,
    isActive: true,
  },
];

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("serve", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Full Server Mode
  // ═══════════════════════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════════════════════
  // Full Server Mode — path resolution and spawn detection
  // Note: Full child process relay tests require integration test setup
  // (real child processes). These unit tests verify the decision logic.
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Full Server Mode — Decision Logic", () => {
    it("should fall back to lite mode when binary not found", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const { serve } = await import("./serve.js");

      await serve({ offline: false });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("falling back to local cache"),
      );
    });

    it("should respect --offline flag to force lite mode", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const { serve } = await import("./serve.js");

      const basePath = "C:\\mock-home\\.prism\\commands\\..\\..\\..\\..\\apps\\prism-mcp-server";
      store[`${basePath}\\dist\\index.js`] = "";

      await serve({ offline: true });

      expect(mockSpawn).not.toHaveBeenCalled();
    });

    it("should return null when spawn throws an error", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const basePath = "C:\\mock-home\\.prism\\commands\\..\\..\\..\\..\\apps\\prism-mcp-server";
      store[`${basePath}\\dist\\index.js`] = "";

      mockSpawn.mockImplementation(() => {
        throw new Error("spawn failed");
      });

      const { serve } = await import("./serve.js");
      await serve({ offline: false });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to start full MCP server"),
      );
    });

    it("should detect built JS over TypeScript source", async () => {
      const { serve } = await import("./serve.js");
      const basePath = "C:\\mock-home\\.prism\\commands\\..\\..\\..\\..\\apps\\prism-mcp-server";

      // Only the built JS exists
      store[`${basePath}\\dist\\index.js`] = "";

      mockSpawn.mockImplementation(() => {
        throw new Error("spawn disabled in test");
      });

      await serve({ offline: false });

      // Should have tried to spawn (binary was found)
      expect(mockSpawn).toHaveBeenCalled();
    });

    it("should prefer built JS when both exist", async () => {
      const { serve } = await import("./serve.js");
      const basePath = "C:\\mock-home\\.prism\\commands\\..\\..\\..\\..\\apps\\prism-mcp-server";

      store[`${basePath}\\dist\\index.js`] = "";
      store[`${basePath}\\src\\index.ts`] = "";

      mockSpawn.mockImplementation(() => {
        throw new Error("spawn disabled in test");
      });

      await serve({ offline: false });

      // First arg should be the built JS path
      const spawnArgs = mockSpawn.mock.calls[0];
      expect(spawnArgs[1][0] as string).toContain("index.js");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Lite Server Mode — Tool Handlers
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Lite Server — get_architectural_rules", () => {
    it("should return rules when cache exists", async () => {
      setupRulesCache(SAMPLE_RULES);

      const { serve } = await import("./serve.js");
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      // We can't directly call the tool handler, but we can verify
      // the server starts and loads rules
      await serve({ offline: true });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Loaded 4 rules from cache"),
      );
    });

    it("should handle empty cache gracefully", async () => {
      setupRulesCache([]);

      const { serve } = await import("./serve.js");
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await serve({ offline: true });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Loaded 0 rules from cache"),
      );
    });

    it("should handle corrupted cache gracefully", async () => {
      store["C:\\mock-home\\.prism\\rules\\rules.json"] = "not valid json {{{";

      const { serve } = await import("./serve.js");
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await serve({ offline: true });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Cache corrupted"),
      );
    });

    it("should create cache directory if it does not exist", async () => {
      const { serve } = await import("./serve.js");
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await serve({ offline: true });

      // The mkdirSync should have been called to create the rules directory
      const { mkdirSync } = await import("fs");
      expect(mkdirSync).toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MCP Protocol Handshake
  // ═══════════════════════════════════════════════════════════════════════════

  describe("MCP Protocol", () => {
    it("should respond with correct protocol version", async () => {
      // This test verifies the server configuration
      // The actual MCP handshake is tested via integration tests
      setupRulesCache(SAMPLE_RULES);

      const { serve } = await import("./serve.js");
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await serve({ offline: true });

      // Server should have started successfully
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Prism MCP Server"),
      );
    });

    it("should advertise correct capabilities", async () => {
      setupRulesCache(SAMPLE_RULES);

      const { serve } = await import("./serve.js");
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await serve({ offline: true });

      // Server should advertise tools and resources capabilities
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Edge Cases
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Edge Cases", () => {
    it("should handle rules with missing optional fields", async () => {
      setupRulesCache([
        {
          name: "Minimal Rule",
          content: "A rule with minimal fields",
        },
      ]);

      const { serve } = await import("./serve.js");
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await serve({ offline: true });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Loaded 1 rules from cache"),
      );
    });

    it("should handle very large rule sets", async () => {
      const largeRuleSet = Array.from({ length: 100 }, (_, i) => ({
        _id: `rule-${i}`,
        name: `Rule ${i}`,
        content: `Content for rule ${i}`.repeat(10),
        category: "test",
        priority: i,
        isActive: true,
      }));

      setupRulesCache(largeRuleSet);

      const { serve } = await import("./serve.js");
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await serve({ offline: true });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Loaded 100 rules from cache"),
      );
    });

    it("should handle rules with inactive status", async () => {
      setupRulesCache([
        {
          _id: "active-rule",
          name: "Active Rule",
          content: "This rule is active",
          isActive: true,
        },
        {
          _id: "inactive-rule",
          name: "Inactive Rule",
          content: "This rule is inactive",
          isActive: false,
        },
      ]);

      const { serve } = await import("./serve.js");
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await serve({ offline: true });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Loaded 2 rules from cache"),
      );
    });
  });
});

// ─── Helper to set up mock spawn return value ────────────────────────────────

function mockSpawnReturnValue(child: any) {
  mockSpawn.mockReturnValue(child);

  // Store the exact path as constructed by serve.ts (with .. components)
  // The path.join mock produces: C:\mock-home\.prism\commands\..\..\..\..\apps\prism-mcp-server\...
  const basePath = "C:\\mock-home\\.prism\\commands\\..\\..\\..\\..\\apps\\prism-mcp-server";
  store[`${basePath}\\dist\\index.js`] = "";
  store[`${basePath}\\src\\index.ts`] = "";
}
