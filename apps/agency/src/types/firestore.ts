/**
 * Firestore Data Types
 * ---------------------
 * Type definitions for Firestore collections.
 * Separated from static data types to avoid LucideIcon serialization issues.
 */

// =============================================================================
// SERVICE
// =============================================================================
export interface FirestoreService {
  slug: string;
  icon: string; // Icon name: 'Globe', 'Cloud', 'Cpu', 'Sparkles'
  title: string;
  tagline: string;
  description: string;
  features: string[];
  deliverables: string[];
  investment: {
    starting: string;
    timeline: string;
  };
  order: number;
}

// =============================================================================
// PROJECT
// =============================================================================
export type ProjectStatus = 'pending' | 'active' | 'paused' | 'completed';
export type MilestoneStatus = 'pending' | 'in-progress' | 'completed';

export interface ProjectMilestone {
  id: string;
  title: string;
  description?: string;
  status: MilestoneStatus;
  dueDate?: string;
  completedAt?: string;
  order: number;
}

export interface FirestoreProject {
  slug: string;
  refNo?: string;
  title: string;
  client: string;
  category: string;
  tagline: string;
  description: string;
  challenge: string;
  solution: string;
  results: {
    metric: string;
    value: string;
  }[];
  technologies: string[];
  testimonial: {
    quote: string;
    author: string;
    role: string;
  } | null;
  image: string | null;
  featured: boolean;
  order: number;
  // Project Management fields
  status: ProjectStatus;
  progress: number; // 0-100
  deadline?: string;
  startDate?: string;
  budget?: number;
  paidAmount?: number;
  assignedPartner?: string; // User UID
  assignedEmployees?: string[]; // User UIDs
  milestones?: ProjectMilestone[];
  createdAt?: string;
  updatedAt?: string;
}

// =============================================================================
// QUOTE
// =============================================================================
export interface FirestoreQuote {
  id?: string;
  projectType: string;
  budget: string;
  timeline: string;
  name: string;
  email: string;
  company?: string;
  details: string;
  status: 'new' | 'contacted' | 'in-progress' | 'closed';
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// MESSAGE
// =============================================================================
export interface FirestoreMessage {
  id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'responded';
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// CALENDAR EVENT
// =============================================================================
export type EventType = 'deadline' | 'meeting' | 'milestone' | 'reminder' | 'holiday';

export interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  type: EventType;
  start: string; // ISO date string
  end?: string; // ISO date string (optional for all-day events)
  allDay?: boolean;
  projectSlug?: string; // Link to project
  color?: string; // Custom color override
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// =============================================================================
// FEEDBACK (Client Testimonials/Reviews)
// =============================================================================
export type FeedbackStatus = 'pending' | 'approved' | 'featured' | 'rejected';

export interface FirestoreFeedback {
  id?: string;
  clientName: string;
  clientEmail: string;
  company?: string;
  projectSlug?: string; // Link to related project
  rating: number; // 1-5
  testimonial: string;
  status: FeedbackStatus;
  featured: boolean; // Show on public site
  createdAt: string;
  updatedAt: string;
}
