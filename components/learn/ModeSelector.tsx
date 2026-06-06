"use client";

import { motion } from "framer-motion";
import { BookOpen, Focus, Gamepad2, Sparkles } from "lucide-react";

const MODES = [
  {
    id: "story",
    name: "Story Mode",
    icon: BookOpen,
    description: "Best when examples and real-life context help ideas stick.",
    gradient: "from-amber-500/25 to-orange-600/15 border-amber-500/40",
    support: "Connects new topics to situations students can picture.",
  },
  {
    id: "calm",
    name: "Calm Visual Mode",
    icon: Focus,
    description: "Best when you need less noise, clear steps, and slower pacing.",
    gradient: "from-sky-500/30 to-blue-600/20 border-sky-500/40",
    support: "Reduces overload with focused chunks and simple checkpoints.",
  },
  {
    id: "game",
    name: "Game Mode",
    icon: Gamepad2,
    description: "Best when quick wins, challenges, and feedback keep you moving.",
    gradient: "from-emerald-500/25 to-violet-600/15 border-emerald-500/40",
    support: "Fights procrastination with small goals and instant feedback.",
  },
];

export function ModeSelector({
  recommended,
  onSelect,
}: {
  recommended?: string;
  onSelect: (mode: string) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Choose Your Learning Mode</h2>
      {recommended && (
        <p className="flex items-center gap-2 text-navy-300 text-sm">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Based on your profile, we recommend{" "}
          <strong className="text-violet-light">
            {MODES.find((m) => m.id === recommended)?.name}
          </strong>
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        {MODES.map((mode, i) => {
          const Icon = mode.icon;
          return (
            <motion.button
              key={mode.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => onSelect(mode.id)}
              className={`relative min-h-56 p-5 rounded-lg border bg-gradient-to-br ${mode.gradient} text-left hover:scale-[1.02] transition-transform`}
            >
              {recommended === mode.id && (
                <span className="absolute top-3 right-3 text-xs bg-violet text-white px-2 py-0.5 rounded-md">
                  Recommended
                </span>
              )}
              <Icon className="w-9 h-9 mb-4 text-white" />
              <h3 className="font-semibold text-white mb-1">{mode.name}</h3>
              <p className="text-sm text-navy-300">{mode.description}</p>
              <p className="text-xs text-navy-200 mt-4 leading-relaxed">{mode.support}</p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
