import { getProjectBySlug } from "@/lib/data";
import { getAllUsers } from "@/app/actions/users";
import { ProjectForm } from "@/components/admin/project-form";
import { notFound } from "next/navigation";
import type { FirestoreProject } from "@/types/supabase";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * Edit Project Page
 * -----------------
 * Renders the ProjectForm in edit mode after loading the project and user list.
 */
export default async function EditProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = (await getProjectBySlug(slug)) as FirestoreProject | null;

  if (!project) {
    notFound();
  }

  const users = await getAllUsers();

  return (
    <div className="max-w-6xl mx-auto py-4">
      <ProjectForm mode="edit" initialData={project} users={users} />
    </div>
  );
}
