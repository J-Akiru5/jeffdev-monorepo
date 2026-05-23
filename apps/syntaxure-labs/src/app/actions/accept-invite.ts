'use server';

/**
 * Accept Invite Action
 * --------------------
 * Handles the logic for accepting an invite and creating a new user account.
 * Called from the session API route during login/registration.
 */

import { getAdminClient } from '@/lib/supabase/admin';
import { getInviteByToken } from './invites';

interface AcceptInviteResult {
  success: boolean;
  role?: string;
  error?: string;
}

export async function acceptInvite(token: string, uid: string, email: string): Promise<AcceptInviteResult> {
  try {
    const supabase = getAdminClient() as any;

    // 1. Get and validate invite
    const invite = await getInviteByToken(token);

    if (!invite) {
      return { success: false, error: 'Invalid or expired invite' };
    }

    if (invite.status !== 'pending') {
      return { success: false, error: 'This invite has already been used' };
    }

    // 2. strict email matching
    if (invite.email.toLowerCase() !== email.toLowerCase()) {
      return { 
        success: false, 
        error: `Email mismatch. This invite is for ${invite.email}, but you signed in with ${email}.` 
      };
    }

    // 3. Create or update user profile
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', uid)
      .maybeSingle();

    const userData: Record<string, unknown> = {
      id: uid,
      email,
      full_name: email.split('@')[0], // Default name from email
      role: invite.role as 'admin' | 'manager' | 'employee' | 'client',
      timezone: 'UTC',
      preferences: {
        assigned_projects: invite.projectId ? [invite.projectId] : [],
        invited_by: invite.invitedBy,
        invite_id: invite.id,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (existingUser) {
      // Update existing
      const { error: updateError } = await (supabase as any)
        .from('user_profiles')
        .update({
          ...userData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', uid);

      if (updateError) throw updateError;
    } else {
      // Insert new
      const { error: insertError } = await (supabase as any)
        .from('user_profiles')
        .insert(userData);

      if (insertError) throw insertError;
    }

    // 4. Set app_metadata for RBAC
    await supabase.auth.admin.updateUserById(uid, {
      app_metadata: { role: invite.role },
    });

    if (!invite.id) {
      return { success: false, error: 'Invalid invite ID' };
    }

    // 5. Mark invite as accepted
    const { error: inviteUpdateError } = await (supabase as any)
      .from('invites')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invite.id);

    if (inviteUpdateError) throw inviteUpdateError;

    return { success: true, role: invite.role };
  } catch (error) {
    console.error('[ACCEPT INVITE ERROR]', error);
    return { success: false, error: 'Failed to accept invite' };
  }
}
