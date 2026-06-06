import { ArrowRight } from "lucide-react";

export default function WorkflowsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Workflows</h1>
        <p className="mt-2 text-zinc-400">
          User journeys, development workflows, and operational processes.
        </p>
      </div>

      {/* Prism Customer Journey */}
      <section className="glass p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Prism Customer Journey
        </h2>
        <div className="space-y-4">
          {[
            {
              phase: "Discovery",
              steps: [
                "User visits prism-engine dashboard or installs CLI from npm",
                "Creates account (Supabase Auth)",
                "Explores free tier (limited rules, projects)",
              ],
            },
            {
              phase: "Onboarding",
              steps: [
                "prism login — authenticate with Prism Cloud",
                "prism sync — fetch rules, projects, brands",
                "prism init — auto-configure IDE (Cursor/Windsurf/VS Code/Claude)",
                "prism serve — start MCP server for IDE integration",
              ],
            },
            {
              phase: "Daily Use",
              steps: [
                "IDE auto-starts prism serve on open",
                "AI assistant calls get_architectural_rules for context",
                "prism_check validates code on save (VS Code diagnostics)",
                "prism_fix auto-corrects violations",
                "Developer uses Context Kitchen to preview/trim context",
              ],
            },
            {
              phase: "Growth",
              steps: [
                "Upgrade to Pro/Team tier for more rules, projects, API calls",
                "Create custom rules via dashboard or CLI",
                "Share rule sets via marketplace",
                "Track token savings via telemetry dashboard",
              ],
            },
          ].map((phase) => (
            <div key={phase.phase} className="rounded-lg bg-white/[0.02] p-4">
              <h3 className="mb-2 font-medium text-violet-400">
                {phase.phase}
              </h3>
              <ul className="space-y-1.5">
                {phase.steps.map((step) => (
                  <li
                    key={step}
                    className="flex items-start gap-2 text-sm text-zinc-300"
                  >
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600" />
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Agency Client Journey */}
      <section className="glass p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Agency Client Journey
        </h2>
        <div className="space-y-4">
          {[
            {
              phase: "Inquiry",
              steps: [
                "Client visits syntaxure-labs marketing site",
                "Submits contact form or quote request",
                "System creates ContactMessage and Quote records",
              ],
            },
            {
              phase: "Proposal",
              steps: [
                "Admin creates quote with line items in prism-admin",
                "Quote sent to client (email via Resend)",
                "Client accepts/rejects quote",
                "System creates Project and ClientContract records",
              ],
            },
            {
              phase: "Development",
              steps: [
                "Project tracked in prism-manage (tasks, milestones)",
                "Calendar events synced with Google Calendar",
                "GitHub integration for code tracking",
                "Regular feedback collection via case studies",
              ],
            },
            {
              phase: "Delivery",
              steps: [
                "Invoice generated and sent",
                "Payment processed (PayPal/Maya/Stripe)",
                "Webhook events processed idempotently",
                "Project marked as completed",
                "Case study published for portfolio",
              ],
            },
          ].map((phase) => (
            <div key={phase.phase} className="rounded-lg bg-white/[0.02] p-4">
              <h3 className="mb-2 font-medium text-green-400">
                {phase.phase}
              </h3>
              <ul className="space-y-1.5">
                {phase.steps.map((step) => (
                  <li
                    key={step}
                    className="flex items-start gap-2 text-sm text-zinc-300"
                  >
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600" />
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Development Workflow */}
      <section className="glass p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Development Workflow
        </h2>
        <div className="space-y-4">
          <div className="rounded-lg bg-white/[0.02] p-4">
            <h3 className="mb-2 font-medium text-blue-400">Local Development</h3>
            <div className="space-y-2 font-mono text-sm text-zinc-300">
              <p>pnpm install</p>
              <p>doppler run -- turbo dev --concurrency=2</p>
            </div>
          </div>

          <div className="rounded-lg bg-white/[0.02] p-4">
            <h3 className="mb-2 font-medium text-blue-400">CI Pipeline</h3>
            <div className="flex items-center gap-2 text-sm text-zinc-300">
              <span className="rounded bg-white/[0.06] px-2 py-1">check-types</span>
              <ArrowRight className="h-3.5 w-3.5 text-zinc-600" />
              <span className="rounded bg-white/[0.06] px-2 py-1">lint</span>
              <ArrowRight className="h-3.5 w-3.5 text-zinc-600" />
              <span className="rounded bg-white/[0.06] px-2 py-1">test</span>
              <ArrowRight className="h-3.5 w-3.5 text-zinc-600" />
              <span className="rounded bg-white/[0.06] px-2 py-1">build</span>
            </div>
          </div>

          <div className="rounded-lg bg-white/[0.02] p-4">
            <h3 className="mb-2 font-medium text-blue-400">Release</h3>
            <ul className="space-y-1.5 text-sm text-zinc-300">
              <li className="flex items-start gap-2">
                <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600" />
                Run pnpm changeset to create version bump
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600" />
                pnpm changeset version to bump versions + changelog
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600" />
                Push to main — CI handles deploy via Vercel
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
