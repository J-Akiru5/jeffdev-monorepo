"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { ChatAssistant } from "@syntaxure/ui/chat-assistant";

interface DocsAssistantProps {
  className?: string;
}

export function DocsAssistant({ className }: DocsAssistantProps) {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === "light") {
      root.classList.add("theme-light");
    } else {
      root.classList.remove("theme-light");
    }
  }, [resolvedTheme]);

  return (
    <ChatAssistant
      className={className}
      apiEndpoint="/api/docs-assistant"
      title="Prism Assistant"
      welcomeMessage="Ask me anything about Prism Context Engine documentation."
      suggestions={[
        "How do I install the MCP server?",
        "What is context governance?",
        "How do I create my first rule?",
      ]}
    />
  );
}

export default DocsAssistant;

