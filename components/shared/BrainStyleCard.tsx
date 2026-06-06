"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

const PROFILES = {
  story: {
    title: "Story Explorer",
    emoji: "📖",
    description: "Your brain loves adventures! Stories, characters, and exciting narratives help you learn best.",
    color: "from-amber-500/20 to-orange-600/20 border-amber-500/30",
    illustration: "A friendly book with sparkles and a winding adventure path",
  },
  calm: {
    title: "Calm Scholar",
    emoji: "🧘",
    description: "Your brain thrives with structure! Clear layouts, simple language, and predictable patterns work best for you.",
    color: "from-sky-500/20 to-blue-600/20 border-sky-500/30",
    illustration: "A serene blue landscape with organized floating cards",
  },
  game: {
    title: "Quest Champion",
    emoji: "🎮",
    description: "Your brain loves challenges! Puzzles, levels, and reward loops keep you engaged and learning.",
    color: "from-purple-500/20 to-violet-600/20 border-purple-500/30",
    illustration: "A cosmic adventure map with glowing XP stars",
  },
};

export function BrainStyleCard({
  dominant,
  scores,
}: {
  dominant: string;
  scores?: { story: number; calm: number; game: number };
}) {
  const profile = PROFILES[dominant as keyof typeof PROFILES] || PROFILES.calm;

  return (
    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
      <Card className={`bg-gradient-to-br ${profile.color} overflow-hidden`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <span className="text-5xl">{profile.emoji}</span>
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">
                Your Brain Style: {profile.title}
              </h3>
              <p className="text-navy-200 mb-4">{profile.description}</p>
              <p className="text-sm text-navy-300 italic">
                ✨ Imagine: {profile.illustration}
              </p>
              {scores && (
                <div className="flex gap-4 mt-4 text-sm">
                  <span className="text-amber-400">📖 Story: {scores.story}</span>
                  <span className="text-sky-400">🧘 Calm: {scores.calm}</span>
                  <span className="text-purple-400">🎮 Game: {scores.game}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
