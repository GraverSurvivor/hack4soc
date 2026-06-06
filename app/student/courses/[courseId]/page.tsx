"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3, RotateCcw, Trophy } from "lucide-react";
import { PageTransition } from "@/components/shared/PageTransition";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface ProgressItem {
  completed: boolean;
  quizScore?: number | null;
  learningMode?: string | null;
}

interface Course {
  id: string;
  title: string;
  classroom: { id: string; name: string };
  units: Array<{
    id: string;
    title: string;
    summary: string;
    order: number;
    progress?: ProgressItem[];
  }>;
}

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/courses/${courseId}`)
      .then((r) => r.json())
      .then(setCourse)
      .finally(() => setLoading(false));
  }, [courseId]);

  const stats = useMemo(() => {
    const units = course?.units || [];
    const completed = units.filter((unit) => unit.progress?.[0]?.completed).length;
    const percent = units.length ? Math.round((completed / units.length) * 100) : 0;
    const next = units.find((unit) => !unit.progress?.[0]?.completed) || units[0];
    return { completed, total: units.length, percent, next };
  }, [course]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-56" />
      </div>
    );
  }

  if (!course || "error" in course) {
    return <div className="p-8 text-center text-navy-400">Course not found</div>;
  }

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <Link href="/student/courses" className="inline-flex items-center gap-2 text-sm text-navy-300 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
          Back to courses
        </Link>

        <Card className="border-violet/30">
          <CardContent className="p-6">
            <p className="text-sm text-violet-light font-medium">{course.classroom.name}</p>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mt-1">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">{course.title}</h1>
                <p className="text-navy-300 mt-2">
                  {stats.completed}/{stats.total} units complete. Pick up from the next unit or review any low quiz score.
                </p>
              </div>
              {stats.next && (
                <Link href={`/student/learn/${stats.next.id}`}>
                  <Button>{stats.completed ? "Continue Course" : "Start Course"}</Button>
                </Link>
              )}
            </div>
            <Progress value={stats.percent} className="mt-6" />
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {course.units.map((unit, index) => {
            const progress = unit.progress?.[0];
            const completed = Boolean(progress?.completed);
            const score = progress?.quizScore;
            const review = typeof score === "number" && score < 80;

            return (
              <Link key={unit.id} href={`/student/learn/${unit.id}`}>
                <Card className="hover:border-violet/50">
                  <CardContent className="p-5">
                    <div className="flex gap-4">
                      <span
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${
                          completed
                            ? "bg-emerald-500/15 text-emerald-300"
                            : review
                            ? "bg-amber-500/15 text-amber-300"
                            : "bg-violet/15 text-violet-light"
                        }`}
                      >
                        {completed ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-semibold text-white">{unit.title}</h2>
                          {completed && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-200">
                              <Trophy className="w-3 h-3" />
                              XP earned
                            </span>
                          )}
                          {review && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-xs text-amber-200">
                              <RotateCcw className="w-3 h-3" />
                              Review
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-navy-300 mt-1">{unit.summary}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-navy-400 mt-3">
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="w-3 h-3" />
                            Learn, quiz, earn XP
                          </span>
                          {typeof score === "number" && <span>Last quiz: {score}%</span>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </PageTransition>
  );
}
