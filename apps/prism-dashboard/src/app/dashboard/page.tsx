import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";

export default async function DashboardPage() {
  const user = await currentUser();

  return (
    <main className="min-h-screen">
      {/* Grid Background */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-[#050505] bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <span className="font-mono text-sm text-white/80 uppercase tracking-wider">
              Prism Engine
            </span>
          </div>
          
          <nav className="flex items-center gap-6">
            <a href="/rules" className="text-sm text-white/60 hover:text-white transition-colors">
              Rules
            </a>
            <a href="/settings" className="text-sm text-white/60 hover:text-white transition-colors">
              Settings
            </a>
            <UserButton afterSignOutUrl="/" />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-white mb-2">
            Welcome back, {user?.firstName || "Developer"}
          </h1>
          <p className="text-white/60">
            Manage your context rules and deploy them to your coding assistants.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: "Create Rule", description: "Define a new architectural constraint", icon: "+" },
            { label: "Import Rules", description: "Import from .cursorrules file", icon: "↓" },
            { label: "Deploy MCP", description: "Connect to your IDE", icon: "→" },
          ].map((action) => (
            <button
              key={action.label}
              className="group relative overflow-hidden rounded-md border border-white/5 bg-white/[0.02] p-6 text-left transition-all hover:border-white/10 hover:bg-white/[0.03]"
            >
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-cyan-500/5 to-violet-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
              <span className="block text-3xl mb-3 text-white/40 group-hover:text-cyan-400 transition-colors">
                {action.icon}
              </span>
              <span className="block font-semibold text-white mb-1">{action.label}</span>
              <span className="block text-sm text-white/50">{action.description}</span>
            </button>
          ))}
        </div>

        {/* Rules Section (Placeholder) */}
        <section className="border border-white/5 rounded-md bg-white/[0.01] p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Your Rules</h2>
          <div className="flex items-center justify-center py-12 text-white/40">
            <p className="text-center">
              No rules created yet.
              <br />
              <span className="text-sm">Create your first rule to get started.</span>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
