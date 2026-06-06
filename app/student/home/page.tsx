"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock3,
  Flame,
  MessageCircle,
  Sparkles,
  Star,
  Target,
  Users,
} from "lucide-react";
import { PageTransition } from "@/components/shared/PageTransition";
import { BrainStyleCard } from "@/components/shared/BrainStyleCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

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

interface BrainProfile {
  dominant: string;
  scores: { story: number; calm: number; game: number };
}

export default function StudentHome() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<BrainProfile | null>(null);
  const [xp, setXp] = useState({ xp: 0, streak: 0 });
  const [courses, setCourses] = useState<Course[]>([]);
  const [classroomName, setClassroomName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    Promise.all([
      fetch(`/api/students/${userId}/xp`).then((r) => r.json()),
      fetch("/api/classrooms").then((r) => r.json()),
    ])
      .then(async ([xpData, classrooms]) => {
        setXp(xpData);
        if (!Array.isArray(classrooms) || classrooms.length === 0) return;

        const classroom = classrooms[0];
        localStorage.setItem("classroomId", classroom.id);
        const res = await fetch(`/api/classrooms/${classroom.id}`);
        const data = await res.json();

        const me = data.members?.find(
          (m: { user: { id: string; brainProfile?: BrainProfile } }) => m.user.id === userId
        );
        if (me?.user.brainProfile) setProfile(me.user.brainProfile);
        setClassroomName(data.name || classroom.name || "");
        setCourses(data.courses || []);
      })
      .finally(() => setLoading(false));
  }, [session?.user?.id]);

  const flatUnits = useMemo(
    () =>
      courses.flatMap((course) =>
        course.units.map((unit) => ({
          ...unit,
          courseId: course.id,
          courseTitle: course.title,
          completed: Boolean(unit.progress?.[0]?.completed),
          score: unit.progress?.[0]?.quizScore,
        }))
      ),
    [courses]
  );

  const completedUnits = flatUnits.filter((unit) => unit.completed).length;
  const totalUnits = flatUnits.length;
  const overallProgress = totalUnits ? Math.round((completedUnits / totalUnits) * 100) : 0;
  const nextUnit = flatUnits.find((unit) => !unit.completed) || flatUnits[0];
  const needsReview = flatUnits.find(
    (unit) => typeof unit.score === "number" && unit.score < 80
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
            <p className="text-sm text-violet-light font-medium">
              {classroomName || "Student dashboard"}
            </p>
            <h1 className="text-2xl md:text-4xl font-bold text-white mt-1">
              Welcome back, {session?.user?.name?.split(" ")[0] || "learner"}.
            </h1>
            <p className="text-navy-300 mt-2 max-w-2xl">
              Your next lesson, progress, XP, badges, and learning style are all in one place
              so you do not have to hunt for what to do next.
            </p>
          </div>
          <div className="flex gap-3 lg:justify-end">
            <Link href="/student/join">
              <Button variant="outline">Join Class</Button>
            </Link>
            <Link href="/student/badges">
              <Button variant="amber">
                <Award className="w-4 h-4" />
                Badges
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="grid gap-4 md:grid-cols-4"
        >
          <Card className="hover:border-amber-500/30 transition-colors duration-300">
            <CardContent className="p-4 flex items-center gap-3">
              <Star className="w-8 h-8 text-amber-400" />
              <div>
                <p className="text-2xl font-bold text-white">{xp.xp}</p>
                <p className="text-xs text-navy-400">Total XP</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:border-orange-500/30 transition-colors duration-300">
            <CardContent className="p-4 flex items-center gap-3">
              <Flame className={`w-8 h-8 text-orange-400 ${xp.streak > 0 ? "animate-flame" : ""}`} />
              <div>
                <p className="text-2xl font-bold text-white">{xp.streak}</p>
                <p className="text-xs text-navy-400">Day streak</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:border-emerald-500/30 transition-colors duration-300">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-300" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {completedUnits}/{totalUnits}
                </p>
                <p className="text-xs text-navy-400">Units complete</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:border-sky-500/30 transition-colors duration-300">
            <CardContent className="p-4 flex items-center gap-3">
              <Target className="w-8 h-8 text-sky-300" />
              <div>
                <p className="text-2xl font-bold text-white">{overallProgress}%</p>
                <p className="text-xs text-navy-400">Course progress</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {loading ? (
          <Skeleton className="h-64" />
        ) : courses.length === 0 ? (
          <Card className="border-violet/30 bg-violet/5">
            <CardContent className="p-8 text-center">
              <BookOpen className="w-12 h-12 text-violet-light mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white">Join your first classroom</h2>
              <p className="text-navy-300 mt-2 mb-5">
                Enter your teacher's invite code to unlock courses, units, quizzes, XP, and badges.
              </p>
              <Link href="/student/join">
                <Button>Join Classroom</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="grid gap-6 lg:grid-cols-[1.35fr_0.9fr]"
          >
            <Card className="border-violet/30 hover:border-violet/50 transition-colors duration-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-violet-light font-medium">Next best step</p>
                    <h2 className="text-xl font-semibold text-white mt-1">
                      {nextUnit?.title || "All caught up"}
                    </h2>
                    <p className="text-sm text-navy-300 mt-2">
                      {nextUnit
                        ? `${nextUnit.courseTitle} - ${nextUnit.summary || "Open this unit to continue learning."}`
                        : "Your teacher has not added units yet."}
                    </p>
                  </div>
                  <Clock3 className="w-8 h-8 text-sky-300 shrink-0" />
                </div>
                <Progress value={overallProgress} className="mt-6" />
                <div className="flex flex-wrap gap-3 mt-5">
                  {nextUnit && (
                    <Link href={`/student/learn/${nextUnit.id}`}>
                      <Button>Open Unit</Button>
                    </Link>
                  )}
                  <Link href="/student/courses">
                    <Button variant="outline">View Courses</Button>
                  </Link>
                </div>
                {needsReview && (
                  <div className="mt-5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                    <p className="text-sm font-medium text-amber-200">Review suggestion</p>
                    <p className="text-sm text-navy-200 mt-1">
                      Revisit {needsReview.title}. Your last quiz score was {needsReview.score}%,
                      and a quick review can turn that into bonus XP.
                    </p>
                  </div>
                )}
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
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="grid gap-4 md:grid-cols-3"
        >
          <Card className="hover:border-sky-500/30 transition-all duration-300 hover:scale-[1.01]">
            <CardContent className="p-5">
              <Clock3 className="w-7 h-7 text-sky-300 mb-3" />
              <h3 className="font-semibold text-white">Time pressure</h3>
              <p className="text-sm text-navy-300 mt-2">
                The dashboard always shows one next task to reduce decision fatigue.
              </p>
            </CardContent>
          </Card>
          <Card className="hover:border-emerald-500/30 transition-all duration-300 hover:scale-[1.01]">
            <CardContent className="p-5">
              <MessageCircle className="w-7 h-7 text-emerald-300 mb-3" />
              <h3 className="font-semibold text-white">Feeling stuck</h3>
              <p className="text-sm text-navy-300 mt-2">
                Open a unit and use the AI tutor for hints without leaving the lesson.
              </p>
            </CardContent>
          </Card>
          <Card className="hover:border-violet/30 transition-all duration-300 hover:scale-[1.01]">
            <CardContent className="p-5">
              <Users className="w-7 h-7 text-violet-light mb-3" />
              <h3 className="font-semibold text-white">Learning alone</h3>
              <p className="text-sm text-navy-300 mt-2">
                Visit community to ask classmates questions and see announcements.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageTransition>
  );
}
