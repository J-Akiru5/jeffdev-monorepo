'use server';

/**
 * Case Studies Server Actions
 * ----------------------------
 * Complete CRUD operations for managing case studies in Supabase.
 * Uses the `case_studies` table with metadata JSONB for extra fields.
 */

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent } from '@/lib/audit';
import type { CaseStudy } from '@/types/database';

// =============================================================================
// ZOD SCHEMAS
// =============================================================================

const metricSchema = z.object({
  metric: z.string().min(1, 'Metric label is required'),
  value: z.string().min(1, 'Metric value is required'),
});

const testimonialSchema = z.object({
  quote: z.string().min(1),
  author: z.string().min(1),
  role: z.string().min(1),
}).nullable();

const caseStudySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  client: z.string().min(1, 'Client name is required'),
  category: z.string().min(1, 'Category is required'),
  tagline: z.string().min(1, 'Tagline is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  challenge: z.string().min(10, 'Challenge description is required'),
  solution: z.string().min(10, 'Solution description is required'),
  results: z.array(metricSchema).min(1, 'At least one metric is required'),
  technologies: z.array(z.string()).min(1, 'At least one technology is required'),
  testimonial: testimonialSchema.optional(),
  image: z.string().nullable().optional(),
  featured: z.boolean().default(false),
  order: z.number().int().min(0).default(0),
});

type CaseStudyInput = z.infer<typeof caseStudySchema>;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate URL-safe slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Check if slug already exists in case_studies table
 */
async function slugExists(slug: string, excludeSlug?: string): Promise<boolean> {
  const supabase = getAdminClient();
  const { data } = await supabase
    .from('case_studies')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (!data) return false;
  if (excludeSlug && slug === excludeSlug) return false;
  return true;
}

/**
 * Serialize Supabase row to the FirestoreProject shape expected by components
 */
function serializeCaseStudy(row: CaseStudy): Record<string, unknown> {
  const metadata = (row.metadata || {}) as Record<string, unknown>;

  return {
    slug: row.slug || row.id,
    title: row.title,
    client: (metadata.client as string) || '',
    category: (metadata.category as string) || (row.industry || ''),
    tagline: (metadata.tagline as string) || '',
    description: row.description || '',
    challenge: row.challenge || '',
    solution: row.solution || '',
    results: row.metrics as { metric: string; value: string }[] || [],
    technologies: (metadata.technologies as string[]) || [],
    testimonial: (metadata.testimonial as { quote: string; author: string; role: string } | null) || null,
    image: row.images?.[0] || null,
    featured: metadata.featured === true,
    order: (metadata.order as number) || 0,
    status: 'completed',
    progress: 100,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// =============================================================================
// GET CASE STUDIES (LIST)
// =============================================================================

export async function getCaseStudies(): Promise<Record<string, unknown>[]> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('case_studies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((row) => serializeCaseStudy(row as CaseStudy));
  } catch (error) {
    console.error('[GET CASE STUDIES ERROR]', error);
    return [];
  }
}

// =============================================================================
// GET SINGLE CASE STUDY
// =============================================================================

export async function getCaseStudyBySlug(
  slug: string
): Promise<Record<string, unknown> | null> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('case_studies')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error || !data) return null;

    return serializeCaseStudy(data as CaseStudy);
  } catch (error) {
    console.error('[GET CASE STUDY ERROR]', error);
    return null;
  }
}

// =============================================================================
// CREATE CASE STUDY
// =============================================================================

export async function createCaseStudy(
  data: CaseStudyInput
): Promise<{ success: boolean; slug?: string; error?: string }> {
  try {
    // Validate input
    const validated = caseStudySchema.parse(data);

    // Generate slug
    let slug = generateSlug(validated.title);
    let attempts = 0;
    while (await slugExists(slug) && attempts < 10) {
      attempts++;
      slug = `${generateSlug(validated.title)}-${attempts}`;
    }

    if (attempts >= 10) {
      return { success: false, error: 'Could not generate unique slug. Try a different title.' };
    }

    // Build result summary text from metrics
    const resultsText = validated.results
      .map(r => `${r.metric}: ${r.value}`)
      .join('; ');

    const supabase = getAdminClient();
    const { error: insertError } = await supabase
      .from('case_studies')
      .insert({
        title: validated.title,
        description: validated.tagline,
        slug,
        industry: validated.category,
        challenge: validated.challenge,
        solution: validated.solution,
        results: resultsText,
        metrics: validated.results as unknown as Record<string, unknown>,
        images: validated.image ? [validated.image] : [],
        status: 'published',
        published_at: new Date().toISOString(),
        metadata: {
          client: validated.client,
          tagline: validated.tagline,
          technologies: validated.technologies,
          testimonial: validated.testimonial,
          featured: validated.featured,
          order: validated.order,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any);

    if (insertError) throw insertError;

    // Audit log
    await logAuditEvent({
      action: 'CREATE',
      resource: 'case_study',
      resourceId: slug,
      details: { title: validated.title },
    });

    // Revalidate paths
    revalidatePath('/admin/case-studies');
    revalidatePath('/work');
    revalidatePath(`/work/${slug}`);

    return { success: true, slug };
  } catch (error) {
    console.error('[CREATE CASE STUDY ERROR]', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Validation failed' };
    }
    return { success: false, error: 'Failed to create case study' };
  }
}

// =============================================================================
// UPDATE CASE STUDY
// =============================================================================

export async function updateCaseStudy(
  slug: string,
  data: Partial<CaseStudyInput>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getAdminClient();

    // Check if exists
    const { data: existing } = await supabase
      .from('case_studies')
      .select('id, metadata')
      .eq('slug', slug)
      .maybeSingle();

    if (!existing) {
      return { success: false, error: 'Case study not found' };
    }

    const existingMetadata = (existing.metadata || {}) as Record<string, unknown>;
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Map fields to case_studies columns
    if (data.title) updates.title = data.title;
    if (data.tagline) updates.description = data.tagline;
    if (data.category) updates.industry = data.category;
    if (data.description) updates.description = data.tagline;
    if (data.challenge) updates.challenge = data.challenge;
    if (data.solution) updates.solution = data.solution;
    if (data.image !== undefined) updates.images = data.image ? [data.image] : [];

    // Build result text from metrics
    if (data.results) {
      updates.results = data.results.map(r => `${r.metric}: ${r.value}`).join('; ');
      updates.metrics = data.results as unknown as Record<string, unknown>;
    }

    // Store extra fields in metadata
    updates.metadata = {
      ...existingMetadata,
      ...(data.client && { client: data.client }),
      ...(data.technologies && { technologies: data.technologies }),
      ...(data.testimonial !== undefined && { testimonial: data.testimonial }),
      ...(data.featured !== undefined && { featured: data.featured }),
      ...(data.order !== undefined && { order: data.order }),
      ...(data.tagline && { tagline: data.tagline }),
    };

    const { error } = await supabase
      .from('case_studies')
      .update(updates as any)
      .eq('slug', slug);

    if (error) throw error;

    // Audit log
    await logAuditEvent({
      action: 'UPDATE',
      resource: 'case_study',
      resourceId: slug,
      details: { fields: Object.keys(data) },
    });

    // Revalidate paths
    revalidatePath('/admin/case-studies');
    revalidatePath(`/admin/case-studies/${slug}`);
    revalidatePath('/work');
    revalidatePath(`/work/${slug}`);

    return { success: true };
  } catch (error) {
    console.error('[UPDATE CASE STUDY ERROR]', error);
    return { success: false, error: 'Failed to update case study' };
  }
}

// =============================================================================
// DELETE CASE STUDY
// =============================================================================

export async function deleteCaseStudy(
  slug: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getAdminClient();

    const { data: existing } = await supabase
      .from('case_studies')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (!existing) {
      return { success: false, error: 'Case study not found' };
    }

    const { error } = await supabase
      .from('case_studies')
      .delete()
      .eq('slug', slug);

    if (error) throw error;

    // Audit log
    await logAuditEvent({
      action: 'DELETE',
      resource: 'case_study',
      resourceId: slug,
      details: {},
    });

    // Revalidate paths
    revalidatePath('/admin/case-studies');
    revalidatePath('/work');

    return { success: true };
  } catch (error) {
    console.error('[DELETE CASE STUDY ERROR]', error);
    return { success: false, error: 'Failed to delete case study' };
  }
}

// =============================================================================
// TOGGLE FEATURED STATUS
// =============================================================================

export async function toggleFeatured(
  slug: string
): Promise<{ success: boolean; featured?: boolean; error?: string }> {
  try {
    const supabase = getAdminClient();

    const { data: existing } = await supabase
      .from('case_studies')
      .select('id, metadata')
      .eq('slug', slug)
      .maybeSingle();

    if (!existing) {
      return { success: false, error: 'Case study not found' };
    }

    const metadata = (existing.metadata || {}) as Record<string, unknown>;
    const currentFeatured = metadata.featured === true;
    const newFeatured = !currentFeatured;

    metadata.featured = newFeatured;

    const { error } = await supabase
      .from('case_studies')
      .update({
        metadata,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('slug', slug);

    if (error) throw error;

    // Audit log
    await logAuditEvent({
      action: 'UPDATE',
      resource: 'case_study',
      resourceId: slug,
      details: { featured: newFeatured },
    });

    // Revalidate paths
    revalidatePath('/admin/case-studies');
    revalidatePath('/work');
    revalidatePath(`/work/${slug}`);

    return { success: true, featured: newFeatured };
  } catch (error) {
    console.error('[TOGGLE FEATURED ERROR]', error);
    return { success: false, error: 'Failed to toggle featured status' };
  }
}

// =============================================================================
// REORDER CASE STUDIES
// =============================================================================

export async function reorderCaseStudies(
  orderedSlugs: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getAdminClient();

    for (let index = 0; index < orderedSlugs.length; index++) {
      const slug = orderedSlugs[index];

      const { data: existing } = await supabase
        .from('case_studies')
        .select('id, metadata')
        .eq('slug', slug)
        .maybeSingle();

      if (!existing) continue;

      const metadata = (existing.metadata || {}) as Record<string, unknown>;
      metadata.order = index;

      const { error } = await supabase
        .from('case_studies')      .update({
        metadata,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('slug', slug);

      if (error) throw error;
    }

    // Audit log
    await logAuditEvent({
      action: 'UPDATE',
      resource: 'case_study',
      resourceId: 'batch',
      details: { action: 'reorder', count: orderedSlugs.length },
    });

    // Revalidate paths
    revalidatePath('/admin/case-studies');
    revalidatePath('/work');

    return { success: true };
  } catch (error) {
    console.error('[REORDER CASE STUDIES ERROR]', error);
    return { success: false, error: 'Failed to reorder case studies' };
  }
}

// =============================================================================
// GET FEEDBACK FOR LINKING
// =============================================================================

export async function getApprovedFeedback(): Promise<
  { id: string; clientName: string; testimonial: string; projectSlug?: string }[]
> {
  try {
    const supabase = getAdminClient();

    // Supabase feedback table uses different statuses: 'received', 'acknowledged', 'resolved'
    // We use project_id as the link -> get project slugs from projects table
    const { data, error } = await supabase
      .from('feedback')
      .select('id, project_id, comment, created_at, user_id')
      .in('status', ['acknowledged', 'resolved'])
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !data) return [];

    // Get user names for each feedback entry
    const userIds = [...new Set(data.map(f => f.user_id).filter(Boolean))];
    const { data: userProfiles } = userIds.length > 0
      ? await supabase.from('user_profiles').select('id, full_name, email').in('id', userIds)
      : { data: [] };

    const userMap = new Map((userProfiles || []).map(u => [u.id, u.full_name || u.email]));

    // Get project slugs for linked projects
    const projectIds = [...new Set(data.map(f => f.project_id).filter(Boolean))];
    const { data: projects } = projectIds.length > 0
      ? await supabase.from('projects').select('id, slug').in('id', projectIds)
      : { data: [] };

    const projectMap = new Map((projects || []).map(p => [p.id, p.slug]));

    return data.map((row) => ({
      id: row.id,
      clientName: userMap.get(row.user_id) || 'Unknown',
      testimonial: row.comment || '',
      projectSlug: row.project_id ? projectMap.get(row.project_id) || undefined : undefined,
    }));
  } catch (error) {
    console.error('[GET FEEDBACK ERROR]', error);
    return [];
  }
}

// =============================================================================
// LINK FEEDBACK TO CASE STUDY
// =============================================================================

export async function linkFeedbackToCaseStudy(
  slug: string,
  feedbackId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getAdminClient();

    // Get feedback
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback')
      .select('*')
      .eq('id', feedbackId)
      .maybeSingle();

    if (feedbackError || !feedback) {
      return { success: false, error: 'Feedback not found' };
    }

    // Get user name for the testimonial author
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('full_name, email')
      .eq('id', feedback.user_id)
      .maybeSingle();

    // Update case study with testimonial
    const { data: caseStudy } = await supabase
      .from('case_studies')
      .select('id, metadata')
      .eq('slug', slug)
      .maybeSingle();

    if (!caseStudy) {
      return { success: false, error: 'Case study not found' };
    }

    const metadata = (caseStudy.metadata || {}) as Record<string, unknown>;
    metadata.testimonial = {
      quote: feedback.comment || '',
      author: userProfile?.full_name || userProfile?.email || 'Client',
      role: 'Client',
    };

    const { error: updateError } = await supabase
      .from('case_studies')
      .update({
        metadata,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('slug', slug);

    if (updateError) throw updateError;

    // Link feedback back to case study
    await supabase
      .from('feedback')
      .update({
        case_study_id: caseStudy.id,
      } as any)
      .eq('id', feedbackId);

    // Audit log
    await logAuditEvent({
      action: 'UPDATE',
      resource: 'case_study',
      resourceId: slug,
      details: { linkedFeedback: feedbackId },
    });

    revalidatePath('/admin/case-studies');
    revalidatePath(`/work/${slug}`);

    return { success: true };
  } catch (error) {
    console.error('[LINK FEEDBACK ERROR]', error);
    return { success: false, error: 'Failed to link feedback' };
  }
}
