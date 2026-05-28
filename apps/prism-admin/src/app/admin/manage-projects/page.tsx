import { getAllProjects } from "@/app/actions/manage";
import { ProjectsManager } from "@/components/admin/projects-manager";

export default async function ManageProjectsPage() {
  const projects = await getAllProjects();

  return <ProjectsManager initialProjects={projects} />;
}
