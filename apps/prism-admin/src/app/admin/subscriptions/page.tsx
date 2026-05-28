import { createClient } from "@/lib/supabase/server";
import { SubscriptionsSearch } from "@/components/admin/subscriptions-search";
import { EmptyState } from "@syntaxure/ui";
import { CreditCard } from "lucide-react";

/**
 * Subscription Management Page
 * Reads subscription data from Supabase.
 * Delegates search/filter/pagination to the client SubscriptionsSearch component.
 */
export default async function SubscriptionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch subscriptions from Supabase
  const { data: subscriptions, error } = await supabase
    .from("subscriptions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[subscriptions] Error fetching:", error);
  }

  const subs = subscriptions || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Subscriptions</h1>
          <p className="text-sm text-white/50">
            {subs.length} total subscriptions
          </p>
        </div>
      </div>

      {subs.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No subscriptions yet"
          description="Subscriptions will appear here once users start subscribing."
        />
      ) : (
        <SubscriptionsSearch subscriptions={subs} />
      )}
    </div>
  );
}
