'use server';

/**
 * Case Studies Server Actions
 * ----------------------------
 * Complete CRUD operations for managing case studies.
 * Uses the existing `projects` collection in Firestore.
 */

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase/admin';
import { logAuditEvent } from '@/lib/audit';
import type { FirestoreProject } from '@/types/firestore';

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
 * Check if slug already exists
 */
async function slugExists(slug: string, excludeSlug?: string): Promise<boolean> {
  const doc = await db.collection('projects').doc(slug).get();
  if (!doc.exists) return false;
  if (excludeSlug && slug === excludeSlug) return false;
  return true;
}

/**
 * Serialize Firestore data for client components
 */
function serializeCaseStudy(doc: FirebaseFirestore.DocumentSnapshot): FirestoreProject | null {
  if (!doc.exists) return null;
  const data = doc.data();
  if (!data) return null;
  
  return {
    ...data,
    slug: doc.id,
    // Serialize timestamps
    createdAt: data.createdAt?.toDate?.() 
      ? data.createdAt.toDate().toISOString() 
      : data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate?.()
      ? data.updatedAt.toDate().toISOString()
      : data.updatedAt || new Date().toISOString(),
  } as FirestoreProject;
}

// =============================================================================
// GET CASE STUDIES (LIST)
// =============================================================================

export async function getCaseStudies(): Promise<FirestoreProject[]> {
  try {
    const snapshot = await db
      .collection('projects')
      .orderBy('order', 'asc')
      .get();

    return snapshot.docs
      .map((doc) => serializeCaseStudy(doc))
      .filter((item): item is FirestoreProject => item !== null);
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
): Promise<FirestoreProject | null> {
  try {
    const doc = await db.collection('projects').doc(slug).get();
    return serializeCaseStudy(doc);
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

    // Prepare document
    const now = new Date().toISOString();
    const document = {
      ...validated,
      slug,
      // Default project management fields
      status: 'completed' as const,
      progress: 100,
      createdAt: now,
      updatedAt: now,
    };

    // Create in Firestore
    await db.collection('projects').doc(slug).set(document);

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
    // Check if exists
    const docRef = db.collection('projects').doc(slug);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return { success: false, error: 'Case study not found' };
    }

    // Partial validation for updates
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    // Update in Firestore
    await docRef.update(updateData);

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
    const docRef = db.collection('projects').doc(slug);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return { success: false, error: 'Case study not found' };
    }

    // Hard delete
    await docRef.delete();

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
    const docRef = db.collection('projects').doc(slug);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return { success: false, error: 'Case study not found' };
    }

    const currentFeatured = doc.data()?.featured || false;
    const newFeatured = !currentFeatured;

    await docRef.update({
      featured: newFeatured,
      updatedAt: new Date().toISOString(),
    });

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
    const batch = db.batch();
    const now = new Date().toISOString();

    orderedSlugs.forEach((slug, index) => {
      const docRef = db.collection('projects').doc(slug);
      batch.update(docRef, { order: index, updatedAt: now });
    });

    await batch.commit();

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
    const snapshot = await db
      .collection('feedback')
      .where('status', 'in', ['approved', 'featured'])
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        clientName: data.clientName || 'Unknown',
        testimonial: data.testimonial || '',
        projectSlug: data.projectSlug,
      };
    });
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
    // Get feedback
    const feedbackDoc = await db.collection('feedback').doc(feedbackId).get();
    if (!feedbackDoc.exists) {
      return { success: false, error: 'Feedback not found' };
    }

    const feedbackData = feedbackDoc.data()!;

    // Update case study with testimonial
    const docRef = db.collection('projects').doc(slug);
    await docRef.update({
      testimonial: {
        quote: feedbackData.testimonial,
        author: feedbackData.clientName,
        role: feedbackData.company || 'Client',
      },
      updatedAt: new Date().toISOString(),
    });

    // Link feedback back to project
    await db.collection('feedback').doc(feedbackId).update({
      projectSlug: slug,
    });

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
