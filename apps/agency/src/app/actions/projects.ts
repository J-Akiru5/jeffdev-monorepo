'use server';

/**
 * Projects CRUD Actions
 * ---------------------
 * Server actions for managing projects in Firestore.
 */

import { db } from '@/lib/firebase/admin';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { FirestoreProject } from '@/types/firestore';
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
    const snapshot = await db.collection('projects').orderBy('title').get();
    return snapshot.docs.map((doc) => ({
      slug: doc.id,
      title: (doc.data() as FirestoreProject).title,
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
    
    const existing = await db.collection('projects').doc(validated.slug).get();
    if (existing.exists) {
      return { success: false, error: 'A project with this slug already exists' };
    }
    
    await db.collection('projects').doc(validated.slug).set(validated);
    
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
    
    const existing = await db.collection('projects').doc(slug).get();
    if (!existing.exists) {
      return { success: false, error: 'Project not found' };
    }
    
    if (slug !== validated.slug) {
      const newExists = await db.collection('projects').doc(validated.slug).get();
      if (newExists.exists) {
        return { success: false, error: 'A project with the new slug already exists' };
      }
      await db.collection('projects').doc(slug).delete();
      await db.collection('projects').doc(validated.slug).set(validated);
    } else {
      await db.collection('projects').doc(slug).set(validated, { merge: true });
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
    const existing = await db.collection('projects').doc(slug).get();
    if (!existing.exists) {
      return { success: false, error: 'Project not found' };
    }
    
    const data = existing.data() as FirestoreProject;
    await db.collection('projects').doc(slug).delete();
    
    await logAuditEvent({
      action: 'DELETE',
      resource: 'projects',
      resourceId: slug,
      details: { title: data.title },
    });
    
    revalidatePath('/work');
    revalidatePath('/admin/projects');
    
    return { success: true };
  } catch (error) {
    console.error('[DELETE PROJECT ERROR]', error);
    return { success: false, error: 'Failed to delete project' };
  }
}
