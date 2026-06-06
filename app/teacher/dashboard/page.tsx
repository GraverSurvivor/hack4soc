"use client";

import { useEffect, useState } from "react";
import { PageTransition } from "@/components/shared/PageTransition";
import { OverviewCards } from "@/components/dashboard/OverviewCards";
import { ModeDistribution } from "@/components/dashboard/ModeDistribution";
import { StudentCards } from "@/components/dashboard/StudentCards";
import { StruggleHeatmap } from "@/components/dashboard/StruggleHeatmap";
import { AtRiskAlerts } from "@/components/dashboard/AtRiskAlerts";
import { IEPPanel } from "@/components/dashboard/IEPPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface DashboardData {
  overview: {
    totalStudents: number;
    avgCompletion: number;
    avgQuizScore: number;
    atRiskCount: number;
  };
  modeDistribution: { story: number; calm: number; game: number };
  studentCards: Array<{
    id: string;
    name: string;
    brainProfile: string;
    lastActive: string | null;
    completionPct: number;
    avgScore: number;
    trend: "up" | "down" | "stable";
    xp: number;
  }>;
  atRiskAlerts: Array<{
    studentId: string;
    studentName: string;
    reasons: string[];
  }>;
  heatmap: Array<{
    studentId: string;
    studentName: string;
    units: Array<{
      unitId: string;
      unitTitle: string;
      score: number | null;
      completed: boolean;
      quizAnswers: Record<string, string> | null;
    }>;
  }>;
}

export default function TeacherDashboard() {
  const [classroomId, setClassroomId] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [iepStudent, setIepStudent] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/classrooms")
      .then((r) => r.json())
      .then((classrooms) => {
        if (classrooms.length > 0) {
          setClassroomId(classrooms[0].id);
          return fetch(`/api/dashboard/${classrooms[0].id}`);
        }
        throw new Error("No classroom");
      })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const exportCSV = () => {
    if (!data) return;
    const rows = [
      ["Name", "Brain Profile", "Completion %", "Avg Score", "XP"],
      ...data.studentCards.map((s) => [
        s.name,
        s.brainProfile,
        s.completionPct,
        s.avgScore,
        s.xp,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "class-report.csv";
    a.click();
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Welcome to NeuroSpark!</h1>
        <p className="text-navy-400 mb-6">Create a classroom to get started.</p>
        <Button onClick={() => (window.location.href = "/teacher/onboarding")}>
          Set Up Classroom
        </Button>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="p-6 md:p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-navy-400 text-sm">Class overview and student insights</p>
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <OverviewCards data={data.overview} />

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <ModeDistribution data={data.modeDistribution} />
          </div>
          <div className="lg:col-span-2">
            <AtRiskAlerts alerts={data.atRiskAlerts} />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Students</h2>
          <StudentCards
            students={data.studentCards}
            onSelect={(id) => setIepStudent(id)}
          />
        </div>

        <StruggleHeatmap data={data.heatmap} />

        {iepStudent && classroomId && (
          <IEPPanel
            studentId={iepStudent}
            classroomId={classroomId}
            onClose={() => setIepStudent(null)}
          />
        )}
      </div>
    </PageTransition>
  );
}
