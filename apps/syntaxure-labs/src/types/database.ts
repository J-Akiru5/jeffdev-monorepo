/**
 * Supabase Database Types
 * ----------------------
 * Auto-generated from Supabase schema.
 * Represents all tables in the PostgreSQL database.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: "admin" | "manager" | "employee" | "client";
          tier: "free" | "pro" | "enterprise";
          avatar_url: string | null;
          bio: string | null;
          company_name: string | null;
          phone: string | null;
          timezone: string;
          preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: "admin" | "manager" | "employee" | "client";
          tier?: "free" | "pro" | "enterprise";
          avatar_url?: string | null;
          bio?: string | null;
          company_name?: string | null;
          phone?: string | null;
          timezone?: string;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: "admin" | "manager" | "employee" | "client";
          tier?: "free" | "pro" | "enterprise";
          avatar_url?: string | null;
          bio?: string | null;
          company_name?: string | null;
          phone?: string | null;
          timezone?: string;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      services: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category: string;
          price_min: string | null;
          price_max: string | null;
          status: "active" | "inactive" | "archived";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          category: string;
          price_min?: string | null;
          price_max?: string | null;
          status?: "active" | "inactive" | "archived";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          category?: string;
          price_min?: string | null;
          price_max?: string | null;
          status?: "active" | "inactive" | "archived";
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          slug: string | null;
          status: "active" | "paused" | "completed" | "archived";
          start_date: string | null;
          end_date: string | null;
          budget: string | null;
          budget_spent: string;
          client_name: string | null;
          client_email: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          slug?: string | null;
          status?: "active" | "paused" | "completed" | "archived";
          start_date?: string | null;
          end_date?: string | null;
          budget?: string | null;
          budget_spent?: string;
          client_name?: string | null;
          client_email?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          slug?: string | null;
          status?: "active" | "paused" | "completed" | "archived";
          start_date?: string | null;
          end_date?: string | null;
          budget?: string | null;
          budget_spent?: string;
          client_name?: string | null;
          client_email?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      milestones: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string | null;
          due_date: string;
          status: "pending" | "in_progress" | "completed" | "blocked";
          deliverables: string[] | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string | null;
          due_date: string;
          status?: "pending" | "in_progress" | "completed" | "blocked";
          deliverables?: string[] | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          description?: string | null;
          due_date?: string;
          status?: "pending" | "in_progress" | "completed" | "blocked";
          deliverables?: string[] | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      quotes: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          title: string;
          description: string | null;
          amount: string;
          status: "draft" | "sent" | "accepted" | "rejected" | "expired";
          valid_until: string | null;
          line_items: Json;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          title: string;
          description?: string | null;
          amount: string;
          status?: "draft" | "sent" | "accepted" | "rejected" | "expired";
          valid_until?: string | null;
          line_items?: Json;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          title?: string;
          description?: string | null;
          amount?: string;
          status?: "draft" | "sent" | "accepted" | "rejected" | "expired";
          valid_until?: string | null;
          line_items?: Json;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          user_id: string;
          quote_id: string | null;
          project_id: string | null;
          invoice_number: string;
          amount: string;
          tax_amount: string;
          total_amount: string;
          status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
          issued_date: string;
          due_date: string;
          paid_date: string | null;
          line_items: Json;
          notes: string | null;
          payment_method: string | null;
          payment_terms: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          quote_id?: string | null;
          project_id?: string | null;
          invoice_number: string;
          amount: string;
          tax_amount?: string;
          total_amount: string;
          status?: "draft" | "sent" | "paid" | "overdue" | "cancelled";
          issued_date: string;
          due_date: string;
          paid_date?: string | null;
          line_items?: Json;
          notes?: string | null;
          payment_method?: string | null;
          payment_terms?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          quote_id?: string | null;
          project_id?: string | null;
          invoice_number?: string;
          amount?: string;
          tax_amount?: string;
          total_amount?: string;
          status?: "draft" | "sent" | "paid" | "overdue" | "cancelled";
          issued_date?: string;
          due_date?: string;
          paid_date?: string | null;
          line_items?: Json;
          notes?: string | null;
          payment_method?: string | null;
          payment_terms?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      calendar_events: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          title: string;
          description: string | null;
          start_time: string;
          end_time: string;
          location: string | null;
          event_type: "meeting" | "deadline" | "review" | "delivery" | "other";
          color: string | null;
          reminders: Json;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          title: string;
          description?: string | null;
          start_time: string;
          end_time: string;
          location?: string | null;
          event_type?: "meeting" | "deadline" | "review" | "delivery" | "other";
          color?: string | null;
          reminders?: Json;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          title?: string;
          description?: string | null;
          start_time?: string;
          end_time?: string;
          location?: string | null;
          event_type?: "meeting" | "deadline" | "review" | "delivery" | "other";
          color?: string | null;
          reminders?: Json;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      case_studies: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          title: string;
          description: string | null;
          slug: string | null;
          industry: string | null;
          challenge: string | null;
          solution: string | null;
          results: string | null;
          metrics: Json;
          images: Json;
          status: "draft" | "published" | "archived";
          published_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          title: string;
          description?: string | null;
          slug?: string | null;
          industry?: string | null;
          challenge?: string | null;
          solution?: string | null;
          results?: string | null;
          metrics?: Json;
          images?: Json;
          status?: "draft" | "published" | "archived";
          published_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          title?: string;
          description?: string | null;
          slug?: string | null;
          industry?: string | null;
          challenge?: string | null;
          solution?: string | null;
          results?: string | null;
          metrics?: Json;
          images?: Json;
          status?: "draft" | "published" | "archived";
          published_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      feedback: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          case_study_id: string | null;
          rating: number | null;
          comment: string | null;
          category: string | null;
          status: "received" | "acknowledged" | "resolved";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          case_study_id?: string | null;
          rating?: number | null;
          comment?: string | null;
          category?: string | null;
          status?: "received" | "acknowledged" | "resolved";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          case_study_id?: string | null;
          rating?: number | null;
          comment?: string | null;
          category?: string | null;
          status?: "received" | "acknowledged" | "resolved";
          created_at?: string;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: "free" | "pro" | "enterprise";
          status: "active" | "cancelled" | "suspended";
          billing_cycle: "monthly" | "annual";
          amount: string;
          currency: string;
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end: boolean;
          cancelled_at: string | null;
          payment_method_id: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan: "free" | "pro" | "enterprise";
          status?: "active" | "cancelled" | "suspended";
          billing_cycle?: "monthly" | "annual";
          amount: string;
          currency?: string;
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end?: boolean;
          cancelled_at?: string | null;
          payment_method_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan?: "free" | "pro" | "enterprise";
          status?: "active" | "cancelled" | "suspended";
          billing_cycle?: "monthly" | "annual";
          amount?: string;
          currency?: string;
          current_period_start?: string;
          current_period_end?: string;
          cancel_at_period_end?: boolean;
          cancelled_at?: string | null;
          payment_method_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string | null;
          type: "info" | "success" | "warning" | "error";
          related_id: string | null;
          read: boolean;
          action_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message?: string | null;
          type?: "info" | "success" | "warning" | "error";
          related_id?: string | null;
          read?: boolean;
          action_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string | null;
          type?: "info" | "success" | "warning" | "error";
          related_id?: string | null;
          read?: boolean;
          action_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      invites: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          role: "admin" | "manager" | "employee" | "client";
          token: string;
          status: "pending" | "accepted" | "rejected" | "expired";
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          role?: "admin" | "manager" | "employee" | "client";
          token: string;
          status?: "pending" | "accepted" | "rejected" | "expired";
          expires_at: string;
          accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string;
          role?: "admin" | "manager" | "employee" | "client";
          token?: string;
          status?: "pending" | "accepted" | "rejected" | "expired";
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          user_id: string | null;
          name: string | null;
          email: string;
          subject: string;
          message: string;
          status: "received" | "read" | "responded";
          message_type: "general" | "support" | "inquiry" | "partnership";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name?: string | null;
          email: string;
          subject: string;
          message: string;
          status?: "received" | "read" | "responded";
          message_type?: "general" | "support" | "inquiry" | "partnership";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string | null;
          email?: string;
          subject?: string;
          message?: string;
          status?: "received" | "read" | "responded";
          message_type?: "general" | "support" | "inquiry" | "partnership";
          created_at?: string;
          updated_at?: string;
        };
      };
      waitlist_entries: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          reason: string | null;
          position: number | null;
          status: "pending" | "invited" | "joined" | "rejected";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          reason?: string | null;
          position?: number | null;
          status?: "pending" | "invited" | "joined" | "rejected";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          reason?: string | null;
          position?: number | null;
          status?: "pending" | "invited" | "joined" | "rejected";
          created_at?: string;
          updated_at?: string;
        };
      };
      support_tickets: {
        Row: {
          id: string;
          user_id: string | null;
          title: string;
          description: string | null;
          priority: "low" | "medium" | "high" | "urgent";
          status: "open" | "in_progress" | "waiting" | "resolved" | "closed";
          assigned_to: string | null;
          tags: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          title: string;
          description?: string | null;
          priority?: "low" | "medium" | "high" | "urgent";
          status?: "open" | "in_progress" | "waiting" | "resolved" | "closed";
          assigned_to?: string | null;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          title?: string;
          description?: string | null;
          priority?: "low" | "medium" | "high" | "urgent";
          status?: "open" | "in_progress" | "waiting" | "resolved" | "closed";
          assigned_to?: string | null;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          title: string;
          description: string | null;
          status: "todo" | "in_progress" | "review" | "done";
          priority: "low" | "medium" | "high";
          task_type: "feature" | "nice-to-have" | "bug" | "error";
          is_starred: boolean;
          assigned_to: string | null;
          due_date: string | null;
          estimated_hours: string | null;
          actual_hours: string | null;
          tags: string[] | null;
          google_event_id: string | null;
          github_issue_number: number | null;
          notes: string | null;
          parent_task_id: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          title: string;
          description?: string | null;
          status?: "todo" | "in_progress" | "review" | "done";
          priority?: "low" | "medium" | "high";
          task_type?: "feature" | "nice-to-have" | "bug" | "error";
          is_starred?: boolean;
          assigned_to?: string | null;
          due_date?: string | null;
          estimated_hours?: string | null;
          actual_hours?: string | null;
          tags?: string[] | null;
          google_event_id?: string | null;
          github_issue_number?: number | null;
          notes?: string | null;
          parent_task_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          title?: string;
          description?: string | null;
          status?: "todo" | "in_progress" | "review" | "done";
          priority?: "low" | "medium" | "high";
          task_type?: "feature" | "nice-to-have" | "bug" | "error";
          is_starred?: boolean;
          assigned_to?: string | null;
          due_date?: string | null;
          estimated_hours?: string | null;
          actual_hours?: string | null;
          tags?: string[] | null;
          google_event_id?: string | null;
          github_issue_number?: number | null;
          notes?: string | null;
          parent_task_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_tokens: {
        Row: {
          id: string;
          user_id: string;
          provider: "google" | "microsoft" | "github" | "slack";
          access_token: string;
          refresh_token: string | null;
          token_expiry: string | null;
          scope: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: "google" | "microsoft" | "github" | "slack";
          access_token: string;
          refresh_token?: string | null;
          token_expiry?: string | null;
          scope?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          provider?: "google" | "microsoft" | "github" | "slack";
          access_token?: string;
          refresh_token?: string | null;
          token_expiry?: string | null;
          scope?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          resource_type: string | null;
          resource_id: string | null;
          changes: Json;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          resource_type?: string | null;
          resource_id?: string | null;
          changes?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          resource_type?: string | null;
          resource_id?: string | null;
          changes?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
      site_pages: {
        Row: {
          id: string;
          slug: string;
          content: Json;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          content?: Json;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          content?: Json;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      releases: {
        Row: {
          id: string;
          title: string;
          version: string | null;
          date: string;
          type: "tool" | "update" | "patch";
          description: string;
          link: string | null;
          tags: string[] | null;
          is_featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          version?: string | null;
          date?: string;
          type?: "tool" | "update" | "patch";
          description: string;
          link?: string | null;
          tags?: string[] | null;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          version?: string | null;
          date?: string;
          type?: "tool" | "update" | "patch";
          description?: string;
          link?: string | null;
          tags?: string[] | null;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      workspaces: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
      };
      workspace_members: {
        Row: {
          workspace_id: string;
          user_id: string;
          role: "founder" | "employee";
          created_at: string;
        };
        Insert: {
          workspace_id: string;
          user_id: string;
          role?: "founder" | "employee";
          created_at?: string;
        };
        Update: {
          workspace_id?: string;
          user_id?: string;
          role?: "founder" | "employee";
          created_at?: string;
        };
      };
      departments: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// New tables
export type Workspace = Database["public"]["Tables"]["workspaces"]["Row"];
export type WorkspaceMember =
  Database["public"]["Tables"]["workspace_members"]["Row"];
export type Department = Database["public"]["Tables"]["departments"]["Row"];

// Convenience type aliases
export type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];
export type Service = Database["public"]["Tables"]["services"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Milestone = Database["public"]["Tables"]["milestones"]["Row"];
export type Quote = Database["public"]["Tables"]["quotes"]["Row"];
export type Invoice = Database["public"]["Tables"]["invoices"]["Row"];
export type CalendarEvent =
  Database["public"]["Tables"]["calendar_events"]["Row"];
export type CaseStudy = Database["public"]["Tables"]["case_studies"]["Row"];
export type Feedback = Database["public"]["Tables"]["feedback"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type Invite = Database["public"]["Tables"]["invites"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type WaitlistEntry =
  Database["public"]["Tables"]["waitlist_entries"]["Row"];
export type SupportTicket =
  Database["public"]["Tables"]["support_tickets"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type UserToken = Database["public"]["Tables"]["user_tokens"]["Row"];
export type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];
export type SitePage = Database["public"]["Tables"]["site_pages"]["Row"];
export type Release = Database["public"]["Tables"]["releases"]["Row"];
