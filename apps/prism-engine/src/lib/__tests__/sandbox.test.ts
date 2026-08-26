import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawn, spawnSync } from "child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import {
  SandboxRejectedPatternError,
  SandboxRequestSchema,
  SandboxSpawnError,
  SandboxValidationError,
  collectUserPatterns,
  resolveCliEntry,
  runSandbox,
} from "../sandbox";

/**
 * Phase 4.5 boundary tests.
 *
 * Spawn-based cases run against the REAL built CLI (dist/index.js). They
 * are skipped when dist has not been built yet - run
 * `pnpm --filter @prism-engine/cli build` first. The timeout-kill case
 * proves the child actually receives SIGTERM (marker file) before being
 * SIGKILLed, and that the call returns well inside the kill window.
 */

const RULES_JSON = JSON.stringify({
  version: 1,
  rules: [
    {
      id: "styling/tokens",
      category: "styling",
      severity: "block",
      check: {
        type: "required_token",
        tokenSet: "t",
        tokenMap: { "#06b6d4": "var(--brand)" },
        message: "Use the token.",
      },
    },
    {
      id: "arch/naming",
      category: "architecture",
      severity: "warn",
      extensions: [".tsx"],
      check: { type: "naming_pattern", pattern: "^[A-Z]" },
    },
  ],
});

const FILES = [
  { path: "app/Bad.tsx", content: 'export const x = "#06b6d4";\n' },
];

function cliDistPath(): string {
  const entry = resolveCliEntry(); // .../bin/prism.js
  return join(entry, "..", "..", "dist", "index.js");
}

const DIST_READY = existsSync(cliDistPath());

describe("collectUserPatterns", () => {
  it("finds pattern + matchPattern anywhere in the envelope", () => {
    const env = {
      version: 1,
      rules: [
        {
          id: "a",
          check: { type: "forbidden_pattern", pattern: "(a+)+" },
        },
        {
          id: "b",
          check: {
            type: "file_placement",
            matchPattern: "^x",
            directory: "d",
          },
        },
      ],
    };
    expect(collectUserPatterns(env).sort()).toEqual(["(a+)+", "^x"]);
  });
});

describe("runSandbox - regex safety front door", () => {
  it("rejects a catastrophic nested-quantifier pattern BEFORE spawning", async () => {
    const evil = JSON.stringify({
      version: 1,
      rules: [
        {
          id: "evil/re",
          category: "security",
          check: { type: "forbidden_pattern", pattern: "^(a+)+$" },
        },
      ],
    });
    await expect(
      runSandbox(SandboxRequestSchema.parse({ rulesJson: evil, files: FILES })),
    ).rejects.toBeInstanceOf(SandboxRejectedPatternError);
  });

  it("includes the offending pattern and reasons in the rejection", async () => {
    const evil = JSON.stringify({
      version: 1,
      rules: [
        {
          id: "evil/re",
          category: "security",
          check: { type: "forbidden_pattern", pattern: "^(a+)+$" },
        },
      ],
    });
    try {
      await runSandbox(
        SandboxRequestSchema.parse({ rulesJson: evil, files: FILES }),
      );
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(SandboxRejectedPatternError);
      const e = err as SandboxRejectedPatternError;
      expect(e.pattern).toBe("^(a+)+$");
      expect(e.reasons.length).toBeGreaterThan(0);
    }
  });

  it("passes benign patterns through to evaluation", async () => {
    if (!DIST_READY) return; // spawn-based; requires built CLI
    const result = await runSandbox(
      SandboxRequestSchema.parse({ rulesJson: RULES_JSON, files: FILES }),
    );
    expect(result.ok).toBe(true);
  });
});

(DIST_READY ? describe : describe.skip)("runSandbox - subprocess contract", () => {
  it("evaluates via spawned child and preserves response shape", async () => {
    const result = await runSandbox(
      SandboxRequestSchema.parse({ rulesJson: RULES_JSON, files: FILES }),
      { timeoutMs: 10_000 },
    );
    expect(result.ok).toBe(true);
    expect(result.ruleCount).toBe(2);
    expect(result.filesScanned).toBe(1);
    expect(result.summary.blocks).toBeGreaterThanOrEqual(1);
    expect(result.findings[0]).toMatchObject({
      file: "app/Bad.tsx",
      ruleId: "styling/tokens",
      replacement: "var(--brand)",
    });
  });

  it("maps child INVALID_RULES to the legacy SandboxValidationError surface", async () => {
    const bad = JSON.stringify({ version: 1, rules: [{ id: "", category: "nope" }] });
    await expect(
      runSandbox(
        SandboxRequestSchema.parse({ rulesJson: bad, files: FILES }),
        { timeoutMs: 10_000 },
      ),
    ).rejects.toBeInstanceOf(SandboxValidationError);
  });
});

describe("timeout hard-kill PROOF", () => {
  let workDir: string;

  beforeAll(() => {
    workDir = mkdtempSync(join(tmpdir(), "p45-timeout-"));
  });
  afterAll(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  function writeStub(name: string, code: string): string {
    const p = join(workDir, name);
    writeFileSync(p, code);
    return p;
  }

  it("(setup sanity) stub entry resolves via PRISM_SANDBOX_CLI_ENTRY", () => {
    const stub = writeStub("stub-ok.mjs", 'process.stdout.write("{}");');
    process.env.PRISM_SANDBOX_CLI_ENTRY = stub;
    expect(resolveCliEntry()).toBe(stub);
  });

  it("hard timeout kills the child: pid no longer alive, caller gets TIMEOUT fast", async () => {
    const workDir = mkdtempSync(join(tmpdir(), "p45-kill-"));
    const pidFile = join(workDir, "child.pid");
    // Stub records its own pid immediately, then idles forever. On Windows
    // cross-process signals are uncatchable TerminateProcess, so the
    // platform-neutral proof of "actually killed" is pid death.
    const stub = writeStub(
      "stub-idle.mjs",
      'import { writeFileSync } from "fs";\n' +
        'writeFileSync(process.env.PID_FILE, String(process.pid));\n' +
        "setInterval(() => {}, 1000);\n",
    );
    process.env.PRISM_SANDBOX_CLI_ENTRY = stub;
    process.env.PID_FILE = pidFile;

    const startedAt = Date.now();
    let caught: unknown;
    try {
      await runSandbox(
        SandboxRequestSchema.parse({
          rulesJson: RULES_JSON,
          files: [{ path: "a.tsx", content: "export const y = 1;" }],
        }),
        { timeoutMs: 300 },
      );
      expect.unreachable("should have timed out");
    } catch (err) {
      caught = err;
    }
    const elapsed = Date.now() - startedAt;

    expect(caught).toBeInstanceOf(SandboxSpawnError);
    expect((caught as SandboxSpawnError).code).toBe("TIMEOUT");
    // Hard-kill semantics: SIGTERM at ~300ms + 1s grace, so well under 2s.
    expect(elapsed).toBeLessThan(2500);

    // THE PROOF: the child pid recorded at startup is dead.
    expect(existsSync(pidFile)).toBe(true);
    const childPid = Number(readFileSync(pidFile, "utf8").trim());
    expect(Number.isFinite(childPid)).toBe(true);
    let dead = false;
    try {
      process.kill(childPid, 0);
    } catch {
      dead = true; // ESRCH - process gone
    }
    expect(dead).toBe(true);
  }, 10_000);

  it("malformed stdout produces a clean MALFORMED_OUTPUT error", async () => {
    const stub = writeStub(
      "stub-garbage.mjs",
      'process.stdout.write("<html>not json</html>");',
    );
    process.env.PRISM_SANDBOX_CLI_ENTRY = stub;
    try {
      await expect(
        runSandbox(
          SandboxRequestSchema.parse({
            rulesJson: RULES_JSON,
            files: FILES.slice(0, 1),
          }),
          { timeoutMs: 5000 },
        ),
      ).rejects.toMatchObject({
        name: "SandboxSpawnError",
        code: "MALFORMED_OUTPUT",
      });
    } finally {
      delete process.env.PRISM_SANDBOX_CLI_ENTRY;
    }
  }, 15_000);
});

afterAll(() => {
  delete process.env.PRISM_SANDBOX_CLI_ENTRY;
});
