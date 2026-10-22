/**
 * Partners register (/portfolio/partners)
 * --------------------------------------
 * The portfolio action layer returns only `{ id, name, kind, status }` for
 * partners, so this page reads the full register through the session client —
 * the migration's SELECT policy is `auth.uid() IS NOT NULL`, i.e. any signed-in
 * workspace member can read it. Writes still go through the founder-gated
 * `createPartner` / `updatePartner` / `deletePartner` actions.
 */

import { getPortfolioData } from "@/app/actions/portfolio";
import { createClient } from "@/lib/supabase/server";
import { PartnersView } from "@/components/portfolio/partners-view";
import {
  mapPartnerRecord,
  type PartnerRecord,
} from "@/components/portfolio/partner-record";

export const dynamic = "force-dynamic";

export default async function PortfolioPartnersPage() {
  const supabase = await createClient();

  const [partnersResult, dashboard] = await Promise.all([
    supabase
      .from("partners")
      .select(
        "id, name, kind, status, contact_name, email, phone, website, notes",
      )
      .order("name", { ascending: true }),
    getPortfolioData(),
  ]);

  if (partnersResult.error) {
    console.error(
      "[Portfolio] Failed to load the partner register:",
      partnersResult.error.message,
    );
  }

  const rows = (partnersResult.data ?? []) as unknown as Record<string, unknown>[];
  const partners: PartnerRecord[] = rows.map(mapPartnerRecord);

  return <PartnersView partners={partners} projects={dashboard.projects} />;
}
