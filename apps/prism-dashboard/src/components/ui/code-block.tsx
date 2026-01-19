"use client";

import { useEffect, useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showCopy?: boolean;
}

// Simple syntax highlighting without Prism (more reliable)
function highlightSyntax(code: string, language: string): string {
  // Basic patterns for TypeScript/TSX highlighting
  const patterns: Array<{ pattern: RegExp; className: string }> = [
    // Comments (must be first)
    { pattern: /(\/\/[^\n]*)/g, className: "comment" },
    { pattern: /(\/\*[\s\S]*?\*\/)/g, className: "comment" },
    
    // Strings (before other patterns)
    { pattern: /("(?:[^"\\]|\\.)*")/g, className: "string" },
    { pattern: /('(?:[^'\\]|\\.)*')/g, className: "string" },
    { pattern: /(`(?:[^`\\]|\\.)*`)/g, className: "string" },
    
    // JSX tags
    { pattern: /(&lt;\/?[A-Z][a-zA-Z0-9]*)/g, className: "tag" },
    { pattern: /(<\/?[A-Z][a-zA-Z0-9]*)/g, className: "tag" },
    
    // Keywords
    { 
      pattern: /\b(import|export|from|const|let|var|function|return|if|else|for|while|class|interface|type|extends|implements|async|await|try|catch|throw|new|this|super|default|null|undefined|true|false)\b/g, 
      className: "keyword" 
    },
    
    // Types
    { pattern: /\b(string|number|boolean|void|any|never|unknown|React|ReactNode|JSX|FC|Component)\b/g, className: "type" },
    
    // Functions
    { pattern: /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g, className: "function" },
    
    // Numbers
    { pattern: /\b(\d+\.?\d*)\b/g, className: "number" },
    
    // Properties
    { pattern: /\.([a-zA-Z_$][a-zA-Z0-9_$]*)/g, className: "property" },
  ];

  // Escape HTML first
  let highlighted = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Apply patterns (simplified - doesn't handle overlaps perfectly but works)
  patterns.forEach(({ pattern, className }) => {
    highlighted = highlighted.replace(pattern, (match, group) => {
      return `<span class="token ${className}">${group}</span>`;
    });
  });

  return highlighted;
}

export function CodeBlock({ 
  code, 
  language = "tsx", 
  filename,
  showCopy = true 
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [highlightedCode, setHighlightedCode] = useState<string>("");

  // Highlight on mount/change
  useEffect(() => {
    try {
      const html = highlightSyntax(code, language);
      setHighlightedCode(html);
    } catch (error) {
      console.error("Highlighting failed:", error);
      // Fallback to escaped HTML
      setHighlightedCode(
        code
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
      );
    }
  }, [code, language]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className="rounded-lg border border-white/10 bg-[#1d1f21] overflow-hidden">
      {/* Syntax highlighting styles */}
      <style>{`
        .token.comment { color: #6b7280; font-style: italic; }
        .token.string { color: #a8ff60; }
        .token.keyword { color: #96cbfe; }
        .token.type { color: #ffffb6; }
        .token.function { color: #dad085; }
        .token.number { color: #ff73fd; }
        .token.property { color: #06b6d4; }
        .token.tag { color: #8b5cf6; }
      `}</style>
      
      {/* Header */}
      {(filename || showCopy) && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/5">
          {filename && (
            <span className="text-xs font-mono text-white/50">{filename}</span>
          )}
          {!filename && <span />}
          {showCopy && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}
        </div>
      )}
      
      {/* Code */}
      <div className="overflow-x-auto p-4">
        <pre className="!bg-transparent !p-0 !m-0 text-sm font-mono leading-relaxed">
          <code 
            className="text-[#c5c8c6]"
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          />
        </pre>
      </div>
    </div>
  );
}
