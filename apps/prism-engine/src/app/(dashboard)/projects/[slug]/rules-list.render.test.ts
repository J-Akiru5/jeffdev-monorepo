import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// next/link needs an app-router context; render it as a plain anchor,
// passing through href/title/etc so link semantics stay assertable.
vi.mock("next/link", async () => {
  const react = await import("react");
  return {
    default: (props: Record<string, unknown>) => {
      const { children, ...rest } = props;
      return react.createElement("a", rest, children as never);
    },
  };
});

import { RulesList, type RuleItem } from "./rules-list";

/** 26 rules shaped like the real microplastic-ai-b project: 11 styling /
 *  11 architecture / 2 security / 2 testing, 8 error + 18 warning. */
function makeRules(): RuleItem[] {
  const rules: RuleItem[] = [];
  let n = 0;
  const add = (category: string, count: number) => {
    for (let i = 0; i < count; i++) {
      n += 1;
      rules.push({
        id: `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`,
        name: `Rule ${String(n).padStart(2, "0")}`,
        category,
        severity: n <= 8 ? "error" : "warning",
        priority: 50,
        isActive: true,
        content: `Instruction for Rule ${String(n).padStart(2, "0")}`,
      });
    }
  };
  add("styling", 11);
  add("architecture", 11);
  add("security", 2);
  add("testing", 2);
  return rules;
}

describe("RulesList render (26-rule project)", () => {
  const rules = makeRules();
  const html = renderToStaticMarkup(
    React.createElement(RulesList, { rules, projectSlug: "microplastic-ai-b" }),
  );

  it("renders every one of the 26 rules (all reachable, none capped)", () => {
    for (const rule of rules) {
      expect(html).toContain(rule.name);
    }
    expect(html).toContain("26/26 active");
  });

  it("groups by category with per-category counts", () => {
    expect(html).toContain("styling");
    expect(html).toContain("architecture");
    expect(html).toContain("security");
    expect(html).toContain("testing");
    // 11/11/2/2 group counts (each rendered as its own span)
    expect(html).toContain(">11</span>");
    expect(html).toContain(">2</span>");
  });

  it("shows the search box and category filter", () => {
    expect(html).toContain("Search rules…");
    expect(html).toContain("All categories");
    expect(html).toContain('value="styling"');
    expect(html).toContain('value="architecture"');
    expect(html).toContain('value="security"');
    expect(html).toContain('value="testing"');
  });

  it("renders compact rows: severity chips present, instructions collapsed", () => {
    expect(html).toContain("error");
    expect(html).toContain("warning");
    // Rows start collapsed — full instruction text is not in the initial markup
    expect(html).not.toContain("Instruction for Rule 01");
    expect(html).not.toContain("Instruction for Rule 26");
  });

  it("links every rule to its view page and edit page", () => {
    for (const rule of rules) {
      expect(html).toContain(
        `href="/projects/microplastic-ai-b/rules/${rule.id}"`,
      );
      expect(html).toContain(
        `href="/projects/microplastic-ai-b/rules/${rule.id}/edit"`,
      );
    }
    expect(html).toContain('title="View rule"');
    expect(html).toContain('title="Edit rule"');
  });
});
