import type { ListSkillsInput, ToolOutput } from "../types.js";

export type { ListSkillsInput };

export async function handleListSkills(
  input: ListSkillsInput,
): Promise<ToolOutput> {
  const { projectId } = input;

  if (!projectId) {
    return {
      content: [{ type: "text", text: "Error: projectId is required." }],
      isError: true,
    };
  }

  try {
    const { getPrismDb } = await import("@syntaxure-labs/db/prism");
    const db = getPrismDb();

    interface SkillDoc {
      id: string;
      name: string;
      description?: string;
      category?: string;
      steps?: unknown[];
    }

    // Get from prism_skills
    const { data: projectSkills } = await db
      .from("prism_skills")
      .select("id, name, description, category, steps")
      .eq("project_id", projectId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    // Get legacy skills stored on prism_rules.skills_content
    const { data: legacySkills } = await db
      .from("prism_rules")
      .select("id, name")
      .eq("project_id", projectId)
      .eq("is_active", true)
      .not("skills_content", "is", null);

    const allProjectSkills = (projectSkills ?? []) as SkillDoc[];
    const allLegacySkills = (legacySkills ?? []) as SkillDoc[];

    if (allProjectSkills.length === 0 && allLegacySkills.length === 0) {
      return {
        content: [{ type: "text", text: "No skills found for this project." }],
      };
    }

    let outputText = "# Project Skills\n\n";

    if (allProjectSkills.length > 0) {
      outputText += "## Procedural Workflows\n\n";
      allProjectSkills.forEach((s) => {
        const stepCount = s.steps?.length || 0;
        outputText += `- **${s.name}** (ID: ${s.id})\n`;
        if (s.description) outputText += `  *${s.description}*\n`;
        outputText += `  *Steps: ${stepCount} | Category: ${s.category}*\n\n`;
      });
    }

    if (allLegacySkills.length > 0) {
      outputText += "## Legacy Skills (from Rules)\n\n";
      allLegacySkills.forEach((r) => {
        outputText += `- **${r.name}** (ID: ${r.id})\n`;
      });
    }

    outputText +=
      "---\n*Use the `get_skill` tool to read the full content of any skill by its ID or Name.*";

    return {
      content: [{ type: "text", text: outputText }],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error listing skills: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
      isError: true,
    };
  }
}
