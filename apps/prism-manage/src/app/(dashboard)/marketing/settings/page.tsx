import { seedMarketingData, getMarketingTeam, getMarketingPhases } from "@/app/actions/marketing";

export const dynamic = "force-dynamic";

export default async function MarketingSettingsPage() {
  const [team, phases] = await Promise.all([
    getMarketingTeam(),
    getMarketingPhases(),
  ]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Marketing Settings</h1>
        <p className="mt-1 text-sm text-white/40">
          Configure your marketing operations
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="glass rounded-lg p-5">
          <h2 className="text-sm font-semibold text-white mb-3">
            Seed Marketing Data
          </h2>
          <p className="text-xs text-white/40 mb-4">
            Populate the database with the pre-defined marketing pipeline:
            phases, KPIs, team members, and 47 initial tasks covering the
            full 6-month GTM plan.
          </p>
          <div className="text-xs text-white/30 mb-4 space-y-1">
            <p>
              Phases: Foundation, Authority Building, Launch, Ongoing
            </p>
            <p>KPIs: 8 metrics (waitlist, social, MRR, etc.)</p>
            <p>Team: 5 members (Jeff, Lou, Karl, Hazel, Mark)</p>
            <p>Tasks: 47 pre-defined marketing tasks</p>
          </div>
          <form
            action={async () => {
              "use server";
              await seedMarketingData();
            }}
          >
            <button
              type="submit"
              className="glass inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-white transition-all hover:border-cyan-500/40"
            >
              Seed Marketing Data
            </button>
          </form>
        </div>

        <div className="glass rounded-lg p-5">
          <h2 className="text-sm font-semibold text-white mb-3">
            Data Status
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50">Phases loaded</span>
              <span
                className={`text-sm font-bold ${phases.length > 0 ? "text-emerald-400" : "text-amber-400"}`}
              >
                {phases.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50">Team members</span>
              <span
                className={`text-sm font-bold ${team.length > 0 ? "text-emerald-400" : "text-amber-400"}`}
              >
                {team.length}
              </span>
            </div>
          </div>
        </div>

        <div className="glass rounded-lg p-5 sm:col-span-2">
          <h2 className="text-sm font-semibold text-white mb-3">
            GitHub Sync Configuration
          </h2>
          <p className="text-xs text-white/40 mb-4">
            Set the following Doppler environment variables to enable GitHub
            issue syncing:
          </p>
          <div className="space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between p-2 bg-white/5 rounded">
              <span className="text-white/60">GITHUB_MARKETING_REPO_OWNER</span>
              <span className="text-white/30">e.g., J-Akiru5</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-white/5 rounded">
              <span className="text-white/60">GITHUB_MARKETING_REPO_NAME</span>
              <span className="text-white/30">e.g., jeffdev-monorepo</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-white/5 rounded">
              <span className="text-white/60">GITHUB_PAT</span>
              <span className="text-white/30">Personal Access Token (fine-grained)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
