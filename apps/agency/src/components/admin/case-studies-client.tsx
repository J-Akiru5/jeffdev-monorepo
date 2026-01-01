'use client';

/**
 * Case Studies Client Component
 * ------------------------------
 * Interactive list of case studies with:
 * - Featured toggle
 * - Quick actions (Edit, Delete)
 * - Search/filter by category
 */

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Plus,
  Star,
  Pencil,
  Trash2,
  Search,
  ExternalLink,
  Layers,
  GripVertical,
} from 'lucide-react';
import { toast } from 'sonner';
import { toggleFeatured, deleteCaseStudy } from '@/app/actions/case-studies';
import type { FirestoreProject } from '@/types/firestore';

interface Props {
  caseStudies: FirestoreProject[];
}

export function CaseStudiesClient({ caseStudies: initialCaseStudies }: Props) {
  const [isPending, startTransition] = useTransition();
  const [caseStudies, setCaseStudies] = useState(initialCaseStudies);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Get unique categories
  const categories = Array.from(
    new Set(caseStudies.map((cs) => cs.category))
  ).sort();

  // Filter case studies
  const filteredCaseStudies = caseStudies.filter((cs) => {
    const matchesSearch =
      cs.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cs.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' || cs.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Toggle featured handler
  const handleToggleFeatured = async (slug: string) => {
    startTransition(async () => {
      const result = await toggleFeatured(slug);
      if (result.success) {
        setCaseStudies((prev) =>
          prev.map((cs) =>
            cs.slug === slug ? { ...cs, featured: result.featured! } : cs
          )
        );
        toast.success(
          result.featured ? 'Marked as featured' : 'Removed from featured'
        );
      } else {
        toast.error(result.error || 'Failed to toggle featured');
      }
    });
  };

  // Delete handler
  const handleDelete = async (slug: string, title: string) => {
    if (!confirm(`Delete "${title}"? This action cannot be undone.`)) return;

    startTransition(async () => {
      const result = await deleteCaseStudy(slug);
      if (result.success) {
        setCaseStudies((prev) => prev.filter((cs) => cs.slug !== slug));
        toast.success('Case study deleted');
      } else {
        toast.error(result.error || 'Failed to delete');
      }
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Case Studies</h1>
          <p className="mt-1 text-sm text-white/50">
            Manage portfolio case studies displayed on the public site
          </p>
        </div>
        <Link
          href="/admin/case-studies/new"
          className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-cyan-400"
        >
          <Plus className="h-4 w-4" />
          New Case Study
        </Link>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search by title or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          />
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Case Studies Grid */}
      {filteredCaseStudies.length === 0 ? (
        <div className="mt-12 text-center">
          <Layers className="mx-auto h-12 w-12 text-white/20" />
          <h3 className="mt-4 text-lg font-medium text-white">
            No case studies found
          </h3>
          <p className="mt-1 text-sm text-white/50">
            {searchQuery || categoryFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first case study to get started'}
          </p>
          {!searchQuery && categoryFilter === 'all' && (
            <Link
              href="/admin/case-studies/new"
              className="mt-4 inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300"
            >
              <Plus className="h-4 w-4" />
              Create Case Study
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCaseStudies.map((cs) => (
            <div
              key={cs.slug}
              className="group relative rounded-md border border-white/[0.08] bg-white/[0.02] p-5 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
            >
              {/* Drag Handle (for future reordering) */}
              <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                <GripVertical className="h-4 w-4 text-white/30" />
              </div>

              {/* Content */}
              <div className="pl-4">
                {/* Category & Featured */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-cyan-400/70">
                    {cs.category}
                  </span>
                  <button
                    onClick={() => handleToggleFeatured(cs.slug)}
                    disabled={isPending}
                    className={`rounded-sm p-1 transition-colors ${
                      cs.featured
                        ? 'text-amber-400 hover:text-amber-300'
                        : 'text-white/20 hover:text-white/40'
                    }`}
                    title={cs.featured ? 'Remove from featured' : 'Mark as featured'}
                  >
                    <Star
                      className={`h-4 w-4 ${cs.featured ? 'fill-current' : ''}`}
                    />
                  </button>
                </div>

                {/* Title & Client */}
                <h3 className="mt-2 font-semibold text-white">{cs.title}</h3>
                <p className="text-sm text-white/50">{cs.client}</p>

                {/* Metrics Preview */}
                {cs.results && cs.results.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {cs.results.slice(0, 3).map((r, i) => (
                      <span
                        key={i}
                        className="rounded-sm bg-white/5 px-2 py-0.5 font-mono text-xs text-white/60"
                      >
                        {r.value}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex items-center gap-2">
                  <Link
                    href={`/admin/case-studies/${cs.slug}`}
                    className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </Link>
                  <a
                    href={`/work/${cs.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View
                  </a>
                  <button
                    onClick={() => handleDelete(cs.slug, cs.title)}
                    disabled={isPending}
                    className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-red-400/70 transition-colors hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="mt-8 border-t border-white/[0.06] pt-4">
        <p className="text-sm text-white/40">
          {filteredCaseStudies.length} of {caseStudies.length} case studies
          {caseStudies.filter((cs) => cs.featured).length > 0 && (
            <span className="ml-2">
              • {caseStudies.filter((cs) => cs.featured).length} featured
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
