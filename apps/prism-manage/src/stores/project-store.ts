import { create } from "zustand";
import type { Project } from "@/lib/schemas";

interface ProjectState {
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  getActiveProject: () => Project | null;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  setProjects: (projects) => set({ projects }),

  addProject: (project) =>
    set((state) => ({ projects: [...state.projects, project] })),

  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      ),
    })),

  removeProject: (id) =>
    set((state) => {
      const filtered = state.projects.filter((p) => p.id !== id);
      // Reset active project if the deleted one was active
      const newActive =
        state.activeProjectId === id
          ? filtered.length > 0
            ? filtered[0]!.id
            : null
          : state.activeProjectId;
      return { projects: filtered, activeProjectId: newActive };
    }),

  activeProjectId: null,
  setActiveProjectId: (id) => set({ activeProjectId: id }),
  getActiveProject: () => {
    const { projects, activeProjectId } = get();
    if (!activeProjectId) return null;
    return projects.find((p) => p.id === activeProjectId) || null;
  },
}));
