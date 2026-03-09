'use client';

import { ChatAssistant } from '@jdstudio/ui/chat-assistant';

interface DocsAssistantProps {
  className?: string;
}

export function DocsAssistant({ className }: DocsAssistantProps) {
  return (
    <ChatAssistant
      className={className}
      apiEndpoint="/api/docs-assistant"
      title="Prism Assistant"
      welcomeMessage="Ask me anything about Prism Context Engine documentation."
      suggestions={[
        'How do I install the MCP server?',
        'What is context governance?',
        'How do I create my first rule?'
      ]}
    />
  );
}

export default DocsAssistant;
