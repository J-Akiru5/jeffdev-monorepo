import { describe, it, expect, afterEach } from "vitest";
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { loadProjectConfig, saveProjectConfig } from "./project-config.js";

function makeTmpDir(label: string): string {
  const dir = join(
    tmpdir(),
    `prism-project-config-${label}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe("project-config", () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  it("returns an empty projects map when .prism/config.json doesn't exist", () => {
    const dir = makeTmpDir("missing");
    dirs.push(dir);
    expect(loadProjectConfig(dir)).toEqual({ projects: {} });
  });

  it("degrades to an empty config on corrupt JSON instead of throwing", () => {
    const dir = makeTmpDir("corrupt");
    dirs.push(dir);
    mkdirSync(join(dir, ".prism"), { recursive: true });
    writeFileSync(join(dir, ".prism", "config.json"), "{ nope");
    expect(() => loadProjectConfig(dir)).not.toThrow();
    expect(loadProjectConfig(dir)).toEqual({ projects: {} });
  });

  it("round-trips a config with multiple projects and preserves activeProject", () => {
    const dir = makeTmpDir("roundtrip");
    dirs.push(dir);
    saveProjectConfig(
      {
        apiKey: "pk_live_abc",
        activeProject: "storefront",
        projects: {
          storefront: { id: "11111111-1111-1111-1111-111111111111", lastPulled: "2026-08-01T00:00:00.000Z" },
          admin: { id: "22222222-2222-2222-2222-222222222222" },
        },
      },
      dir,
    );
    const loaded = loadProjectConfig(dir);
    expect(loaded.activeProject).toBe("storefront");
    expect(Object.keys(loaded.projects)).toHaveLength(2);
    expect(loaded.projects.admin!.lastPulled).toBeUndefined();
  });

  it("writes atomically — no partial file left behind under normal operation", () => {
    const dir = makeTmpDir("atomic");
    dirs.push(dir);
    saveProjectConfig({ projects: { a: { id: "x" } } }, dir);
    const files = readdirSync(join(dir, ".prism"));
    expect(files).toEqual(["config.json"]);
  });
});
