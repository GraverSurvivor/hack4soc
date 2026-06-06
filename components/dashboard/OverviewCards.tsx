"use client";

import { motion } from "framer-motion";
import { Users, TrendingUp, AlertTriangle, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface OverviewProps {
  totalStudents: number;
  avgCompletion: number;
  avgQuizScore: number;
  atRiskCount: number;
}

const cards = [
  { key: "totalStudents", label: "Total Students", icon: Users, color: "text-sky-400" },
  { key: "avgCompletion", label: "Avg Completion", icon: TrendingUp, color: "text-green-400", suffix: "%" },
  { key: "avgQuizScore", label: "Avg Quiz Score", icon: BarChart3, color: "text-violet-light", suffix: "%" },
  { key: "atRiskCount", label: "Students at Risk", icon: AlertTriangle, color: "text-amber-400" },
] as const;

export function OverviewCards({ data }: { data: OverviewProps }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        const value = data[card.key];
        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <p className="text-2xl font-bold text-white">
                  {value}{"suffix" in card ? card.suffix : ""}
                </p>
                <p className="text-sm text-navy-400 mt-1">{card.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
