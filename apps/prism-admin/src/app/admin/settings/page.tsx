import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { 
  Settings,
  Key,
  Bell,
  Shield,
  Database,
  Mail,
  CreditCard,
  ExternalLink,
  AlertCircle,
  CheckCircle
} from "lucide-react";

/**
 * Admin Settings Page
 * Founder-only access for system configuration
 */
export default async function SettingsPage() {
  const { userId } = await auth();
  const clerk = await currentUser();
  const role = (clerk?.publicMetadata as { role?: string })?.role || "user";
  
  if (!userId) return null;
  
  // Founder-only page
  if (role !== "founder") {
    redirect("/admin/dashboard");
  }

  // Check integration status
  const integrations = {
    clerk: { connected: true, name: "Clerk Authentication" },
    firebase: { connected: !!process.env.FIREBASE_PROJECT_ID, name: "Firebase (Agency)" },
    cosmos: { connected: !!process.env.COSMOS_CONNECTION_STRING, name: "Cosmos DB (Prism)" },
    paypal: { connected: !!process.env.PAYPAL_CLIENT_ID, name: "PayPal Subscriptions" },
    zoho: { connected: !!process.env.ZOHO_CLIENT_ID, name: "Zoho Mail" },
    resend: { connected: !!process.env.RESEND_API_KEY, name: "Resend Email" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-white/50">System configuration (Founder only)</p>
      </div>

      {/* Integrations Status */}
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

      {/* Environment Variables */}
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

      {/* Danger Zone */}
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
            <button className="px-4 py-2 text-xs font-medium text-red-400 border border-red-500/30 hover:bg-red-500/10 rounded-lg transition-colors">
              Clear Cache
            </button>
            <button className="px-4 py-2 text-xs font-medium text-red-400 border border-red-500/30 hover:bg-red-500/10 rounded-lg transition-colors">
              Reset Webhooks
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function IntegrationCard({ name, connected }: { name: string; connected: boolean }) {
  return (
    <div className="p-4 rounded-lg border border-white/5 bg-white/[0.02] flex items-center justify-between">
      <span className="text-sm text-white">{name}</span>
      <div className={`flex items-center gap-1.5 text-xs ${
        connected ? "text-emerald-400" : "text-yellow-400"
      }`}>
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
