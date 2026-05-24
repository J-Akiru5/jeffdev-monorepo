import { getAllUsers } from "@/app/actions/users";
import { ProjectForm } from "@/components/admin/project-form";

export const dynamic = "force-dynamic";

/**
 * New Project Page
 * ----------------
 * Renders the ProjectForm in create mode after fetching registered users.
 */
export default async function NewProjectPage() {
  const users = await getAllUsers();

  return (
    <div className="max-w-6xl mx-auto py-4">
      <ProjectForm mode="create" users={users} />
    </div>
  );
}
