'use client';

/**
 * Component Library Page
 * 
 * View and manage saved components
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Trash2, 
  Download, 
  Eye, 
  Loader2,
  Code2,
  AlertCircle
} from 'lucide-react';
import { GlassPanel, Button, Badge } from '@jdstudio/ui';
import { ComponentTabs } from '@/components/ui/component-tabs';

interface SavedComponent {
  id: string;
  name: string;
  description: string;
  code?: string;
  rules?: string;
  designSystem: string;
  stack: string;
  createdAt: string;
}

export default function ComponentLibraryPage() {
  const [components, setComponents] = useState<SavedComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<SavedComponent | null>(null);
  const [loadingComponent, setLoadingComponent] = useState(false);

  useEffect(() => {
    fetchComponents();
  }, []);

  const fetchComponents = async () => {
    try {
      const response = await fetch('/api/components');
      if (!response.ok) throw new Error('Failed to fetch components');
      const data = await response.json();
      setComponents(data.components);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load components');
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (id: string) => {
    if (selectedId === id) {
      setSelectedId(null);
      setSelectedComponent(null);
      return;
    }

    setSelectedId(id);
    setLoadingComponent(true);

    try {
      const response = await fetch(`/api/components/${id}`);
      if (!response.ok) throw new Error('Failed to fetch component');
      const data = await response.json();
      setSelectedComponent(data);
    } catch {
      setError('Failed to load component details');
    } finally {
      setLoadingComponent(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this component?')) return;

    try {
      const response = await fetch(`/api/components/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      
      setComponents(prev => prev.filter(c => c.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
        setSelectedComponent(null);
      }
    } catch {
      setError('Failed to delete component');
    }
  };

  const handleExport = (component: SavedComponent) => {
    if (!component.code) return;
    
    const blob = new Blob([component.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${component.name}.tsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-white/40" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link 
            href="/generate"
            className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to AI Kitchen
          </Link>
          <h1 className="text-2xl font-semibold text-white">Component Library</h1>
          <p className="text-sm text-white/50 mt-1">
            {components.length} component{components.length !== 1 ? 's' : ''} saved
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-4 flex items-center gap-3 text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Empty State */}
      {components.length === 0 ? (
        <GlassPanel className="p-12 text-center">
          <Code2 className="h-12 w-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No components yet</h3>
          <p className="text-sm text-white/50 mb-6">
            Generate a component in AI Kitchen and save it to your library.
          </p>
          <Button variant="primary" asChild>
            <Link href="/generate">Go to AI Kitchen</Link>
          </Button>
        </GlassPanel>
      ) : (
        <div className="space-y-4">
          {components.map((component) => (
            <GlassPanel key={component.id} className="p-4">
              {/* Component Row */}
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-white truncate">{component.name}</h3>
                    <Badge variant="default" className="text-xs">
                      {component.stack}
                    </Badge>
                    <Badge variant="info" className="text-xs">
                      {component.designSystem}
                    </Badge>
                  </div>
                  <p className="text-sm text-white/50 mt-1 line-clamp-1">
                    {component.description}
                  </p>
                  <p className="text-xs text-white/30 mt-1">
                    Created {new Date(component.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleView(component.id)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    {selectedId === component.id ? 'Hide' : 'View'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleExport(selectedComponent || component)}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <button
                    onClick={() => handleDelete(component.id)}
                    className="p-2 text-white/40 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Expanded View */}
              {selectedId === component.id && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  {loadingComponent ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-white/40" />
                    </div>
                  ) : selectedComponent ? (
                    <ComponentTabs
                      code={selectedComponent.code || '// No code available'}
                      rules={selectedComponent.rules}
                      defaultTab="code"
                      collapsible={false}
                    />
                  ) : null}
                </div>
              )}
            </GlassPanel>
          ))}
        </div>
      )}
    </div>
  );
}
