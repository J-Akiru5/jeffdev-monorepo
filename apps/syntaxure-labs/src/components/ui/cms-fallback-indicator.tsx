import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

interface CmsFallbackIndicatorProps {
  pageSlug: string;
  isAdmin?: boolean;
}

export async function CmsFallbackIndicator({
  pageSlug,
  isAdmin = false,
}: CmsFallbackIndicatorProps) {
  // Only show for authenticated admin users
  if (!isAdmin) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return null;

      // Check if user has admin/founder role
      const role = user.user_metadata?.role;
      if (role !== "admin" && role !== "founder") return null;
    } catch {
      return null;
    }
  }

  const editPath = `/admin/agency/content/${pageSlug}`;

  return (
    <div className="mb-6 rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
        <div className="flex-1">
          <p className="text-sm text-amber-300">
            <span className="font-semibold">CMS Fallback Active</span> — Showing
            default content.{" "}
            <Link href={editPath} className="underline hover:text-amber-200">
              Edit in admin panel
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
