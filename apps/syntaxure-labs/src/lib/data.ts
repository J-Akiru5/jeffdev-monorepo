/**
 * Data Fetching Layer
 * -------------------
 * Server-side functions to fetch data from Supabase.
 * Uses Supabase admin client for secure reads.
 *
 * @note These functions match the old Firestore data.ts interface
 *       but query the Supabase tables instead.
 */

import { getAdminClient } from "@/lib/supabase/admin";

// =============================================================================
// TYPES (matching the FirestoreService shape for backward compat)
// =============================================================================
export interface DataService {
  slug: string;
  icon: string;
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

export interface DataProject {
  slug: string;
  refNo?: string;
  title: string;
  client: string;
  category: string;
  tagline: string;
  description: string;
  challenge: string;
  solution: string;
  results: { metric: string; value: string }[];
  technologies: string[];
  testimonial: { quote: string; author: string; role: string } | null;
  image: string | null;
  featured: boolean;
  order: number;
  status: string;
  progress: number;
  deadline?: string;
  startDate?: string;
  budget?: number;
  paidAmount?: number;
  assignedPartner?: string;
  assignedEmployees?: string[];
  milestones?: unknown[];
  created_at?: string;
  updated_at?: string;
  publishedSiteUrl?: string | null; // Live URL of the delivered product
  user_id?: string;
}

export interface DataQuote {
  id?: string;
  projectType: string;
  budget: string;
  timeline: string;
  name: string;
  email: string;
  company?: string;
  details: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DataMessage {
  id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// SERVICES
// =============================================================================
export async function getServices(): Promise<DataService[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("status", "active")
      .order("name", { ascending: true });

    if (error) throw error;
    if (!data) return [];

    // Map Supabase columns to DataService shape
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((svc: any, idx: number) => ({
      slug: svc.name?.toLowerCase().replace(/\s+/g, "-") || `service-${idx}`,
      icon: mapCategoryToIcon(svc.category),
      title: svc.name || "",
      tagline: svc.description?.slice(0, 120) || "",
      description: svc.description || "",
      features: [],
      deliverables: [],
      investment: {
        starting: svc.price_min
          ? `$${Number(svc.price_min).toLocaleString()}`
          : "",
        timeline: "",
      },
      order: idx,
    }));
  } catch (error) {
    console.error("[GET SERVICES ERROR]", error);
    return [];
  }
}

export async function getServiceBySlug(
  slug: string,
): Promise<DataService | null> {
  const services = await getServices();
  return services.find((s) => s.slug === slug) || null;
}

// Map Supabase category to icon string
function mapCategoryToIcon(category: string): string {
  const map: Record<string, string> = {
    web: "Globe",
    cloud: "Cloud",
    ai: "Sparkles",
    mobile: "Smartphone",
    design: "Palette",
    consulting: "Briefcase",
    saas: "Cloud",
    default: "Globe",
  };
  return map[category?.toLowerCase()] || map.default!;
}

// =============================================================================
// PROJECTS
// =============================================================================
export async function getProjects(): Promise<DataProject[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!data) return [];

    return data
      .map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (p: any) =>
          ({
            slug: p.slug || p.id,
            refNo: undefined,
            title: p.title || "",
            client: p.client_id || "",
            category: p.metadata?.category || "",
            tagline: p.description?.slice(0, 120) || "",
            description: p.description || "",
            challenge: p.metadata?.challenge || "",
            solution: p.metadata?.solution || "",
            results: p.metadata?.results || [],
            technologies: p.metadata?.technologies || [],
            testimonial: p.metadata?.testimonial || null,
            image: p.metadata?.image || null,
            featured: p.metadata?.featured === true,
            order: p.metadata?.order || 0,
            status: p.status || "active",
            progress: p.metadata?.progress ?? 0,
            deadline: p.end_date || undefined,
            startDate: p.start_date || undefined,
            budget: p.budget ? Number(p.budget) : undefined,
            paidAmount: p.budget_spent ? Number(p.budget_spent) : undefined,
            assignedPartner: p.metadata?.assignedPartner || undefined,
            assignedEmployees: p.metadata?.assignedEmployees || [],
            publishedSiteUrl: p.published_site_url ?? null,
            user_id: p.user_id,
            created_at: p.created_at,
            updated_at: p.updated_at,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          }) as any,
      );
  } catch (error) {
    console.error("[GET PROJECTS ERROR]", error);
    return [];
  }
}

export async function getFeaturedProjects(): Promise<DataProject[]> {
  const projects = await getProjects();
  return projects.filter((p) => p.featured);
}

export async function getProjectBySlug(
  slug: string,
): Promise<DataProject | null> {
  try {
    const supabase = getAdminClient() as any;
    const { data, error } = await supabase
      .from("projects")
      .select("*, milestones(*)")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      slug: data.slug || data.id,
      refNo: undefined,
      title: data.title || "",
      client: data.client_id || "",
      category: data.metadata?.category || "",
      tagline: data.description?.slice(0, 120) || "",
      description: data.description || "",
      challenge: data.metadata?.challenge || "",
      solution: data.metadata?.solution || "",
      results: data.metadata?.results || [],
      technologies: data.metadata?.technologies || [],
      testimonial: data.metadata?.testimonial || null,
      image: data.metadata?.image || null,
      featured: data.metadata?.featured === true,
      order: data.metadata?.order || 0,
      status: data.status || "active",
      progress: data.metadata?.progress ?? 0,
      deadline: data.end_date || undefined,
      startDate: data.start_date || undefined,
      budget: data.budget ? Number(data.budget) : undefined,
      paidAmount: data.budget_spent ? Number(data.budget_spent) : undefined,
      assignedPartner: data.metadata?.assignedPartner || undefined,
      assignedEmployees: data.metadata?.assignedEmployees || [],
      publishedSiteUrl: data.published_site_url ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      milestones: (data.milestones || []).map((m: any) => ({
        id: m.id,
        title: m.title,
        description: m.description || "",
        status: m.status === "in_progress" ? "in-progress" : m.status,
        dueDate: m.due_date || undefined,
        completedAt: m.metadata?.completedAt || undefined,
        order: m.metadata?.order || 0,
      })),
      user_id: data.user_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  } catch (error) {
    console.error("[GET PROJECT ERROR]", error);
    return null;
  }
}

// =============================================================================
// QUOTES
// =============================================================================
export async function getQuotes(limit = 50): Promise<DataQuote[]> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!data) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).slice(0, limit).map((q: any) => ({
      id: q.id,
      projectType: q.title || "",
      budget: q.amount ? `$${Number(q.amount).toLocaleString()}` : "",
      timeline: "",
      name: q.metadata?.name || "",
      email: q.metadata?.email || "",
      company: q.metadata?.company,
      details: q.description || "",
      status: q.status || "draft",
      created_at: q.created_at,
      updated_at: q.updated_at,
    }));
  } catch (error) {
    console.error("[GET QUOTES ERROR]", error);
    return [];
  }
}

// =============================================================================
// MESSAGES
// =============================================================================
export async function getMessages(limit = 50): Promise<DataMessage[]> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!data) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).slice(0, limit).map((m: any) => ({
      id: m.id,
      name: m.name || "",
      email: m.email || "",
      subject: m.subject || "",
      message: m.message || "",
      status: m.status || "received",
      created_at: m.created_at,
      updated_at: m.updated_at,
    }));
  } catch (error) {
    console.error("[GET MESSAGES ERROR]", error);
    return [];
  }
}
