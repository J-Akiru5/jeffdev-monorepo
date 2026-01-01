'use server';

/**
 * Project Management Server Actions
 * -----------------------------------
 * CRUD for projects, milestones, and status updates.
 */

import { z } from 'zod';
import { db } from '@/lib/firebase/admin';
import { logAuditEvent } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import type { ProjectStatus, MilestoneStatus } from '@/types/firestore';

// Validation schemas
const milestoneSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['pending', 'in-progress', 'completed']),
  dueDate: z.string().optional(),
  completedAt: z.string().optional(),
  order: z.number(),
});

const projectUpdateSchema = z.object({
  status: z.enum(['pending', 'active', 'paused', 'completed']).optional(),
  progress: z.number().min(0).max(100).optional(),
  deadline: z.string().optional(),
  startDate: z.string().optional(),
  budget: z.number().optional(),
  paidAmount: z.number().optional(),
  assignedPartner: z.string().optional(),
  assignedEmployees: z.array(z.string()).optional(),
});

/**
 * Update project status
 */
export async function updateProjectStatus(
  slug: string,
  status: ProjectStatus
) {
  try {
    const snapshot = await db
      .collection('projects')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { success: false, error: 'Project not found' };
    }

    const docRef = snapshot.docs[0].ref;
    const oldStatus = snapshot.docs[0].data().status;

    await docRef.update({
      status,
      updatedAt: new Date().toISOString(),
    });

    await logAuditEvent({
      action: 'STATUS_CHANGE',
      resource: 'projects',
      resourceId: slug,
      details: { oldStatus, newStatus: status },
    });

    revalidatePath('/admin/projects');
    revalidatePath(`/admin/projects/${slug}`);

    return { success: true };
  } catch (error) {
    console.error('[UPDATE PROJECT STATUS ERROR]', error);
    return { success: false, error: 'Failed to update status' };
  }
}

/**
 * Update project progress (0-100)
 */
export async function updateProjectProgress(
  slug: string,
  progress: number
) {
  try {
    const validProgress = Math.max(0, Math.min(100, progress));

    const snapshot = await db
      .collection('projects')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { success: false, error: 'Project not found' };
    }

    const docRef = snapshot.docs[0].ref;

    await docRef.update({
      progress: validProgress,
      updatedAt: new Date().toISOString(),
    });

    await logAuditEvent({
      action: 'UPDATE',
      resource: 'projects',
      resourceId: slug,
      details: { field: 'progress', value: validProgress },
    });

    revalidatePath('/admin/projects');
    revalidatePath(`/admin/projects/${slug}`);

    return { success: true };
  } catch (error) {
    console.error('[UPDATE PROJECT PROGRESS ERROR]', error);
    return { success: false, error: 'Failed to update progress' };
  }
}

/**
 * Update project details (deadline, budget, assignments)
 */
export async function updateProjectDetails(
  slug: string,
  data: z.infer<typeof projectUpdateSchema>
) {
  try {
    const validated = projectUpdateSchema.parse(data);

    const snapshot = await db
      .collection('projects')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { success: false, error: 'Project not found' };
    }

    const docRef = snapshot.docs[0].ref;

    await docRef.update({
      ...validated,
      updatedAt: new Date().toISOString(),
    });

    await logAuditEvent({
      action: 'UPDATE',
      resource: 'projects',
      resourceId: slug,
      details: validated,
    });

    revalidatePath('/admin/projects');
    revalidatePath(`/admin/projects/${slug}`);

    return { success: true };
  } catch (error) {
    console.error('[UPDATE PROJECT DETAILS ERROR]', error);
    return { success: false, error: 'Failed to update project' };
  }
}

/**
 * Add milestone to project
 */
export async function addMilestone(
  slug: string,
  milestone: Omit<z.infer<typeof milestoneSchema>, 'id'>
) {
  try {
    const snapshot = await db
      .collection('projects')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { success: false, error: 'Project not found' };
    }

    const docRef = snapshot.docs[0].ref;
    const project = snapshot.docs[0].data();
    const milestones = project.milestones || [];

    const newMilestone = {
      ...milestone,
      id: `ms-${Date.now()}`,
    };

    await docRef.update({
      milestones: [...milestones, newMilestone],
      updatedAt: new Date().toISOString(),
    });

    await logAuditEvent({
      action: 'CREATE',
      resource: 'projects',
      resourceId: slug,
      details: { milestone: newMilestone.title },
    });

    revalidatePath(`/admin/projects/${slug}`);

    return { success: true, milestone: newMilestone };
  } catch (error) {
    console.error('[ADD MILESTONE ERROR]', error);
    return { success: false, error: 'Failed to add milestone' };
  }
}

/**
 * Update milestone status
 */
export async function updateMilestoneStatus(
  slug: string,
  milestoneId: string,
  status: MilestoneStatus
) {
  try {
    const snapshot = await db
      .collection('projects')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { success: false, error: 'Project not found' };
    }

    const docRef = snapshot.docs[0].ref;
    const project = snapshot.docs[0].data();
    const milestones = project.milestones || [];

    const updatedMilestones = milestones.map((m: { id: string }) => {
      if (m.id === milestoneId) {
        return {
          ...m,
          status,
          completedAt: status === 'completed' ? new Date().toISOString() : null,
        };
      }
      return m;
    });

    // Calculate progress based on completed milestones
    const completedCount = updatedMilestones.filter(
      (m: { status: string }) => m.status === 'completed'
    ).length;
    const progress = milestones.length > 0
      ? Math.round((completedCount / milestones.length) * 100)
      : 0;

    await docRef.update({
      milestones: updatedMilestones,
      progress,
      updatedAt: new Date().toISOString(),
    });

    await logAuditEvent({
      action: 'STATUS_CHANGE',
      resource: 'projects',
      resourceId: slug,
      details: { milestoneId, status },
    });

    revalidatePath(`/admin/projects/${slug}`);

    return { success: true, progress };
  } catch (error) {
    console.error('[UPDATE MILESTONE STATUS ERROR]', error);
    return { success: false, error: 'Failed to update milestone' };
  }
}

/**
 * Delete milestone
 */
export async function deleteMilestone(slug: string, milestoneId: string) {
  try {
    const snapshot = await db
      .collection('projects')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { success: false, error: 'Project not found' };
    }

    const docRef = snapshot.docs[0].ref;
    const project = snapshot.docs[0].data();
    const milestones = project.milestones || [];

    const updatedMilestones = milestones.filter(
      (m: { id: string }) => m.id !== milestoneId
    );

    await docRef.update({
      milestones: updatedMilestones,
      updatedAt: new Date().toISOString(),
    });

    await logAuditEvent({
      action: 'DELETE',
      resource: 'projects',
      resourceId: slug,
      details: { milestoneId },
    });

    revalidatePath(`/admin/projects/${slug}`);

    return { success: true };
  } catch (error) {
    console.error('[DELETE MILESTONE ERROR]', error);
    return { success: false, error: 'Failed to delete milestone' };
  }
}
