'use server';

/**
 * User Invite Server Actions
 * --------------------------
 * Magic link invite system for onboarding team members.
 * Flow: Create invite → Send email → User clicks link → Complete signup
 */

import { getAdminClient } from '@/lib/supabase/admin';
import type { UserRole } from '@/types/rbac';
import { logAuditEvent } from '@/lib/audit';
import { randomBytes } from 'crypto';
import { sendEmail, inviteEmailTemplate, BRANDED_SENDER } from '@/lib/email';

// Founder UID - locked to single account
const FOUNDER_UID = process.env.FOUNDER_UID || 'founder-001';

// Base URL for invite links
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://jeffdev.studio';

/**
 * Generate a secure invite token
 */
function generateInviteToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Create a new invite (Founder/Admin only)
 * Automatically sends invite email via Resend
 */
export async function createInvite(
  data: {
    email: string;
    role: UserRole;
    invitedBy: string;
    projectId?: string;
    projectName?: string;
  }
): Promise<{ success: boolean; inviteId?: string; token?: string; error?: string }> {
  try {
    const supabase = getAdminClient();

    // Validate role (prevent creating Founder invites)
    if (data.role === 'founder') {
      return { success: false, error: 'Cannot create founder invites' };
    }

    // Map UserRole to Supabase role
    const supabaseRole = mapRoleToSupabase(data.role);

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', data.email)
      .maybeSingle();

    if (existingUser) {
      return { success: false, error: 'User with this email already exists' };
    }

    // Check for pending invite
    const { data: existingInvite } = await supabase
      .from('invites')
      .select('id')
      .eq('email', data.email)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingInvite) {
      return { success: false, error: 'Pending invite already exists for this email' };
    }

    // Get inviter's name for the email
    let inviterName: string | undefined;
    const { data: inviterProfile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', data.invitedBy)
      .maybeSingle();

    if (inviterProfile) {
      inviterName = inviterProfile.full_name || undefined;
    }

    // Create invite
    const token = generateInviteToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const { data: inviteResult, error: inviteError } = await supabase
      .from('invites')
      .insert({
        user_id: data.invitedBy,
        email: data.email,
        role: supabaseRole,
        token,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        metadata: {
          ...(data.projectId && { projectId: data.projectId }),
          ...(data.projectName && { projectName: data.projectName }),
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any)
      .select('id')
      .single();

    if (inviteError) throw inviteError;

    // Send invite email via Resend
    const inviteLink = `${BASE_URL}/auth/invite/${token}`;

    try {
      await sendEmail({
        to: data.email,
        from: BRANDED_SENDER,
        subject: `You're invited to join Syntaxure Labs as ${data.role}`,
        html: inviteEmailTemplate({
          email: data.email,
          role: data.role,
          inviteLink,
          inviterName,
          projectName: data.projectName,
          expiresAt: expiresAt.toISOString(),
        }),
      });
    } catch (emailError) {
      console.error('[INVITE EMAIL SEND ERROR]', emailError);
      // Don't fail the invite creation, just log the error
    }

    await logAuditEvent({
      action: 'CREATE',
      resource: 'users',
      resourceId: inviteResult.id,
      details: {
        email: data.email,
        role: data.role,
        type: 'invite',
        projectId: data.projectId,
        emailSent: true,
      },
    });

    return { success: true, inviteId: inviteResult.id, token };
  } catch (error) {
    console.error('[CREATE INVITE ERROR]', error);
    return { success: false, error: 'Failed to create invite' };
  }
}

/**
 * Get invite by token
 */
export async function getInviteByToken(token: string): Promise<{
  id: string;
  email: string;
  role: string;
  invitedBy: string;
  status: string;
  token: string;
  expiresAt: string;
  projectId?: string;
  projectName?: string;
} | null> {
  try {
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from('invites')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .maybeSingle();

    if (error || !data) return null;

    const metadata = (data.metadata || {}) as Record<string, string>;

    // Check if expired
    if (new Date(data.expires_at) < new Date()) {
      await supabase
        .from('invites')
        .update({ status: 'expired' } as any)
        .eq('id', data.id);

      return null;
    }

    return {
      id: data.id,
      email: data.email,
      role: data.role,
      invitedBy: data.user_id,
      status: data.status,
      token: data.token,
      expiresAt: data.expires_at,
      projectId: metadata.projectId,
      projectName: metadata.projectName,
    };
  } catch (error) {
    console.error('[GET INVITE BY TOKEN ERROR]', error);
    return null;
  }
}

/**
 * Complete invite (after magic link authentication)
 */
export async function completeInvite(
  token: string,
  uid: string,
  displayName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getAdminClient();

    const invite = await getInviteByToken(token);
    if (!invite) {
      return { success: false, error: 'Invalid or expired invite' };
    }

    // Map Supabase role back to UserRole if needed
    const role = invite.role as UserRole;

    // Create user profile in Supabase
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: uid,
        email: invite.email,
        full_name: displayName,
        role: invite.role as 'admin' | 'manager' | 'employee' | 'client',
        timezone: 'UTC',
        preferences: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any);

    if (profileError) throw profileError;

    // Set app_metadata for role-based access (using service_role key)
    await supabase.auth.admin.updateUserById(uid, {
      app_metadata: { role },
    });

    // Mark invite as accepted
    const { error: updateError } = await supabase
      .from('invites')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      } as any)
      .eq('id', invite.id);

    if (updateError) throw updateError;

    await logAuditEvent({
      action: 'CREATE',
      resource: 'users',
      resourceId: uid,
      details: { email: invite.email, role, type: 'signup_complete' },
    });

    return { success: true };
  } catch (error) {
    console.error('[COMPLETE INVITE ERROR]', error);
    return { success: false, error: 'Failed to complete signup' };
  }
}

/**
 * Get all invites
 */
export async function getInvites(): Promise<{
  id: string;
  email: string;
  role: string;
  invitedBy: string;
  status: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  projectName?: string;
}[]> {
  try {
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from('invites')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((row) => {
      const metadata = (row.metadata || {}) as Record<string, string>;
      return {
        id: row.id,
        email: row.email,
        role: row.role,
        invitedBy: row.user_id,
        status: row.status,
        token: row.token,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
        projectName: metadata.projectName,
      };
    });
  } catch (error) {
    console.error('[GET INVITES ERROR]', error);
    return [];
  }
}

/**
 * Revoke an invite
 */
export async function revokeInvite(
  inviteId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getAdminClient();

    const { error } = await supabase
      .from('invites')
      .update({ status: 'expired' } as any)
      .eq('id', inviteId);

    if (error) throw error;

    await logAuditEvent({
      action: 'DELETE',
      resource: 'users',
      resourceId: inviteId,
      details: { type: 'invite_revoked' },
    });

    return { success: true };
  } catch (error) {
    console.error('[REVOKE INVITE ERROR]', error);
    return { success: false, error: 'Failed to revoke invite' };
  }
}

/**
 * Resend invite with new token and extended expiry
 */
export async function resendInvite(
  inviteId: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const supabase = getAdminClient();

    const { data: invite, error: fetchError } = await supabase
      .from('invites')
      .select('*')
      .eq('id', inviteId)
      .maybeSingle();

    if (fetchError || !invite) {
      return { success: false, error: 'Invite not found' };
    }

    // Can only resend pending invites
    if (invite.status !== 'pending') {
      return { success: false, error: 'Can only resend pending invites' };
    }

    // Generate new token and extend expiry
    const newToken = generateInviteToken();
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    const { error: updateError } = await supabase
      .from('invites')
      .update({
        token: newToken,
        expires_at: newExpiresAt.toISOString(),
      } as any)
      .eq('id', inviteId);

    if (updateError) throw updateError;

    // Send new invite email
    const inviteLink = `${BASE_URL}/auth/invite/${newToken}`;
    const metadata = (invite.metadata || {}) as Record<string, string>;

    try {
      await sendEmail({
        to: invite.email,
        from: BRANDED_SENDER,
        subject: `Action Required: Accept Your Invitation to Syntaxure Labs`,
        html: inviteEmailTemplate({
          email: invite.email,
          role: invite.role,
          inviteLink,
          projectName: metadata.projectName,
          expiresAt: newExpiresAt.toISOString(),
        }),
      });
    } catch (emailError) {
      console.error('[RESEND INVITE EMAIL ERROR]', emailError);
    }

    await logAuditEvent({
      action: 'UPDATE',
      resource: 'users',
      resourceId: inviteId,
      details: { type: 'invite_resent', email: invite.email },
    });

    return { success: true, token: newToken };
  } catch (error) {
    console.error('[RESEND INVITE ERROR]', error);
    return { success: false, error: 'Failed to resend invite' };
  }
}

/**
 * Update user role (with Founder protection)
 */
export async function updateUserRole(
  uid: string,
  newRole: UserRole,
  updatedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getAdminClient();

    // Founder protection: Cannot change Founder's role
    if (uid === FOUNDER_UID) {
      return { success: false, error: 'Cannot modify Founder account' };
    }

    // Cannot promote to Founder
    if (newRole === 'founder') {
      return { success: false, error: 'Cannot promote to Founder role' };
    }

    const supabaseRole = mapRoleToSupabase(newRole);

    const { error } = await supabase
      .from('user_profiles')
      .update({
        role: supabaseRole,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', uid);

    if (error) throw error;

    // Update app_metadata for role-based access
    await supabase.auth.admin.updateUserById(uid, {
      app_metadata: { role: newRole },
    });

    await logAuditEvent({
      action: 'UPDATE',
      resource: 'users',
      resourceId: uid,
      details: { newRole, updatedBy },
    });

    return { success: true };
  } catch (error) {
    console.error('[UPDATE USER ROLE ERROR]', error);
    return { success: false, error: 'Failed to update role' };
  }
}

/**
 * Assign projects to a Partner/Employee
 */
export async function assignProjects(
  uid: string,
  projectSlugs: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getAdminClient();

    // Founder protection
    if (uid === FOUNDER_UID) {
      return { success: false, error: 'Cannot modify Founder account' };
    }

    // Get existing preferences to merge
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('preferences')
      .eq('id', uid)
      .maybeSingle();

    const existingPrefs = (existing?.preferences || {}) as Record<string, unknown>;

    const { error } = await supabase
      .from('user_profiles')
      .update({
        preferences: { ...existingPrefs, assigned_projects: projectSlugs },
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', uid);

    if (error) throw error;

    await logAuditEvent({
      action: 'UPDATE',
      resource: 'users',
      resourceId: uid,
      details: { assignedProjects: projectSlugs },
    });

    return { success: true };
  } catch (error) {
    console.error('[ASSIGN PROJECTS ERROR]', error);
    return { success: false, error: 'Failed to assign projects' };
  }
}

/**
 * Deactivate user (soft delete)
 */
export async function deactivateUser(
  uid: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getAdminClient();

    // Founder protection
    if (uid === FOUNDER_UID) {
      return { success: false, error: 'Cannot deactivate Founder account' };
    }

    // Get existing preferences to merge (user_profiles has no status column)
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('preferences')
      .eq('id', uid)
      .maybeSingle();

    const existingPrefs = (existing?.preferences || {}) as Record<string, unknown>;

    const { error } = await supabase
      .from('user_profiles')
      .update({
        preferences: { ...existingPrefs, status: 'inactive' },
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', uid);

    if (error) throw error;

    // Disable in Supabase Auth
    await supabase.auth.admin.updateUserById(uid, { ban_duration: '24h' });

    await logAuditEvent({
      action: 'DELETE',
      resource: 'users',
      resourceId: uid,
      details: { type: 'deactivated' },
    });

    return { success: true };
  } catch (error) {
    console.error('[DEACTIVATE USER ERROR]', error);
    return { success: false, error: 'Failed to deactivate user' };
  }
}

/**
 * Map UserRole to Supabase role enum
 */
function mapRoleToSupabase(role: UserRole): 'admin' | 'manager' | 'employee' | 'client' {
  switch (role) {
    case 'founder':
    case 'admin':
      return 'admin';
    case 'partner':
      return 'manager';
    case 'employee':
      return 'employee';
    default:
      return 'employee';
  }
}
