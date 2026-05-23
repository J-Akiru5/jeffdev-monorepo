'use server';

/**
 * Projects CRUD Actions
 * ---------------------
 * Server actions for managing projects in Supabase.
 */
import { getAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { logAuditEvent } from '@/lib/audit';

// Validation schema
const projectSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  title: z.string().min(1).max(100),
  client: z.string().min(1).max(100),
  category: z.string().min(1).max(50),
  tagline: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  challenge: z.string().min(1).max(1000),
  solution: z.string().min(1).max(1000),
  results: z.array(z.object({
    metric: z.string().min(1),
    value: z.string().min(1),
  })).min(1).max(5),
  technologies: z.array(z.string()).min(1).max(10),
  testimonial: z.object({
    quote: z.string().min(1),
    author: z.string().min(1),
    role: z.string().min(1),
  }).nullable(),
  image: z.string().nullable(),
  featured: z.boolean(),
  order: z.number().int().min(1),
});

export type ProjectFormData = z.infer<typeof projectSchema>;

interface ActionResult {
  success: boolean;
  error?: string;
}

/**
 * Get simple list of projects for dropdown selection
 * Returns only slug and title for efficiency
 */
export async function getProjectsList(): Promise<{ slug: string; title: string }[]> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('projects')
      .select('slug, title');

    if (error) throw error;

    return (data || []).map((project: any) => ({
      slug: project.slug || '',
      title: project.title,
    }));
  } catch (error) {
    console.error('[GET PROJECTS LIST ERROR]', error);
    return [];
  }
}

/**
 * Create a new project
 */
export async function createProject(data: ProjectFormData): Promise<ActionResult> {
  try {
    const validated = projectSchema.parse(data);
    const supabase = getAdminClient();

    // Check if slug already exists
    const { data: existing } = await supabase
      .from('projects')
      .select('id')
      .eq('slug', validated.slug)
      .maybeSingle();

    if (existing) {
      return { success: false, error: 'A project with this slug already exists' };
    }

    // Insert new project
    const { error } = await supabase
      .from('projects')
      .insert([{
        user_id: '', // Will be set by RLS policy or auth context
        title: validated.title,
        description: validated.description,
        slug: validated.slug,
        status: 'active' as const,
        client_name: validated.client,
        metadata: {
          category: validated.category,
          tagline: validated.tagline,
          challenge: validated.challenge,
          solution: validated.solution,
          results: validated.results,
          technologies: validated.technologies,
          testimonial: validated.testimonial,
          image: validated.image,
          featured: validated.featured,
          order: validated.order,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }] as any);

    if (error) throw error;

    await logAuditEvent({
      action: 'CREATE',
      resource: 'projects',
      resourceId: validated.slug,
      details: { title: validated.title },
    });

    revalidatePath('/work');
    revalidatePath('/admin/projects');

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error('[CREATE PROJECT ERROR]', error);
    return { success: false, error: 'Failed to create project' };
  }
}

/**
 * Update an existing project
 */
export async function updateProject(
  slug: string,
  data: ProjectFormData
): Promise<ActionResult> {
  try {
    const validated = projectSchema.parse(data);
    const supabase = getAdminClient();

    // Check if current slug exists
    const { data: existing } = await supabase
      .from('projects')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (!existing) {
      return { success: false, error: 'Project not found' };
    }

    // If slug is changing, check if new slug exists
    if (slug !== validated.slug) {
      const { data: newSlugExists } = await supabase
        .from('projects')
        .select('id')
        .eq('slug', validated.slug)
        .maybeSingle();

      if (newSlugExists) {
        return { success: false, error: 'A project with the new slug already exists' };
      }

      // Delete old record and insert new one (since slug is primary identifier)
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('slug', slug);

      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from('projects')
        .insert([{
          user_id: '',
          title: validated.title,
          description: validated.description,
          slug: validated.slug,
          status: 'active' as const,
          client_name: validated.client,
          metadata: {
            category: validated.category,
            tagline: validated.tagline,
            challenge: validated.challenge,
            solution: validated.solution,
            results: validated.results,
            technologies: validated.technologies,
            testimonial: validated.testimonial,
            image: validated.image,
            featured: validated.featured,
            order: validated.order,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }] as any);

      if (insertError) throw insertError;
    } else {
      // Update existing record
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          title: validated.title,
          description: validated.description,
          client_name: validated.client,
          metadata: {
            category: validated.category,
            tagline: validated.tagline,
            challenge: validated.challenge,
            solution: validated.solution,
            results: validated.results,
            technologies: validated.technologies,
            testimonial: validated.testimonial,
            image: validated.image,
            featured: validated.featured,
            order: validated.order,
          },
          updated_at: new Date().toISOString(),
        } as any)
        .eq('slug', slug);

      if (updateError) throw updateError;
    }

    await logAuditEvent({
      action: 'UPDATE',
      resource: 'projects',
      resourceId: validated.slug,
      details: { title: validated.title, oldSlug: slug !== validated.slug ? slug : undefined },
    });

    revalidatePath('/work');
    revalidatePath('/admin/projects');
    revalidatePath(`/work/${slug}`);
    if (slug !== validated.slug) {
      revalidatePath(`/work/${validated.slug}`);
    }

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error('[UPDATE PROJECT ERROR]', error);
    return { success: false, error: 'Failed to update project' };
  }
}

/**
 * Delete a project
 */
export async function deleteProject(slug: string): Promise<ActionResult> {
  try {
    const supabase = getAdminClient();

    const { data: existing, error: fetchError } = await supabase
      .from('projects')
      .select('title')
      .eq('slug', slug)
      .maybeSingle();

    if (fetchError || !existing) {
      return { success: false, error: 'Project not found' };
    }

    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('slug', slug);

    if (deleteError) throw deleteError;

    await logAuditEvent({
      action: 'DELETE',
      resource: 'projects',
      resourceId: slug,
      details: { title: existing.title },
    });

    revalidatePath('/work');
    revalidatePath('/admin/projects');

    return { success: true };
  } catch (error) {
    console.error('[DELETE PROJECT ERROR]', error);
    return { success: false, error: 'Failed to delete project' };
  }
}