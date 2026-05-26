"use client";

import { useState, useEffect, useCallback, Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Eye, EyeOff, Code2 } from "lucide-react";

interface ComponentPreviewProps {
  code: string;
  stack?: "react" | "nextjs" | "react-native";
}

// =============================================================================
// ERROR BOUNDARY
// =============================================================================

interface ErrorBoundaryState {
  hasError: boolean;
}

class PreviewErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// =============================================================================
// CODE SANITIZATION (AGGRESSIVE)
// =============================================================================

function sanitizeForSandpack(code: string): string {
  let sanitized = code;

  // Remove all Next.js specific directives
  sanitized = sanitized.replace(/"use client";?\s*\n?/g, "");
  sanitized = sanitized.replace(/'use client';?\s*\n?/g, "");
  sanitized = sanitized.replace(/"use server";?\s*\n?/g, "");
  sanitized = sanitized.replace(/'use server';?\s*\n?/g, "");

  // Remove ALL Next.js imports
  sanitized = sanitized.replace(
    /import\s+[\w{},\s*]+\s+from\s+['"]next\/[^'"]+['"];?\s*\n?/g,
    "",
  );

  // Replace Next.js components with HTML equivalents
  sanitized = sanitized.replace(/<Link\s+([^>]*)>/g, "<a $1>");
  sanitized = sanitized.replace(/<\/Link>/g, "</a>");
  sanitized = sanitized.replace(/<Image\s+([^>]*)\/>/g, "<img $1 />");
  sanitized = sanitized.replace(/<Image\s+([^>]*)>/g, "<img $1>");
  sanitized = sanitized.replace(/<\/Image>/g, "");

  // Fix href to onClick for sandbox
  sanitized = sanitized.replace(/href=["'][^"']*["']/g, 'href="#"');

  // Remove TypeScript interface blocks that might cause issues
  // Keep interfaces but simplify complex types
  sanitized = sanitized.replace(/:\s*React\.FC<[^>]+>/g, "");
  sanitized = sanitized.replace(/:\s*FC<[^>]+>/g, "");

  // Fix Lucide imports - ensure they work
  if (sanitized.includes("lucide-react")) {
    // Replace individual icon imports with destructured import
    sanitized = sanitized.replace(
      /import\s+{\s*([^}]+)\s*}\s+from\s+['"]lucide-react['"];?/g,
      'import { $1 } from "lucide-react";',
    );
  }

  return sanitized;
}

function extractComponentName(code: string): string {
  // Try various patterns
  const patterns = [
    /export\s+default\s+function\s+(\w+)/,
    /export\s+function\s+(\w+)/,
    /export\s+const\s+(\w+)\s*[=:]/,
    /function\s+(\w+)\s*\(/,
    /const\s+(\w+)\s*=.*=>/,
  ];

  for (const pattern of patterns) {
    const match = code.match(pattern);
    if (match) return match[1]!;
  }

  return "Component";
}

// =============================================================================
// LAZY SANDPACK LOADER
// =============================================================================

function SandpackPreviewInner({
  code,
  onError,
}: {
  code: string;
  onError: (msg: string) => void;
}) {
  const [SandpackComponents, setSandpackComponents] = useState<{
    SandpackProvider: typeof import("@codesandbox/sandpack-react").SandpackProvider;
    SandpackPreview: typeof import("@codesandbox/sandpack-react").SandpackPreview;
  } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Dynamically import Sandpack only on client
  useEffect(() => {
    const loadSandpack = async () => {
      try {
        const sandpack = await import("@codesandbox/sandpack-react");
        setSandpackComponents({
          SandpackProvider: sandpack.SandpackProvider,
          SandpackPreview: sandpack.SandpackPreview,
        });
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to load preview";
        setLoadError(msg);
        onError(msg);
      }
    };
    loadSandpack();
  }, [onError]);

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-[400px] text-white/40">
        <p>Preview unavailable</p>
      </div>
    );
  }

  if (!SandpackComponents) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="flex items-center gap-3 text-white/40">
          <div className="h-5 w-5 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <span>Loading preview...</span>
        </div>
      </div>
    );
  }

  const { SandpackProvider, SandpackPreview } = SandpackComponents;
  const sanitizedCode = sanitizeForSandpack(code);
  const componentName = extractComponentName(sanitizedCode);

  // Create wrapper that renders the component
  const appCode = `
import React from 'react';

// Generated Component
${sanitizedCode}

// Wrapper
export default function App() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#050505',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <${componentName} />
    </div>
  );
}
`;

  return (
    <SandpackProvider
      template="react-ts"
      theme={{
        colors: {
          surface1: "#0a0a0a",
          surface2: "#151515",
          surface3: "#1a1a1a",
          clickable: "#666666",
          base: "#ffffff",
          disabled: "#4D4D4D",
          hover: "#ffffff",
          accent: "#06b6d4",
          error: "#ef4444",
          errorSurface: "#1f1f1f",
        },
        font: {
          body: "Inter, system-ui, sans-serif",
          mono: '"JetBrains Mono", monospace',
          size: "14px",
          lineHeight: "1.6",
        },
      }}
      files={{
        "/App.tsx": appCode,
      }}
      options={{
        externalResources: ["https://cdn.tailwindcss.com"],
      }}
      customSetup={{
        dependencies: {
          "lucide-react": "latest",
        },
      }}
    >
      <div className="h-[400px]">
        <SandpackPreview
          showOpenInCodeSandbox={false}
          showRefreshButton={true}
        />
      </div>
    </SandpackProvider>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ComponentPreview({ code }: ComponentPreviewProps) {
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [key, setKey] = useState(0);

  const handleError = useCallback((message: string) => {
    setError(message);
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    setKey((prev) => prev + 1);
  }, []);

  // Disabled state
  if (!showPreview) {
    return (
      <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <EyeOff className="h-10 w-10 text-white/20 mb-4" />
          <p className="text-sm text-white/50 mb-4">Preview disabled</p>
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <Eye className="h-4 w-4" />
            Enable Preview
          </button>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-6">
        <div className="flex items-start gap-4">
          <AlertTriangle className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-amber-400 mb-2">Preview Error</h3>
            <p className="text-sm text-amber-300/70 mb-4 break-words">
              {error}
            </p>
            <p className="text-xs text-amber-300/50 mb-4">
              Complex components with Next.js features may not preview
              correctly. View the Code tab to see the generated component.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
              <button
                onClick={() => setShowPreview(false)}
                className="flex items-center gap-2 text-sm text-white/50 hover:text-white/70 transition-colors"
              >
                <EyeOff className="h-4 w-4" />
                Disable Preview
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PreviewErrorBoundary
      fallback={
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-6">
          <div className="flex items-start gap-4">
            <Code2 className="h-6 w-6 text-amber-400 shrink-0" />
            <div>
              <h3 className="font-medium text-amber-400 mb-2">
                Preview Unavailable
              </h3>
              <p className="text-sm text-amber-300/70">
                This component uses features that can&apos;t be previewed in the
                browser. Check the Code tab to view the generated source.
              </p>
            </div>
          </div>
        </div>
      }
    >
      <div className="rounded-lg border border-white/10 overflow-hidden bg-[#0a0a0a]">
        <SandpackPreviewInner key={key} code={code} onError={handleError} />
      </div>
    </PreviewErrorBoundary>
  );
}
