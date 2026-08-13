import type { GetSkillInput, ToolOutput } from "../types.js";
import { countTokensInText } from "../middleware/token-counter.js";

export type { GetSkillInput };

export async function handleGetSkill(
  input: GetSkillInput,
): Promise<ToolOutput> {
  const { skillId } = input;

  if (!skillId) {
    return {
      content: [{ type: "text", text: "Error: skillId is required." }],
      isError: true,
    };
  }

  try {
    const { getPrismDb, isValidId } = await import("@syntaxure-labs/db/prism");
    const db = getPrismDb();

    let doc: { name: string; description?: string | null; steps?: unknown; skillsContent?: string | null; content?: string } | null = null;
    let isSkillDoc = true;

    if (isValidId(skillId)) {
      const { data } = await db
        .from("prism_skills")
        .select("name, description, steps")
        .eq("id", skillId)
        .maybeSingle();
      doc = data;
    }

    if (!doc) {
      const { data } = await db
        .from("prism_skills")
        .select("name, description, steps")
        .ilike("name", `%${skillId}%`)
        .limit(1)
        .maybeSingle();
      doc = data;
    }

    if (!doc) {
      isSkillDoc = false;
      // Fallback to rules collection
      if (isValidId(skillId)) {
        const { data } = await db
          .from("prism_rules")
          .select("name, content, skillsContent:skills_content")
          .eq("id", skillId)
          .maybeSingle();
        doc = data;
      }

      if (!doc) {
        const { data } = await db
          .from("prism_rules")
          .select("name, content, skillsContent:skills_content")
          .eq("name", skillId)
          .maybeSingle();
        doc = data;
      }

      if (!doc) {
        const { data } = await db
          .from("prism_rules")
          .select("name, content, skillsContent:skills_content")
          .not("skills_content", "is", null)
          .ilike("name", `%${skillId}%`)
          .limit(1)
          .maybeSingle();
        doc = data;
      }
    }

    if (!doc) {
      return {
        content: [{ type: "text", text: `Skill "${skillId}" not found.` }],
      };
    }

    let formatted = "";

    if (isSkillDoc) {
      const stepsText = (
        (doc.steps as Array<{ title: string; content: string }>) || []
      )
        .map((step, i) => `### Step ${i + 1}: ${step.title}\n\n${step.content}`)
        .join("\n\n");
      const desc = doc.description ? `${doc.description}\n\n` : "";
      const fullText = `${desc}${stepsText}`;
      const tokenCount = countTokensInText(fullText);
      formatted = `# ${doc.name}\n\n${fullText}\n\n---\n**Tokens:** ${tokenCount}`;
    } else {
      const skillContent =
        (doc.skillsContent as string) || (doc.content as string);
      const tokenCount = countTokensInText(skillContent);
      formatted = `# ${doc.name}\n\n${skillContent}\n\n---\n**Tokens:** ${tokenCount}`;
    }

    return {
      content: [{ type: "text", text: formatted }],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error fetching skill: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
      isError: true,
    };
  }
}
