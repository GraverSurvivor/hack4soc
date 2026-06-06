"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = ["#F59E0B", "#38BDF8", "#A855F7"];

export function ModeDistribution({
  data,
}: {
  data: { story: number; calm: number; game: number };
}) {
  const chartData = [
    { name: "Story Mode", value: data.story },
    { name: "Calm Visual", value: data.calm },
    { name: "Game Mode", value: data.game },
  ].filter((d) => d.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Learning Mode Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#1A2F52",
                border: "1px solid #3D5C8C",
                borderRadius: "8px",
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
