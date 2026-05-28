"use client";

import { useEffect, type ReactNode } from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";

interface WorkspaceProviderProps {
  children: ReactNode;
  workspaces: { id: string; name: string; createdAt: string }[];
  activeWorkspaceId: string | null;
  departments: { id: string; workspaceId: string; name: string; createdAt: string }[];
  userRole: "founder" | "employee";
  userDepartmentId: string | null;
  cpoUserId: string | null;
}

/**
 * WorkspaceProvider
 * -----------------
 * Hydrates the Zustand workspace store from server-fetched data.
 * Must be rendered inside a client component boundary (within "use client").
 */
export function WorkspaceProvider({
  children,
  workspaces,
  activeWorkspaceId,
  departments,
  userRole,
  userDepartmentId,
  cpoUserId,
}: WorkspaceProviderProps) {
  const setWorkspaces = useWorkspaceStore((s) => s.setWorkspaces);
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace);
  const setDepartments = useWorkspaceStore((s) => s.setDepartments);
  const setUserRole = useWorkspaceStore((s) => s.setUserRole);
  const setUserDepartmentId = useWorkspaceStore((s) => s.setUserDepartmentId);
  const setCpoUserId = useWorkspaceStore((s) => s.setCpoUserId);
  const setLoaded = useWorkspaceStore((s) => s.setLoaded);

  useEffect(() => {
    setWorkspaces(workspaces);
    if (activeWorkspaceId) {
      setActiveWorkspace(activeWorkspaceId);
    }
    setDepartments(departments);
    setUserRole(userRole);
    setUserDepartmentId(userDepartmentId);
    setCpoUserId(cpoUserId);
    setLoaded(true);
  }, [
    workspaces,
    activeWorkspaceId,
    departments,
    userRole,
    userDepartmentId,
    cpoUserId,
    setWorkspaces,
    setActiveWorkspace,
    setDepartments,
    setUserRole,
    setUserDepartmentId,
    setCpoUserId,
    setLoaded,
  ]);

  return <>{children}</>;
}
