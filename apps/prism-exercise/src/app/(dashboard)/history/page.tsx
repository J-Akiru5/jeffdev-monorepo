import { History, Calendar } from "lucide-react";

export default function HistoryPage() {
  // Mock data - will be replaced with Supabase queries
  const workouts = [
    {
      id: "1",
      date: "2026-01-20",
      name: "Push Day A",
      duration: 45,
      sets: 16,
      mood: 8,
    },
    {
      id: "2",
      date: "2026-01-18",
      name: "Pull Day A",
      duration: 50,
      sets: 18,
      mood: 7,
    },
    {
      id: "3",
      date: "2026-01-16",
      name: "Skill Work",
      duration: 30,
      sets: 12,
      mood: 9,
    },
  ];

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <History className="w-6 h-6 text-emerald-500" />
        <h1 className="text-2xl font-bold tracking-tight">Workout History</h1>
      </div>

      {/* Workout List */}
      <div className="space-y-4">
        {workouts.map((workout) => (
          <div
            key={workout.id}
            className="glass rounded-lg p-5 hover:bg-white/5 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold">{workout.name}</h3>
                <div className="flex items-center gap-2 mt-1 text-sm text-white/50">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(workout.date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i < Math.round(workout.mood / 2)
                        ? "bg-emerald-500"
                        : "bg-white/10"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-white/40">Duration: </span>
                <span className="font-mono">{workout.duration}min</span>
              </div>
              <div>
                <span className="text-white/40">Sets: </span>
                <span className="font-mono">{workout.sets}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {workouts.length === 0 && (
        <div className="text-center py-16 text-white/40">
          <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No workouts logged yet</p>
          <p className="text-sm mt-1">Start your first workout to see history here</p>
        </div>
      )}
    </div>
  );
}
