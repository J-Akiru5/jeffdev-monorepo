"use client";

import { useState } from "react";
import { Code2, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { CodeBlock } from "./code-block";

interface ComponentTabsProps {
  code: string;
  rules?: string;
  defaultTab?: "code" | "rules";
  collapsible?: boolean;
}

type TabId = "code" | "rules";

const tabs = [
  { id: "code" as const, label: "Code", icon: Code2 },
  { id: "rules" as const, label: "Rules", icon: FileText },
];

export function ComponentTabs({
  code,
  rules,
  defaultTab = "code",
  collapsible = true,
}: ComponentTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Filter out rules tab if no rules provided
  const availableTabs = tabs.filter((tab) => {
    if (tab.id === "rules" && !rules) return false;
    return true;
  });

  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] overflow-hidden">
      {/* Tab Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-tertiary)]">
        <div className="flex">
          {availableTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors
                  ${
                    isActive
                      ? "text-cyan-400 border-b-2 border-cyan-400 -mb-px"
                      : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Collapse Toggle */}
        {collapsible && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-3 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          >
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Tab Content */}
      {!isCollapsed && (
        <div className="p-4">
          {activeTab === "code" && (
            <CodeBlock code={code} language="tsx" filename="component.tsx" />
          )}

          {activeTab === "rules" && rules && (
            <CodeBlock
              code={rules}
              language="markdown"
              filename="usage-rules.md"
            />
          )}
        </div>
      )}
    </div>
  );
}
