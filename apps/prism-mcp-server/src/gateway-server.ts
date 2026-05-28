/**
 * Universal Context Gateway — REST API Endpoint
 *
 * Exposes governance via HTTP for:
 * - CI/CD pipelines (GitHub Actions, GitLab CI)
 * - Custom agents (any language, any framework)
 * - Git hooks (pre-commit, pre-push)
 * - Webhook integrations
 *
 * Usage:
 *   POST /api/govern
 *   POST /api/validate
 *   POST /api/export
 *   GET  /api/health
 *
 * This is a standalone Express server that runs alongside the MCP server.
 */

import {
  processGovernanceRequest,
  type GatewayRequest,
  type Protocol,
} from "./lib/universal-gateway.js";

const PORT = parseInt(process.env.PRISM_GATEWAY_PORT || "3003", 10);

/**
 * Handle an incoming HTTP request.
 * This can be used with Express, Fastify, or any HTTP framework.
 */
export async function handleHttpRequest(
  method: string,
  path: string,
  body: Record<string, unknown>,
  headers: Record<string, string>,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const protocol: Protocol = "rest";

  try {
    switch (path) {
      case "/api/govern": {
        const request: GatewayRequest = {
          protocol,
          action: "govern",
          task: body.task as string,
          code: body.code as string | undefined,
          filePath: body.filePath as string | undefined,
          projectId: body.projectId as string | undefined,
          teamId: body.teamId as string | undefined,
          budget: body.budget as number | undefined,
          format: body.format as GatewayRequest["format"],
        };
        const response = await processGovernanceRequest(request);
        return { status: response.success ? 200 : 400, body: response as unknown as Record<string, unknown> };
      }

      case "/api/validate": {
        const request: GatewayRequest = {
          protocol,
          action: "validate",
          code: body.code as string,
          projectId: body.projectId as string | undefined,
        };
        const response = await processGovernanceRequest(request);
        return { status: response.success ? 200 : 400, body: response as unknown as Record<string, unknown> };
      }

      case "/api/export": {
        const request: GatewayRequest = {
          protocol,
          action: "export",
          projectId: body.projectId as string | undefined,
          teamId: body.teamId as string | undefined,
          format: body.format as GatewayRequest["format"],
        };
        const response = await processGovernanceRequest(request);
        return { status: 200, body: response as unknown as Record<string, unknown> };
      }

      case "/api/health": {
        const request: GatewayRequest = {
          protocol,
          action: "health",
          projectId: body.projectId as string | undefined,
        };
        const response = await processGovernanceRequest(request);
        return { status: 200, body: response as unknown as Record<string, unknown> };
      }

      default:
        return {
          status: 404,
          body: {
            error: "Not found",
            availableEndpoints: [
              "POST /api/govern — Get governance context for a task",
              "POST /api/validate — Validate code against rules",
              "POST /api/export — Export rules for a specific tool",
              "GET /api/health — Gateway health check",
            ],
          },
        };
    }
  } catch (error) {
    return {
      status: 500,
      body: {
        error: error instanceof Error ? error.message : "Internal server error",
      },
    };
  }
}

/**
 * Start the REST API server (standalone mode).
 * Run with: npx tsx src/gateway-server.ts
 */
export async function startGatewayServer(): Promise<void> {
  // Use Node.js built-in HTTP server (no extra dependencies)
  const http = await import("http");

  const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // Parse body for POST requests
    let body = "";
    for await (const chunk of req) {
      body += chunk;
    }

    let parsedBody: Record<string, unknown> = {};
    try {
      parsedBody = body ? JSON.parse(body) : {};
    } catch {
      // Empty body is fine for GET
    }

    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) headers[key] = Array.isArray(value) ? (value[0] || "") : value;
    }

    const path = (req.url || "/").split("?")[0] || "/";
    const result = await handleHttpRequest(req.method || "GET", path, parsedBody, headers);

    res.writeHead(result.status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result.body, null, 2));
  });

  server.listen(PORT, () => {
    console.error(`[prism-gateway] Universal Context Gateway listening on port ${PORT}`);
    console.error(`[prism-gateway] Endpoints:`);
    console.error(`  POST http://localhost:${PORT}/api/govern`);
    console.error(`  POST http://localhost:${PORT}/api/validate`);
    console.error(`  POST http://localhost:${PORT}/api/export`);
    console.error(`  GET  http://localhost:${PORT}/api/health`);
  });
}

// Start if run directly
const isMainModule = process.argv[1]?.includes("gateway-server");
if (isMainModule) {
  startGatewayServer().catch(console.error);
}
