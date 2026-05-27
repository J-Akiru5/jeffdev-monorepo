"use client";

import { useEffect, type ReactNode } from "react";
import { useProjectStore } from "@/stores/project-store";
import type { Project } from "@/lib/schemas";

export function ProjectProvider({
  children,
  initialProjects = [],
}: {
  children: ReactNode;
  initialProjects?: Project[];
}) {
  const setProjects = useProjectStore((s) => s.setProjects);

  useEffect(() => {
    if (initialProjects.length > 0) {
      setProjects(initialProjects);
    }
  }, [initialProjects, setProjects]);

  return <>{children}</>;
}

export function useProjects() {
  const projects = useProjectStore((s) => s.projects);
  const setProjects = useProjectStore((s) => s.setProjects);
  const addProject = useProjectStore((s) => s.addProject);
  const updateProject = useProjectStore((s) => s.updateProject);
  const removeProject = useProjectStore((s) => s.removeProject);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const setActiveProjectId = useProjectStore((s) => s.setActiveProjectId);
  const activeProject = useProjectStore((s) => s.getActiveProject());

  return {
    projects,
    setProjects,
    addProject,
    updateProject,
    removeProject,
    activeProjectId,
    setActiveProjectId,
    activeProject,
  };
}
