import { createServer } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createServer();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3008"));
}
