import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getAdminClient } from "@/lib/supabase/admin";
import { ProjectForm } from "@/components/agency/project-form";

/**
 * Edit Agency Project Page
 * -------------------------
 * Edit an existing agency project.
 */

export default async function EditAgencyProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = getAdminClient() as any;

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!project) notFound();

  const metadata = (project.metadata || {}) as Record<string, unknown>;

  const defaultValues = {
    slug: project.slug,
    title: project.title,
    userId: project.user_id || "",
    client: project.client_name || "",
    clientEmail: project.client_email || "",
    category: (metadata.category as string) || "",
    tagline: (metadata.tagline as string) || "",
    description: project.description || "",
    challenge: (metadata.challenge as string) || "",
    solution: (metadata.solution as string) || "",
    results: (metadata.results as Array<{ metric: string; value: string }>) || [],
    technologies: (metadata.technologies as string[]) || [],
    testimonial: (metadata.testimonial as { quote: string; author: string; role: string } | null) || null,
    image: (metadata.image as string) || null,
    featured: (metadata.featured as boolean) || false,
    order: (metadata.order as number) || 0,
    status: (project.status as "pending" | "active" | "paused" | "completed") || "active",
    progress: (metadata.progress as number) || 0,
    startDate: project.start_date || "",
    deadline: project.end_date || "",
    budget: project.budget ? Number(project.budget) : undefined,
    paidAmount: (metadata.paid_amount as number) || undefined,
    assignedPartner: (metadata.assignedPartner as string) || "",
    assignedEmployees: (metadata.assignedEmployees as string[]) || [],
  };

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/agency/projects/${slug}`}
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Project
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white">Edit Project</h1>
        <p className="mt-1 text-sm text-white/50">{project.title}</p>
      </div>

      <ProjectForm mode="edit" defaultValues={defaultValues} />
    </div>
  );
}
