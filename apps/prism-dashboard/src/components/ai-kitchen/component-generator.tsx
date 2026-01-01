'use client';

/**
 * AI Kitchen - Component Generator
 * 
 * Chat interface for generating components with Gemini
 */

import { useState } from 'react';

type DesignSystem = 'jdstudio' | 'bare-minimum' | 'glassmorphic' | '8bit-nostalgia';
type Stack = 'react' | 'nextjs' | 'react-native';

interface GeneratedComponent {
  code: string;
  explanation: string;
  rules?: string;
}

export function ComponentGenerator() {
  const [prompt, setPrompt] = useState('');
  const [designSystem, setDesignSystem] = useState<DesignSystem>('jdstudio');
  const [stack, setStack] = useState<Stack>('nextjs');
  const [generateRules, setGenerateRules] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GeneratedComponent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          designSystem,
          stack,
          generateRules,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      setResult({
        code: data.component.code,
        explanation: data.component.explanation,
        rules: data.rules,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Design System Select */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Design System
          </label>
          <select
            value={designSystem}
            onChange={(e) => setDesignSystem(e.target.value as DesignSystem)}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
          >
            <option value="jdstudio">JDStudio (Glassmorphic)</option>
            <option value="bare-minimum">Bare Minimum</option>
            <option value="glassmorphic">Glassmorphic</option>
            <option value="8bit-nostalgia">8-Bit Nostalgia</option>
          </select>
        </div>

        {/* Stack Select */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Stack
          </label>
          <select
            value={stack}
            onChange={(e) => setStack(e.target.value as Stack)}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
          >
            <option value="nextjs">Next.js</option>
            <option value="react">React.js</option>
            <option value="react-native">React Native</option>
          </select>
        </div>

        {/* Generate Rules Toggle */}
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={generateRules}
              onChange={(e) => setGenerateRules(e.target.checked)}
              className="rounded border-white/10 bg-white/5 text-cyan-500 focus:ring-cyan-500"
            />
            <span className="text-sm text-white/70">Generate usage rules</span>
          </label>
        </div>
      </div>

      {/* Prompt Input */}
      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">
          Describe your component
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Create a pricing card with a title, price, feature list, and CTA button..."
          rows={4}
          className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-500 focus:outline-none resize-none"
        />
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isLoading || !prompt.trim()}
        className="w-full rounded-md bg-gradient-to-r from-cyan-500 to-purple-500 px-6 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Generating...
          </span>
        ) : (
          '✨ Generate Component'
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-6">
          {/* Explanation */}
          <div className="rounded-md border border-white/10 bg-white/5 p-4">
            <h3 className="font-medium text-white mb-2">Explanation</h3>
            <p className="text-white/70">{result.explanation}</p>
          </div>

          {/* Code Output */}
          <div className="rounded-md border border-white/10 bg-black/50 overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
              <span className="text-sm font-mono text-white/50">component.tsx</span>
              <button
                onClick={() => navigator.clipboard.writeText(result.code)}
                className="text-sm text-cyan-400 hover:text-cyan-300"
              >
                Copy
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm">
              <code className="text-white/80">{result.code}</code>
            </pre>
          </div>

          {/* Generated Rules */}
          {result.rules && (
            <div className="rounded-md border border-white/10 bg-black/50 overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
                <span className="text-sm font-mono text-white/50">usage-rules.md</span>
                <button
                  onClick={() => navigator.clipboard.writeText(result.rules!)}
                  className="text-sm text-cyan-400 hover:text-cyan-300"
                >
                  Copy
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-sm whitespace-pre-wrap">
                <code className="text-white/80">{result.rules}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
