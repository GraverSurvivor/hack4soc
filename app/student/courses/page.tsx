"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageTransition } from "@/components/shared/PageTransition";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, CheckCircle2, Clock3, Focus, Gamepad2, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

interface ProgressItem {
  completed: boolean;
  quizScore?: number | null;
  learningMode?: string | null;
}

interface Unit {
  id: string;
  title: string;
  summary: string;
  progress?: ProgressItem[];
}

interface Course {
  id: string;
  title: string;
  units: Unit[];
}

const modeLabels: Record<string, string> = {
  story: "Story",
  calm: "Calm",
  game: "Game",
};

export default function StudentCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const classroomId = localStorage.getItem("classroomId");
    if (!classroomId) {
      setLoading(false);
      return;
    }

    fetch(`/api/classrooms/${classroomId}`)
      .then((r) => r.json())
      .then((data) => setCourses(data.courses || []))
      .finally(() => setLoading(false));
  }, []);

  const totals = useMemo(() => {
    const units = courses.flatMap((course) => course.units);
    const done = units.filter((unit) => unit.progress?.[0]?.completed).length;
    return { done, all: units.length, percent: units.length ? Math.round((done / units.length) * 100) : 0 };
  }, [courses]);

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">My Courses</h1>
            <p className="text-navy-300 mt-2">
              Open units, choose a learning mode, finish quizzes, and build XP.
            </p>
          </div>
          <Link href="/student/join">
            <Button variant="outline">Join Another Class</Button>
          </Link>
        </div>

        {courses.length > 0 && (
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-navy-300">Overall progress</span>
                <span className="text-sm text-white font-medium">
                  {totals.done}/{totals.all} units
                </span>
              </div>
              <Progress value={totals.percent} />
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="w-10 h-10 text-navy-500 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-white">No courses yet</h2>
              <p className="text-navy-400 mt-2 mb-4">
                Join a classroom with your teacher's invite code to see your courses here.
              </p>
              <Link href="/student/join">
                <Button>Join Classroom</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {courses.map((course) => {
              const completed = course.units.filter((unit) => unit.progress?.[0]?.completed).length;
              const percent = course.units.length
                ? Math.round((completed / course.units.length) * 100)
                : 0;
              const nextUnit = course.units.find((unit) => !unit.progress?.[0]?.completed) || course.units[0];

              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <Card className="hover:border-violet/30 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <Link href={`/student/courses/${course.id}`}>
                            <h2 className="text-xl font-semibold text-white hover:text-violet-light transition-colors cursor-pointer">{course.title}</h2>
                          </Link>
                          <p className="text-sm text-navy-400 mt-1">
                            {completed}/{course.units.length} units complete
                          </p>
                        </div>
                        {nextUnit && (
                          <Link href={`/student/learn/${nextUnit.id}`}>
                            <Button size="sm">{completed ? "Continue" : "Start"}</Button>
                          </Link>
                        )}
                      </div>
                      <Progress value={percent} className="mt-5" />

                      <div className="grid gap-3 mt-5">
                        {course.units.map((unit, index) => {
                          const progress = unit.progress?.[0];
                          const completedUnit = Boolean(progress?.completed);
                          const score = progress?.quizScore;
                          const review = typeof score === "number" && score < 80;
                          return (
                            <Link key={unit.id} href={`/student/learn/${unit.id}`}>
                              <div className="rounded-lg border border-navy-700 bg-navy-900/40 p-4 transition-colors hover:border-violet/50">
                                <div className="flex gap-4">
                                  <span
                                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                                      completedUnit
                                        ? "bg-emerald-500/15 text-emerald-300"
                                        : review
                                        ? "bg-amber-500/15 text-amber-300"
                                        : "bg-violet/15 text-violet-light"
                                    }`}
                                  >
                                    {completedUnit ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h3 className="font-medium text-white">{unit.title}</h3>
                                      {progress?.learningMode && (
                                        <span className="rounded-md bg-navy-700 px-2 py-0.5 text-xs text-navy-200">
                                          {modeLabels[progress.learningMode] || progress.learningMode} mode
                                        </span>
                                      )}
                                      {review && (
                                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-xs text-amber-200">
                                          <RotateCcw className="w-3 h-3" />
                                          Review
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-navy-400 line-clamp-2 mt-1">{unit.summary}</p>
                                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-navy-300">
                                      <span className="inline-flex items-center gap-1">
                                        <Clock3 className="w-3 h-3" />
                                        Short lesson
                                      </span>
                                      <span className="inline-flex items-center gap-1">
                                        <Focus className="w-3 h-3" />
                                        Mode choice
                                      </span>
                                      <span className="inline-flex items-center gap-1">
                                        <Gamepad2 className="w-3 h-3" />
                                        Quiz XP
                                      </span>
                                    </div>
                                  </div>
                                  {typeof score === "number" && (
                                    <span className="text-sm font-semibold text-white shrink-0">{score}%</span>
                                  )}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
