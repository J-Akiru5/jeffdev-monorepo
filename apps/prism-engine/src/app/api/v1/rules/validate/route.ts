import { NextRequest } from "next/server";
import { getCollection } from "@jeffdev/db/cosmos";
import { z } from "zod";
import { authenticate, errorResponse, successResponse } from "@/lib/api-auth";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

const ValidateSchema = z.object({
  code: z.string().min(1),
  context: z.string().optional(),
  category: z.string().optional(),
  projectId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const rl = checkRateLimit(`validate:${auth.userId}`, auth.tier);
  if (!rl.allowed) return errorResponse("Rate limit exceeded", 429);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const parsed = ValidateSchema.safeParse(body);
  if (!parsed.success)
    return errorResponse(
      parsed.error.issues.map((e) => e.message).join(", "),
      422,
    );

  const { code, context, category } = parsed.data;
  const violations: Array<{
    rule: string;
    severity: string;
    message: string;
    line?: number;
  }> = [];

  const rules = await getCollection("rules");
  const query: Record<string, unknown> = {
    isActive: true,
    pattern: { $exists: true, $ne: null },
  };
  if (category) query.category = category;
  if (auth.source === "api_key") query.createdBy = auth.userId;

  const patternRules = await rules.find(query).sort({ priority: 1 }).toArray();

  for (const rule of patternRules) {
    if (!rule.pattern) continue;
    try {
      const regex = new RegExp(rule.pattern as string, "gi");
      let match: RegExpExecArray | null;
      while ((match = regex.exec(code)) !== null) {
        const lineNumber = code.substring(0, match.index).split("\n").length;
        const snippet =
          match[0].length > 80 ? match[0].substring(0, 80) + "..." : match[0];
        violations.push({
          rule: rule.name as string,
          severity: (rule.severity as string) || "warning",
          message: `${rule.content as string} (matched: "${snippet}")`,
          line: lineNumber,
        });
      }
    } catch {
      /* skip invalid regex */
    }
  }

  if (patternRules.length === 0) {
    if (code.includes("../../apps/") || code.includes("../apps/")) {
      violations.push({
        rule: "Cross-App Import Detected",
        severity: "error",
        message:
          "Never import from `../../apps/*`. Use shared packages like `@repo/*` instead.",
      });
    }
    if (code.includes("style={{") || code.includes("style:")) {
      violations.push({
        rule: "Inline Styles Detected",
        severity: "warning",
        message: "Use Tailwind CSS classes instead of inline styles.",
      });
    }
  }

  const response = successResponse({
    violations,
    count: violations.length,
    context,
  });
  Object.entries(
    getRateLimitHeaders(`validate:${auth.userId}`, auth.tier),
  ).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}
