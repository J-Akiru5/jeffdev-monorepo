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

export async function handleGetSkill(input: GetSkillInput): Promise<GetSkillOutput> {
  const { skillId } = input;

  if (!skillId) {
    return {
      content: [{ type: "text", text: "Error: skillId is required." }],
      isError: true,
    };
  }

  try {
    const { getCollection } = await import("@jeffdev/db/cosmos");
    const rules = await getCollection("rules");

    let doc;

    if (ObjectId.isValid(skillId)) {
      doc = await rules.findOne({ _id: new ObjectId(skillId) });
    }

    if (!doc) {
      doc = await rules.findOne({ name: skillId });
    }

    if (!doc) {
      doc = await rules.findOne({ skillsContent: { $exists: true, $ne: null }, name: { $regex: skillId, $options: "i" } });
    }

    if (!doc) {
      return {
        content: [{ type: "text", text: `Skill "${skillId}" not found.` }],
        isError: true,
      };
    }

    const skillContent = (doc.skillsContent as string) || (doc.content as string);
    const tokenCount = countTokensInText(skillContent);

    const formatted = `# ${doc.name}\n\n${skillContent}\n\n---\n**Tokens:** ${tokenCount}`;

    return {
      content: [{ type: "text", text: formatted }],
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error fetching skill: ${error instanceof Error ? error.message : "Unknown error"}` }],
      isError: true,
    };
  }
}
