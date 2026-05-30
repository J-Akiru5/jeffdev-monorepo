"use client";

interface SidebarSectionProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  collapsed: boolean;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function SidebarSection({
  title,
  icon: Icon,
  collapsed,
  action,
  children,
}: SidebarSectionProps) {
  return (
    <div className="mb-6">
      {!collapsed && (
        <div className="mb-2 flex items-center justify-between px-3">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-3.5 w-3.5 text-white/30" />}
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-white/30">
              {title}
            </h3>
          </div>
          {action}
        </div>
      )}
      <ul className="space-y-1">{children}</ul>
    </div>
  );
}
