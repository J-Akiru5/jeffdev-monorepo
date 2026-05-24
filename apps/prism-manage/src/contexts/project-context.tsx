"use client";

/**
 * Project Context
 * ---------------
 * Manages the currently active project and project list.
 */

import { createContext, useContext, useState, ReactNode } from "react";
import type { Project } from "@/lib/schemas";

interface ProjectContextType {
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  activeProject: Project | null;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({
  children,
  initialProjects = [],
}: {
  children: ReactNode;
  initialProjects?: Project[];
}) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const activeProject = activeProjectId
    ? projects.find((p) => p.id === activeProjectId) || null
    : null;

  return (
    <ProjectContext.Provider
      value={{
        projects,
        setProjects,
        activeProjectId,
        setActiveProjectId,
        activeProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProjects must be used within a ProjectProvider");
  }
  return context;
}
