import { Library, Filter, Search } from "lucide-react";

// Seed data for exercises
const exercises = [
  {
    id: "1",
    name: "Strict Pull-Up",
    difficulty: "INTERMEDIATE",
    category: "HYPERTROPHY",
    muscles: ["PULL"],
    instructions: "Dead hang to full pull, chin over bar. No kipping.",
  },
  {
    id: "2",
    name: "Pseudo Planche Lean",
    difficulty: "ADVANCED",
    category: "SKILL",
    muscles: ["PUSH", "CORE"],
    instructions: "Protract scapula, lean forward with locked arms.",
  },
  {
    id: "3",
    name: "Parallette Push-Up",
    difficulty: "BEGINNER",
    category: "ENDURANCE",
    muscles: ["PUSH"],
    instructions: "Full range of motion on parallettes, chest to floor.",
  },
  {
    id: "4",
    name: "Tuck Front Lever",
    difficulty: "ADVANCED",
    category: "SKILL",
    muscles: ["PULL", "CORE"],
    instructions: "Horizontal body with tucked knees, engage lats.",
  },
  {
    id: "5",
    name: "Diamond Push-Up",
    difficulty: "BEGINNER",
    category: "HYPERTROPHY",
    muscles: ["PUSH"],
    instructions: "Hands together forming diamond shape, full extension.",
  },
  {
    id: "6",
    name: "L-Sit Hold",
    difficulty: "INTERMEDIATE",
    category: "SKILL",
    muscles: ["CORE"],
    instructions: "Legs straight and parallel to ground, arms locked.",
  },
];

const difficultyColors: Record<string, string> = {
  BEGINNER: "badge-beginner",
  INTERMEDIATE: "badge-intermediate",
  ADVANCED: "badge-advanced",
  ELITE: "badge-elite",
};

const muscleColors: Record<string, string> = {
  PUSH: "badge-push",
  PULL: "badge-pull",
  LEGS: "badge-legs",
  CORE: "badge-core",
};

export default function ExercisesPage() {
  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Library className="w-6 h-6 text-emerald-500" />
          <h1 className="text-2xl font-bold tracking-tight">Exercise Library</h1>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search exercises..."
              className="w-full sm:w-64 bg-white/5 border border-white/10 rounded-md py-2 pl-9 pr-4 text-sm placeholder:text-white/30 focus:border-emerald-500/50 focus:outline-none transition-colors"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 glass hover:bg-white/10 rounded-md text-sm transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["All", "Beginner", "Intermediate", "Advanced"].map((level) => (
          <button
            key={level}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              level === "All"
                ? "bg-emerald-500 text-black"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            {level}
          </button>
        ))}
      </div>

      {/* Exercise Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exercises.map((exercise) => (
          <div
            key={exercise.id}
            className="glass rounded-lg p-5 hover:bg-white/5 transition-colors cursor-pointer group"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold group-hover:text-emerald-400 transition-colors">
                {exercise.name}
              </h3>
              <span
                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                  difficultyColors[exercise.difficulty]
                }`}
              >
                {exercise.difficulty}
              </span>
            </div>

            {/* Muscle Badges */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {exercise.muscles.map((muscle) => (
                <span
                  key={muscle}
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                    muscleColors[muscle]
                  }`}
                >
                  {muscle}
                </span>
              ))}
            </div>

            {/* Instructions */}
            <p className="text-sm text-white/50 line-clamp-2">
              {exercise.instructions}
            </p>

            {/* Category */}
            <div className="mt-3 pt-3 border-t border-white/5">
              <p className="text-xs text-white/30 font-mono">
                {exercise.category}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
