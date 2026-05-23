import Link from 'next/link';
import { ArrowUpRight, BarChart3, ListTodo, Target, Users } from 'lucide-react';
import { getKpis } from '@/actions/kpis';
import { getTaskStats } from '@/actions/github';
import { team } from '@/data/team';
import { KpiCards } from '@/components/kpi-cards';

const colorMap: Record<string, string> = {
  cyan: 'text-cyan-accent border-cyan-accent/30 bg-cyan-accent/10',
  purple: 'text-purple-accent border-purple-accent/30 bg-purple-accent/10',
  emerald: 'text-emerald-accent border-emerald-accent/30 bg-emerald-accent/10',
  amber: 'text-amber-accent border-amber-accent/30 bg-amber-accent/10',
  rose: 'text-rose-accent border-rose-accent/30 bg-rose-accent/10',
};

const borderAccentMap: Record<string, string> = {
  cyan: 'border-cyan-accent',
  purple: 'border-purple-accent',
  emerald: 'border-emerald-accent',
  amber: 'border-amber-accent',
  rose: 'border-rose-accent',
};

const phases = [
  { id: 'phase-1', name: 'Foundation', timeframe: 'May-June 2026', description: 'Build the audience engine — accounts, waitlist, first content wave, visual assets.', color: 'cyan' },
  { id: 'phase-2', name: 'Authority Building', timeframe: 'July-August 2026', description: 'Content engine, open-source releases, case studies, social proof.', color: 'purple' },
  { id: 'phase-3', name: 'Launch', timeframe: 'September-October 2026', description: 'Product Hunt launch, Founding Member conversion, paid ads, growth levers.', color: 'emerald' },
  { id: 'ongoing', name: 'Ongoing', timeframe: 'Running daily/weekly/monthly', description: 'Sustained content, community, analytics, and iteration.', color: 'amber' },
];

const progressColorMap: Record<string, string> = {
  cyan: 'bg-cyan-accent',
  purple: 'bg-purple-accent',
  emerald: 'bg-emerald-accent',
  amber: 'bg-amber-accent',
};

export default async function Home() {
  const kpis = await getKpis();
  const stats = await getTaskStats();

  const totalAll = Object.values(stats.byPhase).reduce((acc, p) => acc + p.total, 0);
  const doneAll = Object.values(stats.byPhase).reduce((acc, p) => acc + p.done, 0);
  const overallPercent = totalAll > 0 ? Math.round((doneAll / totalAll) * 100) : 0;

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-cyan-accent">Syntaxure Labs</p>
            <h1 className="mt-1 text-3xl font-bold text-white">Marketing Plan</h1>
            <p className="mt-1 text-sm text-white/50">
              Context-as-a-Service · Prism Context Engine · Governance over Generation
            </p>
          </div>
          <Link
            href="/tasks"
            className="glass inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-white transition-all hover:border-cyan-accent/40"
          >
            <ListTodo className="h-4 w-4" />
            Task Board
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Overall Progress */}
        <div className="mt-6 glass rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/70 font-medium">
              <BarChart3 className="h-4 w-4 inline mr-2 text-cyan-accent" />
              Overall Campaign Progress
            </span>
            <span className="text-sm font-mono text-white/70">{doneAll}/{totalAll} tasks</span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/10">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-cyan-accent to-purple-accent transition-all"
              style={{ width: `${overallPercent}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-white/40">{overallPercent}% complete ({totalAll - doneAll} remaining)</p>
        </div>
      </div>

      {/* CMO Priority Callout */}
      <div className="mb-8 glass rounded-lg border-l-2 border-rose-accent p-4 animate-fade-in">
        <div className="flex items-start gap-3">
          <Target className="h-5 w-5 text-rose-accent mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white">Best Move for Mark (CMO) — Right Now</p>
            <p className="mt-1 text-sm text-white/60">
              Create and post the Founding Member Waitlist on LinkedIn + Twitter this week.
              First 100 devs get $9/mo lifetime. Built from Iloilo City, Philippines.
              Pin both posts and DM 10 dev contacts to share.
            </p>
          </div>
        </div>
      </div>

      {/* KPIs — interactive client component */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-4 w-4 text-cyan-accent" />
          <h2 className="text-sm font-mono uppercase tracking-wider text-white/50">180-Day Targets</h2>
        </div>
        <KpiCards kpis={kpis} />
      </section>

      {/* Phases with live stats */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-4 w-4 text-cyan-accent" />
          <h2 className="text-sm font-mono uppercase tracking-wider text-white/50">Campaign Phases</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {phases.map((phase) => {
            const phaseStats = stats.byPhase[phase.id] || { total: 0, done: 0 };
            const percent = phaseStats.total > 0 ? Math.round((phaseStats.done / phaseStats.total) * 100) : 0;

            return (
              <Link
                key={phase.id}
                href={`/tasks?phase=${phase.id}`}
                className="glass rounded-lg p-5 block transition-all hover:border-white/20 animate-fade-in"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${colorMap[phase.color]}`}>
                    {phase.name}
                  </span>
                  <span className="text-xs font-mono text-white/40">{phase.timeframe}</span>
                </div>
                <p className="text-sm text-white/60 leading-relaxed">{phase.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-white/50">
                    {phaseStats.done}/{phaseStats.total} tasks
                  </span>
                  <span className="text-xs font-mono text-white/70">{percent}%</span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-white/10">
                  <div
                    className={`h-1.5 rounded-full transition-all ${progressColorMap[phase.color]}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Team */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-4 w-4 text-cyan-accent" />
          <h2 className="text-sm font-mono uppercase tracking-wider text-white/50">Team</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {team.map((member) => (
            <div key={member.id} className={`glass rounded-lg p-4 border-l-2 ${borderAccentMap[member.color]}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${colorMap[member.color]}`}>
                  {member.initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{member.name}</p>
                  <p className="text-xs text-white/50">{member.role}</p>
                </div>
              </div>
              <p className="text-xs text-white/40 leading-relaxed">{member.focus}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-white/30">
        Syntaxure Labs · Incubated at ISAT-U Kwadra TBI, Iloilo City · Data via GitHub Issues + Firestore
      </footer>
    </main>
  );
}
