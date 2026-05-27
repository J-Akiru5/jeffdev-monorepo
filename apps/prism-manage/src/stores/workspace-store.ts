import { create } from "zustand";
import type { Workspace, Department, WorkspaceRole } from "@/lib/schemas";

interface WorkspaceState {
  /** All workspaces the user belongs to */
  workspaces: Workspace[];
  /** Currently active workspace */
  activeWorkspaceId: string | null;
  /** Departments for the active workspace (Syntaxure Labs) */
  departments: Department[];
  /** User's role in the active workspace */
  userRole: WorkspaceRole | null;
  /** The department this user is assigned to (only for employees) */
  userDepartmentId: string | null;
  /** Is the workspace data loaded? */
  loaded: boolean;

  // Actions
  setWorkspaces: (workspaces: Workspace[]) => void;
  setActiveWorkspace: (id: string) => void;
  setDepartments: (departments: Department[]) => void;
  setUserRole: (role: WorkspaceRole) => void;
  setUserDepartmentId: (id: string | null) => void;
  setLoaded: (loaded: boolean) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  activeWorkspaceId: null,
  departments: [],
  userRole: null,
  userDepartmentId: null,
  loaded: false,

  setWorkspaces: (workspaces) => {
    set({ workspaces });
    // Auto-select first workspace if none selected
    if (!get().activeWorkspaceId && workspaces.length > 0) {
      set({ activeWorkspaceId: workspaces[0]!.id });
    }
  },

  setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),

  setDepartments: (departments) => set({ departments }),

  setUserRole: (role) => set({ userRole: role }),

  setUserDepartmentId: (id) => set({ userDepartmentId: id }),

  setLoaded: (loaded) => set({ loaded }),
}));
