import { NextResponse } from "next/server";
import { syncGitHubIssuesToSupabase } from "@/app/actions/github-sync";

export async function POST() {
  try {
    const result = await syncGitHubIssuesToSupabase();

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      imported: result.imported,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 }
    );
  }
}
