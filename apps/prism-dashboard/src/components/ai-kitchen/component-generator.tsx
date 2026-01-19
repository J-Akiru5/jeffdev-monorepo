'use client';

/**
 * AI Kitchen - Component Generator
 * 
 * Chat interface for generating components with Gemini
 * Features: Live preview, syntax highlighting, save to library, export
 */

import { useState, useEffect } from 'react';
import { Save, Download, Loader2, Library } from 'lucide-react';
import Link from 'next/link';
import { ComponentTabs } from '@/components/ui/component-tabs';
import { Button } from '@jdstudio/ui';

type DesignSystem = 'jdstudio' | 'bare-minimum' | 'glassmorphic' | '8bit-nostalgia';
type Stack = 'react' | 'nextjs' | 'react-native';

interface GeneratedComponent {
  code: string;
  explanation: string;
  rules?: string;
}

interface LibraryStats {
  count: number;
  limit: number;
}

export function ComponentGenerator() {
  const [prompt, setPrompt] = useState('');
  const [designSystem, setDesignSystem] = useState<DesignSystem>('jdstudio');
  const [stack, setStack] = useState<Stack>('nextjs');
  const [generateRules, setGenerateRules] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<GeneratedComponent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [libraryStats, setLibraryStats] = useState<LibraryStats>({ count: 0, limit: 5 });

  // Fetch library stats on mount
  useEffect(() => {
    fetchLibraryStats();
  }, []);

  const fetchLibraryStats = async () => {
    try {
      const response = await fetch('/api/components');
      if (response.ok) {
        const data = await response.json();
        setLibraryStats({ count: data.count, limit: data.limit });
      }
    } catch {
      // Ignore errors fetching stats
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);
    setSaveMessage(null);

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

  const handleSave = async () => {
    if (!result) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Extract component name from code
      const nameMatch = result.code.match(/(?:function|const)\s+(\w+)/);
      const componentName = nameMatch?.[1] || 'Component';

      const response = await fetch('/api/components', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: componentName,
          description: result.explanation,
          code: result.code,
          rules: result.rules,
          designSystem,
          stack,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save');
      }

      setSaveMessage('✓ Saved to library');
      fetchLibraryStats(); // Refresh stats
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    if (!result) return;

    // Create file content
    const content = result.code;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    // Extract component name
    const nameMatch = result.code.match(/(?:function|const)\s+(\w+)/);
    const componentName = nameMatch?.[1] || 'Component';

    // Trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `${componentName}.tsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header with Library Link */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-white/40">
          {libraryStats.limit === -1
            ? `${libraryStats.count} components saved`
            : `${libraryStats.count} of ${libraryStats.limit} components`
          }
        </div>
        <Link
          href="/generate/library"
          className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <Library className="h-4 w-4" />
          View Library
        </Link>
      </div>

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
        <div className="space-y-4">
          {/* Explanation */}
          <div className="rounded-md border border-white/10 bg-white/5 p-4">
            <h3 className="font-medium text-white mb-2">Explanation</h3>
            <p className="text-white/70 text-sm">{result.explanation}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              variant="secondary"
              size="sm"
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save to Library
            </Button>

            <Button
              onClick={handleExport}
              variant="secondary"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export File
            </Button>

            {saveMessage && (
              <span className={`text-sm ${saveMessage.startsWith('✓') ? 'text-emerald-400' : 'text-red-400'}`}>
                {saveMessage}
              </span>
            )}
          </div>

          {/* Tabbed Output */}
          <ComponentTabs
            code={result.code}
            rules={result.rules}
            defaultTab="code"
            collapsible={true}
          />
        </div>
      )}
    </div>
  );
}
