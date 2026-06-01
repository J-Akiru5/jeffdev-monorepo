import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProjectForm } from "@/components/agency/project-form";
import { getAgencyAllUsers } from "@/app/actions/agency-users";

/**
 * New Agency Project Page
 * ------------------------
 * Create a new agency project.
 */

export default async function NewAgencyProjectPage() {
  const users = await getAgencyAllUsers();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/agency/projects"
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white">New Project</h1>
        <p className="mt-1 text-sm text-white/50">Create a new agency project</p>
      </div>

      <ProjectForm mode="create" users={users} />
    </div>
  );
}

