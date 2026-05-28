import { createClient } from "@/lib/supabase/server";
import { CaseStudiesManager } from "@/components/admin/case-studies-manager";

export default async function AgencyCaseStudiesPage() {
  const supabase = await createClient();
  const { data: caseStudies } = await supabase
    .from("case_studies")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <CaseStudiesManager initialData={caseStudies ?? []} />
    </div>
  );
}
