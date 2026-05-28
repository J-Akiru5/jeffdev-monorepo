import { create } from "zustand";
import type { Workspace, Department, WorkspaceRole, CLevelTitle } from "@/lib/schemas";

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
  /** The CPO user ID (user in the Product department of Syntaxure Labs) */
  cpoUserId: string | null;
  /** C-Level title refinement (founder-only: ceo, cto, cpo, coo, cmo) */
  cLevelTitle: CLevelTitle | null;
  /** Is the workspace data loaded? */
  loaded: boolean;

  // Actions
  setWorkspaces: (workspaces: Workspace[]) => void;
  setActiveWorkspace: (id: string) => void;
  setDepartments: (departments: Department[]) => void;
  setUserRole: (role: WorkspaceRole) => void;
  setUserDepartmentId: (id: string | null) => void;
  setCpoUserId: (id: string | null) => void;
  setCLevelTitle: (title: CLevelTitle | null) => void;
  setLoaded: (loaded: boolean) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  activeWorkspaceId: null,
  departments: [],
  userRole: null,
  userDepartmentId: null,
  cpoUserId: null,
  cLevelTitle: null,
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

  setCpoUserId: (id) => set({ cpoUserId: id }),

  setCLevelTitle: (title) => set({ cLevelTitle: title }),

  setLoaded: (loaded) => set({ loaded }),
}));
