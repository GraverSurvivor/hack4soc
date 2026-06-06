"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HeatmapRow {
  studentId: string;
  studentName: string;
  units: {
    unitId: string;
    unitTitle: string;
    score: number | null;
    completed: boolean;
    quizAnswers: Record<string, string> | null;
  }[];
}

function scoreColor(score: number | null, completed: boolean): string {
  if (!completed && score === null) return "bg-navy-700";
  if (score === null) return "bg-navy-600";
  if (score >= 80) return "bg-green-500/70";
  if (score >= 50) return "bg-yellow-500/70";
  return "bg-red-500/70";
}

export function StruggleHeatmap({ data }: { data: HeatmapRow[] }) {
  const [selected, setSelected] = useState<{
    student: string;
    unit: string;
    score: number | null;
    answers: Record<string, string> | null;
  } | null>(null);

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-navy-400">
          No student data yet. Students will appear here once they start learning.
        </CardContent>
      </Card>
    );
  }

  const units = data[0]?.units || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Struggle Heatmap</CardTitle>
        <p className="text-sm text-navy-400">Click a cell to view quiz details</p>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left p-2 text-navy-400 font-medium sticky left-0 bg-navy-800">
                Student
              </th>
              {units.map((unit) => (
                <th
                  key={unit.unitId}
                  className="p-2 text-navy-400 font-medium text-xs max-w-[80px] truncate"
                  title={unit.unitTitle}
                >
                  {unit.unitTitle.slice(0, 12)}...
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.studentId}>
                <td className="p-2 text-white font-medium sticky left-0 bg-navy-800 whitespace-nowrap">
                  {row.studentName}
                </td>
                {row.units.map((unit) => (
                  <td key={unit.unitId} className="p-1">
                    <button
                      onClick={() =>
                        setSelected({
                          student: row.studentName,
                          unit: unit.unitTitle,
                          score: unit.score,
                          answers: unit.quizAnswers,
                        })
                      }
                      className={`w-10 h-8 rounded-md ${scoreColor(unit.score, unit.completed)} hover:ring-2 hover:ring-violet transition-all`}
                      title={`${unit.unitTitle}: ${unit.score ?? "N/A"}%`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex gap-4 mt-4 text-xs text-navy-400">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-green-500/70" /> 80%+
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-yellow-500/70" /> 50-79%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-red-500/70" /> &lt;50%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-navy-700" /> Not started
          </span>
        </div>

        {selected && (
          <div className="mt-4 p-4 rounded-xl bg-navy-700/50 border border-navy-600">
            <h4 className="font-medium text-white mb-2">
              {selected.student} — {selected.unit}
            </h4>
            <p className="text-sm text-navy-300">
              Score: {selected.score !== null ? `${selected.score}%` : "Not completed"}
            </p>
            {selected.answers && (
              <pre className="mt-2 text-xs text-navy-400 overflow-auto">
                {JSON.stringify(selected.answers, null, 2)}
              </pre>
            )}
            <button
              onClick={() => setSelected(null)}
              className="mt-2 text-xs text-violet-light hover:underline"
            >
              Close
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
