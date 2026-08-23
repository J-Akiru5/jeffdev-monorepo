import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { pull } from "./pull.js";
import { saveProjectConfig } from "../rules/project-config.js";

function makeTmpDir(label: string): string {
  const dir = join(
    tmpdir(),
    `prism-pull-${label}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  mkdirSync(dir, { recursive: true });
  return dir;
}

const validRuleSet = {
  version: 1,
  rules: [
    {
      id: "styling/design-tokens",
      category: "styling",
      severity: "block",
      instruction: "use tokens",
      check: {
        type: "required_token",
        tokenSet: "colors",
        tokenMap: { "#06b6d4": "var(--brand-primary)" },
      },
    },
  ],
};

describe("pull", () => {
  const dirs: string[] = [];
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.PRISM_API_KEY;
    delete process.env.PRISM_API_URL;
  });

  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
    vi.unstubAllGlobals();
    process.env = { ...originalEnv };
  });

  it("warns and exits cleanly when no API key is available, without touching rules.json", async () => {
    const dir = makeTmpDir("no-key");
    dirs.push(dir);
    mkdirSync(join(dir, ".prism"), { recursive: true });
    writeFileSync(join(dir, ".prism", "rules.json"), "EXISTING");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await pull({ cwd: dir });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(readFileSync(join(dir, ".prism", "rules.json"), "utf8")).toBe("EXISTING");
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("writes .prism/rules.json on a successful pull and records lastPulled", async () => {
    const dir = makeTmpDir("success");
    dirs.push(dir);
    saveProjectConfig(
      {
        apiKey: "pk_live_test",
        activeProject: "storefront",
        projects: { storefront: { id: "11111111-1111-1111-1111-111111111111" } },
      },
      dir,
    );
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => validRuleSet,
    });
    vi.stubGlobal("fetch", fetchMock);

    await pull({ cwd: dir });

    const written = JSON.parse(readFileSync(join(dir, ".prism", "rules.json"), "utf8"));
    expect(written).toEqual(validRuleSet);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        "/api/v1/projects/11111111-1111-1111-1111-111111111111/rules/pass",
      ),
      expect.objectContaining({ headers: { "x-api-key": "pk_live_test" } }),
    );

    const config = JSON.parse(readFileSync(join(dir, ".prism", "config.json"), "utf8"));
    expect(config.projects.storefront.lastPulled).toBeDefined();
  });

  it("fails safe on a 401 and leaves an existing rules.json untouched", async () => {
    const dir = makeTmpDir("401");
    dirs.push(dir);
    mkdirSync(join(dir, ".prism"), { recursive: true });
    writeFileSync(join(dir, ".prism", "rules.json"), "EXISTING");
    saveProjectConfig(
      {
        apiKey: "pk_live_bad",
        activeProject: "storefront",
        projects: { storefront: { id: "11111111-1111-1111-1111-111111111111" } },
      },
      dir,
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: "Invalid API key" }),
      }),
    );
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await pull({ cwd: dir });

    expect(readFileSync(join(dir, ".prism", "rules.json"), "utf8")).toBe("EXISTING");
    expect(process.exitCode ?? 0).toBe(0);
    warnSpy.mockRestore();
  });

  it("fails safe on a network error and leaves an existing rules.json untouched", async () => {
    const dir = makeTmpDir("network-error");
    dirs.push(dir);
    mkdirSync(join(dir, ".prism"), { recursive: true });
    writeFileSync(join(dir, ".prism", "rules.json"), "EXISTING");
    saveProjectConfig(
      {
        apiKey: "pk_live_test",
        activeProject: "storefront",
        projects: { storefront: { id: "11111111-1111-1111-1111-111111111111" } },
      },
      dir,
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("getaddrinfo ENOTFOUND prism.syntaxure.dev")),
    );
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await pull({ cwd: dir });

    expect(readFileSync(join(dir, ".prism", "rules.json"), "utf8")).toBe("EXISTING");
    warnSpy.mockRestore();
  });

  it("fails safe on a malformed (schema-invalid) response and leaves rules.json untouched", async () => {
    const dir = makeTmpDir("malformed");
    dirs.push(dir);
    mkdirSync(join(dir, ".prism"), { recursive: true });
    writeFileSync(join(dir, ".prism", "rules.json"), "EXISTING");
    saveProjectConfig(
      {
        apiKey: "pk_live_test",
        activeProject: "storefront",
        projects: { storefront: { id: "11111111-1111-1111-1111-111111111111" } },
      },
      dir,
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ not: "a rule set" }),
      }),
    );
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await pull({ cwd: dir });

    expect(readFileSync(join(dir, ".prism", "rules.json"), "utf8")).toBe("EXISTING");
    warnSpy.mockRestore();
  });

  it("fails safe when the response body isn't JSON at all", async () => {
    const dir = makeTmpDir("not-json");
    dirs.push(dir);
    saveProjectConfig(
      {
        apiKey: "pk_live_test",
        activeProject: "storefront",
        projects: { storefront: { id: "11111111-1111-1111-1111-111111111111" } },
      },
      dir,
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError("Unexpected token < in JSON");
        },
      }),
    );
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await pull({ cwd: dir });

    expect(existsSync(join(dir, ".prism", "rules.json"))).toBe(false);
    warnSpy.mockRestore();
  });

  it("auto-picks the first project under --yes when none is configured yet", async () => {
    const dir = makeTmpDir("yes-autopick");
    dirs.push(dir);
    saveProjectConfig({ apiKey: "pk_live_test", projects: {} }, dir);

    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/v1/projects?")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            data: [
              { id: "aaa-1", slug: "storefront", name: "Storefront" },
              { id: "bbb-2", slug: "admin", name: "Admin" },
            ],
          }),
        });
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => validRuleSet });
    });
    vi.stubGlobal("fetch", fetchMock);

    await pull({ cwd: dir, yes: true });

    const config = JSON.parse(readFileSync(join(dir, ".prism", "config.json"), "utf8"));
    expect(config.activeProject).toBe("storefront");
    expect(readFileSync(join(dir, ".prism", "rules.json"), "utf8")).toContain("styling/design-tokens");
  });

  it("respects --project even when a different project is already active", async () => {
    const dir = makeTmpDir("explicit-project");
    dirs.push(dir);
    saveProjectConfig(
      {
        apiKey: "pk_live_test",
        activeProject: "storefront",
        projects: { storefront: { id: "aaa-1" } },
      },
      dir,
    );
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/v1/projects?")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: [{ id: "bbb-2", slug: "admin", name: "Admin" }] }),
        });
      }
      expect(url).toContain("/api/v1/projects/bbb-2/rules/pass");
      return Promise.resolve({ ok: true, status: 200, json: async () => validRuleSet });
    });
    vi.stubGlobal("fetch", fetchMock);

    await pull({ cwd: dir, project: "admin" });

    const config = JSON.parse(readFileSync(join(dir, ".prism", "config.json"), "utf8"));
    expect(config.activeProject).toBe("admin");
    expect(config.projects.storefront).toBeDefined(); // untouched, not dropped
  });
});
