"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/lib/utils";

interface StudentCard {
  id: string;
  name: string;
  brainProfile: string;
  lastActive: string | null;
  completionPct: number;
  avgScore: number;
  trend: "up" | "down" | "stable";
  xp: number;
}

const PROFILE_EMOJI: Record<string, string> = {
  story: "📖",
  calm: "🧘",
  game: "🎮",
};

export function StudentCards({
  students,
  onSelect,
}: {
  students: StudentCard[];
  onSelect?: (id: string) => void;
}) {
  const TrendIcon = {
    up: TrendingUp,
    down: TrendingDown,
    stable: Minus,
  };

  const trendColor = {
    up: "text-green-400",
    down: "text-red-400",
    stable: "text-navy-400",
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {students.map((student, i) => {
        const Trend = TrendIcon[student.trend];
        return (
          <motion.div
            key={student.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card
              className="cursor-pointer hover:border-violet/50 transition-colors"
              onClick={() => onSelect?.(student.id)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white">{student.name}</h3>
                    <p className="text-xs text-navy-400">
                      {PROFILE_EMOJI[student.brainProfile]} {student.brainProfile} learner
                    </p>
                  </div>
                  <Trend className={`w-4 h-4 ${trendColor[student.trend]}`} />
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs text-navy-400 mb-1">
                      <span>Completion</span>
                      <span>{student.completionPct}%</span>
                    </div>
                    <Progress value={student.completionPct} className="h-1.5" />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-navy-400">Avg Score</span>
                    <span className="text-white font-medium">{student.avgScore}%</span>
                  </div>
                  <div className="flex justify-between text-xs text-navy-500">
                    <span>Last active: {formatDate(student.lastActive)}</span>
                    <span>{student.xp} XP</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
