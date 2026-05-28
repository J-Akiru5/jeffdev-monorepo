/**
 * MCP Server Smoke Test
 *
 * Verifies all MCP endpoints are readable and functional.
 * Tests the server end-to-end without requiring a real IDE connection.
 *
 * Usage:
 *   npx tsx scripts/smoke-test.ts
 *   MONGODB_URI=mongodb://... npx tsx scripts/smoke-test.ts
 */

import { spawn, type ChildProcess } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const TIMEOUT_MS = 30_000;
const PASS = "\x1b[32m✓\x1b[0m";
const FAIL = "\x1b[31m✗\x1b[0m";
const SKIP = "\x1b[33m○\x1b[0m";
const INFO = "\x1b[36m→\x1b[0m";

interface TestResult {
  name: string;
  passed: boolean;
  skipped: boolean;
  duration: number;
  message?: string;
}

const results: TestResult[] = [];

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(msg: string): void {
  process.stderr.write(msg + "\n");
}

async function sendMcpRequest(
  server: ChildProcess,
  method: string,
  params?: Record<string, unknown>,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Request timeout")), 10_000);

    const onData = (data: Buffer) => {
      const lines = data.toString().split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          const msg = JSON.parse(line);
          if (msg.jsonrpc === "2.0" && (msg.result || msg.error)) {
            clearTimeout(timeout);
            server.stdout?.off("data", onData);
            if (msg.error) {
              reject(new Error(msg.error.message || "RPC error"));
            } else {
              resolve(msg.result);
            }
          }
        } catch {
          // Not JSON, skip
        }
      }
    };

    server.stdout?.on("data", onData);

    const request = JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method,
      params: params || {},
    });

    server.stdin?.write(request + "\n");
  });
}

async function testServerStarts(): Promise<TestResult> {
  const start = Date.now();
  const serverPath = join(process.cwd(), "dist", "index.js");

  if (!existsSync(serverPath)) {
    return {
      name: "Server binary exists",
      passed: false,
      skipped: true,
      duration: Date.now() - start,
      message: "dist/index.js not found. Run `pnpm run build` first.",
    };
  }

  return new Promise((resolve) => {
    const server = spawn("node", [serverPath], {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, NODE_ENV: "test" },
    });

    let stderrOutput = "";
    server.stderr?.on("data", (data) => {
      stderrOutput += data.toString();
    });

    const timeout = setTimeout(() => {
      server.kill();
      resolve({
        name: "Server starts successfully",
        passed: false,
        duration: Date.now() - start,
        message: "Server did not start within 10s",
      });
    }, 10_000);

    // Wait for "Server connected and ready" message
    server.stderr?.on("data", (data) => {
      if (data.toString().includes("Server connected and ready")) {
        clearTimeout(timeout);
        server.kill();
        resolve({
          name: "Server starts successfully",
          passed: true,
          duration: Date.now() - start,
          message: "Server connected and ready",
        });
      }
    });

    server.on("error", (err) => {
      clearTimeout(timeout);
      resolve({
        name: "Server starts successfully",
        passed: false,
        duration: Date.now() - start,
        message: err.message,
      });
    });
  });
}

async function testStdioTransport(): Promise<TestResult> {
  const start = Date.now();
  const serverPath = join(process.cwd(), "dist", "index.js");

  if (!existsSync(serverPath)) {
    return {
      name: "Stdio transport works",
      passed: false,
      skipped: true,
      duration: Date.now() - start,
      message: "dist/index.js not found",
    };
  }

  return new Promise((resolve) => {
    const server = spawn("node", [serverPath], {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, NODE_ENV: "test" },
    });

    let stderrOutput = "";
    server.stderr?.on("data", (data) => {
      stderrOutput += data.toString();
    });

    // Wait for server to be ready, then send initialize
    const readyCheck = setInterval(() => {
      if (stderrOutput.includes("Server connected and ready")) {
        clearInterval(readyCheck);

        // Send MCP initialize request
        const initRequest = JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: { name: "smoke-test", version: "1.0.0" },
          },
        });

        server.stdin?.write(initRequest + "\n");

        // Listen for response
        const timeout = setTimeout(() => {
          server.kill();
          resolve({
            name: "Stdio transport works",
            passed: false,
            duration: Date.now() - start,
            message: "No response to initialize request within 5s",
          });
        }, 5_000);

        server.stdout?.on("data", (data) => {
          const lines = data.toString().split("\n").filter(Boolean);
          for (const line of lines) {
            try {
              const msg = JSON.parse(line);
              if (msg.jsonrpc === "2.0" && msg.id === 1 && msg.result) {
                clearTimeout(timeout);
                server.kill();
                resolve({
                  name: "Stdio transport works",
                  passed: true,
                  duration: Date.now() - start,
                  message: `Server responded: ${msg.result.serverInfo?.name || "unknown"}`,
                });
              }
            } catch {
              // Not JSON
            }
          }
        });
      }
    }, 100);

    // Timeout for server startup
    setTimeout(() => {
      clearInterval(readyCheck);
      server.kill();
      resolve({
        name: "Stdio transport works",
        passed: false,
        duration: Date.now() - start,
        message: "Server did not start within 10s",
      });
    }, 10_000);
  });
}

async function testListTools(): Promise<TestResult> {
  const start = Date.now();
  const serverPath = join(process.cwd(), "dist", "index.js");

  if (!existsSync(serverPath)) {
    return {
      name: "List tools returns all 14 tools",
      passed: false,
      skipped: true,
      duration: Date.now() - start,
      message: "dist/index.js not found",
    };
  }

  return new Promise((resolve) => {
    const server = spawn("node", [serverPath], {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, NODE_ENV: "test" },
    });

    let stderrOutput = "";
    server.stderr?.on("data", (data) => {
      stderrOutput += data.toString();
    });

    const readyCheck = setInterval(() => {
      if (stderrOutput.includes("Server connected and ready")) {
        clearInterval(readyCheck);

        // Send tools/list request
        const request = JSON.stringify({
          jsonrpc: "2.0",
          id: 2,
          method: "tools/list",
          params: {},
        });

        server.stdin?.write(request + "\n");

        const timeout = setTimeout(() => {
          server.kill();
          resolve({
            name: "List tools returns all tools",
            passed: false,
            duration: Date.now() - start,
            message: "No response within 5s",
          });
        }, 5_000);

        server.stdout?.on("data", (data) => {
          const lines = data.toString().split("\n").filter(Boolean);
          for (const line of lines) {
            try {
              const msg = JSON.parse(line);
              if (msg.jsonrpc === "2.0" && msg.id === 2 && msg.result?.tools) {
                clearTimeout(timeout);
                server.kill();

                const tools = msg.result.tools;
                const toolNames = tools.map((t: { name: string }) => t.name);
                const expected = [
                  "get_architectural_rules", "validate_code_pattern", "prism_scan",
                  "get_skill", "list_skills", "prism_check", "prism_fix",
                  "repo_extract", "repo_scan", "prism_kitchen", "prism_intercept",
                  "prism_health", "prism_compile", "prism_orchestrate",
                ];

                const missing = expected.filter((t) => !toolNames.includes(t));
                const extra = toolNames.filter((t: string) => !expected.includes(t));

                resolve({
                  name: `List tools returns all ${expected.length} tools`,
                  passed: missing.length === 0,
                  duration: Date.now() - start,
                  message: missing.length > 0
                    ? `Missing: ${missing.join(", ")}`
                    : extra.length > 0
                      ? `Found ${tools.length} tools (extra: ${extra.join(", ")})`
                      : `Found all ${tools.length} tools`,
                });
              }
            } catch {
              // Not JSON
            }
          }
        });
      }
    }, 100);

    setTimeout(() => {
      clearInterval(readyCheck);
      server.kill();
      resolve({
        name: "List tools returns all tools",
        passed: false,
        duration: Date.now() - start,
        message: "Server did not start within 10s",
      });
    }, 10_000);
  });
}

async function testToolExecution(): Promise<TestResult> {
  const start = Date.now();
  const serverPath = join(process.cwd(), "dist", "index.js");

  if (!existsSync(serverPath)) {
    return {
      name: "prism_health tool executes",
      passed: false,
      skipped: true,
      duration: Date.now() - start,
      message: "dist/index.js not found",
    };
  }

  return new Promise((resolve) => {
    const server = spawn("node", [serverPath], {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, NODE_ENV: "test" },
    });

    let stderrOutput = "";
    server.stderr?.on("data", (data) => {
      stderrOutput += data.toString();
    });

    const readyCheck = setInterval(() => {
      if (stderrOutput.includes("Server connected and ready")) {
        clearInterval(readyCheck);

        // Call prism_health tool
        const request = JSON.stringify({
          jsonrpc: "2.0",
          id: 3,
          method: "tools/call",
          params: {
            name: "prism_health",
            arguments: { verbose: true },
          },
        });

        server.stdin?.write(request + "\n");

        const timeout = setTimeout(() => {
          server.kill();
          resolve({
            name: "prism_health tool executes",
            passed: false,
            duration: Date.now() - start,
            message: "No response within 5s",
          });
        }, 5_000);

        server.stdout?.on("data", (data) => {
          const lines = data.toString().split("\n").filter(Boolean);
          for (const line of lines) {
            try {
              const msg = JSON.parse(line);
              if (msg.jsonrpc === "2.0" && msg.id === 3 && msg.result) {
                clearTimeout(timeout);
                server.kill();

                const content = msg.result.content?.[0]?.text || "";
                const isConnected = content.includes("Connected") || content.includes("✅");

                resolve({
                  name: "prism_health tool executes",
                  passed: isConnected,
                  duration: Date.now() - start,
                  message: content.substring(0, 200),
                });
              }
            } catch {
              // Not JSON
            }
          }
        });
      }
    }, 100);

    setTimeout(() => {
      clearInterval(readyCheck);
      server.kill();
      resolve({
        name: "prism_health tool executes",
        passed: false,
        duration: Date.now() - start,
        message: "Server did not start within 10s",
      });
    }, 10_000);
  });
}

async function testCwdDetection(): Promise<TestResult> {
  const start = Date.now();
  const serverPath = join(process.cwd(), "dist", "index.js");

  if (!existsSync(serverPath)) {
    return {
      name: "CWD detection works",
      passed: false,
      skipped: true,
      duration: Date.now() - start,
      message: "dist/index.js not found",
    };
  }

  return new Promise((resolve) => {
    const server = spawn("node", [serverPath], {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, NODE_ENV: "test" },
    });

    let stderrOutput = "";
    server.stderr?.on("data", (data) => {
      stderrOutput += data.toString();
    });

    // Check if server detects the project
    const timeout = setTimeout(() => {
      server.kill();
      const detected = stderrOutput.includes("Detected project:");
      resolve({
        name: "CWD detection works",
        passed: detected,
        duration: Date.now() - start,
        message: detected
          ? "Server detected project from working directory"
          : "Server did not detect project (may be expected if no package.json)",
      });
    }, 8_000);

    server.on("error", () => {
      clearTimeout(timeout);
      resolve({
        name: "CWD detection works",
        passed: false,
        duration: Date.now() - start,
        message: "Server failed to start",
      });
    });
  });
}

async function testStartupWarnings(): Promise<TestResult> {
  const start = Date.now();
  const serverPath = join(process.cwd(), "dist", "index.js");

  if (!existsSync(serverPath)) {
    return {
      name: "Startup warnings for missing config",
      passed: false,
      skipped: true,
      duration: Date.now() - start,
      message: "dist/index.js not found",
    };
  }

  return new Promise((resolve) => {
    // Start without MONGODB_URI
    const server = spawn("node", [serverPath], {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, NODE_ENV: "test", MONGODB_URI: "", GOOGLE_GEMINI_API_KEY: "" },
    });

    let stderrOutput = "";
    server.stderr?.on("data", (data) => {
      stderrOutput += data.toString();
    });

    const timeout = setTimeout(() => {
      server.kill();
      const hasMongoWarning = stderrOutput.includes("MONGODB_URI not set");
      const hasAiWarning = stderrOutput.includes("No AI provider configured");
      resolve({
        name: "Startup warnings for missing config",
        passed: hasMongoWarning && hasAiWarning,
        duration: Date.now() - start,
        message: [
          hasMongoWarning ? "MONGODB_URI warning ✓" : "MONGODB_URI warning ✗",
          hasAiWarning ? "AI provider warning ✓" : "AI provider warning ✗",
        ].join(", "),
      });
    }, 8_000);

    server.on("error", () => {
      clearTimeout(timeout);
      resolve({
        name: "Startup warnings for missing config",
        passed: false,
        duration: Date.now() - start,
        message: "Server failed to start",
      });
    });
  });
}

// =============================================================================
// Main
// =============================================================================

async function main(): Promise<void> {
  log("");
  log("╔══════════════════════════════════════════════════════════╗");
  log("║           Prism MCP Server — Smoke Test                 ║");
  log("╚══════════════════════════════════════════════════════════╝");
  log("");

  const tests = [
    testServerStarts,
    testStdioTransport,
    testListTools,
    testToolExecution,
    testCwdDetection,
    testStartupWarnings,
  ];

  for (const test of tests) {
    log(`${INFO} Running: ${test.name || test.constructor.name}...`);
    try {
      const result = await test();
      results.push(result);
      const icon = result.skipped ? SKIP : result.passed ? PASS : FAIL;
      log(`  ${icon} ${result.name} (${result.duration}ms)${result.message ? ` — ${result.message}` : ""}`);
    } catch (err) {
      results.push({
        name: test.name || "unknown",
        passed: false,
        duration: 0,
        message: err instanceof Error ? err.message : "Unknown error",
      });
      log(`  ${FAIL} ${test.name} — ${err instanceof Error ? err.message : "Unknown error"}`);
    }
    log("");
  }

  // Summary
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed && !r.skipped).length;
  const skipped = results.filter((r) => r.skipped).length;

  log("╔══════════════════════════════════════════════════════════╗");
  log(`║  Results: ${passed} passed, ${failed} failed, ${skipped} skipped`.padEnd(57) + "║");
  log("╚══════════════════════════════════════════════════════════╝");

  if (failed > 0) {
    log("");
    log("Failed tests:");
    for (const r of results.filter((r) => !r.passed && !r.skipped)) {
      log(`  ${FAIL} ${r.name}: ${r.message || "unknown error"}`);
    }
  }

  process.exit(failed > 0 ? 1 : 0);
}

main();
