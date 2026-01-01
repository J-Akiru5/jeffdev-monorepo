'use client';

/**
 * Case Study Form Component
 * --------------------------
 * Shared form for creating and editing case studies.
 * Includes dynamic metrics, tech stack, and image upload.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Loader2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { createCaseStudy, updateCaseStudy } from '@/app/actions/case-studies';
import { CaseStudyImageUpload } from './case-study-image-upload';
import type { FirestoreProject } from '@/types/firestore';

// =============================================================================
// TYPES
// =============================================================================

interface Metric {
  value: string;
  metric: string;
}

interface FormData {
  title: string;
  client: string;
  category: string;
  tagline: string;
  description: string;
  challenge: string;
  solution: string;
  results: Metric[];
  technologies: string[];
  image: string | null;
  featured: boolean;
  order: number;
}

interface Props {
  mode: 'create' | 'edit';
  initialData?: FirestoreProject;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const CATEGORIES = [
  'SaaS Platform',
  'Web Application',
  'E-Commerce',
  'Mobile App',
  'Internal Tool',
  'API / Backend',
  'Landing Page',
  'Other',
];

// =============================================================================
// COMPONENT
// =============================================================================

export function CaseStudyForm({ mode, initialData }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    title: initialData?.title || '',
    client: initialData?.client || '',
    category: initialData?.category || CATEGORIES[0],
    tagline: initialData?.tagline || '',
    description: initialData?.description || '',
    challenge: initialData?.challenge || '',
    solution: initialData?.solution || '',
    results: initialData?.results || [{ value: '', metric: '' }],
    technologies: initialData?.technologies || [],
    image: initialData?.image || null,
    featured: initialData?.featured || false,
    order: initialData?.order || 0,
  });

  // Tech input state
  const [techInput, setTechInput] = useState('');

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const updateField = <K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Metrics handlers
  const addMetric = () => {
    setFormData((prev) => ({
      ...prev,
      results: [...prev.results, { value: '', metric: '' }],
    }));
  };

  const updateMetric = (index: number, field: 'value' | 'metric', value: string) => {
    setFormData((prev) => ({
      ...prev,
      results: prev.results.map((m, i) =>
        i === index ? { ...m, [field]: value } : m
      ),
    }));
  };

  const removeMetric = (index: number) => {
    if (formData.results.length <= 1) {
      toast.error('At least one metric is required');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      results: prev.results.filter((_, i) => i !== index),
    }));
  };

  // Tech handlers
  const addTech = () => {
    if (!techInput.trim()) return;
    if (formData.technologies.includes(techInput.trim())) {
      toast.error('Technology already added');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      technologies: [...prev.technologies, techInput.trim()],
    }));
    setTechInput('');
  };

  const removeTech = (tech: string) => {
    setFormData((prev) => ({
      ...prev,
      technologies: prev.technologies.filter((t) => t !== tech),
    }));
  };

  const handleTechKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTech();
    }
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!formData.client.trim()) {
      toast.error('Client name is required');
      return;
    }
    if (formData.technologies.length === 0) {
      toast.error('At least one technology is required');
      return;
    }
    if (formData.results.some((r) => !r.value.trim() || !r.metric.trim())) {
      toast.error('All metrics must have both value and label');
      return;
    }

    startTransition(async () => {
      let result;

      if (mode === 'create') {
        result = await createCaseStudy(formData);
      } else {
        result = await updateCaseStudy(initialData!.slug, formData);
      }

      if (result.success) {
        toast.success(
          mode === 'create' ? 'Case study created!' : 'Case study updated!'
        );
        router.push('/admin/case-studies');
      } else {
        toast.error(result.error || 'Something went wrong');
      }
    });
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/case-studies"
            className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Case Studies
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-white">
            {mode === 'create' ? 'New Case Study' : `Edit: ${initialData?.title}`}
          </h1>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-6 py-2.5 text-sm font-medium text-black transition-colors hover:bg-cyan-400 disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {mode === 'create' ? 'Create Case Study' : 'Save Changes'}
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Basic Info Card */}
          <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-6">
            <h2 className="mb-4 font-semibold text-white">Basic Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm text-white/70">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="e.g., SineAI Hub"
                  className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-white/70">
                  Client *
                </label>
                <input
                  type="text"
                  value={formData.client}
                  onChange={(e) => updateField('client', e.target.value)}
                  placeholder="e.g., Internal Project"
                  className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-white/70">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-cyan-500/50 focus:outline-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm text-white/70">
                  Tagline *
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => updateField('tagline', e.target.value)}
                  placeholder="Short one-liner about the project"
                  className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Description Card */}
          <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-6">
            <h2 className="mb-4 font-semibold text-white">Description</h2>
            <textarea
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Full description of the project..."
              rows={4}
              className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none"
            />
          </div>

          {/* Challenge & Solution Card */}
          <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-6">
            <h2 className="mb-4 font-semibold text-white">
              Challenge & Solution
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-white/70">
                  The Challenge
                </label>
                <textarea
                  value={formData.challenge}
                  onChange={(e) => updateField('challenge', e.target.value)}
                  placeholder="What problem needed to be solved?"
                  rows={3}
                  className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-white/70">
                  Our Solution
                </label>
                <textarea
                  value={formData.solution}
                  onChange={(e) => updateField('solution', e.target.value)}
                  placeholder="How did you solve it?"
                  rows={3}
                  className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Metrics Card */}
          <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-white">Results / Metrics</h2>
              <button
                type="button"
                onClick={addMetric}
                className="inline-flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300"
              >
                <Plus className="h-4 w-4" />
                Add Metric
              </button>
            </div>
            <div className="space-y-3">
              {formData.results.map((metric, index) => (
                <div key={index} className="flex gap-3">
                  <input
                    type="text"
                    value={metric.value}
                    onChange={(e) => updateMetric(index, 'value', e.target.value)}
                    placeholder="Value (e.g., 60%)"
                    className="w-32 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={metric.metric}
                    onChange={(e) => updateMetric(index, 'metric', e.target.value)}
                    placeholder="Label (e.g., Time Saved)"
                    className="flex-1 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeMetric(index)}
                    className="rounded-md p-2 text-white/30 transition-colors hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Image Upload */}
          <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-6">
            <CaseStudyImageUpload
              currentImage={formData.image}
              onImageChange={(url) => updateField('image', url)}
            />
          </div>

          {/* Technologies Card */}
          <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-6">
            <h2 className="mb-4 font-semibold text-white">Technologies</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={handleTechKeyDown}
                placeholder="Add technology..."
                className="flex-1 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none"
              />
              <button
                type="button"
                onClick={addTech}
                className="rounded-md bg-white/10 px-3 py-2 text-white/70 transition-colors hover:bg-white/20"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {formData.technologies.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {formData.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="inline-flex items-center gap-1.5 rounded-md bg-white/5 px-2.5 py-1 text-xs text-white/70"
                  >
                    {tech}
                    <button
                      type="button"
                      onClick={() => removeTech(tech)}
                      className="text-white/30 hover:text-red-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {formData.technologies.length === 0 && (
              <p className="mt-2 text-xs text-white/30">
                Press Enter or click + to add
              </p>
            )}
          </div>

          {/* Settings Card */}
          <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-6">
            <h2 className="mb-4 font-semibold text-white">Settings</h2>
            <div className="space-y-4">
              {/* Featured Toggle */}
              <label className="flex cursor-pointer items-center justify-between">
                <span className="text-sm text-white/70">Featured</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => updateField('featured', e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="h-6 w-11 rounded-full bg-white/10 transition-colors peer-checked:bg-cyan-500/50" />
                  <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white/50 transition-all peer-checked:left-[22px] peer-checked:bg-cyan-400" />
                </div>
              </label>

              {/* Order */}
              <div>
                <label className="mb-1.5 block text-sm text-white/70">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => updateField('order', parseInt(e.target.value) || 0)}
                  min={0}
                  className="w-full rounded-md border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-cyan-500/50 focus:outline-none"
                />
                <p className="mt-1 text-xs text-white/30">Lower = appears first</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

// Missing import fix
import { X } from 'lucide-react';
