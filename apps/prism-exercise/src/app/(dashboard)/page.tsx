import { createClient } from "@/lib/supabase/server";
import { Calendar, Flame, Target, TrendingUp } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const displayName = user?.user_metadata?.display_name || "Athlete";
  const firstName = displayName.split(" ")[0];

  // Mock stats for now - will be replaced with real data
  const stats = [
    { label: "Current Streak", value: "0", unit: "days", icon: Flame, color: "orange" },
    { label: "This Week", value: "0", unit: "workouts", icon: Target, color: "emerald" },
    { label: "Total Volume", value: "0", unit: "sets", icon: TrendingUp, color: "cyan" },
  ];

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Welcome back, {firstName}
        </h1>
        <p className="text-white/50 mt-1">
          What gets measured, gets managed.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="glass rounded-lg p-5 flex items-center gap-4"
          >
            <div
              className={`p-3 rounded-lg ${
                stat.color === "orange"
                  ? "bg-orange-500/10 text-orange-500"
                  : stat.color === "emerald"
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-cyan-500/10 text-cyan-500"
              }`}
            >
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono">
                {stat.value}
                <span className="text-sm font-normal text-white/40 ml-1">
                  {stat.unit}
                </span>
              </p>
              <p className="text-sm text-white/50">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Calendar Placeholder */}
      <div className="glass rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-5 h-5 text-emerald-500" />
          <h2 className="text-lg font-semibold">Training Calendar</h2>
        </div>

        {/* Placeholder for GitHub-style heatmap */}
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: 52 * 7 }).map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-sm bg-white/5 hover:bg-white/10 transition-colors"
              title="No workout"
            />
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 mt-4 text-xs text-white/40">
          <span>Less</span>
          <div className="w-3 h-3 rounded-sm bg-white/5" />
          <div className="w-3 h-3 rounded-sm bg-emerald-500/30" />
          <div className="w-3 h-3 rounded-sm bg-emerald-500/60" />
          <div className="w-3 h-3 rounded-sm bg-emerald-500" />
          <span>More</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <a
          href="/workout"
          className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-black font-medium py-3 px-6 rounded-lg transition-colors"
        >
          <Flame className="w-5 h-5" />
          Start Workout
        </a>
        <a
          href="/exercises"
          className="flex-1 flex items-center justify-center gap-2 glass hover:bg-white/10 font-medium py-3 px-6 rounded-lg transition-colors"
        >
          Browse Exercises
        </a>
      </div>
    </div>
  );
}
