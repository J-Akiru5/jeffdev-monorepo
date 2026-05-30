"use client";

import { use } from "react";
import { Sparkles } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * AI Skill Generator
 * Placeholder — feature coming soon.
 */
export default function GenerateSkillPage({ params }: Props) {
  const { slug } = use(params);

  return (
    <ComingSoon
      title="Generate Skill"
      description="Describe a workflow and our AI will document it into a step-by-step procedural guide for your agents."
      icon={Sparkles}
      backHref={`/projects/${slug}/skills`}
      backLabel="Back to Skills"
    />
  );
}
