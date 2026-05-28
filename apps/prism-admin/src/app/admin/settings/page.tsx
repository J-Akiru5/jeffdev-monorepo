import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Key,
  Shield,
  Database,
  ExternalLink,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { ClearCacheButton } from "@/components/admin/clear-cache-button";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "employee";

  if (role !== "founder") {
    redirect("/admin/dashboard");
  }

  const integrations = {
    supabase: { connected: true, name: "Supabase (Auth + Database)" },
    cosmos: {
      connected: !!process.env.MONGODB_URI,
      name: "Cosmos DB (Prism Rules)",
    },
    paypal: {
      connected: !!process.env.PAYPAL_CLIENT_ID,
      name: "PayPal Subscriptions",
    },
    zoho: { connected: !!process.env.ZOHO_CLIENT_ID, name: "Zoho Mail" },
    resend: { connected: !!process.env.RESEND_API_KEY, name: "Resend Email" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-white/50">
          System configuration (Founder only)
        </p>
      </div>

      <section>
        <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
          <Database className="h-4 w-4 text-amber-400" />
          Integrations
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(integrations).map(([key, { connected, name }]) => (
            <IntegrationCard key={key} name={name} connected={connected} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
          <Key className="h-4 w-4 text-amber-400" />
          Environment
        </h2>
        <div className="p-4 rounded-lg border border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-2 text-xs text-white/40 mb-3">
            <Shield className="h-3 w-3" />
            <span>Managed by Doppler</span>
          </div>
          <a
            href="https://dashboard.doppler.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors"
          >
            Open Doppler Dashboard
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-red-400 mb-4 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Danger Zone
        </h2>
        <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/5">
          <p className="text-xs text-white/50 mb-4">
            These actions are irreversible. Proceed with caution.
          </p>
          <div className="flex flex-wrap gap-3">
            <ClearCacheButton />
            <button
              disabled
              title="Webhook management coming soon"
              className="px-4 py-2 text-xs font-medium text-white/30 border border-white/10 rounded-lg cursor-not-allowed opacity-50"
            >
              Reset Webhooks
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function IntegrationCard({
  name,
  connected,
}: {
  name: string;
  connected: boolean;
}) {
  return (
    <div className="p-4 rounded-lg border border-white/5 bg-white/[0.02] flex items-center justify-between">
      <span className="text-sm text-white">{name}</span>
      <div
        className={`flex items-center gap-1.5 text-xs ${
          connected ? "text-emerald-400" : "text-yellow-400"
        }`}
      >
        {connected ? (
          <>
            <CheckCircle className="h-3 w-3" />
            <span>Connected</span>
          </>
        ) : (
          <>
            <AlertCircle className="h-3 w-3" />
            <span>Not configured</span>
          </>
        )}
      </div>
    </div>
  );
}
