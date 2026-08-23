import { NextRequest } from "next/server";
import { getPrismDb } from "@syntaxure-labs/db/prism";
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

  const rl = await checkRateLimit(`validate:${auth.userId}`, auth.tier);
  if (!rl.allowed)
    return errorResponse("Rate limit exceeded", 429, getRateLimitHeaders(rl));

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

  const db = getPrismDb();
  let query = db
    .from("prism_rules")
    .select("name, severity, content, pattern, priority")
    .eq("is_active", true)
    .not("pattern", "is", null);
  if (category) query = query.eq("category", category);
  if (auth.source === "api_key") query = query.eq("created_by", auth.userId);

  const { data: patternRulesData } = await query.order("priority", {
    ascending: true,
  });
  const patternRules = patternRulesData ?? [];

  for (const rule of patternRules) {
    if (!rule.pattern) continue;
    try {
      const regex = new RegExp(String(rule.pattern ?? ""), "gi");
      let match: RegExpExecArray | null;
      while ((match = regex.exec(code)) !== null) {
        const lineNumber = code.substring(0, match.index).split("\n").length;
        const snippet =
          match[0].length > 80 ? match[0].substring(0, 80) + "..." : match[0];
        violations.push({
          rule: String(rule.name ?? ""),
          severity: String(rule.severity || "warning"),
          message: `${String(rule.content ?? "")} (matched: "${snippet}")`,
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
    getRateLimitHeaders(rl),
  ).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}
