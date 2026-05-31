"use server";

import { z } from "zod";
import { getAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import {
  communityWelcomeEmail,
  communityAdminNotification,
} from "@/lib/emails/community-emails";
import type { CommunityPost, CommunityMember } from "@/types/database";

// =============================================================================
// PUBLIC: Fetch published community posts
// =============================================================================

export interface CommunityPostWithAuthor extends CommunityPost {
  author: CommunityMember | null;
}

export async function getPublishedCommunityPosts(): Promise<CommunityPostWithAuthor[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getAdminClient() as any;

    const { data, error } = await supabase
      .from("community_posts")
      .select("*, author:community_members(*)")
      .eq("is_published", true)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data ?? []) as CommunityPostWithAuthor[];
  } catch (error) {
    console.error("[community] getPublishedCommunityPosts error:", error);
    return [];
  }
}

// =============================================================================
// REGISTRATION
// =============================================================================

const registrationSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  fullName: z.string().min(1, "Full name is required"),
  githubUsername: z.string().optional(),
  discordHandle: z.string().optional(),
  primaryRole: z.string().optional().default("developer"),
  interests: z.string().optional(),
});

export async function registerCommunityMember(data: {
  email: string;
  fullName: string;
  githubUsername?: string;
  discordHandle?: string;
  primaryRole?: string;
  interests?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const validated = registrationSchema.parse(data);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getAdminClient() as any;

    // Check if email already registered
    const { data: existing, error: checkError } = await supabase
      .from("community_members")
      .select("id")
      .eq("email", validated.email)
      .limit(1);

    if (checkError) throw checkError;
    if (existing && existing.length > 0) {
      return { success: false, error: "This email is already registered in our community!" };
    }

    // Insert new member
    const { error: insertError } = await supabase
      .from("community_members")
      .insert({
        email: validated.email,
        full_name: validated.fullName,
        github_username: validated.githubUsername || null,
        discord_handle: validated.discordHandle || null,
        primary_role: validated.primaryRole,
        interests: validated.interests || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (insertError) throw insertError;

    // Send welcome email to new member
    await sendEmail({
      to: validated.email,
      subject: "Welcome to the Syntaxure Labs Community",
      html: communityWelcomeEmail({ fullName: validated.fullName }),
    });

    // Notify administrator
    await sendEmail({
      to: "jeff@syntaxure.dev",
      subject: `[Community] New Registration: ${validated.fullName}`,
      html: communityAdminNotification({
        fullName: validated.fullName,
        email: validated.email,
        githubUsername: validated.githubUsername,
        discordHandle: validated.discordHandle,
        primaryRole: validated.primaryRole,
        interests: validated.interests,
      }),
    });

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues?.[0]?.message || "Invalid registration data";
      return { success: false, error: message };
    }
    console.error("[COMMUNITY REGISTRATION ERROR]", error);
    return { success: false, error: "Failed to complete registration. Please try again." };
  }
}
