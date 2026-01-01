/**
 * User Types
 * ----------
 * Type definitions for user profiles and authentication.
 */

import type { UserRole } from './rbac';

// =============================================================================
// USER PROFILE
// =============================================================================
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  title?: string; // Job title (e.g., "Lead Developer", "Project Manager")
  phone?: string;
  location?: string;
  timezone?: string;
  social?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    website?: string;
  };
  role: UserRole;
  status: 'active' | 'inactive' | 'pending';
  assignedProjects?: string[]; // Project slugs for partners
  permissions?: string[];      // Granular permission overrides
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  // Namecard settings
  namecard?: {
    username: string; // Unique URL slug for /card/[username]
    tagline?: string;
    showEmail: boolean;
    showPhone: boolean;
    accentColor?: string; // Custom accent color
    background?: string; // Preset or image URL
    socials?: {
      linkedin?: boolean;
      github?: boolean;
      twitter?: boolean;
      website?: boolean;
    };
  };
}

// =============================================================================
// NAMECARD (Public Display)
// =============================================================================
export interface PublicNamecard {
  username: string;
  displayName: string;
  title?: string;
  tagline?: string;
  photoURL?: string;
  bio?: string;
  email?: string; // Only if showEmail is true
  phone?: string; // Only if showPhone is true
  social?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    website?: string;
  };
  accentColor?: string;
  background?: string;
}

// =============================================================================
// USER INVITE
// =============================================================================
export interface UserInvite {
  id?: string;
  email: string;
  role: UserRole;
  invitedBy: string; // UID of inviter
  status: 'pending' | 'accepted' | 'expired';
  token: string; // Unique invite token
  expiresAt: string;
  createdAt: string;
  projectId?: string;   // Optional: assign to specific project
  projectName?: string; // Optional: display in invite email
}

