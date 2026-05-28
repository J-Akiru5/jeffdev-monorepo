import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/workspace/update-c-level-title
 * Updates the founder's C-Level title refinement.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, cLevelTitle } = await request.json();

    // Validate cLevelTitle
    const validTitles = ["ceo", "cto", "cpo", "coo", "cmo", null];
    if (!validTitles.includes(cLevelTitle)) {
      return NextResponse.json({ error: "Invalid title" }, { status: 400 });
    }

    // Verify the requester is a founder
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single();

    if (!membership || membership.role !== "founder") {
      return NextResponse.json({ error: "Only founders can set C-level titles" }, { status: 403 });
    }

    const { error } = await supabase
      .from("workspace_members")
      .update({ c_level_title: cLevelTitle })
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePath("/", "layout");

    return NextResponse.json({ success: true, cLevelTitle });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
