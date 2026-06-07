"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Award,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Flame,
  MessageCircle,
  Plus,
  Sparkles,
  Star,
  Target,
  Users,
} from "lucide-react";
import { PageTransition } from "@/components/shared/PageTransition";
import { BrainStyleCard } from "@/components/shared/BrainStyleCard";
import {
  getClassroomProgress,
  useClassrooms,
} from "@/components/shared/ClassroomProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface BrainProfile {
  dominant: string;
  scores: { story: number; calm: number; game: number };
}

export default function StudentHome() {
  const { data: session } = useSession();
  const { classrooms, activeClassroom, setActiveClassroom, loading: classesLoading } =
    useClassrooms();
  const [profile, setProfile] = useState<BrainProfile | null>(null);
  const [xp, setXp] = useState({ xp: 0, streak: 0 });

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    Promise.all([
      fetch(`/api/students/${userId}/xp`).then((r) => r.json()),
      fetch("/api/quiz/brain-profile?profile=1").then((r) => r.json()),
    ]).then(([xpData, brainData]) => {
      setXp(xpData);
      if (brainData?.dominant) setProfile(brainData);
    });
  }, [session]);

  const allProgress = useMemo(() => {
    let completed = 0;
    let total = 0;
    let nextUnit: {
      id: string;
      title: string;
      courseTitle: string;
      classroomName: string;
      classroomId: string;
    } | null = null;

    for (const classroom of classrooms) {
      const { units, nextUnit: classroomNext } = getClassroomProgress(classroom);
      completed += units.filter((u) => u.completed).length;
      total += units.length;

      if (!nextUnit && classroomNext && !classroomNext.completed) {
        nextUnit = {
          id: classroomNext.id,
          title: classroomNext.title,
          courseTitle: classroomNext.courseTitle,
          classroomName: classroom.name,
          classroomId: classroom.id,
        };
      }
    }

    return {
      completed,
      total,
      percent: total ? Math.round((completed / total) * 100) : 0,
      nextUnit,
    };
  }, [classrooms]);

  const activeProgress = useMemo(
    () => (activeClassroom ? getClassroomProgress(activeClassroom) : null),
    [activeClassroom]
  );

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 lg:grid-cols-[1.5fr_1fr]"
        >
          <div>
            <p className="text-sm text-violet-light font-medium">Student dashboard</p>
            <h1 className="text-2xl md:text-4xl font-bold text-white mt-1">
              Welcome back, {session?.user?.name?.split(" ")[0] || "learner"}.
            </h1>
            <p className="text-navy-300 mt-2 max-w-2xl">
              All your classes in one place — pick up where you left off, join new classes,
              and track progress across every classroom.
            </p>
          </div>
          <div className="flex gap-3 lg:justify-end flex-wrap">
            <Link href="/student/join">
              <Button variant="outline">
                <Plus className="w-4 h-4" />
                Join Class
              </Button>
            </Link>
            <Link href="/student/badges">
              <Button variant="amber">
                <Award className="w-4 h-4" />
                Badges
              </Button>
            </Link>
          </div>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-violet-light" />
              <div>
                <p className="text-2xl font-bold text-white">{classrooms.length}</p>
                <p className="text-xs text-navy-400">Classes joined</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Star className="w-8 h-8 text-amber-400" />
              <div>
                <p className="text-2xl font-bold text-white">{xp.xp}</p>
                <p className="text-xs text-navy-400">Total XP</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Flame className={`w-8 h-8 text-orange-400 ${xp.streak > 0 ? "animate-flame" : ""}`} />
              <div>
                <p className="text-2xl font-bold text-white">{xp.streak}</p>
                <p className="text-xs text-navy-400">Day streak</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Target className="w-8 h-8 text-sky-300" />
              <div>
                <p className="text-2xl font-bold text-white">{allProgress.percent}%</p>
                <p className="text-xs text-navy-400">Overall progress</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {classesLoading ? (
          <Skeleton className="h-64" />
        ) : classrooms.length === 0 ? (
          <Card className="border-violet/30 bg-violet/5">
            <CardContent className="p-8 text-center">
              <BookOpen className="w-12 h-12 text-violet-light mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white">Join your first classroom</h2>
              <p className="text-navy-300 mt-2 mb-5">
                Enter your teacher&apos;s invite code to unlock courses, units, quizzes, XP, and badges.
                You can join as many classes as you need.
              </p>
              <Link href="/student/join">
                <Button>Join Classroom</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">My Classes</h2>
                <Link href="/student/join" className="text-sm text-violet-light hover:underline">
                  + Join another
                </Link>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {classrooms.map((classroom) => {
                  const progress = getClassroomProgress(classroom);
                  const isActive = classroom.id === activeClassroom?.id;

                  return (
                    <Card
                      key={classroom.id}
                      className={`cursor-pointer transition-all hover:border-violet/50 ${
                        isActive ? "border-violet/60 bg-violet/5 ring-1 ring-violet/30" : ""
                      }`}
                      onClick={() => setActiveClassroom(classroom.id)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-white truncate">{classroom.name}</h3>
                            <p className="text-xs text-navy-400 mt-1">
                              {classroom.teacher?.name || "Teacher"}
                              {" · "}
                              {progress.total} units
                            </p>
                          </div>
                          {isActive && (
                            <span className="text-xs bg-violet/20 text-violet-light px-2 py-0.5 rounded-full shrink-0">
                              Active
                            </span>
                          )}
                        </div>
                        <Progress value={progress.percent} className="mt-4" />
                        <p className="text-xs text-navy-400 mt-2">
                          {progress.completed}/{progress.total} complete · {progress.percent}%
                        </p>
                        <div className="flex gap-2 mt-4">
                          <Link
                            href="/student/courses"
                            onClick={() => setActiveClassroom(classroom.id)}
                            className="flex-1"
                          >
                            <Button size="sm" variant="outline" className="w-full">
                              Courses
                            </Button>
                          </Link>
                          <Link
                            href="/student/community"
                            onClick={() => setActiveClassroom(classroom.id)}
                            className="flex-1"
                          >
                            <Button size="sm" variant="ghost" className="w-full">
                              Chat
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-[1.35fr_0.9fr]">
              <Card className="border-violet/30">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-violet-light font-medium">Continue learning</p>
                      <h2 className="text-xl font-semibold text-white mt-1">
                        {allProgress.nextUnit?.title || "All caught up!"}
                      </h2>
                      <p className="text-sm text-navy-300 mt-2">
                        {allProgress.nextUnit
                          ? `${allProgress.nextUnit.classroomName} · ${allProgress.nextUnit.courseTitle}`
                          : activeClassroom
                          ? `${activeClassroom.name} — check back for new units.`
                          : "Select a class above to get started."}
                      </p>
                    </div>
                    <CheckCircle2 className="w-8 h-8 text-emerald-300 shrink-0" />
                  </div>
                  {activeProgress && (
                    <Progress value={activeProgress.percent} className="mt-6" />
                  )}
                  <div className="flex flex-wrap gap-3 mt-5">
                    {allProgress.nextUnit && (
                      <Link href={`/student/learn/${allProgress.nextUnit.id}`}>
                        <Button>Open Unit</Button>
                      </Link>
                    )}
                    <Link href="/student/courses">
                      <Button variant="outline">All Courses</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {profile ? (
                <BrainStyleCard dominant={profile.dominant} scores={profile.scores} />
              ) : (
                <Card className="border-amber-500/30 bg-amber-500/5">
                  <CardContent className="p-6">
                    <Sparkles className="w-8 h-8 text-amber-300 mb-3" />
                    <h2 className="text-lg font-semibold text-white">Find your learning style</h2>
                    <p className="text-sm text-navy-300 mt-2 mb-4">
                      Take a short quiz so lessons can recommend story, calm, or game mode.
                    </p>
                    <Link href="/student/quiz/brain-profile">
                      <Button variant="amber">Take Quiz</Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <GraduationCap className="w-7 h-7 text-violet-light mb-3" />
              <h3 className="font-semibold text-white">Multiple classes</h3>
              <p className="text-sm text-navy-300 mt-2">
                Like Google Classroom — join every class you belong to and switch between them anytime.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <MessageCircle className="w-7 h-7 text-emerald-300 mb-3" />
              <h3 className="font-semibold text-white">Class chat</h3>
              <p className="text-sm text-navy-300 mt-2">
                Each classroom has its own community. Use @Spark for AI help in any class.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <Users className="w-7 h-7 text-sky-300 mb-3" />
              <h3 className="font-semibold text-white">Stay on track</h3>
              <p className="text-sm text-navy-300 mt-2">
                Your dashboard shows the next best step across all your classes.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
