import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getCollection } from "@jeffdev/db";
import { ObjectId } from "mongodb";
import { ArrowLeft, BookOpen } from "lucide-react";

interface Props {
  params: Promise<{ slug: string; skillId: string }>;
}

export default async function SkillDetailPage({ params }: Props) {
  const { slug, skillId } = await params;
  const { userId } = await auth();
  
  if (!userId) return null;

  if (!ObjectId.isValid(skillId)) {
    notFound();
  }

  const skillsCollection = await getCollection("skills");
  const skill = await skillsCollection.findOne({ 
    _id: new ObjectId(skillId),
    createdBy: userId 
  });

  if (!skill) {
    notFound();
  }

  const steps = skill.steps as { title: string; content: string }[] || [];

  return (
    <div className="space-y-8 max-w-4xl">
      <Link
        href={`/projects/${slug}/skills`}
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Skills
      </Link>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/20 border border-cyan-500/30">
            <BookOpen className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">{skill.name as string}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-white/50">{skill.category as string}</span>
              <span className="inline-flex items-center rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-mono text-white/40">
                SOURCE: {skill.source as string}
              </span>
              {skill.isActive === false && (
                <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-mono text-red-400 border border-red-500/20">
                  INACTIVE
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {skill.description && (
        <div className="rounded-md border border-white/5 bg-white/[0.02] p-5">
          <p className="text-sm text-white/70 leading-relaxed">
            {skill.description as string}
          </p>
        </div>
      )}

      <div className="space-y-6">
        <h2 className="text-lg font-medium text-white flex items-center gap-2">
          Procedure
          <span className="text-xs font-normal text-white/30 ml-2">({steps.length} steps)</span>
        </h2>
        
        <div className="relative border-l border-white/10 ml-4 space-y-10 pb-4">
          {steps.map((step, idx) => (
            <div key={idx} className="relative pl-8">
              <div className="absolute -left-[17px] top-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#050505] border-2 border-cyan-500 text-xs font-bold text-cyan-400 font-mono">
                {idx + 1}
              </div>
              <h3 className="text-base font-medium text-white mb-3 pt-1">{step.title}</h3>
              <div className="rounded-md border border-white/10 bg-black/40 p-4 overflow-x-auto">
                <pre className="text-sm font-mono text-white/80 whitespace-pre-wrap">
                  {step.content}
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
