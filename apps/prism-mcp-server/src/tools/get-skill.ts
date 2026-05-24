import { ObjectId } from "mongodb";
import { countTokensInText } from "../middleware/token-counter.js";

export interface GetSkillInput {
  skillId: string;
  projectId?: string;
}

export interface GetSkillOutput {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

export async function handleGetSkill(
  input: GetSkillInput,
): Promise<GetSkillOutput> {
  const { skillId } = input;

  if (!skillId) {
    return {
      content: [{ type: "text", text: "Error: skillId is required." }],
      isError: true,
    };
  }

  try {
    const { getCollection } = await import("@jeffdev/db/cosmos");
    const skills = await getCollection("skills");
    const rules = await getCollection("rules");

    let doc;
    let isSkillDoc = true;

    if (ObjectId.isValid(skillId)) {
      doc = await skills.findOne({ _id: new ObjectId(skillId) });
    }

    if (!doc) {
      doc = await skills.findOne({ name: { $regex: skillId, $options: "i" } });
    }

    if (!doc) {
      isSkillDoc = false;
      // Fallback to rules collection
      if (ObjectId.isValid(skillId)) {
        doc = await rules.findOne({ _id: new ObjectId(skillId) });
      }

      if (!doc) {
        doc = await rules.findOne({ name: skillId });
      }

      if (!doc) {
        doc = await rules.findOne({
          skillsContent: { $exists: true, $ne: null },
          name: { $regex: skillId, $options: "i" },
        });
      }
    }

    if (!doc) {
      return {
        content: [{ type: "text", text: `Skill "${skillId}" not found.` }],
        isError: true,
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
