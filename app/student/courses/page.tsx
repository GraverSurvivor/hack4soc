"use client";

import { useMemo } from "react";
import Link from "next/link";
import { PageTransition } from "@/components/shared/PageTransition";
import { useClassrooms, getClassroomProgress } from "@/components/shared/ClassroomProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, CheckCircle2, Clock3, Focus, Gamepad2, GraduationCap, RotateCcw } from "lucide-react";

const modeLabels: Record<string, string> = {
  story: "Story",
  calm: "Calm",
  game: "Game",
};

export default function StudentCourses() {
  const { classrooms, loading } = useClassrooms();

  const groupedCourses = useMemo(() => {
    return classrooms.map((classroom) => ({
      classroom,
      courses: classroom.courses ?? [],
      progress: getClassroomProgress(classroom),
    }));
  }, [classrooms]);

  const totals = useMemo(() => {
    const units = groupedCourses.flatMap((g) => g.progress.units);
    const done = units.filter((u) => u.completed).length;
    return { done, all: units.length, percent: units.length ? Math.round((done / units.length) * 100) : 0 };
  }, [groupedCourses]);

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">My Courses</h1>
            <p className="text-navy-300 mt-2">
              All courses from every class you&apos;ve joined. Switch active class from the header
              for community chat.
            </p>
          </div>
          <Link href="/student/join">
            <Button variant="outline">Join Another Class</Button>
          </Link>
        </div>

        {totals.all > 0 && (
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
        ) : classrooms.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="w-10 h-10 text-navy-500 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-white">No classes yet</h2>
              <p className="text-navy-400 mt-2 mb-4">
                Join a classroom with your teacher&apos;s invite code to see courses here.
              </p>
              <Link href="/student/join">
                <Button>Join Classroom</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {groupedCourses.map(({ classroom, courses }) => (
              <section key={classroom.id}>
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap className="w-5 h-5 text-violet-light" />
                  <h2 className="text-lg font-semibold text-white">{classroom.name}</h2>
                  {classroom.teacher?.name && (
                    <span className="text-sm text-navy-400">· {classroom.teacher.name}</span>
                  )}
                </div>

                {courses.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center text-navy-400 text-sm">
                      No courses added to this class yet. Check back soon!
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {courses.map((course) => {
                      const completed = course.units.filter((u) => u.progress?.[0]?.completed).length;
                      const percent = course.units.length
                        ? Math.round((completed / course.units.length) * 100)
                        : 0;
                      const nextUnit =
                        course.units.find((u) => !u.progress?.[0]?.completed) || course.units[0];

                      return (
                        <Card key={course.id}>
                          <CardContent className="p-6">
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                              <div>
                                <h3 className="text-xl font-semibold text-white">{course.title}</h3>
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
                                          {completedUnit ? (
                                            <CheckCircle2 className="w-5 h-5" />
                                          ) : (
                                            index + 1
                                          )}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <h4 className="font-medium text-white">{unit.title}</h4>
                                            {progress?.learningMode && (
                                              <span className="rounded-md bg-navy-700 px-2 py-0.5 text-xs text-navy-200">
                                                {modeLabels[progress.learningMode] || progress.learningMode}{" "}
                                                mode
                                              </span>
                                            )}
                                            {review && (
                                              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-xs text-amber-200">
                                                <RotateCcw className="w-3 h-3" />
                                                Review
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-xs text-navy-400 line-clamp-2 mt-1">
                                            {unit.summary}
                                          </p>
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
                                          <span className="text-sm font-semibold text-white shrink-0">
                                            {score}%
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </Link>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
