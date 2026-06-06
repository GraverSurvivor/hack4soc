"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Award, Flame, GraduationCap, History, Star, Target } from "lucide-react";
import { PageTransition } from "@/components/shared/PageTransition";
import { BrainStyleCard } from "@/components/shared/BrainStyleCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface BrainProfile {
  dominant: string;
  scores: { story: number; calm: number; game: number };
}

export default function StudentProfile() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<BrainProfile | null>(null);
  const [xpData, setXpData] = useState<{
    xp: number;
    streak: number;
    history: Array<{ amount: number; reason: string; createdAt: string }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    fetch(`/api/students/${userId}/xp`)
      .then((r) => r.json())
      .then(setXpData);

    const classroomId = localStorage.getItem("classroomId");
    if (classroomId) {
      fetch(`/api/classrooms/${classroomId}`)
        .then((r) => r.json())
        .then((data) => {
          const me = data.members?.find(
            (m: { user: { id: string; brainProfile?: BrainProfile } }) => m.user.id === userId
          );
          if (me?.user.brainProfile) setProfile(me.user.brainProfile);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [session?.user?.id]);

  const nextMilestone = useMemo(() => {
    const xp = xpData?.xp || 0;
    const target = Math.ceil((xp + 1) / 250) * 250;
    return { target, remaining: Math.max(target - xp, 0), percent: Math.min((xp / target) * 100, 100) };
  }, [xpData]);

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-violet/20 flex items-center justify-center text-2xl font-bold text-violet-light">
              {session?.user?.name?.[0] || "?"}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{session?.user?.name}</h1>
              <p className="text-navy-400 text-sm">{session?.user?.email}</p>
            </div>
          </div>
          <Link href="/student/quiz/brain-profile">
            <Button variant="outline">Update Learning Style</Button>
          </Link>
        </div>

        {xpData && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Star className="w-8 h-8 text-amber-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{xpData.xp}</p>
                  <p className="text-xs text-navy-400">Total XP</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Flame className="w-8 h-8 text-orange-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{xpData.streak}</p>
                  <p className="text-xs text-navy-400">Day streak</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Target className="w-8 h-8 text-sky-300" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{nextMilestone.remaining} XP to next milestone</p>
                  <Progress value={nextMilestone.percent} className="mt-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {loading ? (
          <Skeleton className="h-40" />
        ) : profile ? (
          <BrainStyleCard dominant={profile.dominant} scores={profile.scores} />
        ) : (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-5 flex gap-4">
              <GraduationCap className="w-8 h-8 text-amber-300 shrink-0" />
              <div>
                <h2 className="font-semibold text-white">Learning style not set</h2>
                <p className="text-sm text-navy-300 mt-1 mb-4">
                  Take the profile quiz so lessons can suggest the mode that fits you best.
                </p>
                <Link href="/student/quiz/brain-profile">
                  <Button variant="amber" size="sm">Take Quiz</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
          <Card>
            <CardContent className="p-5">
              <Award className="w-7 h-7 text-amber-300 mb-3" />
              <h3 className="font-semibold text-white">Badges</h3>
              <p className="text-sm text-navy-300 mt-2 mb-4">
                Badges reward course completion, streaks, high quiz scores, and mode exploration.
              </p>
              <Link href="/student/badges">
                <Button variant="outline" size="sm">View Badges</Button>
              </Link>
            </CardContent>
          </Card>

          {xpData?.history && xpData.history.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <History className="w-5 h-5 text-violet-light" />
                  Recent XP
                </h3>
                <div className="space-y-3">
                  {xpData.history.slice(0, 8).map((h, i) => (
                    <div key={`${h.createdAt}-${i}`} className="flex justify-between gap-4 text-sm">
                      <span className="text-navy-300">{h.reason}</span>
                      <span className="text-amber-400 font-medium">+{h.amount} XP</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Button
          variant="ghost"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full text-red-400 hover:text-red-300"
        >
          Sign Out
        </Button>
      </div>
    </PageTransition>
  );
}
