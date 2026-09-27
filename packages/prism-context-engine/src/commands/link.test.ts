import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { existsSync, mkdirSync, readFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { link } from "./link.js";
import { saveProjectConfig } from "../rules/project-config.js";

function makeTmpDir(label: string): string {
  const dir = join(
    tmpdir(),
    `prism-link-${label}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe("link", () => {
  const dirs: string[] = [];
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.PRISM_API_URL;
    delete process.env.PRISM_TOKEN;
  });

  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
    vi.unstubAllGlobals();
    process.env = { ...originalEnv };
  });

  it("refuses to link when no session token exists", async () => {
    const dir = makeTmpDir("no-token");
    dirs.push(dir);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await link({ cwd: dir });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it("persists activeProject + projects entry using the Bearer token", async () => {
    const dir = makeTmpDir("success");
    dirs.push(dir);
    vi.stubEnv("PRISM_TOKEN", "sk_test_session_jwt");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          { id: "aaa-1", slug: "storefront", name: "Storefront" },
          { id: "bbb-2", slug: "dost-demo", name: "DOST Demo" },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await link({ cwd: dir, project: "dost-demo" });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/projects?limit=50"),
      expect.objectContaining({
        headers: { Authorization: "Bearer sk_test_session_jwt" },
      }),
    );
    const config = JSON.parse(readFileSync(join(dir, ".prism", "config.json"), "utf8"));
    expect(config.activeProject).toBe("dost-demo");
    expect(config.projects["dost-demo"].id).toBe("bbb-2");
  });

  it("keeps existing project entries when linking to a new project", async () => {
    const dir = makeTmpDir("merge");
    dirs.push(dir);
    saveProjectConfig(
      {
        activeProject: "storefront",
        projects: { storefront: { id: "aaa-1", lastPulled: "2026-09-01T00:00:00Z" } },
      },
      dir,
    );
    vi.stubEnv("PRISM_TOKEN", "sk_test_session_jwt");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          data: [{ id: "bbb-2", slug: "dost-demo", name: "DOST Demo" }],
        }),
      }),
    );

    await link({ cwd: dir, project: "dost-demo" });

    const config = JSON.parse(readFileSync(join(dir, ".prism", "config.json"), "utf8"));
    expect(config.activeProject).toBe("dost-demo");
    expect(config.projects.storefront).toBeDefined();
    expect(config.projects["dost-demo"].id).toBe("bbb-2");
  });

  it("fails safely on a project-list error and writes nothing", async () => {
    const dir = makeTmpDir("http-error");
    dirs.push(dir);
    vi.stubEnv("PRISM_TOKEN", "sk_test_session_jwt");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }),
    );
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await link({ cwd: dir, project: "dost-demo" });

    expect(existsSync(join(dir, ".prism", "config.json"))).toBe(false);
    expect(process.exitCode ?? 0).toBe(1);
    errSpy.mockRestore();
    process.exitCode = 0;
  });
});