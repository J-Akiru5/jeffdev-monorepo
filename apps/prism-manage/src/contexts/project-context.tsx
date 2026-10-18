"use client";

import { useEffect, type ReactNode } from "react";
import { useProjectStore } from "@/stores/project-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { getProjects } from "@/app/actions/projects";

/**
 * ProjectProvider
 * ---------------
 * Loads the real workspace lists (pm_projects) whenever the active workspace
 * changes, and hydrates the Zustand project store. Replaces the old fake
 * client-side "list-N" defaults.
 */
export function ProjectProvider({ children }: { children: ReactNode }) {
  const setProjects = useProjectStore((s) => s.setProjects);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);

  useEffect(() => {
    if (!activeWorkspaceId) {
      setProjects([]);
      useProjectStore.getState().setActiveProjectId(null);
      return;
    }

    let cancelled = false;
    getProjects(activeWorkspaceId).then((projects) => {
      if (cancelled) return;
      setProjects(projects);
      // Keep the user's selected list if it still exists in the new workspace.
      const { activeProjectId, setActiveProjectId } = useProjectStore.getState();
      if (activeProjectId && !projects.some((p) => p.id === activeProjectId)) {
        setActiveProjectId(null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [activeWorkspaceId, setProjects]);

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
