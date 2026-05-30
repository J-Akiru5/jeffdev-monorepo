"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { getDepartmentColor } from "@/lib/constants";
import type { Department } from "@/lib/schemas";

interface SidebarDepartmentsProps {
  departments: Department[];
  collapsed: boolean;
  isFounder: boolean;
}

export function SidebarDepartments({
  departments,
  collapsed,
  isFounder,
}: SidebarDepartmentsProps) {
  const pathname = usePathname();

  if (departments.length === 0) return null;

  return (
    <div className="mb-6">
      {!collapsed && (
        <div className="mb-2 flex items-center justify-between px-3">
          <h3 className="font-mono text-[10px] uppercase tracking-wider text-white/30">
            Departments
          </h3>
          {isFounder && (
            <button
              className="rounded p-1 text-white/30 hover:bg-white/[0.04] hover:text-white/60"
              title="Add department"
            >
              <Plus className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
      <ul className="space-y-1">
        {departments.map((dept) => {
          const deptHref = `/tasks?department=${dept.id}`;
          const active = pathname.includes(`department=${dept.id}`);
          const color = getDepartmentColor(dept.name);

          return (
            <li key={dept.id}>
              <Link
                href={deptHref}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all ${
                  active
                    ? "bg-cyan-500/10 text-white"
                    : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
                } ${collapsed ? "justify-center" : ""}`}
                title={collapsed ? dept.name : undefined}
              >
                <span
                  className="h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {!collapsed && <span className="truncate">{dept.name}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
