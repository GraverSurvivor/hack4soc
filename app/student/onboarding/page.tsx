"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles, BookOpen, Focus, Gamepad2, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const neuroQuestions = [
  { id: "q1", text: "When reading, do you often lose your place or skip lines?", trait: "dyslexia" },
  { id: "q2", text: "Do letters or words sometimes appear to move or blur while reading?", trait: "dyslexia" },
  { id: "q3", text: "Do you find it hard to stay focused on one task for more than 10 minutes?", trait: "adhd" },
  { id: "q4", text: "Do you often feel restless or feel the need to move around while studying?", trait: "adhd" },
  { id: "q5", text: "Do you find basic arithmetic (addition, subtraction) unexpectedly difficult?", trait: "dyscalculia" },
  { id: "q6", text: "Do you struggle to remember number sequences or phone numbers?", trait: "dyscalculia" },
  { id: "q7", text: "Do you find it hard to understand spoken instructions the first time?", trait: "auditory_processing" },
  { id: "q8", text: "Do you have difficulty expressing your thoughts in writing even when you know the answer?", trait: "dysgraphia" },
];

const prefQuestions = [
  { id: "p1", text: "How do you prefer to receive new information?", options: ["Watching videos", "Reading text", "Listening to audio", "Hands-on practice"], key: "input_style" },
  { id: "p2", text: "How long can you focus in one sitting?", options: ["Less than 10 mins", "10–20 mins", "20–40 mins", "More than 40 mins"], key: "focus_duration" },
  { id: "p3", text: "What helps you remember things best?", options: ["Diagrams & visuals", "Repetition & flashcards", "Stories & examples", "Writing notes"], key: "memory_style" },
  { id: "p4", text: "When you're stuck on a problem, what do you prefer?", options: ["Step-by-step hints", "A worked example", "Ask someone", "Try again myself"], key: "help_style" },
  { id: "p5", text: "What kind of feedback motivates you most?", options: ["Points & badges", "Written praise", "Progress bars", "Leaderboards"], key: "motivation_style" },
];

const SCALE = ["Never", "Rarely", "Sometimes", "Often", "Always"];

const TRAIT_LABELS: Record<string, string> = {
  dyslexia: "Dyslexia Profile",
  adhd: "ADHD Profile",
  dyscalculia: "Dyscalculia Profile",
  auditory_processing: "Auditory Processing Profile",
  dysgraphia: "Dysgraphia Profile",
};

const MODE_DETAILS = {
  story: {
    name: "Story Mode",
    icon: BookOpen,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/30",
    desc: "Uses contextual narratives, character guidance, and real-life scenarios to anchor abstract theories into relatable knowledge.",
  },
  calm: {
    name: "Calm Visual Mode",
    icon: Focus,
    color: "text-sky-400",
    bg: "bg-sky-500/10 border-sky-500/30",
    desc: "Reduces visual noise and text density, using structured sections, calm color spaces, and direct step-by-step progressions.",
  },
  game: {
    name: "Game Mode",
    icon: Gamepad2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/30",
    desc: "Breaks concepts into interactive levels, prompt checkpoints, instant XP/badge feedback, and gamified challenges.",
  },
};

export default function OnboardingPage() {
  const router = useRouter();
  const { update } = useSession();
  const [step, setStep] = useState<"welcome" | "neuro" | "pref" | "results" | "saving">("welcome");
  const [neuroAnswers, setNeuroAnswers] = useState<Record<string, number>>({});
  const [prefAnswers, setPrefAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [calculatedProfile, setCalculatedProfile] = useState<Record<string, number>>({});
  const [recommendedMode, setRecommendedMode] = useState<"story" | "calm" | "game">("calm");

  const startQuiz = () => { setStep("neuro"); setCurrentQ(0); };

  const handleNeuro = (id: string, value: number) => {
    const updated = { ...neuroAnswers, [id]: value };
    setNeuroAnswers(updated);
    if (currentQ < neuroQuestions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setStep("pref");
      setCurrentQ(0);
    }
  };

  const handlePref = (key: string, value: string) => {
    const updated = { ...prefAnswers, [key]: value };
    setPrefAnswers(updated);
    if (currentQ < prefQuestions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      calculateAndShowResults(updated);
    }
  };

  const calculateAndShowResults = (prefs: Record<string, string>) => {
    // ── FIXED: use neuroAnswers from closure, handle 0 values correctly ──
    const traits: Record<string, number> = {};
    const traitCounts: Record<string, number> = {};

    neuroQuestions.forEach((q) => {
      if (traits[q.trait] === undefined) traits[q.trait] = 0;
      if (traitCounts[q.trait] === undefined) traitCounts[q.trait] = 0;
      // FIXED: use 1 as default (not 0) so unanswered = minimal score
      const answer = neuroAnswers[q.id] !== undefined ? neuroAnswers[q.id] : 1;
      traits[q.trait] += answer;
      traitCounts[q.trait] += 1;
    });

    const profile: Record<string, number> = {};
    Object.keys(traits).forEach((t) => {
      const maxScore = traitCounts[t] * 4;
      profile[t] = maxScore > 0 ? Math.round((traits[t] / maxScore) * 100) : 0;
    });

    setCalculatedProfile(profile);

    const scores = { story: 0, calm: 0, game: 0 };

    if (prefs.input_style === "Watching videos") scores.calm += 2;
    else if (prefs.input_style === "Reading text") scores.story += 2;
    else if (prefs.input_style === "Listening to audio") { scores.calm += 1; scores.story += 1; }
    else if (prefs.input_style === "Hands-on practice") scores.game += 2;

    if (prefs.focus_duration === "Less than 10 mins") scores.game += 2;
    else if (prefs.focus_duration === "10–20 mins") { scores.game += 1; scores.calm += 1; }
    else if (prefs.focus_duration === "20–40 mins") { scores.calm += 1; scores.story += 1; }
    else if (prefs.focus_duration === "More than 40 mins") scores.story += 2;

    if (prefs.memory_style === "Diagrams & visuals") scores.calm += 2;
    else if (prefs.memory_style === "Repetition & flashcards") scores.game += 2;
    else if (prefs.memory_style === "Stories & examples") scores.story += 2;
    else if (prefs.memory_style === "Writing notes") { scores.story += 1; scores.calm += 1; }

    if (prefs.help_style === "Step-by-step hints") scores.calm += 2;
    else if (prefs.help_style === "A worked example") scores.story += 2;
    else if (prefs.help_style === "Ask someone") scores.story += 1;
    else if (prefs.help_style === "Try again myself") scores.game += 2;

    if (prefs.motivation_style === "Points & badges") scores.game += 2;
    else if (prefs.motivation_style === "Written praise") scores.story += 2;
    else if (prefs.motivation_style === "Progress bars") scores.calm += 2;
    else if (prefs.motivation_style === "Leaderboards") scores.game += 2;

    if ((profile.adhd ?? 0) > 40) { scores.game += 3; scores.calm += 1; }
    if ((profile.dyslexia ?? 0) > 40) { scores.calm += 2; scores.story += 1; }
    if ((profile.auditory_processing ?? 0) > 40) { scores.calm += 3; }
    if ((profile.dyscalculia ?? 0) > 40) { scores.story += 2; }
    if ((profile.dysgraphia ?? 0) > 40) { scores.calm += 2; }

    const dominant = (Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0]) as "story" | "calm" | "game";
    setRecommendedMode(dominant);
    setStep("results");
  };

  const handleSaveAndStart = async () => {
      setStep("saving");
      setTimeout(() => { router.push("/student/home"); }, 3000);
      try {
        await fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            learningProfile: calculatedProfile,
            learningPreferences: prefAnswers,
          }),
        });
        await update();
        router.push("/student/home");
      } catch (err) {
        console.error(err);
      }
    };

  if (step === "welcome") {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute top-10 left-10 w-96 h-96 bg-violet/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl w-full text-center space-y-6 z-10">
          <div className="inline-flex p-4 rounded-3xl bg-violet/10 border border-violet/20 shadow-lg mb-2">
            <Brain className="w-16 h-16 text-violet-light animate-pulse" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-light via-sky-400 to-emerald-400">NeuroSpark</span>
          </h1>
          <p className="text-navy-300 text-lg leading-relaxed">
            Let's take a quick 2-minute interactive brain quiz to discover how you learn best and tailor course materials to fit your unique cognitive style.
          </p>
          <Button size="lg" className="w-full md:w-auto px-8 py-6 text-lg rounded-2xl" onClick={startQuiz}>
            Begin Brain Quiz <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </div>
    );
  }

  if (step === "saving") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-navy-900 gap-4">
        <Brain className="w-16 h-16 text-violet-light animate-spin-slow" />
        <h2 className="text-white text-xl font-bold animate-pulse">Personalizing your dashboard...</h2>
      </div>
    );
  }

  if (step === "results") {
    const ModeIcon = MODE_DETAILS[recommendedMode].icon;
    return (
      <div className="min-h-screen bg-navy-900 py-10 px-4 md:px-8 relative overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-8 z-10">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-2">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Your Cognitive Profile is Ready!</h1>
            <p className="text-navy-300">Here's a breakdown of your cognitive tendencies and recommended learning environment.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-navy-700 bg-navy-800/40 backdrop-blur-md">
              <CardContent className="p-6 space-y-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-navy-700 pb-3">
                  <Brain className="w-5 h-5 text-violet-light" /> Cognitive Traits Breakdown
                </h3>
                <div className="space-y-4">
                  {Object.entries(calculatedProfile).map(([trait, pct]) => (
                    <div key={trait} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-navy-200 font-medium">{TRAIT_LABELS[trait] || trait}</span>
                        <span className="text-navy-400 font-bold">{pct}%</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className={`border-2 ${MODE_DETAILS[recommendedMode].bg} backdrop-blur-md flex flex-col justify-between`}>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" /> Learning Recommendation
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <ModeIcon className={`w-12 h-12 ${MODE_DETAILS[recommendedMode].color}`} />
                    <h3 className="text-2xl font-bold text-white">{MODE_DETAILS[recommendedMode].name}</h3>
                  </div>
                  <p className="text-navy-300 text-sm leading-relaxed">{MODE_DETAILS[recommendedMode].desc}</p>
                </div>
                <div className="border-t border-navy-700/50 pt-4 mt-6">
                  <p className="text-xs text-navy-400 italic">Note: You can switch between modes at any point in any unit to match your energy level.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center pt-4">
            <Button size="lg" className="px-10 py-6 text-lg rounded-2xl shadow-lg" onClick={handleSaveAndStart}>
              Go to Learning Dashboard <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isNeuro = step === "neuro";
  const q = isNeuro ? neuroQuestions[currentQ] : prefQuestions[currentQ];
  const progressPercent = isNeuro
    ? ((currentQ + 1) / (neuroQuestions.length + prefQuestions.length)) * 100
    : ((neuroQuestions.length + currentQ + 1) / (neuroQuestions.length + prefQuestions.length)) * 100;

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-10 right-10 w-96 h-96 bg-violet/5 rounded-full blur-3xl pointer-events-none" />
      <div className="w-full max-w-xl space-y-6 z-10">
        <div className="space-y-2">
          <p className="text-violet-light text-sm font-semibold tracking-wider uppercase">
            {isNeuro ? `Section 1 of 2 — Cognitive Habits` : `Section 2 of 2 — Preferences`}
          </p>
          <div className="flex items-center justify-between text-xs text-navy-400 font-medium">
            <span>Progress</span>
            <span>
              {isNeuro ? currentQ + 1 : neuroQuestions.length + currentQ + 1} of{" "}
              {neuroQuestions.length + prefQuestions.length}
            </span>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={q.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-navy-800/60 backdrop-blur-md border border-navy-700 rounded-3xl p-6 md:p-8 space-y-8 shadow-card"
          >
            <h2 className="text-white text-xl md:text-2xl font-bold leading-relaxed">{q.text}</h2>

            {isNeuro ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {SCALE.map((label, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    onClick={() => handleNeuro(q.id, i)}
                    className="py-6 border-navy-600 text-white rounded-xl text-xs hover:bg-violet hover:border-violet transition-all active:scale-95"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {q.options?.map((opt) => (
                  <Button
                    key={opt}
                    variant="outline"
                    onClick={() => handlePref((q as any).key, opt)}
                    className="w-full py-7 border-navy-600 text-white text-left px-5 rounded-2xl hover:bg-violet hover:border-violet transition-all flex justify-start text-sm"
                  >
                    {opt}
                  </Button>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}