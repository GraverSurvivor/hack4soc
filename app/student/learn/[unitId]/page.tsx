"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Award, CheckCircle2, Clock3, ShieldCheck, Sparkles } from "lucide-react";
import { StoryMode } from "@/components/learn/StoryMode";
import { CalmMode } from "@/components/learn/CalmMode";
import { GameMode } from "@/components/learn/GameMode";
import { ModeSelector } from "@/components/learn/ModeSelector";
import { QuizPanel } from "@/components/learn/QuizPanel";
import { AITutor } from "@/components/chat/AITutor";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Unit {
  id: string;
  title: string;
  summary?: string;
  storyMode: string;
  calmMode: string;
  gameMode: string;
  quizQuestions: Array<{
    id: string;
    question: string;
    options: string[];
    correct: string;
    explanation: string;
  }>;
  course?: { id: string; title: string };
  progress?: Array<{ completed: boolean; quizScore?: number | null; learningMode?: string | null }>;
  iepNote?: {
    notes: string;
    difficulty: string;
    is504: boolean;
    extraSupport: boolean;
  };
}

type Phase = "select" | "learn" | "quiz" | "done";

export default function LearnPage() {
  const { data: session } = useSession();
  const { unitId } = useParams<{ unitId: string }>();
  const [unit, setUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>("select");
  const [mode, setMode] = useState<string>("calm");
  const [brainProfile, setBrainProfile] = useState<string | null>(null);
  const [studentUser, setStudentUser] = useState<any>(null);
  const [score, setScore] = useState<number | null>(null);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (!session?.user?.id) return;

    fetch(`/api/units/${unitId}`)
      .then((r) => r.json())
      .then((data) => {
        setUnit(data);
        if (data.progress?.[0]?.learningMode) setMode(data.progress[0].learningMode);

        const classroomId = localStorage.getItem("classroomId");
        if (classroomId) {
          fetch(`/api/classrooms/${classroomId}`)
            .then((r) => r.json())
            .then((classroom) => {
              const me = classroom.members?.find(
                (m: { user: { id: string; brainProfile?: { dominant: string } } }) => m.user.id === session.user.id
              );
              if (me?.user?.brainProfile) {
                setBrainProfile(me.user.brainProfile.dominant);
                setMode(me.user.brainProfile.dominant);
              }
              if (me?.user) {
                setStudentUser(me.user);
              }
            });
        }
      })
      .finally(() => setLoading(false));
  }, [unitId, session?.user?.id]);

  const handleModeSelect = (selectedMode: string) => {
    setMode(selectedMode);
    setPhase("learn");
  };

  const handleQuizSubmit = async (
    quizScore: number,
    answers: Record<string, string>
  ) => {
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    await fetch(`/api/units/${unitId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        completed: true,
        quizScore,
        quizAnswers: answers,
        learningMode: mode,
        timeSpent,
      }),
    });
    setScore(quizScore);
    setPhase("done");
    toast.success(quizScore >= 80 ? "Unit complete. Bonus XP earned." : "Unit complete. XP earned.");
  };

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!unit || "error" in unit) {
    return <div className="p-8 text-center text-navy-400">Unit not found</div>;
  }

  const iep = unit.iepNote;
  const lp = studentUser?.learningProfile || {};
  const accommodations = {
    textToSpeech: iep?.is504 || iep?.extraSupport || (lp.auditory_processing ?? 0) > 40,
    largeFont: iep?.difficulty === "easy" || iep?.extraSupport || (lp.dyslexia ?? 0) > 40,
    extendedTime: iep?.is504 || (lp.adhd ?? 0) > 40,
  };
  const hasSupport = accommodations.textToSpeech || accommodations.largeFont || accommodations.extendedTime;

  if (phase === "select") {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div>
          <p className="text-sm text-violet-light font-medium">{unit.course?.title || "Learning unit"}</p>
          <h1 className="text-2xl md:text-3xl font-bold text-white mt-1">{unit.title}</h1>
          {unit.summary && <p className="text-navy-300 mt-2">{unit.summary}</p>}
        </div>

        {!brainProfile && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-4 flex gap-3">
              <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
              <p className="text-sm text-navy-200">
                Take the profile quiz later to get better learning-mode recommendations.
              </p>
            </CardContent>
          </Card>
        )}

        {hasSupport && (
          <Card className="border-sky-500/30 bg-sky-500/5">
            <CardContent className="p-4 flex gap-3">
              <ShieldCheck className="w-5 h-5 text-sky-300 shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">Support settings are on</p>
                <p className="text-sm text-navy-300 mt-1">
                  This lesson may use text-to-speech, larger text, or extended pacing based on your classroom support plan.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <ModeSelector recommended={brainProfile || undefined} onSelect={handleModeSelect} />
      </div>
    );
  }

  if (phase === "learn") {
    const rawContent =
      mode === "story"
        ? unit.storyMode
        : mode === "game"
        ? unit.gameMode
        : unit.calmMode;

    let displayContent = rawContent;
    try {
      const parsed = JSON.parse(rawContent);
      if (mode === "story") {
        displayContent = parsed.narrative || parsed.content || rawContent;
      } else if (mode === "calm") {
        if (Array.isArray(parsed.cards)) {
          displayContent = parsed.cards.map((c: any) => `### ${c.heading || c.title || c.concept || "Concept"}\n${c.body || c.content || ""}`).join("\n\n");
        } else if (parsed.content) {
          displayContent = parsed.content;
        }
      } else if (mode === "game") {
        if (parsed.questTitle) {
          displayContent = `## ${parsed.questTitle}\n\n${parsed.questObjective || ""}\n\nReward: ${parsed.xpReward || 100} XP`;
        } else if (parsed.content) {
          displayContent = parsed.content;
        }
      }
    } catch {
      // It's plain text, use as-is
    }

    return (
      <>
        {mode === "story" && (
          <StoryMode
            content={displayContent}
            title={unit.title}
            onComplete={() => setPhase("quiz")}
            textToSpeech={accommodations.textToSpeech}
            largeFont={accommodations.largeFont}
          />
        )}
        {mode === "calm" && (
          <CalmMode
            content={displayContent}
            title={unit.title}
            onComplete={() => setPhase("quiz")}
            textToSpeech={accommodations.textToSpeech}
            largeFont={accommodations.largeFont}
            extendedTime={accommodations.extendedTime}
          />
        )}
        {mode === "game" && (
          <GameMode
            content={displayContent}
            title={unit.title}
            onComplete={() => setPhase("quiz")}
            largeFont={accommodations.largeFont}
          />
        )}
        <AITutor unitId={unitId} />
      </>
    );
  }

  if (phase === "quiz") {
    return (
      <div className="min-h-screen bg-navy-900 py-8">
        <div className="max-w-2xl mx-auto px-6 text-center mb-4">
          <p className="text-sm text-violet-light font-medium">Quiz checkpoint</p>
          <h2 className="text-xl font-bold text-white mt-1">{unit.title}</h2>
          <p className="text-sm text-navy-300 mt-2">
            Answer each question to lock in the lesson and earn XP.
          </p>
        </div>
        <QuizPanel questions={unit.quizQuestions} onSubmit={handleQuizSubmit} />
        <AITutor unitId={unitId} />
      </div>
    );
  }

  const earnedXp = (score || 0) >= 80 ? 75 : 50;

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-900 px-4">
      <Card className="max-w-md w-full border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="p-8 text-center">
          <CheckCircle2 className="w-14 h-14 text-emerald-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white">Unit Complete</h2>
          <p className="text-navy-300 mt-2">
            You scored {score ?? 0}% and earned {earnedXp} XP.
          </p>
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="rounded-lg border border-navy-700 bg-navy-900/40 p-4">
              <Award className="w-5 h-5 text-amber-300 mx-auto mb-2" />
              <p className="text-sm text-white">XP earned</p>
              <p className="text-lg font-bold text-amber-300">{earnedXp}</p>
            </div>
            <div className="rounded-lg border border-navy-700 bg-navy-900/40 p-4">
              <Clock3 className="w-5 h-5 text-sky-300 mx-auto mb-2" />
              <p className="text-sm text-white">Mode used</p>
              <p className="text-lg font-bold text-sky-300 capitalize">{mode}</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 mt-6">
            <Link href={unit.course?.id ? `/student/courses/${unit.course.id}` : "/student/courses"}>
              <Button className="w-full">Back to Course</Button>
            </Link>
            <Link href="/student/badges">
              <Button variant="outline" className="w-full">
                View Badges
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
