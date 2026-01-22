"use client";

import { useState } from "react";
import { Play, Mic, MicOff, Plus, Minus, Clock, CheckCircle } from "lucide-react";

export default function WorkoutPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [reps, setReps] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [restTimer, setRestTimer] = useState<number | null>(null);

  const handleLogSet = () => {
    // TODO: Save to database
    setCurrentSet((prev) => prev + 1);
    setReps(0);
    setRestTimer(90); // 90 second rest
  };

  return (
    <div className="p-6 md:p-8 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Play className="w-6 h-6 text-emerald-500" />
        <h1 className="text-2xl font-bold tracking-tight">Active Workout</h1>
      </div>

      {/* Voice Input */}
      <div className="glass rounded-lg p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`p-4 rounded-full transition-all ${
              isRecording
                ? "bg-red-500 animate-pulse"
                : "bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20"
            }`}
          >
            {isRecording ? (
              <MicOff className="w-6 h-6 text-white" />
            ) : (
              <Mic className="w-6 h-6 text-emerald-500" />
            )}
          </button>
          <div>
            <h3 className="font-medium">Voice Command</h3>
            <p className="text-sm text-white/50">
              {isRecording
                ? "Listening... Say your workout plan"
                : "Tap to speak your workout"}
            </p>
          </div>
        </div>

        {isRecording && (
          <div className="bg-black/30 rounded-md p-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <p className="text-sm text-white/70 font-mono">
                Waiting for speech...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Current Exercise */}
      <div className="glass rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-white/40 font-mono mb-1">CURRENT EXERCISE</p>
            <h2 className="text-xl font-semibold">Strict Pull-Up</h2>
          </div>
          <span className="badge-intermediate text-xs font-mono uppercase px-2 py-1 rounded">
            INTERMEDIATE
          </span>
        </div>

        {/* Set Indicator */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((set) => (
              <div
                key={set}
                className={`w-8 h-8 rounded-md flex items-center justify-center text-sm font-mono ${
                  set < currentSet
                    ? "bg-emerald-500/20 text-emerald-500"
                    : set === currentSet
                    ? "bg-emerald-500 text-black"
                    : "bg-white/5 text-white/30"
                }`}
              >
                {set < currentSet ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  set
                )}
              </div>
            ))}
          </div>
          <p className="text-sm text-white/50">Set {currentSet} of 5</p>
        </div>

        {/* Rep Stepper */}
        <div className="flex items-center justify-center gap-6 py-8">
          <button
            onClick={() => setReps((prev) => Math.max(0, prev - 1))}
            className="w-16 h-16 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors active:scale-95"
          >
            <Minus className="w-8 h-8" />
          </button>

          <div className="text-center">
            <p className="text-6xl font-bold font-mono">{reps}</p>
            <p className="text-sm text-white/50 mt-1">reps</p>
          </div>

          <button
            onClick={() => setReps((prev) => prev + 1)}
            className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center text-black transition-colors active:scale-95"
          >
            <Plus className="w-8 h-8" />
          </button>
        </div>

        {/* Log Set Button */}
        <button
          onClick={handleLogSet}
          disabled={reps === 0}
          className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-white/10 disabled:text-white/30 text-black font-semibold rounded-lg transition-colors"
        >
          Log Set ({reps} reps)
        </button>
      </div>

      {/* Rest Timer */}
      {restTimer !== null && (
        <div className="glass rounded-lg p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-cyan-500" />
            <p className="text-sm text-white/50">Rest Timer</p>
          </div>
          <p className="text-4xl font-bold font-mono text-cyan-400">
            {Math.floor(restTimer / 60)}:{String(restTimer % 60).padStart(2, "0")}
          </p>
          <button
            onClick={() => setRestTimer(null)}
            className="mt-4 text-sm text-white/50 hover:text-white transition-colors"
          >
            Skip Rest
          </button>
        </div>
      )}
    </div>
  );
}
