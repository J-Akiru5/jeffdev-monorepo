import { auth } from "@clerk/nextjs/server";
import { getCollection, ObjectId } from "@jeffdev/db";
import { notFound } from "next/navigation";
import { RuleEditForm } from "./rule-edit-form";

interface Props {
  params: Promise<{ slug: string; ruleId: string }>;
}

/**
 * Rule Edit Page
 * Edit rule content with "Enhance with AI" feature.
 */
export default async function RuleEditPage({ params }: Props) {
  const { slug, ruleId } = await params;
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }

  // Fetch project
  const projectsCollection = await getCollection("projects");
  const project = await projectsCollection.findOne({ userId, slug });
  
  if (!project) {
    notFound();
  }

  // Fetch rule
  const rulesCollection = await getCollection("rules");
  const rule = await rulesCollection.findOne({ 
    _id: new ObjectId(ruleId),
    projectId: project._id.toString()
  });
  
  if (!rule) {
    notFound();
  }

  // Serialize rule for client component
  const serializedRule = {
    _id: rule._id.toString(),
    name: rule.name as string,
    category: rule.category as string || "general",
    priority: rule.priority as number || 50,
    content: rule.content as string || "",
    description: rule.description as string,
  };

  return <RuleEditForm rule={serializedRule} />;
}
