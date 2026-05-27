import { create } from "zustand";
import type { Project } from "@/lib/schemas";

interface ProjectState {
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  getActiveProject: () => Project | null;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  setProjects: (projects) => set({ projects }),
  activeProjectId: null,
  setActiveProjectId: (id) => set({ activeProjectId: id }),
  getActiveProject: () => {
    const { projects, activeProjectId } = get();
    if (!activeProjectId) return null;
    return projects.find((p) => p.id === activeProjectId) || null;
  },
}));
