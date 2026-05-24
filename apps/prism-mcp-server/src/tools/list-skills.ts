export interface ListSkillsInput {
  projectId: string;
}

export interface ListSkillsOutput {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

export async function handleListSkills(
  input: ListSkillsInput,
): Promise<ListSkillsOutput> {
  const { projectId } = input;

  if (!projectId) {
    return {
      content: [{ type: "text", text: "Error: projectId is required." }],
      isError: true,
    };
  }

  try {
    const { getCollection } = await import("@jeffdev/db/cosmos");
    const skills = await getCollection("skills");
    const rules = await getCollection("rules");

    interface SkillDoc {
      _id: { toString(): string };
      name: string;
      description?: string;
      category?: string;
      steps?: unknown[];
    }

    // Get from skills collection
    const projectSkills = (await skills
      .find({ projectId, isActive: true })
      .sort({ createdAt: -1 })
      .toArray()) as unknown as SkillDoc[];

    // Get legacy skills from rules collection
    const legacySkills = (await rules
      .find({
        projectId,
        isActive: true,
        skillsContent: { $exists: true, $ne: null },
      })
      .toArray()) as unknown as SkillDoc[];

    if (projectSkills.length === 0 && legacySkills.length === 0) {
      return {
        content: [{ type: "text", text: "No skills found for this project." }],
      };
    }

    let outputText = "# Project Skills\n\n";

    if (projectSkills.length > 0) {
      outputText += "## Procedural Workflows\n\n";
      projectSkills.forEach((s) => {
        const stepCount = s.steps?.length || 0;
        outputText += `- **${s.name}** (ID: ${s._id.toString()})\n`;
        if (s.description) outputText += `  *${s.description}*\n`;
        outputText += `  *Steps: ${stepCount} | Category: ${s.category}*\n\n`;
      });
    }

    if (legacySkills.length > 0) {
      outputText += "## Legacy Skills (from Rules)\n\n";
      legacySkills.forEach((r) => {
        outputText += `- **${r.name}** (ID: ${r._id.toString()})\n`;
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
