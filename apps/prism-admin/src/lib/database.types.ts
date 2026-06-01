/**
 * Database type definitions for prism-admin's Supabase tables.
 *
 * These types enable type-safe Supabase queries without requiring
 * generated types from supabase gen types (which needs a running DB).
 *
 * Tables are derived from supabase/migrations/20250523011807_initial_schema.sql,
 * supabase/migrations/20250601000001_workspaces_rbac.sql, and related migrations.
 */

// GenericRelationship isn't exported from @supabase/supabase-js, define locally.
type GenericRelationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

/**
 * Wraps a table's Row, Insert, and Update types with `& Record<string, unknown>`
 * so the resulting struct satisfies supabase-js's `GenericTable` constraint.
 */
type ToGenericTable<Row, Insert = Partial<Row>> = {
  Row: Row & Record<string, unknown>;
  Insert: Insert & Record<string, unknown>;
  Update: Partial<Row> & Record<string, unknown>;
  Relationships: GenericRelationship[];
};

export interface Database {
  public: {
    Tables: {
      calendar_events: ToGenericTable<CalendarEventRow>;
      case_studies: ToGenericTable<CaseStudyRow>;
      workspaces: ToGenericTable<WorkspaceRow>;
      departments: ToGenericTable<DepartmentRow>;
      workspace_members: ToGenericTable<WorkspaceMemberRow>;
      projects: ToGenericTable<ProjectRow>;
      tasks: ToGenericTable<TaskRow>;
      user_profiles: ToGenericTable<UserProfileRow>;
      invoices: ToGenericTable<InvoiceRow>;
      notifications: ToGenericTable<NotificationRow>;
      invites: ToGenericTable<InviteRow>;
      milestones: ToGenericTable<MilestoneRow>;
        releases: ToGenericTable<ReleaseRow>;
      site_pages: ToGenericTable<SitePageRow>;
      page_sections: ToGenericTable<PageSectionRow>;
      clients: ToGenericTable<ClientRow>;
      tags: ToGenericTable<TagRow>;
      availability_slots: ToGenericTable<AvailabilitySlotRow>;
      audit_logs: ToGenericTable<AuditLogRow>;
      subscriptions: ToGenericTable<SubscriptionRow>;
      pricing_plans: ToGenericTable<PricingPlanRow>;
      pricing_faqs: ToGenericTable<PricingFAQRow>;
      product_templates: ToGenericTable<ProductTemplateRow>;
      contract_terms: ToGenericTable<ContractTermRow>;
      customization_services: ToGenericTable<CustomizationServiceRow>;
      services: ToGenericTable<ServiceRow>;
      quote_services: ToGenericTable<QuoteServiceRow>;
      task_tags: ToGenericTable<TaskTagRow>;
      release_tags: ToGenericTable<ReleaseTagRow>;
      community_post_tags: ToGenericTable<CommunityPostTagRow>;
      support_ticket_tags: ToGenericTable<SupportTicketTagRow>;
      client_contracts: ToGenericTable<ClientContractRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

type ReleaseType = "tool" | "update" | "patch";

// ── Calendar Events ──

export interface CalendarEventRow {
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
  reminders: unknown;
  metadata: unknown;
  created_at: string;
  updated_at: string;
}

// ── Case Studies ──

export interface CaseStudyRow {
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
  metrics: unknown;
  images: unknown;
  status: "draft" | "published" | "archived";
  published_at: string | null;
  metadata: unknown;
  created_at: string;
  updated_at: string;
}

// ── Workspaces ──

export interface WorkspaceRow {
  id: string;
  name: string;
  slug: string | null;
  created_at: string;
  updated_at: string;
}

// ── User Profile ──

export interface UserProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  role: string | null;
  tier: string | null;
  avatar_url: string | null;
  bio: string | null;
  company_name: string | null;
  phone: string | null;
  timezone: string | null;
  preferences: unknown;
  created_at: string;
  updated_at: string;
}

// ── Departments ──

export interface DepartmentRow {
  id: string;
  workspace_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

// ── Workspace Members ──

export interface WorkspaceMemberRow {
  user_id: string;
  workspace_id: string;
  role: "founder" | "admin" | "employee" | "client";
  department_id: string | null;
  joined_at: string;
  created_at: string;
  updated_at: string;
}

// ── Projects ──

export interface ProjectRow {
  id: string;
  user_id: string | null;
  workspace_id: string | null;
  name: string;
  color: string | null;
  icon: string | null;
  slug: string | null;
  description: string | null;
  status: string;
  order: number;
  created_at: string;
  updated_at: string;
}

// ── Tasks ──

export interface TaskRow {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "review" | "done" | "approved";
  priority: "low" | "medium" | "high";
  assigned_to: string | null;
  due_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  notes: string | null;
  parent_task_id: string | null;
  metadata: unknown;
  created_at: string;
  updated_at: string;
}

// ── Invoices ──

export interface InvoiceRow {
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
  line_items: unknown;
  notes: string | null;
  payment_method: string | null;
  payment_terms: string | null;
  metadata: unknown;
  created_at: string;
  updated_at: string;
}

// ── Notifications ──

export interface NotificationRow {
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
}

// ── Invites ──

export interface InviteRow {
  id: string;
  user_id: string;
  email: string;
  role: string;
  token: string;
  status: "pending" | "accepted" | "rejected" | "expired";
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── Milestones ──

export interface MilestoneRow {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  due_date: string;
  status: "pending" | "in_progress" | "completed" | "blocked";
  deliverables: string[] | null;
  metadata: unknown;
  created_at: string;
  updated_at: string;
}

// ── Releases ──

export interface ReleaseRow {
  id: string;
  title: string;
  version: string | null;
  date: string;
  type: ReleaseType;
  description: string;
  link: string | null;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

// ── Site Pages (CMS) ──

export interface SitePageRow {
  id: string;
  slug: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

// ── Availability Slots ──

export interface AvailabilitySlotRow {
  id: string;
  quarter_label: string;
  total_slots: number;
  filled_slots: number;
  is_active: boolean;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

// ── Audit Logs ──

export interface AuditLogRow {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  changes: unknown;
  ip_address: unknown;
  user_agent: string | null;
  created_at: string;
}

// ── Subscriptions ──

export interface SubscriptionRow {
  id: string;
  user_id: string;
  plan: "free" | "pro" | "team" | "enterprise";
  status: "active" | "cancelled" | "suspended" | "past_due";
  billing_cycle: "monthly" | "annual";
  amount: string;
  currency: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  payment_method_id: string | null;
  metadata: unknown;
  paypal_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

// ── Pricing Plans ──

export interface PricingPlanRow {
  id: string;
  app: "prism-engine" | "syntaxure-labs";
  plan_type: "tier" | "addon";
  name: string;
  tier_slug: string;
  tagline: string | null;
  description: string | null;
  price_monthly_php: number | null;
  price_monthly_usd: number | null;
  price_annual_php: number | null;
  price_annual_usd: number | null;
  price_original_php: number | null;
  price_original_usd: number | null;
  discount_label: string | null;
  monthly_addon: string | null;
  features: unknown;
  comparison_values: unknown;
  cta_label: string | null;
  cta_href: string | null;
  cta_variant: "primary" | "secondary" | "contact";
  highlighted: boolean;
  limited_deal: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ── Pricing FAQs ──

export interface PricingFAQRow {
  id: string;
  app: "prism-engine" | "syntaxure-labs";
  question: string;
  answer: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ── Product Templates ──

export interface ProductTemplateRow {
  id: string;
  name: string;
  slug: string;
  category: "template" | "boilerplate" | "addon";
  tagline: string | null;
  description: string | null;
  short_description: string | null;
  base_price_monthly_php: number | null;
  base_price_monthly_usd: number | null;
  base_price_annual_php: number | null;
  base_price_annual_usd: number | null;
  features: unknown;
  tech_stack: unknown;
  demo_url: string | null;
  repo_url: string | null;
  documentation_url: string | null;
  icon: string | null;
  image_url: string | null;
  highlighted: boolean;
  sort_order: number;
  status: "draft" | "active" | "archived";
  created_at: string;
  updated_at: string;
}

// ── Contract Terms ──

export interface ContractTermRow {
  id: string;
  template_id: string;
  term_months: number;
  billing_cycle: "monthly" | "annual";
  price_php: number;
  price_usd: number;
  discount_percent: number;
  includes: unknown;
  extension_enabled: boolean;
  extension_max_years: number;
  extension_rate_increase_percent: number;
  highlighted: boolean;
  sort_order: number;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

// ── Customization Services ──

export interface CustomizationServiceRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  pricing_model: "fixed" | "hourly" | "project";
  estimated_range_min_php: number | null;
  estimated_range_max_php: number | null;
  estimated_range_min_usd: number | null;
  estimated_range_max_usd: number | null;
  turnaround_days: number | null;
  sort_order: number;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

// ── Catalog Services ──

export interface ServiceRow {
  id: string;
  name: string;
  category: string;
  description: string | null;
  price_min: number | null;
  price_max: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

// ── Phase 1 Normalization Types ──

// ── Clients ──
export interface ClientRow {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

// ── Page Sections ──
export interface PageSectionRow {
  id: string;
  page_slug: string;
  section_key: string;
  section_type: string;
  content: unknown;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

// ── Tags ──
export interface TagRow {
  id: string;
  name: string;
  created_at: string;
}

// ── Quote Services (junction) ──
export interface QuoteServiceRow {
  quote_id: string;
  service_id: string;
  created_at: string;
}

// ── Task Tags (junction) ──
export interface TaskTagRow {
  task_id: string;
  tag_id: string;
  created_at: string;
}

// ── Release Tags (junction) ──
export interface ReleaseTagRow {
  release_id: string;
  tag_id: string;
  created_at: string;
}

// ── Community Post Tags (junction) ──
export interface CommunityPostTagRow {
  post_id: string;
  tag_id: string;
  created_at: string;
}

// ── Support Ticket Tags (junction) ──
export interface SupportTicketTagRow {
  ticket_id: string;
  tag_id: string;
  created_at: string;
}

// ── Client Contracts ──
export interface ClientContractRow {
  id: string;
  quote_id: string | null;
  template_id: string;
  contract_term_id: string;
  client_id: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  maya_subscription_id: string | null;
  maya_checkout_id: string | null;
  maya_customer_id: string | null;
  billing_cycle: string;
  amount: string;
  currency: string;
  metadata: unknown;
  created_at: string;
  updated_at: string;
}
