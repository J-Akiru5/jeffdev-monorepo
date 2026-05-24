"use client";

import Link from "next/link";
import { use, useActionState } from "react";
import {
  ArrowLeft,
  Layers,
  Code,
  Paintbrush,
  Shield,
  PlusCircle,
} from "lucide-react";
import { GlassPanel, Button } from "@syntaxure/ui";
import { ruleTemplates } from "@/data/rule-templates";
import { installTemplate, type InstallTemplateState } from "./actions";

interface Props {
  params: Promise<{ slug: string }>;
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  layers: Layers,
  code: Code,
  paintbrush: Paintbrush,
  shield: Shield,
};

export default function TemplatesPage({ params }: Props) {
  const { slug } = use(params);

  return (
    <div className="space-y-8 max-w-5xl">
      <Link
        href={`/projects/${slug}`}
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Project
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-white">Rule Templates</h1>
        <p className="text-sm text-white/50 mt-1 max-w-2xl">
          Jumpstart your context engine with pre-built architectural rules for
          popular tech stacks. Install a template to instantly add these
          constraints to your project.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {ruleTemplates.map((template) => (
          <TemplateCard key={template.id} template={template} slug={slug} />
        ))}
      </div>
    </div>
  );
}

function TemplateCard({
  template,
  slug,
}: {
  template: (typeof ruleTemplates)[0];
  slug: string;
}) {
  const Icon = ICONS[template.icon] || Layers;
  const [state, formAction, pending] = useActionState<
    InstallTemplateState,
    FormData
  >(installTemplate, null);

  return (
    <GlassPanel className="p-6 flex flex-col h-full">
      <div className="flex items-start gap-4 mb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 border border-white/10 shrink-0">
          <Icon className="h-6 w-6 text-white/60" />
        </div>
        <div>
          <h2 className="text-lg font-medium text-white">{template.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-white/40">{template.category}</span>
            <span className="inline-flex items-center rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-mono text-cyan-400">
              {template.rules.length} RULES
            </span>
          </div>
        </div>
      </div>

      <p className="text-sm text-white/60 mb-6 flex-grow leading-relaxed">
        {template.description}
      </p>

      <form
        action={formAction}
        className="mt-auto pt-4 border-t border-white/5"
      >
        <input type="hidden" name="projectSlug" value={slug} />
        <input type="hidden" name="templateId" value={template.id} />
        <Button
          type="submit"
          variant="secondary"
          disabled={pending}
          className="w-full group"
        >
          {pending ? (
            "Installing..."
          ) : (
            <>
              <PlusCircle className="h-4 w-4 mr-2 group-hover:text-cyan-400 transition-colors" />
              Install {template.rules.length} Rules
            </>
          )}
        </Button>
        {state?.error && (
          <p className="text-xs text-red-400 mt-2 text-center">{state.error}</p>
        )}
      </form>
    </GlassPanel>
  );
}
