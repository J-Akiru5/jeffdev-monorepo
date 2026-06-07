import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TEAM_COLORS = ["cyan", "purple", "emerald", "amber", "rose"] as const;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: memberships } = await supabase
      .from("workspace_members")
      .select("user_id, role, user_profiles!inner(id, full_name, email)")
      .limit(20);

    if (!memberships) {
      return NextResponse.json([]);
    }

    const team = memberships.map(
      (
        m: {
          user_id: string;
          role: string;
          user_profiles: { id: string; full_name: string | null; email: string }[];
        },
        i: number,
      ) => {
        const profile = m.user_profiles[0];
        if (!profile) return null;
        const name = profile.full_name || profile.email?.split("@")[0] || "Member";
        const initials = name
          .split(" ")
          .map((w: string) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        return {
          id: m.user_id,
          name,
          role: m.role === "founder" ? "Lead" : "Contributor",
          initials,
          color: TEAM_COLORS[i % TEAM_COLORS.length],
        };
      },
    );

    return NextResponse.json(team.filter(Boolean));
  } catch {
    return NextResponse.json([]);
  }
}
