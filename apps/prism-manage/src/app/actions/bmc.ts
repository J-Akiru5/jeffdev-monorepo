"use server"

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { 
  BmcSectionSchema, 
  UpdateBmcSectionSchema,
  type BmcSection,
  type UpdateBmcSectionInput 
} from "@/lib/schemas";

// 1. Kuhanin ang lahat ng 9 blocks ng BMC para sa isang Workspace
export async function getBmcSections(workspaceId: string): Promise<BmcSection[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bmc_sections")
    .select("*")
    .eq("workspace_id", workspaceId);

  if (error) {
    console.error("Error fetching BMC sections:", error.message);
    throw new Error("Failed to fetch BMC data");
  }

  return (data || []).map((row) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    block: row.block as any,
    content: row.content || "",
    updatedBy: row.updated_by || undefined,
    updatedAt: row.updated_at,
  }));
}

// 2. Mag-save o mag-update ng isang partikular na BMC block (Upsert)
export async function upsertBmcSection(workspaceId: string, input: UpdateBmcSectionInput) {
  const supabase = await createClient();
  
  // I-validate ang data gamit ang Zod
  const validated = UpdateBmcSectionSchema.parse(input);

  // Kuhanin ang kasalukuyang naka-log in na user ID
  const { data: { user } } = await supabase.auth.getUser();

  const id = `${workspaceId}_${validated.block}`;

  const { error } = await supabase
    .from("bmc_sections")
    .upsert({
      id,
      workspace_id: workspaceId,
      block: validated.block,
      content: validated.content,
      updated_by: user?.id,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "workspace_id,block"
    });

  if (error) {
    console.error("Error saving BMC section:", error.message);
    throw new Error("Failed to save BMC block");
  }

  revalidatePath("/bmc");
}

// 3. Seed Function: Mag-pre-fill ng default template data para sa Syntaxure Labs
export async function seedBmcData(workspaceId: string) {
  const supabase = await createClient();
  
  const sampleData = [
    { block: "value_propositions", content: "### 1. Zero-to-One Development\nRapidly build high-fidelity MVPs (Next.js, Supabase, Tailwind) for founders within weeks instead of months.\n\n### 2. Fractional COO/CTO Services\nProvide enterprise-grade operations tracking and technical management tailored for early-stage startups." },
    { block: "customer_segments", content: "- Non-technical startup founders who need an fast MVP.\n- Seed-stage companies looking to automate internal trackers.\n- Local businesses needing specialized software ecosystems." },
    { block: "channels", content: "- GitHub Project Portals (Transparent dev handoffs)\n- Strategic Twitter/X & LinkedIn technical content marketing\n- Founder networks and local tech incubator referrals" },
    { block: "customer_relationships", content: "- High-touch slack communication channel\n- Automated real-time project implementation tracking dashboards\n- Bi-weekly syncs with founders" },
    { block: "revenue_streams", content: "- **Fixed-scope MVP builds:** $5k - $15k per project\n- **Fractional Tech Consulting Retainers:** Monthly recurring fee\n- **Post-launch Maintenance Plans**" },
    { block: "key_activities", content: "- Fast full-stack software development\n- UI/UX layout engineering & wireframing\n- Business automation workflow integration (n8n, webhooks)" },
    { block: "key_resources", content: "- Specialized Developer/Designer Talent\n- Reusable UI component blueprints & monorepo templates\n- Cloud hosting & modern AI automation tools" },
    { block: "key_partners", content: "- **Supabase:** Core database and backend provider\n- **Vercel:** Deployment and hosting infrastructure\n- Local Startup Hubs and tech community leaders" },
    { block: "cost_structure", content: "- Engineering & design talent compensation\n- Cloud services & infrastructure budgets (Vercel, OpenAI, Supabase)\n- Workspace and developmental tool software licenses" }
  ];

  for (const item of sampleData) {
    const id = `${workspaceId}_${item.block}`;
    await supabase.from("bmc_sections").upsert({
      id,
      workspace_id: workspaceId,
      block: item.block,
      content: item.content,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "workspace_id,block"
    });
  }

  revalidatePath("/bmc");
}